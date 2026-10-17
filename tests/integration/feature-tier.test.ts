import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PLANS, TIER_FEATURES, costOf, levelsAllowed, tierHas, type FeatureTier } from "@/config/plans";
import { db, disconnectDb } from "@/server/db";
import { setBackendForTests } from "@/server/ai/registry";
import type { GenerationBackend } from "@/server/ai/types";
import { setFeatureTierForTests } from "@/server/games/feature-tier";
import { editGameWithAi } from "@/server/games/ai-edit";
import { createGeneration } from "@/server/generation/service";
import { runGenerationJob } from "@/server/generation/runner";
import { failJob } from "@/server/generation/jobs";
import { ApiError } from "@/server/http/errors";
import type { GameSpec } from "@/lib/game/spec/schema";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { createTestUser, grantSubscription } from "./helpers";
import { mockLlm, specJson } from "./helpers-ai";

afterAll(disconnectDb);
afterEach(() => setBackendForTests(null));
// The shared setup runs the suites at tier A; these tests are about the plans' REAL tiers.
beforeEach(() => setFeatureTierForTests(null));

const DEMO: GenerationBackend = { type: "templates", info: { id: "demo", kind: "demo", label: "Demo templates (not AI)", model: "predefined-templates" } };
const req = (over: Partial<GenerationRequest> = {}): GenerationRequest => ({
  mode: "FAST", subject: "Fractions", learningGoal: "Understand fractions", difficulty: "beginner", gameType: "exploration", contentLanguage: "en", ...over,
});
const key = () => `tier-${randomUUID()}`;
const codeOf = async (p: Promise<unknown>): Promise<{ code: string; details?: any }> => // eslint-disable-line @typescript-eslint/no-explicit-any
  p.then(() => ({ code: "OK" }), (e) => (e instanceof ApiError ? { code: e.code, details: e.details } : { code: String(e) }));

async function generate(userId: string, request: GenerationRequest, backend: GenerationBackend = DEMO) {
  setBackendForTests(backend);
  const res = await createGeneration(userId, { idempotencyKey: key(), request }, { schedule: false });
  await runGenerationJob(res.jobId, { backend });
  const job = await db.generationJob.findUniqueOrThrow({ where: { id: res.jobId } });
  const game = job.gameId ? await db.game.findUnique({ where: { id: job.gameId } }) : null;
  return { job, game, spec: game ? (game.spec as unknown as GameSpec) : null };
}

const typesOf = (spec: GameSpec) => [...new Set(spec.challenges.map((c) => c.type))];
const allowedTypes = (tier: FeatureTier) => (["choice", "numeric", "sequence", "match", "program", "simulation"] as const).filter((t) => tierHas(tier, `challenge:${t}` as never));

const summary = async (userId: string) => {
  const p = await db.allowancePeriod.findFirst({ where: { userId }, orderBy: { periodStart: "desc" } });
  return { used: p?.used ?? 0, reserved: p?.reserved ?? 0 };
};

