import { describe, expect, it } from "vitest";
import { buildDemoSpec, DEMO_PACKS } from "../support/samples";
import { generationRequestSchema } from "@/lib/schemas/generation";
import { validateGameSpec } from "@/lib/game/spec/validate";

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const HEBREW = /\p{Script=Hebrew}/u;

function build(pack: (typeof DEMO_PACKS)[number], lang: "en" | "he") {
  const content = pack.build(lang);
  return { content, challenges: content.challenges as Raw[], byId: new Map((content.challenges as Raw[]).map((c) => [c.id as string, c])) };
}

/** Challenges that are a variant of another one: the base points at them. */
function variantPairs(challenges: Raw[], byId: Map<string, Raw>) {
  return challenges.flatMap((c) => [["easierId", c.easierId], ["harderId", c.harderId]].filter(([, id]) => id).map(([field, id]) => ({ base: c, variant: byId.get(id as string)!, field: field as string })));
}

describe("demo template packs: the same strength in Hebrew and English", () => {
  for (const pack of DEMO_PACKS) {
    describe(pack.id, () => {
      const en = build(pack, "en"), he = build(pack, "he");

      it("both languages have the same structure: challenge ids, types, options, items and pairs", () => {
        const shape = (c: Raw) => [c.id, c.type, c.level, c.objectiveId, c.easierId, c.harderId, c.options?.length, c.correctOptionId, c.items?.length, c.pairs?.length, c.commonMistakes?.length, c.answer];
        expect(he.challenges.map(shape)).toEqual(en.challenges.map(shape));
        expect(he.content.missions.length).toBe(en.content.missions.length);
        expect(he.content.objectives.map((o) => o.id)).toEqual(en.content.objectives.map((o) => o.id));
        expect(pack.extensions("he").map((e) => e.challenges.length)).toEqual(pack.extensions("en").map((e) => e.challenges.length));
      });

      it("every challenge has a hint and an explanation, in Hebrew too, and every option explains itself", () => {
        for (const [lang, set] of [["en", en], ["he", he]] as const) {
          for (const c of set.challenges) {
            expect(String(c.hint ?? "").length, `${lang} ${c.id} hint`).toBeGreaterThan(8);
            expect(String(c.explanation ?? "").length, `${lang} ${c.id} explanation`).toBeGreaterThan(8);
            // (a language pack teaches foreign words, and a pure calculation has no words at all)
            if (lang === "he" && pack.id !== "language") {
              for (const field of ["hint", "explanation", "title"]) {
                if (/\p{Script=Latin}{3,}/u.test(String(c[field]))) expect(String(c[field]), `${c.id} ${field} is Hebrew`).toMatch(HEBREW);
              }
            }
            for (const o of (c.options ?? []) as Raw[]) expect(String(o.feedback ?? "").length, `${lang} ${c.id}/${o.id} feedback`).toBeGreaterThan(8);
            for (const m of (c.commonMistakes ?? []) as Raw[]) {
              expect(m.value, `${lang} ${c.id}: a common mistake is never the answer`).not.toBe(c.answer);
              expect(String(m.feedback).length).toBeGreaterThan(8);
            }
          }
        }
      });

      it("has enough to play: at least seven challenges of three or more types, and an easier version of at least a third", () => {
        expect(en.challenges.filter((c) => !/-easy$/.test(c.id)).length).toBeGreaterThanOrEqual(7);
        expect(new Set(en.challenges.map((c) => c.type)).size).toBeGreaterThanOrEqual(3);
        const placed = en.challenges.filter((c) => !/-(easy|hard)$/.test(c.id));
        expect(placed.filter((c) => c.easierId).length / placed.length).toBeGreaterThanOrEqual(1 / 3);
      });

      it("an easier version is the same kind of question, about the same concept and objective, and not harder", () => {
        for (const set of [en, he]) {
          for (const { base, variant, field } of variantPairs(set.challenges, set.byId)) {
            expect(variant, `${base.id} ${field}`).toBeTruthy();
            expect(variant.type, `${variant.id} type`).toBe(base.type);
            expect(variant.concept).toBe(base.concept);
            expect(variant.objectiveId).toBe(base.objectiveId);
            if (field === "easierId") expect(variant.level).toBeLessThanOrEqual(base.level);
            else expect(variant.level).toBeGreaterThan(base.level);
            // not a copy: the question or its numbers differ
            expect(JSON.stringify([variant.prompt, variant.items, variant.pairs, variant.options?.map((o: Raw) => o.text)])).not.toBe(JSON.stringify([base.prompt, base.items, base.pairs, base.options?.map((o: Raw) => o.text)]));
            if (base.type === "choice" && field === "easierId") {
              const right = (c: Raw) => c.options.find((o: Raw) => o.id === c.correctOptionId).text;
              expect(right(variant)).toBe(right(base));
              expect(variant.options.length).toBeLessThan(base.options.length);
              // every option of the warm-up is one of the full question's options
              for (const o of variant.options) expect(base.options.find((x: Raw) => x.text === o.text), o.text).toBeTruthy();
            }
            if (base.type === "match" && field === "easierId") {
              expect(variant.pairs.length).toBeLessThan(base.pairs.length);
              for (const p of variant.pairs) expect(base.pairs.find((x: Raw) => x.left === p.left && x.right === p.right)).toBeTruthy();
            }
          }
        }
      });

      for (const mode of ["FULL", "FAST"] as const) {
        for (const lang of ["en", "he"] as const) {
          it(`${mode} ${lang}: the game built from it passes validation`, () => {
            const req = generationRequestSchema.parse({ mode, subject: pack.id === "math" ? "maths" : pack.id, learningGoal: "learn", difficulty: "beginner", gameType: pack.gameType, contentLanguage: lang });
            const { raw, templateId } = buildDemoSpec(req);
            const res = validateGameSpec(raw, { alignGameType: req.gameType });
            if (!res.ok) throw new Error(res.errors.join("\n"));
            expect(templateId).toBeTruthy();
          });
        }
      }
    });
  }
});

