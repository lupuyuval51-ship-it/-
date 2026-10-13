import { afterAll, afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db, disconnectDb } from "@/server/db";
import { setBackendForTests } from "@/server/ai/registry";
import type { GenerationBackend } from "@/server/ai/types";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { runGenerationJob } from "@/server/generation/runner";
import { createGeneration } from "@/server/generation/service";
import type { GameSpec } from "@/lib/game/spec/schema";
import { validateGameSpec } from "@/lib/game/spec/validate";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { TOPICS } from "@/lib/game/topics/catalog";
import { ApiError } from "@/server/http/errors";
import { PLANS } from "@/config/plans";
import { createTestUser, grantSubscription } from "./helpers";
import { mockLlm } from "./helpers-ai";
import { setFeatureTierForTests } from "@/server/games/feature-tier";

/** The topic library on the website: the server pipeline builds the game from curated content, never with a model. */
afterAll(disconnectDb);
afterEach(() => setBackendForTests(null));

const DEMO: GenerationBackend = { type: "templates", info: { id: "demo", kind: "demo", label: "Demo templates (not AI)", model: "predefined-templates" } };
const topic = TOPICS[0]!;
const req = (over: Partial<GenerationRequest> = {}): GenerationRequest => ({
  mode: "FAST", subject: "whatever the client sent", learningGoal: "ignored", difficulty: "beginner", gameType: "adventure", contentLanguage: "he", topicId: topic.id, ...over,
});
const key = () => `idem-${randomUUID()}`;

async function generate(userId: string, request: GenerationRequest, backend: GenerationBackend, idempotencyKey = key()) {
  setBackendForTests(backend);
  const res = await createGeneration(userId, { idempotencyKey, request }, { schedule: false });
  await runGenerationJob(res.jobId, { backend });
  const job = await db.generationJob.findUniqueOrThrow({ where: { id: res.jobId } });
  const game = job.gameId ? await db.game.findUnique({ where: { id: job.gameId } }) : null;
  return { job, game, res };
}

describe("topic library — curated topics become games without any model", () => {
  it("demo backend: a valid game, labelled as the topic library, charging exactly one credit", async () => {
    const u = await createTestUser();
    const { job, game } = await generate(u.id, req(), DEMO);
    expect(job.status).toBe("SUCCEEDED");
    expect(job.providerId).toBe("topic-library");
    expect(game).toMatchObject({ ownerId: u.id, generatorKind: "catalog", generatorProvider: "topic-library", generatorModel: "curated-content", createdVia: "FAST", difficulty: "beginner", language: "he" });
    const spec = game!.spec as unknown as GameSpec;
    expect(validateGameSpec(spec).ok).toBe(true);
    expect(spec.meta.generator).toMatchObject({ kind: "catalog", provider: "topic-library", templateId: topic.id });
    // the subject is the topic's own title, not whatever the client typed
    expect(spec.meta.subject).toBe(topic.he[0]);
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 1, reserved: 0, remaining: PLANS.FREE.gamesPerPeriod - 1 });
  });

  it("a real AI provider is configured: the model is never called, and the game is still not labelled as AI", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const llm = mockLlm(() => new Error("the model must not be called for a topic-library game"));
    const { job, game } = await generate(u.id, req({ mode: "FULL", difficulty: "advanced", contentLanguage: "en", device: "phone" }), llm);
    expect(job.status).toBe("SUCCEEDED");
    expect(llm.calls).toHaveLength(0);
    expect(game).toMatchObject({ generatorKind: "catalog", generatorProvider: "topic-library", createdVia: "FULL", difficulty: "advanced" });
    const spec = game!.spec as unknown as GameSpec;
    expect(spec.areas.length).toBe(2);
    expect(spec.bosses.length).toBeGreaterThan(0);
    expect(spec.meta.featureTier).toBe("A");
  });

  it("works even when the AI provider is unavailable (the topic library needs none)", async () => {
    const u = await createTestUser();
    const { job, game } = await generate(u.id, req(), { type: "unavailable", reason: "ANTHROPIC_API_KEY is not set", info: { id: "anthropic", kind: "ai", label: "Anthropic", model: "n/a" } });
    expect(job.status).toBe("SUCCEEDED");
    expect(game!.generatorKind).toBe("catalog");
  });

  it("honours the plan's feature tier: Free gets a tier-C game, and a Full Adventure is refused before anything is reserved", async () => {
    setFeatureTierForTests(null); // this test uses the plans' real tiers (Free = C)
    const u = await createTestUser();
    const { game } = await generate(u.id, req({ gameType: "exploration" }), DEMO);
    const spec = game!.spec as unknown as GameSpec;
    expect(spec.meta.featureTier).toBe("C");
    expect(spec.challenges.every((c) => c.type !== "match" && !c.easierId && !c.harderId)).toBe(true);
    setBackendForTests(DEMO);
    const err = await createGeneration(u.id, { idempotencyKey: key(), request: req({ mode: "FULL" }) }, { schedule: false }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("FEATURE_TIER_LOCKED");
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 1, reserved: 0 });
  });

  it("is idempotent: the same key returns the same job and charges once", async () => {
    const u = await createTestUser();
    const k = key();
    const first = await generate(u.id, req(), DEMO, k);
    setBackendForTests(DEMO);
    const again = await createGeneration(u.id, { idempotencyKey: k, request: req() }, { schedule: false });
    expect(again.jobId).toBe(first.res.jobId);
    expect(again.created).toBe(false);
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 1, reserved: 0 });
  });

  it("a topic-library game cannot be extended (refused before a credit is reserved)", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const { game } = await generate(u.id, req(), DEMO);
    setBackendForTests(DEMO);
    const ext: GenerationRequest = { mode: "EXTEND", subject: "x", learningGoal: "more", difficulty: "beginner", gameType: "adventure", contentLanguage: "he", targetGameId: game!.id };
    const err = await createGeneration(u.id, { idempotencyKey: key(), request: ext }, { schedule: false }).catch((e) => e);
    expect((err as ApiError).code).toBe("EXTEND_BACKEND_MISMATCH");
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 1, reserved: 0 });
  });
});
