import { describe, expect, it } from "vitest";
import { EXAMPLES, EXAMPLE_NOTES, exampleById, isExampleText } from "../../mobile/src/pages/examples";
import { INPUT_LIMITS } from "@/config/limits";
import { parseMaterial } from "@/lib/game/material/parse";
import { generateChallenges } from "@/lib/game/material/challenges";
import { MIN_CHALLENGES, MIN_MATERIAL_CHARS } from "@/lib/game/material/limits";
import { hashText } from "@/lib/game/material/text";
import { mulberry32 } from "@/lib/game/util/prng";
import { generateOffline } from "@/lib/offline/generate";
import { generationRequestSchema } from "@/lib/schemas/generation";
import { request } from "./helpers";

describe("example notes in the app", () => {
  for (const lang of ["he", "en"] as const) {
    it(`(${lang}) build a full game that uses several kinds of challenges`, () => {
      const ex = EXAMPLE_NOTES[lang];
      const { spec } = generateOffline(request({ material: ex.notes, subject: ex.subject, mode: "FULL", contentLanguage: lang }));
      const types = new Set(spec.challenges.map((c) => c.type));
      expect(spec.challenges.length).toBeGreaterThanOrEqual(8);
      expect(types.has("sequence")).toBe(true); // the numbered steps
      expect(types.has("match")).toBe(true); // the terms
      expect(spec.challenges.some((c) => /מה מניע|What powers/.test(c.prompt))).toBe(true); // the learner's own question
      expect(spec.meta.generator?.kind).toBe("engine");
    });
  }

  it("the default example is the first one and stays the water cycle", () => {
    expect(EXAMPLES[0]!.id).toBe("water");
    expect(EXAMPLE_NOTES.he.subject).toBe("מחזור המים");
    expect(EXAMPLE_NOTES.en.subject).toBe("The water cycle");
  });

  it("offers several examples with unique ids and distinct subjects", () => {
    expect(EXAMPLES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(EXAMPLES.map((e) => e.id)).size).toBe(EXAMPLES.length);
    for (const lang of ["he", "en"] as const) expect(new Set(EXAMPLES.map((e) => e[lang].subject)).size).toBe(EXAMPLES.length);
    expect(exampleById("fractions")?.en.subject).toBe("Fractions");
    expect(exampleById("nope")).toBeUndefined();
  });

  it("recognises example text so it is never mistaken for the learner's own notes", () => {
    expect(isExampleText(EXAMPLES[1]!.he.subject, EXAMPLES[1]!.he.notes)).toBe(true);
    expect(isExampleText(EXAMPLES[1]!.he.subject, EXAMPLES[1]!.en.notes)).toBe(false);
    expect(isExampleText("", "")).toBe(false);
  });
});

describe.each(EXAMPLES.flatMap((e) => (["he", "en"] as const).map((lang) => ({ id: e.id, lang, ex: e[lang] }))))("example $id ($lang)", ({ lang, ex }) => {
  it("fits the form limits and the request schema, so the button can never produce an invalid request", () => {
    expect(ex.subject.length).toBeLessThanOrEqual(INPUT_LIMITS.subjectMax);
    expect(ex.notes.length).toBeLessThanOrEqual(INPUT_LIMITS.materialMax);
    expect(ex.notes.length).toBeGreaterThanOrEqual(MIN_MATERIAL_CHARS);
    const parsed = generationRequestSchema.safeParse({ mode: "FAST", subject: ex.subject, learningGoal: ex.subject, difficulty: "beginner", gameType: "exploration", contentLanguage: lang, material: ex.notes });
    expect(parsed.success).toBe(true);
  });

  it("is judged 'enough for a game' by the live preview rule (same as the screen)", () => {
    const k = parseMaterial(ex.notes);
    const gen = generateChallenges(k, { lang: "en", rnd: mulberry32(hashText(ex.notes)), max: 4 });
    expect(gen.challenges.length).toBeGreaterThanOrEqual(MIN_CHALLENGES);
    expect(k.definitions.length).toBeGreaterThanOrEqual(3);
    expect(k.steps.length).toBeGreaterThanOrEqual(1);
    expect(k.qa.length).toBeGreaterThanOrEqual(1);
  });

  it("builds an engine game in a Full Adventure (tier A) and in the smallest game the lowest tier has (tier C)", () => {
    const full = generateOffline(request({ material: ex.notes, subject: ex.subject, mode: "FULL", contentLanguage: lang }), new Date(), "A");
    expect(full.spec.meta.generator?.kind).toBe("engine");
    expect(full.spec.challenges.length).toBeGreaterThanOrEqual(8);
    const types = new Set(full.spec.challenges.map((c) => c.type));
    expect(types.has("sequence")).toBe(true);
    expect(types.has("match")).toBe(true);
    const small = generateOffline(request({ material: ex.notes, subject: ex.subject, mode: "FAST", gameType: "exploration", contentLanguage: lang }), new Date(), "C");
    expect(small.spec.meta.featureTier).toBe("C");
    expect(small.spec.challenges.length).toBeGreaterThanOrEqual(MIN_CHALLENGES);
  });
});
