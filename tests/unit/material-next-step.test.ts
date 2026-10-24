import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { NOTE_SETS } from "@/lib/game/sim-balance/corpus";
import { correctAnswer, request, wrongAnswer } from "./helpers";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import type { Challenge } from "@/lib/game/spec/schema";

const notes = (id: string) => [...NOTE_SETS.en, ...NOTE_SETS.he].find((n) => n.id === id)!;

describe("study engine: notes made only of steps still make a game", () => {
  for (const id of ["en-steps-only", "he-steps-only"]) {
    it(`${id} builds, with "which step" questions whose right answer is the next step of the list`, () => {
      const n = notes(id);
      const lang = id.startsWith("he") ? "he" : "en";
      const { spec } = generateOffline(request({ material: n.text, subject: n.subject, mode: "FULL", contentLanguage: lang }));
      const choices = spec.challenges.filter((c): c is Extract<Challenge, { type: "choice" }> => c.type === "choice");
      expect(spec.challenges.length).toBeGreaterThanOrEqual(3);
      expect(choices.length).toBeGreaterThan(0);
      const steps = n.text.split("\n").map((l) => l.match(/^\d+\.\s*(.+?)\.?$/)?.[1]).filter((x): x is string => !!x);
      for (const c of choices) {
        const texts = c.options.map((o) => o.text);
        expect(new Set(texts).size, c.id).toBe(texts.length);
        for (const t of texts) expect(steps, `${c.id}: ${t}`).toContain(t);
        const right = c.options.find((o) => o.id === c.correctOptionId)!.text;
        const after = c.prompt.match(/[“״]([^”״]+)[”״]\?$/)?.[1];
        if (after) expect(steps[steps.indexOf(after) + 1], c.prompt).toBe(right);
        else expect(steps[0]).toBe(right); // "which step comes first"
        expect(gradeAnswer(c, correctAnswer(c), lang).correct).toBe(true);
        expect(gradeAnswer(c, wrongAnswer(c), lang).correct).toBe(false);
      }
    });
  }

  it("a list of three steps alone is still too little (one ordering question, no next-step questions)", () => {
    expect(() => generateOffline(request({ material: "How to plant:\n1. Dig a small hole.\n2. Put the seed in.\n3. Cover it with soil.", subject: "Planting", mode: "FULL" }))).toThrow();
  });
});
