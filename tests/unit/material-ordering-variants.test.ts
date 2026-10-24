import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { buildMaterialSpec } from "@/lib/game/material/build";
import { generateChallenges } from "@/lib/game/material/challenges";
import { parseMaterial } from "@/lib/game/material/parse";
import { NOTE_SETS } from "@/lib/game/sim-balance/corpus";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { mulberry32 } from "@/lib/game/util/prng";
import { correctAnswer, request, wrongAnswer } from "./helpers";

describe("a long ordering question has an easier version with three of its items", () => {
  for (const [lang, id] of [["en", "en-history"], ["he", "he-history"], ["en", "en-water"]] as const) {
    it(`${id}: the first, a middle and the last item stay, in the same order`, () => {
      const n = NOTE_SETS[lang].find((x) => x.id === id)!;
      const g = generateChallenges(parseMaterial(n.text), { lang, rnd: mulberry32(3), max: 20, variants: true });
      const longOnes = g.challenges.filter((c) => c.type === "sequence" && c.easierId);
      expect(longOnes.length, id).toBeGreaterThan(0);
      for (const c of longOnes) {
        const v = g.variants.find((x) => x.id === c.easierId)!;
        const base = (c.items as { id: string }[]).map((i) => i.id);
        const kept = (v.items as { id: string }[]).map((i) => i.id);
        expect(v.type).toBe("sequence");
        expect(v.level).toBe(1);
        expect(kept).toHaveLength(3);
        expect(kept.map((k) => base.indexOf(k))).toEqual([0, Math.floor((base.length - 1) / 2), base.length - 1]);
        expect(v.hint).toBe(c.hint);
      }
      expect(g.variants.length).toBeLessThanOrEqual(6);
    });
  }

  it("a whole game with them validates, and the easier version is gradable in order", () => {
    const n = NOTE_SETS.en.find((x) => x.id === "en-history")!;
    const built = buildMaterialSpec(request({ material: n.text, subject: n.subject, contentLanguage: "en", mode: "FULL" }) as never);
    const res = validateGameSpec(built.raw, { alignGameType: "adventure" });
    if (!res.ok) throw new Error(res.errors.join("\n"));
    const easy = res.spec.challenges.filter((c) => /-easy$/.test(c.id) && c.type === "sequence");
    expect(easy.length).toBeGreaterThan(0);
    for (const c of easy) {
      expect(gradeAnswer(c, correctAnswer(c), "en").correct).toBe(true);
      expect(gradeAnswer(c, wrongAnswer(c), "en").correct).toBe(false);
    }
  });
});
