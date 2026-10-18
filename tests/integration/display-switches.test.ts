import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db, disconnectDb } from "@/server/db";
import { describeBackend, setBackendForTests } from "@/server/ai/registry";
import type { GenerationBackend } from "@/server/ai/types";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { demoTemplatesOn, gameEditingShown, resetEnvForTests } from "@/server/env";
import { runGenerationJob } from "@/server/generation/runner";
import { createGeneration } from "@/server/generation/service";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { TOPICS } from "@/lib/game/topics/catalog";
import { createTestUser } from "./helpers";
import { mockLlm } from "./helpers-ai";

/**
 * The display switches GAME_EDITING and DEMO_TEMPLATES are off by default (the suites run with them on). Off, the game
 * page hides the editing tools, and without an AI provider a subject alone no longer makes a demo-template game: the
 * learner's material or a library topic is needed. Nothing is reserved for a refused request.
 */
afterAll(disconnectDb);
afterEach(() => setBackendForTests(null));

const DEMO: GenerationBackend = { type: "templates", info: { id: "demo", kind: "demo", label: "Demo templates (not AI)", model: "predefined-templates" } };
const req = (over: Partial<GenerationRequest> = {}): GenerationRequest => ({
  mode: "FAST", subject: "Photosynthesis", learningGoal: "How plants make food", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", ...over,
});
const NOTES = "Photosynthesis: the process plants use to turn light into chemical energy.\nChlorophyll: the green pigment in leaves that absorbs light.\nStomata: tiny pores on a leaf that let gases in and out.\nXylem: the tissue that carries water up the plant.";

describe("display switches off (the defaults)", () => {
  beforeEach(() => { delete process.env.GAME_EDITING; delete process.env.DEMO_TEMPLATES; resetEnvForTests(); });
  afterEach(() => { process.env.GAME_EDITING = "true"; process.env.DEMO_TEMPLATES = "true"; resetEnvForTests(); });

  it("both are off unless switched on", () => {
    expect(gameEditingShown()).toBe(false);
    expect(demoTemplatesOn()).toBe(false);
    setBackendForTests(DEMO);
    expect(describeBackend()).toMatchObject({ kind: "demo", templates: false });
  });

  it("no AI: a subject alone is refused before anything is reserved; material or a topic still make a game", async () => {
    const u = await createTestUser();
    setBackendForTests(DEMO);
    await expect(createGeneration(u.id, { idempotencyKey: `k-${randomUUID()}`, request: req() }, { schedule: false })).rejects.toMatchObject({ status: 422, code: "MATERIAL_REQUIRED" });
    expect(await db.generationJob.count({ where: { userId: u.id } })).toBe(0);
    expect((await getAllowanceSummary(u.id)).levels.A).toMatchObject({ used: 0, reserved: 0 });

    const fromNotes = await createGeneration(u.id, { idempotencyKey: `k-${randomUUID()}`, request: req({ material: NOTES }) }, { schedule: false });
    await runGenerationJob(fromNotes.jobId, { backend: DEMO });
    const job = await db.generationJob.findUniqueOrThrow({ where: { id: fromNotes.jobId } });
    expect(job.status).toBe("SUCCEEDED");
    expect((await db.game.findUniqueOrThrow({ where: { id: job.gameId! } })).generatorKind).toBe("engine");

    const fromTopic = await createGeneration(u.id, { idempotencyKey: `k-${randomUUID()}`, request: req({ topicId: TOPICS[0]!.id }) }, { schedule: false });
    await runGenerationJob(fromTopic.jobId, { backend: DEMO });
    expect((await db.generationJob.findUniqueOrThrow({ where: { id: fromTopic.jobId } })).status).toBe("SUCCEEDED");
  });

  it("with an AI provider a subject alone is fine (the switch is only about the demo templates)", async () => {
    const u = await createTestUser();
    const llm = mockLlm(() => new Error("not needed: the job is only created here"));
    setBackendForTests(llm);
    const res = await createGeneration(u.id, { idempotencyKey: `k-${randomUUID()}`, request: req() }, { schedule: false });
    expect(res.created).toBe(true);
  });
});
