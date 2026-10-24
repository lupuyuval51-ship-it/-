import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GAME_TYPES } from "@/lib/game/spec/constants";
import { setSampleBuilderForTests } from "@/lib/game/sample-builder";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { TOPICS } from "@/lib/game/topics/catalog";
import { TOPIC_PROVIDER } from "@/lib/game/topics/build";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { OfflineGenerationError, generateOffline, generateOfflineWithProgress, type OfflineStage } from "@/lib/offline/generate";
import { registerSamples } from "../support/register-samples";
import { request } from "./helpers";
import { NOTES } from "./offline-helpers";

/**
 * The product's rule "there are no demo games" at the device's own generator. The suites register a sample builder for the
 * rest of the tests; here it is removed, which is exactly what the real app is.
 */
beforeEach(() => setSampleBuilderForTests(null));
afterEach(() => registerSamples());

const refusal = (fn: () => unknown): OfflineGenerationError => {
  try { fn(); } catch (e) { return e as OfflineGenerationError; }
  throw new Error("expected a refusal");
};

describe("a subject alone builds nothing on the device", () => {
  it("every mode, game type, level and language is refused with INVALID_REQUEST and a message that says what to add", () => {
    for (const mode of ["FAST", "FULL"] as const) {
      for (const gameType of GAME_TYPES) {
        for (const contentLanguage of ["en", "he"] as const) {
          const e = refusal(() => generateOffline(request({ mode, gameType, contentLanguage, difficulty: "intermediate" })));
          expect(e, `${mode}/${gameType}/${contentLanguage}`).toBeInstanceOf(OfflineGenerationError);
          expect(e.code).toBe("INVALID_REQUEST");
          expect(e.message).toMatch(/study material|topic library/i);
        }
      }
    }
  });

  it("the progress call refuses it too, after reading and before it claims to be building a game that cannot exist", async () => {
    const stages: OfflineStage[] = [];
    const err = await generateOfflineWithProgress(request(), (_p, stage) => stages.push(stage)).then(() => null, (e: unknown) => e);
    expect(err).toBeInstanceOf(OfflineGenerationError);
    expect((err as OfflineGenerationError).code).toBe("INVALID_REQUEST");
    expect(stages).not.toContain("checking");
    expect(stages).not.toContain("saving");
  });

  it("with the sample builder back (the test seam), the same request does build, and the label says it is a template", () => {
    registerSamples();
    const { spec } = generateOffline(request());
    expect(spec.meta.generator?.kind).toBe("demo");
  });
});

describe("what the device does build, and how it is labelled", () => {
  const now = new Date("2026-10-17T12:00:00.000Z");

  it("the learner's own notes make an 'engine' game that passes validation again and carries the time it was made", () => {
    const { spec } = generateOffline(request({ material: NOTES, subject: "Plants", mode: "FAST" }), now);
    expect(spec.meta.generator).toMatchObject({ kind: "engine", provider: "study-engine", model: "rule-based", mode: "FAST", generatedAt: now.toISOString() });
    expect(spec.meta.generator).not.toHaveProperty("templateId");
    expect(validateGameSpec(spec, { alignGameType: spec.meta.gameType }).ok).toBe(true);
  });

  it("a library topic makes a 'catalog' game that names its topic, whatever the subject line says", async () => {
    const topic = TOPICS[0]!;
    const content = (await loadTopicContent(topic.id))!;
    const { spec } = generateOffline({ ...request({ mode: "FAST", subject: "something else entirely" }), topicId: topic.id }, now, "A", content);
    expect(spec.meta.generator).toMatchObject({ kind: "catalog", provider: TOPIC_PROVIDER, templateId: topic.id, mode: "FAST", generatedAt: now.toISOString() });
    expect(spec.meta.generator?.kind).not.toBe("ai");
  });

  it("a topic request without its content, with an unknown topic, in EXTEND mode, or that is not a request at all, is INVALID_REQUEST", async () => {
    const topic = TOPICS[0]!;
    const content = (await loadTopicContent(topic.id))!;
    expect(refusal(() => generateOffline({ ...request(), topicId: topic.id })).code).toBe("INVALID_REQUEST"); // the caller must load it first
    expect(refusal(() => generateOffline({ ...request(), topicId: "no-such-topic" }, now, "A", content)).code).toBe("INVALID_REQUEST");
    // (an extension that the request schema accepts: the device has no game to extend and still builds nothing)
    expect(refusal(() => generateOffline({ ...request({ material: NOTES }), mode: "EXTEND", targetGameId: "some-game" })).code).toBe("INVALID_REQUEST");
    for (const junk of [null, undefined, "", "FULL", 7, [], {}, { mode: "FULL" }]) expect(refusal(() => generateOffline(junk)).code, JSON.stringify(junk)).toBe("INVALID_REQUEST");
  });

  it("notes that are too thin are refused in the language of the request, and nothing is built", () => {
    const thin = "too short to be a lesson but long enough to pass the box";
    const en = refusal(() => generateOffline(request({ material: thin, contentLanguage: "en" })));
    const he = refusal(() => generateOffline(request({ material: thin, contentLanguage: "he" })));
    expect([en.code, he.code]).toEqual(["MATERIAL_UNUSABLE", "MATERIAL_UNUSABLE"]);
    expect(en.message).not.toMatch(/[֐-׿]/);
    expect(he.message).toMatch(/[֐-׿]/);
  });

  it("every game the device builds from notes or a topic carries one of the two honest labels, never 'demo' or 'ai'", async () => {
    const content = (await loadTopicContent(TOPICS[1]!.id))!;
    const games = [
      generateOffline(request({ material: NOTES, mode: "FULL" }), now).spec,
      generateOffline({ ...request({ mode: "FULL" }), topicId: TOPICS[1]!.id }, now, "A", content).spec,
    ];
    expect(games.map((g) => g.meta.generator?.kind)).toEqual(["engine", "catalog"]);
  });
});
