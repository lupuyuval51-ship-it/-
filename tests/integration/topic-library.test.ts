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
import { PREMIUM_TOPIC_IDS, PRO_ONLY_TOPIC_IDS } from "@/lib/game/topics/premium";

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
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 1, reserved: 0, remaining: PLANS.FREE.allowance.budget - 1 });
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

  it("honours the game's level: a Free level-C topic is a tier-C game, and a level-C Full Adventure is refused before anything is reserved", async () => {
    setFeatureTierForTests(null); // this test uses the plans' real levels (Free = C or B)
    const u = await createTestUser();
    const { game } = await generate(u.id, req({ gameType: "exploration", level: "C" }), DEMO);
    const spec = game!.spec as unknown as GameSpec;
    expect(spec.meta.featureTier).toBe("C");
    expect(spec.challenges.every((c) => c.type !== "match" && !c.easierId && !c.harderId)).toBe(true);
    setBackendForTests(DEMO);
    const err = await createGeneration(u.id, { idempotencyKey: key(), request: req({ mode: "FULL", level: "C" }) }, { schedule: false }).catch((e) => e);
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

describe("premium topics — about a third of the library is Plus and Pro only and two topics per category are Pro only, enforced by the server", () => {
  const premium = [...PREMIUM_TOPIC_IDS][0]!;
  it("a Free account is refused a premium topic (403 TOPIC_LOCKED naming Plus) and nothing is reserved", async () => {
    const u = await createTestUser();
    setBackendForTests(DEMO);
    const err = await createGeneration(u.id, { idempotencyKey: key(), request: req({ topicId: premium }) }, { schedule: false }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 403, code: "TOPIC_LOCKED", details: { requiredPlan: "PLUS" } });
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 0, reserved: 0 });
  });

  it("a Plus account plays it", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const { job } = await generate(u.id, req({ topicId: premium }), DEMO);
    expect(job.status).toBe("SUCCEEDED");
  });

  const proOnly = [...PRO_ONLY_TOPIC_IDS][0]!;
  it("a Plus account is refused a Pro-only topic (403 TOPIC_LOCKED naming Pro) and nothing is reserved", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    setBackendForTests(DEMO);
    const err = await createGeneration(u.id, { idempotencyKey: key(), request: req({ topicId: proOnly }) }, { schedule: false }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 403, code: "TOPIC_LOCKED", details: { requiredPlan: "PRO" } });
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 0, reserved: 0 });
  });

  it("a Free account is refused a Pro-only topic too, and a Pro account plays it", async () => {
    const free = await createTestUser();
    setBackendForTests(DEMO);
    const err = await createGeneration(free.id, { idempotencyKey: key(), request: req({ topicId: proOnly }) }, { schedule: false }).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 403, code: "TOPIC_LOCKED", details: { requiredPlan: "PRO" } });
    const pro = await createTestUser();
    await grantSubscription(pro.id, "PRO");
    const { job } = await generate(pro.id, req({ topicId: proOnly }), DEMO);
    expect(job.status).toBe("SUCCEEDED");
  });
});