describe("the right answer of a choice question is not always in the same place", () => {
  it("across the packs no slot holds more than 40 % of the right answers, and no pack puts them all in one slot", () => {
    const slots = new Map<number, number>();
    let total = 0;
    for (const pack of DEMO_PACKS) {
      for (const lang of ["en", "he"] as const) {
        const here = new Set<number>();
        let count = 0;
        for (const c of [...pack.build(lang).challenges, ...pack.extensions(lang).flatMap((e) => e.challenges)] as Raw[]) {
          if (c.type !== "choice" || c.options.length < 3 || c.options.every((o: Raw) => /^[-−\d.,/\s]+$/.test(o.text))) continue;
          const at = c.options.findIndex((o: Raw) => o.id === c.correctOptionId);
          here.add(at);
          count++;
          if (lang === "en") { slots.set(at, (slots.get(at) ?? 0) + 1); total++; }
        }
        if (count >= 3) expect(here.size, `${pack.id} ${lang}`).toBeGreaterThan(1);
      }
    }
    expect(total).toBeGreaterThan(12);
    expect(Math.max(...slots.values()) / total).toBeLessThanOrEqual(0.4);
    expect(slots.size).toBe(4);
  });

  it("is the same position in both languages, and only the order of the options changed", () => {
    for (const pack of DEMO_PACKS) {
      const en = pack.build("en").challenges as Raw[], he = pack.build("he").challenges as Raw[];
      expect(he.map((c) => c.correctOptionId)).toEqual(en.map((c) => c.correctOptionId));
      for (const c of en.filter((x) => x.type === "choice")) expect(c.options.map((o: Raw) => o.id)).toEqual(["a", "b", "c", "d", "e"].slice(0, c.options.length));
    }
  });
});

describe("the arithmetic of the maths pack is right", () => {
  const { byId } = build(DEMO_PACKS.find((p) => p.id === "math")!, "en");
  const answerOf = (id: string) => byId.get(id)!.answer as number;
  const promptOf = (id: string) => String(byId.get(id)!.prompt);

  /** A tiny evaluator for "3 + 4 × 2": × and ÷ before + and −, no eval. */
  function evaluate(expr: string): number {
    const tokens = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").match(/\d+(?:\.\d+)?|[-+*/]/g)!;
    const terms: number[] = [];
    let sign = 1, i = 0;
    while (i < tokens.length) {
      let value = Number(tokens[i++]);
      while (tokens[i] === "*" || tokens[i] === "/") value = tokens[i++] === "*" ? value * Number(tokens[i++]) : value / Number(tokens[i++]);
      terms.push(sign * value);
      sign = tokens[i] === "-" ? -1 : 1;
      i++;
    }
    return terms.reduce((a, b) => a + b, 0);
  }

  it("plain expressions evaluate to the answer", () => {
    for (const id of ["c-ops", "c-ops-easy"]) expect(evaluate(promptOf(id).replace(/=\s*\?/, "")), id).toBe(answerOf(id));
    // the "common mistake" is what you get by adding first
    expect(byId.get("c-ops")!.commonMistakes[0].value).toBe((3 + 4) * 2);
    expect(byId.get("c-ops-easy")!.commonMistakes[0].value).toBe((2 + 3) * 2);
  });

  it("one- and two-step equations solve to the answer", () => {
    for (const id of ["c-eq", "c-eq-easy"]) {
      const m = /(\d*)x\s*\+\s*(\d+)\s*=\s*(\d+)/.exec(promptOf(id))!;
      const a = m[1] ? Number(m[1]) : 1;
      expect((Number(m[3]) - Number(m[2])) / a, id).toBe(answerOf(id));
    }
  });

  it("percentages, ratios, rates, negatives, area and perimeter match their stories", () => {
    for (const id of ["c-pct", "c-pct-easy"]) {
      const m = /(\d+)%[^\d]+(\d+)/.exec(promptOf(id))!;
      expect((Number(m[1]) * Number(m[2])) / 100, id).toBe(answerOf(id));
    }
    expect(answerOf("c-neg")).toBe(-4 + 9);
    expect(answerOf("c-ratio")).toBe((2 * 9) / 3);
    expect(answerOf("c-rate")).toBe(150 / 2);
    expect(byId.get("c-neg")!.commonMistakes.map((m: Raw) => m.value)).toEqual([-4 - 9, 4 + 9]);
    // a rectangle with perimeter 20 and width 4: the right option is the length 6, and 2 × (4 + 6) = 20
    const perim = byId.get("c-perim")!;
    expect(perim.options.find((o: Raw) => o.id === perim.correctOptionId).text).toBe(String(20 / 2 - 4));
  });
});
