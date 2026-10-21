import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { maxAreasFor } from "@/lib/game/spec/tier";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { db, disconnectDb } from "@/server/db";
import { setBackendForTests } from "@/server/ai/registry";
import type { GenerationBackend } from "@/server/ai/types";
import { setFeatureTierForTests } from "@/server/games/feature-tier";
import { createGeneration } from "@/server/generation/service";
import { runGenerationJob } from "@/server/generation/runner";
import { ApiError } from "@/server/http/errors";
import type { GameSpec } from "@/lib/game/spec/schema";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { createTestUser, grantSubscription } from "./helpers";

afterAll(disconnectDb);
afterEach(() => setBackendForTests(null));
beforeEach(() => setFeatureTierForTests(null)); // the real levels: a level B game holds at most two areas

const DEMO: GenerationBackend = { type: "none", info: { id: "none", kind: "none", label: "No AI provider", model: "n/a" } };
const req = (over: Partial<GenerationRequest> = {}): GenerationRequest => ({
  mode: "FULL", subject: "Python loops", learningGoal: "Understand loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", level: "B", ...over,
});
const key = () => `extend-full-${randomUUID()}`;
const usedB = async (userId: string) => (await getAllowanceSummary(userId)).levels.B.used;

async function generate(userId: string, request: GenerationRequest) {
  setBackendForTests(DEMO);
  const res = await createGeneration(userId, { idempotencyKey: key(), request }, { schedule: false });
  await runGenerationJob(res.jobId, { backend: DEMO });
  const job = await db.generationJob.findUniqueOrThrow({ where: { id: res.jobId } });
  const game = job.gameId ? await db.game.findUniqueOrThrow({ where: { id: job.gameId } }) : null;
  return { job, game, spec: game ? (game.spec as unknown as GameSpec) : null };
}
const extensionOf = (gameId: string): GenerationRequest => ({ ...req({ mode: "EXTEND" }), targetGameId: gameId, extension: { addArea: true, addMissions: 1, addChallenges: 3, addMechanics: [] } });

describe("extending a game that already has every area its level allows", () => {
  it("is refused before anything is reserved, and nothing is charged", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const full = await generate(u.id, req());
    expect(full.spec!.meta.featureTier).toBe("B");
    expect(full.spec!.areas.length).toBe(maxAreasFor("B"));
    const before = await usedB(u.id);

    setBackendForTests(DEMO);
    const err = await createGeneration(u.id, { idempotencyKey: key(), request: extensionOf(full.game!.id) }, { schedule: false }).then(() => null, (e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("EXTEND_FULL");
    expect((err as ApiError).details).toMatchObject({ level: "B", areas: 2, maxAreas: 2 });
    expect(await db.generationJob.count({ where: { userId: u.id, mode: "EXTEND" } })).toBe(0);
    expect(await usedB(u.id)).toBe(before);
  });

  it("an extension the level clamp would empty (the game filled up after the job was accepted) fails without a charge", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const small = await generate(u.id, req({ mode: "FAST" }));
    const twoAreas = await generate(u.id, req({ subject: "Python loops" }));
    expect(small.spec!.areas.length).toBe(1);
    setBackendForTests(DEMO);
    const res = await createGeneration(u.id, { idempotencyKey: key(), request: extensionOf(small.game!.id) }, { schedule: false });
    // meanwhile the game becomes a two-area game (an edit or a restore of another version)
    await db.game.update({ where: { id: small.game!.id }, data: { spec: twoAreas.spec as never } });
    const before = await usedB(u.id);
    await runGenerationJob(res.jobId, { backend: DEMO });
    const job = await db.generationJob.findUniqueOrThrow({ where: { id: res.jobId } });
    expect(job.status).toBe("FAILED");
    expect(job.errorCode).toBe("TIER_BUILD_FAILED");
    expect(await usedB(u.id)).toBe(before);
    const game = await db.game.findUniqueOrThrow({ where: { id: small.game!.id } });
    expect((game.spec as unknown as GameSpec).areas.length).toBe(2); // nothing was saved over it
  });
});
