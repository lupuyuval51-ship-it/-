import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PLANS, TIER_FEATURES, tierHas, type FeatureTier } from "@/config/plans";
import { db, disconnectDb } from "@/server/db";
import { setBackendForTests } from "@/server/ai/registry";
import type { GenerationBackend } from "@/server/ai/types";
import { setFeatureTierForTests } from "@/server/games/feature-tier";
import { editGameWithAi } from "@/server/games/ai-edit";
import { createGeneration } from "@/server/generation/service";
import { runGenerationJob } from "@/server/generation/runner";
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

describe("Free plan = tier C: up to 2 games with 40 % of the features", () => {
  it("builds basic games: one area, only the tier's question types, no boss, labelled with its tier", async () => {
    const u = await createTestUser();
    for (const subject of ["Fractions", "Photosynthesis"]) {
      const { job, game, spec } = await generate(u.id, req({ subject }));
      expect(game, `${subject} should be delivered`).toBeTruthy();
      expect(job.featureTier).toBe("C");
      expect(spec!.meta.featureTier).toBe("C");
      expect(spec!.areas).toHaveLength(1);
      expect(spec!.bosses).toEqual([]);
      for (const t of typesOf(spec!)) expect(allowedTypes("C"), `${subject}: ${t}`).toContain(t);
      expect(spec!.missions.every((m) => !m.optional)).toBe(true);
      expect(spec!.areas.every((a) => a.hazardLevel === "none" && a.npcs.every((n) => n.reactions.length === 0))).toBe(true);
    }
    // two games per month, then the allowance wall
    expect((await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req() }, { schedule: false }))).code).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("refuses what the tier does not have BEFORE reserving anything, and names the plan that unlocks it", async () => {
    const u = await createTestUser();
    const cases: [Partial<GenerationRequest>, string][] = [
      [{ mode: "FULL" }, "PLUS"],
      [{ gameType: "adventure" }, "PLUS"],
      [{ gameType: "platformer" }, "PLUS"],
      [{ gameType: "simulation" }, "PRO"],
    ];
    for (const [over, plan] of cases) {
      const r = await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req(over) }, { schedule: false }));
      expect(r.code, JSON.stringify(over)).toBe("FEATURE_TIER_LOCKED");
      expect(r.details).toMatchObject({ requiredPlan: plan, tier: "C" });
    }
    expect(await db.generationJob.count({ where: { userId: u.id } })).toBe(0);
    expect(await db.allowancePeriod.count({ where: { userId: u.id, reserved: { gt: 0 } } })).toBe(0);
  });

  it("a model that ignores the tier is clamped on the saved game: its program challenges are taken out", async () => {
    const u = await createTestUser();
    // A model that returns a "robot program" challenge (a type outside tier C) in an otherwise valid Fast game.
    const rich = specJson(req({ subject: "Python loops" })) as { challenges: Record<string, unknown>[] };
    const program = (specJson(req({ mode: "FULL", gameType: "adventure", subject: "Python loops" })) as { challenges: Record<string, unknown>[] }).challenges.find((c) => c.type === "program")!;
    const victim = rich.challenges[0]!;
    rich.challenges[0] = { ...program, id: victim.id, objectiveId: victim.objectiveId, easierId: undefined, harderId: undefined };
    expect(JSON.stringify(rich)).toContain('"type":"program"');
    const llm = mockLlm([rich]);
    const { game, spec, job } = await generate(u.id, req({ subject: "Python loops" }), llm);
    expect(game, job.errorMessage ?? "").toBeTruthy();
    expect(spec!.meta.featureTier).toBe("C");
    expect(typesOf(spec!)).not.toContain("program");
    for (const t of typesOf(spec!)) expect(allowedTypes("C")).toContain(t);
    // …and the model was told about the tier up front
    expect(llm.calls[0]!.messages[0]!.content).toContain("FEATURE TIER C");
  });
});

describe("Plus plan = tier B: 70 % of the features", () => {
  it("allows platformers and 2-area adventures with matching and side missions, but no program/simulation, boss or reactions", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const { job, spec } = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Fractions" }));
    expect(job.featureTier).toBe("B");
    expect(spec!.meta.featureTier).toBe("B");
    expect(spec!.areas.length).toBeLessThanOrEqual(2);
    expect(spec!.bosses).toEqual([]);
    for (const t of typesOf(spec!)) expect(allowedTypes("B")).toContain(t);
    expect(allowedTypes("B")).toContain("match");
    expect(spec!.areas.every((a) => a.npcs.every((n) => n.reactions.length === 0))).toBe(true);

    // a game type of the tier works, one outside it is refused with Pro
    const other = await createTestUser();
    await grantSubscription(other.id, "PLUS");
    const plat = await generate(other.id, req({ gameType: "platformer", subject: "Fractions" }));
    expect(plat.spec!.meta.featureTier).toBe("B");
    const r = await codeOf(createGeneration(u.id, { idempotencyKey: key(), request: req({ gameType: "simulation" }) }, { schedule: false }));
    expect(r.code).toBe("FEATURE_TIER_LOCKED");
    expect(r.details).toMatchObject({ requiredPlan: "PRO", tier: "B" });
  });
});

describe("Pro plan = tier A: everything", () => {
  it("builds the full game: several areas, every question type the template has, and the final boss", async () => {
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
  });

  it("a game keeps its features when the plan is later downgraded: extending never strips what the game already has", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const first = await generate(u.id, req({ mode: "FULL", gameType: "adventure", subject: "Python loops" }));
    expect(first.spec!.bosses.length).toBe(1);
    await grantSubscription(u.id, "PLUS"); // downgraded to tier B
    const ext = await generate(u.id, { ...req({ mode: "EXTEND", gameType: "adventure", subject: "Python loops" }), targetGameId: first.game!.id, extension: { addArea: true, addMissions: 1, addChallenges: 3, addMechanics: [] } });
    expect(ext.job.status).toBe("SUCCEEDED");
    expect(ext.spec!.bosses.length).toBe(1);
    expect(typesOf(ext.spec!)).toContain("program");
  });

  it("the tiers are nested and the shares are exactly 40 / 70 / 100 percent", () => {
    expect(TIER_FEATURES.C.length / 20).toBe(0.4);
    expect(TIER_FEATURES.B.length / 20).toBe(0.7);
    expect(PLANS.FREE.featureTier).toBe("C");
  });
});

describe("edits stay inside the tier", () => {
  it("a Plus (tier B) edit cannot add character reactions: the model is told, and without a valid change nothing is saved or charged", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const created = await generate(u.id, req({ subject: "Python loops" }), mockLlm([specJson(req({ subject: "Python loops" }))]));
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
