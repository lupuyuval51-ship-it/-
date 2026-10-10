import { describe, expect, it } from "vitest";
import { EXAMPLE_NOTES } from "../../mobile/src/pages/examples";
import { generateOffline } from "@/lib/offline/generate";
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
});