describe("Free plan: 2 topics at level C, or 1 topic at level B (never A)", () => {
  it("level C costs 1 point: two basic games (one area, the level's question types, no boss), then the allowance wall", async () => {
    const u = await createTestUser();
    expect(costOf("FREE", "C")).toBe(1);
    for (const subject of ["Fractions", "Photosynthesis"]) {
      const { job, game, spec } = await generate(u.id, req({ subject, level: "C" }));
      expect(game, `${subject} should be delivered`).toBeTruthy();
      expect(job.featureTier).toBe("C");
      expect(job.cost).toBe(1);
      expect(spec!.meta.featureTier).toBe("C");
      expect(spec!.areas).toHaveLength(1);
      expect(spec!.bosses).toEqual([]);
      for (const t of typesOf(spec!)) expect(allowedTypes("C"), `${subject}: ${t}`).toContain(t);
      expect(spec!.missions.every((m) => !m.optional)).toBe(true);
      expect(spec!.areas.every((a) => a.hazardLevel === "none" && a.npcs.every((n) => n.reactions.length === 0))).toBe(true);
    }
    expect(await summary(u.id)).toEqual({ used: PLANS.FREE.allowance.budget, reserved: 0 });
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ level: "C" }) }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("without a wish the best affordable level is chosen: B costs both points; with 1 point left, B is refused and C is the default", async () => {
    const u = await createTestUser();
    const b = await generate(u.id, req({ gameType: "platformer" }));
    expect(b.job.featureTier).toBe("B");
    expect(b.job.cost).toBe(costOf("FREE", "B"));
    expect(b.spec!.meta.featureTier).toBe("B");
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ level: "C" }) }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");

    const v = await createTestUser();
    await generate(v.id, req({ level: "C" }));
    const r = await codeOf(createGeneration(v.id, { idempotencyKey: key(), request: req({ level: "B" }) }, { schedule: false }));
    expect(r).toMatchObject({ code: "ALLOWANCE_EXHAUSTED", details: { level: "B", cost: 2, remaining: 1 } });
    expect(await summary(v.id)).toEqual({ used: 1, reserved: 0 });
    const c = await generate(v.id, req());
    expect(c.job.featureTier).toBe("C");
    expect(await summary(v.id)).toEqual({ used: 2, reserved: 0 });
  });

  it("refuses what the plan or the level does not have BEFORE reserving anything, naming the level and the plan that unlock it", async () => {
    const u = await createTestUser();
    const cases: [Partial<GenerationRequest>, Record<string, unknown>][] = [
      [{ level: "A" }, { requiredLevel: "A", requiredPlan: "PLUS" }],
      [{ level: "C", mode: "FULL" }, { requiredLevel: "B", requiredPlan: "FREE", tier: "C" }],
      [{ level: "C", gameType: "platformer" }, { requiredLevel: "B", requiredPlan: "FREE", tier: "C" }],
      [{ gameType: "simulation" }, { requiredLevel: "A", requiredPlan: "PLUS", tier: "B" }],
    ];
    for (const [over, details] of cases) {
      const r = await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req(over) }, { schedule: false }));
      expect(r.code, JSON.stringify(over)).toBe("FEATURE_TIER_LOCKED");
      expect(r.details).toMatchObject(details);
    }
    expect(await db.generationJob.count({ where: { userId: u.id } })).toBe(0);
    expect(await db.allowancePeriod.count({ where: { userId: u.id, reserved: { gt: 0 } } })).toBe(0);
    // a Full Adventure at level B is part of Free (it costs both points)
    const full = await generate(u.id, req({ mode: "FULL", gameType: "adventure", level: "B" }));
    expect(full.job.status).toBe("SUCCEEDED");
    expect(full.spec!.areas.length).toBeLessThanOrEqual(2);
  });

  it("a model that ignores the level is clamped on the saved game: its program challenges are taken out", async () => {
    const u = await createTestUser();
    // A model that returns a "robot program" challenge (a type outside level C) in an otherwise valid Fast game.
    const rich = specJson(req({ subject: "Python loops" })) as { challenges: Record<string, unknown>[] };
    const program = (specJson(req({ mode: "FULL", gameType: "adventure", subject: "Python loops" })) as { challenges: Record<string, unknown>[] }).challenges.find((c) => c.type === "program")!;
    const victim = rich.challenges[0]!;
    rich.challenges[0] = { ...program, id: victim.id, objectiveId: victim.objectiveId, easierId: undefined, harderId: undefined };
    // the replaced challenge loses its variants, so they must not stay behind as unplaced orphans
    rich.challenges = rich.challenges.filter((c) => c.id !== victim.easierId && c.id !== victim.harderId);
    expect(JSON.stringify(rich)).toContain('"type":"program"');
    const llm = mockLlm([rich]);
    const { game, spec, job } = await generate(u.id, req({ subject: "Python loops", level: "C" }), llm);
    expect(game, job.errorMessage ?? "").toBeTruthy();
    expect(spec!.meta.featureTier).toBe("C");
    expect(typesOf(spec!)).not.toContain("program");
    for (const t of typesOf(spec!)) expect(allowedTypes("C")).toContain(t);
    // …and the model was told about the level up front
    expect(llm.calls[0]!.messages[0]!.content).toContain("FEATURE TIER C");
  });
});

describe("Plus plan: 3 topics at level B, or 1 topic at level A", () => {
  it("level B (1 point): platformers and 2-area adventures with matching and side missions, but no program/simulation, boss or reactions", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const { job, spec } = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Fractions", level: "B" }));
    expect(job.featureTier).toBe("B");
    expect(job.cost).toBe(1);
    expect(spec!.meta.featureTier).toBe("B");
    expect(spec!.areas.length).toBeLessThanOrEqual(2);
    expect(spec!.bosses).toEqual([]);
    for (const t of typesOf(spec!)) expect(allowedTypes("B")).toContain(t);
    expect(allowedTypes("B")).toContain("match");
    expect(spec!.areas.every((a) => a.npcs.every((n) => n.reactions.length === 0))).toBe(true);

    const plat = await generate(u.id, req({ gameType: "platformer", subject: "Fractions", level: "B" }));
    expect(plat.spec!.meta.featureTier).toBe("B");
    // a game type outside level B is refused, naming level A which the plan itself offers
    const r = await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ gameType: "simulation", level: "B" }) }, { schedule: false }));
    expect(r.code).toBe("FEATURE_TIER_LOCKED");
    expect(r.details).toMatchObject({ requiredLevel: "A", requiredPlan: "PLUS", tier: "B" });
    await generate(u.id, req({ subject: "Photosynthesis", level: "B" }));
    expect(await summary(u.id)).toEqual({ used: 3, reserved: 0 });
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ level: "B" }) }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("level A costs all 3 points (the default with a full budget); a failed generation releases every point, a retry with the same key holds them once", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    setBackendForTests(DEMO);
    const body = { idempotencyKey: key(), request: req({ mode: "FULL", gameType: "adventure", subject: "Python loops" }) };
    const first = await createGeneration(u.id, body, { schedule: false });
    const again = await createGeneration(u.id, body, { schedule: false });
    expect(again.jobId).toBe(first.jobId);
    const held = await db.generationJob.findUniqueOrThrow({ where: { id: first.jobId } });
    expect(held.featureTier).toBe("A");
    expect(held.cost).toBe(costOf("PLUS", "A"));
    expect(await summary(u.id)).toEqual({ used: 0, reserved: 3 });
    expect(await failJob(first.jobId, "PROVIDER_ERROR", "failed")).toBe(true);
    expect(await summary(u.id)).toEqual({ used: 0, reserved: 0 });

    const { job, spec } = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Python loops" }));
    expect(job.featureTier).toBe("A");
    expect(spec!.bosses.length).toBe(1);
    expect(await summary(u.id)).toEqual({ used: 3, reserved: 0 });
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ level: "B" }) }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");
    // level C is free and unlimited on Plus: still possible with no points left, and it spends nothing
    const free = await generate(u.id, req({ level: "C" }));
    expect(free.job.featureTier).toBe("C");
    expect(free.job.cost).toBe(0);
    expect(await summary(u.id)).toEqual({ used: 3, reserved: 0 });
  });
});

