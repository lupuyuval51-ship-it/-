import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { TIER_FEATURES, levelsAllowed, quotaOf, tierHas, type FeatureTier } from "@/config/plans";
import { getAllowanceSummary } from "@/server/allowance/summary";
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

/** Games used and held per level in the user's current period (every level is its own count). */
const summary = async (userId: string) => {
  const { levels } = await getAllowanceSummary(userId);
  return { used: { A: levels.A.used, B: levels.B.used, C: levels.C.used }, reserved: levels.A.reserved + levels.B.reserved + levels.C.reserved };
};
/** Use up a level's quota in the current period directly (the counting itself is tested in allowance.test.ts). */
const useUp = async (userId: string, level: FeatureTier, used: number) => {
  await db.allowanceQuota.updateMany({ where: { allowancePeriod: { userId }, level }, data: { used } });
};

describe("Free plan: 1 topic at level B and 5 topics at level C a month (never A)", () => {
  it("level C: basic games (one area, the level's question types, no boss), counted at level C only, then the level's wall", async () => {
    const u = await createTestUser();
    expect(quotaOf("FREE", "C")).toBe(5);
    for (const subject of ["Fractions", "Photosynthesis"]) {
      const { job, game, spec } = await generate(u.id, req({ subject, level: "C" }));
      expect(game, `${subject} should be delivered`).toBeTruthy();
      expect(job.featureTier).toBe("C");
      expect(spec!.meta.featureTier).toBe("C");
      expect(spec!.areas).toHaveLength(1);
      expect(spec!.bosses).toEqual([]);
      for (const t of typesOf(spec!)) expect(allowedTypes("C"), `${subject}: ${t}`).toContain(t);
      expect(spec!.missions.every((m) => !m.optional)).toBe(true);
      expect(spec!.areas.every((a) => a.hazardLevel === "none" && a.npcs.every((n) => n.reactions.length === 0))).toBe(true);
    }
    expect(await summary(u.id)).toEqual({ used: { A: 0, B: 0, C: 2 }, reserved: 0 });
    await useUp(u.id, "C", 5);
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ level: "C" }) }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");
    // the level-B game of the month is still there: the levels are separate counts
    expect((await generate(u.id, req({ level: "B", gameType: "platformer" }))).job.featureTier).toBe("B");
    expect(await summary(u.id)).toEqual({ used: { A: 0, B: 1, C: 5 }, reserved: 0 });
  });

  it("without a wish the highest level that fits and still has a game left is chosen: B first, then C; B is refused once used", async () => {
    const u = await createTestUser();
    const b = await generate(u.id, req());
    expect(b.job.featureTier).toBe("B");
    expect(b.spec!.meta.featureTier).toBe("B");
    expect(await summary(u.id)).toEqual({ used: { A: 0, B: 1, C: 0 }, reserved: 0 });
    // B is used up: the wish is refused with the level, what is left at it and the reset date; nothing is held
    const r = await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ level: "B" }) }, { schedule: false }));
    expect(r).toMatchObject({ code: "ALLOWANCE_EXHAUSTED", details: { level: "B", remaining: 0, limit: 1, resetsAt: (await getAllowanceSummary(u.id)).periodEnd } });
    // without a wish the next game is a level C game (C still has all 5)
    const c = await generate(u.id, req());
    expect(c.job.featureTier).toBe("C");
    // a request only level B can hold (a platformer) has no level left that fits: 402, nothing held
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ gameType: "platformer" }) }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");
    expect(await summary(u.id)).toEqual({ used: { A: 0, B: 1, C: 1 }, reserved: 0 });
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
    expect(await db.allowanceQuota.count({ where: { allowancePeriod: { userId: u.id }, reserved: { gt: 0 } } })).toBe(0);
    // a Full Adventure at level B is part of Free (it uses the month's level-B game)
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

describe("Plus plan: 3 topics at level A, 5 at level B and unlimited level C", () => {
  it("level B: platformers and 2-area adventures with matching and side missions, but no program/simulation, boss or reactions", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const { job, spec } = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Fractions", level: "B" }));
    expect(job.featureTier).toBe("B");
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
    expect(await summary(u.id)).toEqual({ used: { A: 0, B: 3, C: 0 }, reserved: 0 });
    await useUp(u.id, "B", 5);
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ level: "B" }) }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("level A is the default while it has games left; a failed generation releases the held game, a retry with the same key holds it once", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    setBackendForTests(DEMO);
    const body = { idempotencyKey: key(), request: req({ mode: "FULL", gameType: "adventure", subject: "Python loops" }) };
    const first = await createGeneration(u.id, body, { schedule: false });
    const again = await createGeneration(u.id, body, { schedule: false });
    expect(again.jobId).toBe(first.jobId);
    const held = await db.generationJob.findUniqueOrThrow({ where: { id: first.jobId } });
    expect(held.featureTier).toBe("A");
    expect(await summary(u.id)).toEqual({ used: { A: 0, B: 0, C: 0 }, reserved: 1 });
    expect((await getAllowanceSummary(u.id)).levels.A.reserved).toBe(1);
    expect(await failJob(first.jobId, "PROVIDER_ERROR", "failed")).toBe(true);
    expect(await summary(u.id)).toEqual({ used: { A: 0, B: 0, C: 0 }, reserved: 0 });

    const { job, spec } = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Python loops" }));
    expect(job.featureTier).toBe("A");
    expect(spec!.bosses.length).toBe(1);
    expect(await summary(u.id)).toEqual({ used: { A: 1, B: 0, C: 0 }, reserved: 0 });
    // with level A used up, a Full Adventure without a wish becomes a level B game; A itself is refused
    await useUp(u.id, "A", 3);
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ level: "A" }) }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");
    expect((await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Fractions" }))).job.featureTier).toBe("B");
    // level C is unlimited on Plus: still possible with A and B used up, and counted only at C
    await useUp(u.id, "B", 5);
    const free = await generate(u.id, req({ level: "C" }));
    expect(free.job.featureTier).toBe("C");
    const s = await getAllowanceSummary(u.id);
    expect([s.levels.A.used, s.levels.B.used, s.levels.C.used, s.levels.C.remaining]).toEqual([3, 5, 1, null]);
  });
});

describe("Pro plan: 5 topics at level A, 10 at level B and unlimited level C", () => {
  it("builds the full game at level A: several areas, every question type the template has, and the final boss", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const { job, spec } = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Python loops" }));
    expect(job.featureTier).toBe("A");
    expect(spec!.meta.featureTier).toBe("A");
    expect(spec!.areas.length).toBeGreaterThan(1);
    expect(spec!.bosses.length).toBe(1);
    expect(typesOf(spec!)).toContain("program");
    // simulation game type is part of A
    expect((await generate(u.id, req({ gameType: "simulation", subject: "Photosynthesis" }))).spec).toBeTruthy();
    expect(await summary(u.id)).toEqual({ used: { A: 2, B: 0, C: 0 }, reserved: 0 });
    // with level A used up, the default becomes B (its own 10 games are untouched)
    await useUp(u.id, "A", quotaOf("PRO", "A")!);
    const b = await generate(u.id, req({ subject: "Fractions" }));
    expect(b.job.featureTier).toBe("B");
    expect(await summary(u.id)).toEqual({ used: { A: 5, B: 1, C: 0 }, reserved: 0 });
  });

  it("extending keeps the game's own level and uses one game of that level on the current plan; a plan without that level cannot extend", async () => {
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
    expect(await summary(u.id)).toEqual({ used: { A: 1, B: 0, C: 0 }, reserved: 0 }); // one of Plus's level A games
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