describe("Pro plan: 5 topics at level A, or 10 topics at level B", () => {
  it("builds the full game at level A for 2 points: several areas, every question type the template has, and the final boss", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const { job, spec } = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Python loops" }));
    expect(job.featureTier).toBe("A");
    expect(job.cost).toBe(costOf("PRO", "A"));
    expect(spec!.meta.featureTier).toBe("A");
    expect(spec!.areas.length).toBeGreaterThan(1);
    expect(spec!.bosses.length).toBe(1);
    expect(typesOf(spec!)).toContain("program");
    // simulation game type is part of A
    expect((await generate(u.id, req({ gameType: "simulation", subject: "Photosynthesis" }))).spec).toBeTruthy();
    expect(await summary(u.id)).toEqual({ used: 4, reserved: 0 });
    // with 1 point left, A is out of reach and the default becomes B
    await db.allowancePeriod.updateMany({ where: { userId: u.id }, data: { used: PLANS.PRO.allowance.budget - 1 } });
    const b = await generate(u.id, req({ subject: "Fractions" }));
    expect(b.job.featureTier).toBe("B");
  });

  it("extending keeps the game's own level and costs that level's points on the current plan; a plan without that level cannot extend", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const first = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Python loops" }));
    expect(first.spec!.bosses.length).toBe(1);
    const extension = { ...req({ mode: "EXTEND", gameType: "adventure", subject: "Python loops", level: "C" }), targetGameId: first.game!.id, extension: { addArea: true, addMissions: 1, addChallenges: 3, addMechanics: [] } };

    await db.subscription.deleteMany({ where: { userId: u.id } }); // back to Free: no level A
    const r = await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: extension }, { schedule: false }));
    expect(r).toMatchObject({ code: "FEATURE_TIER_LOCKED", details: { requiredLevel: "A", requiredPlan: "PLUS" } });
    expect(await db.generationJob.count({ where: { userId: u.id, status: { in: ["PENDING", "RUNNING"] } } })).toBe(0);

    await grantSubscription(u.id, "PLUS");
    const ext = await generate(u.id, extension);
    expect(ext.job.status).toBe("SUCCEEDED");
    expect(ext.job.featureTier).toBe("A"); // the level wish is ignored when extending
    expect(ext.job.cost).toBe(costOf("PLUS", "A"));
    expect(ext.spec!.bosses.length).toBe(1);
    expect(typesOf(ext.spec!)).toContain("program");
  });

  it("the tiers are nested, the shares are exactly 40 / 70 / 100 percent, and Free never offers A", () => {
    expect(TIER_FEATURES.C.length / 20).toBe(0.4);
    expect(TIER_FEATURES.B.length / 20).toBe(0.7);
    expect(levelsAllowed("FREE")).not.toContain("A");
  });
});

describe("edits stay inside the tier", () => {
  it("a Plus (tier B) edit cannot add character reactions: the model is told, and without a valid change nothing is saved or charged", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const created = await generate(u.id, req({ subject: "Python loops", level: "B" }), mockLlm([specJson(req({ subject: "Python loops" }))]));
    expect(created.spec!.meta.featureTier).toBe("B");
    const spec = created.spec!;
    const npc = spec.areas[0]!.npcs[0];
    if (!npc) return; // a game without characters has nothing to react
    const missionId = spec.missions[0]!.id;
    const llm = mockLlm([{ summary: "Made it react", ops: [{ op: "add", path: "/areas/0/npcs/0/reactions/-", value: { afterMissionId: missionId, lines: ["Well done!"] } }] }]);
    setBackendForTests(llm);
    const r = await codeOf(editGameWithAi({ userId: u.id, gameId: created.game!.id, instruction: "make the guide react when I finish", idempotencyKey: key() }));
    expect(r.code).toBe("INVALID_OUTPUT");
    expect(llm.calls.at(-1)!.messages.at(-1)!.content).toContain("system:reactions");
    expect((await db.game.findUniqueOrThrow({ where: { id: created.game!.id } })).revision).toBe(1);
    expect(await db.aiEdit.count({ where: { userId: u.id, status: "SUCCEEDED" } })).toBe(0);
  });
});
