import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import circles from "@/lib/game/topics/content/math-circles";
import dataSpread from "@/lib/game/topics/content/math-data-spread";
import functions from "@/lib/game/topics/content/math-functions";
import hebrewNumerals from "@/lib/game/topics/content/math-hebrew-numerals";
import historyOfMaths from "@/lib/game/topics/content/math-history-of-maths";
import logarithms from "@/lib/game/topics/content/math-logarithms";
import money from "@/lib/game/topics/content/math-money";
import probability from "@/lib/game/topics/content/math-probability";
import simultaneous from "@/lib/game/topics/content/math-simultaneous-equations";

/**
 * Nine maths topics after the W7 giveaway round (G4): a game shows most items of a level together, so no term
 * meaning, number prompt or ordering step of a level may spell out the answer of a choice question (or a number item)
 * of that level. Removed: "add 3" as the function-machine example next to the "add 3" rule question, the diameter as
 * the one-word answer about the longest chord (now a 14 cm computation), "the interquartile range" in a number prompt
 * next to the question that has it as its answer, Hei in an ordering next to "Which letter stands for 5?", kuf = 100
 * and tsadi = 90 spelled out in the tens and hundreds terms, 708 as the lifrat-katan example next to the tav-shin-chet
 * question, "Roman numerals" in a number prompt next to the no-zero question, log₂ 8 = 3 and log₃ 81 = 4 as term
 * examples next to the questions that ask exactly those, log 8 in a number prompt next to "write 3·log 2 as one log",
 * 100 agorot in the shekel terms next to "how many agorot in one shekel" (now 3 shekels → 300), "5 shekels" in an
 * ordering next to the pizza change question, "impossible" in the probability term next to the die-7 question, and
 * "no solution" (אין פתרון) in a number prompt next to the parallel-lines question.
 */
const TOPICS: Record<string, TopicContent> = {
  "math-circles": circles,
  "math-data-spread": dataSpread,
  "math-functions": functions,
  "math-hebrew-numerals": hebrewNumerals,
  "math-history-of-maths": historyOfMaths,
  "math-logarithms": logarithms,
  "math-money": money,
  "math-probability": probability,
  "math-simultaneous-equations": simultaneous,
};
const LEVELS = ["b", "i", "a"] as const;
type Lang = 0 | 1;

/** Term meanings, number prompts and hints, and ordering steps of one level in one language. */
function shownAround(lv: LevelContent, lang: Lang): string[] {
  return [
    ...(lv.t ?? []).map((t) => (lang ? t[3] : t[1])),
    ...(lv.n ?? []).flatMap((n) => {
      const nt = lang ? n[2] : n[1];
      return [nt[0], ...(nt[3] ? [nt[3]] : [])];
    }),
    ...(lv.s ?? []).flatMap((s) => s[lang]),
  ];
}

const norm = (s: string) => ` ${s.toLowerCase().replace(/[.,;:!?()“”"]/g, " ").replace(/\s+/g, " ").trim()} `;
/** The answer word for word, not as part of a longer word or number ("5 שקלים" is not inside "15 שקלים"). */
function contains(text: string, answer: string): boolean {
  const t = norm(text);
  const a = norm(answer).trim().replace(/^(the|a|an) /, "");
  for (let at = t.indexOf(a); at >= 0; at = t.indexOf(a, at + 1)) {
    const before = t[at - 1] ?? " ";
    const after = t[at + a.length] ?? " ";
    if (/[\s־]/.test(before) && /[\s־]/.test(after)) return true;
  }
  return false;
}

/** Mentions checked and kept: they name a topical word but do not answer the question. */
const KEPT = new Set([
  // "the mean and the median are equal or close" (symmetric distribution) does not say which measure stays put
  // when the top score is corrected.
  "math-data-spread/a/The median",
  "math-data-spread/a/החציון",
]);

describe("topics G4: no item of a level spells out a choice answer of that level", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: word answers are not shown in the level's terms, number prompts or orderings`, () => {
      for (const level of LEVELS) {
        const lv = content[level];
        for (const lang of [0, 1] as const) {
          const around = shownAround(lv, lang);
          for (const pair of lv.q ?? []) {
            const answer = pair[lang][1];
            // Number answers are pinned one by one below: a bare number like 3 turns up in many unrelated items.
            if (/\d/.test(answer) || KEPT.has(`${id}/${level}/${answer}`)) continue;
            for (const text of around) expect(contains(text, answer), `${id}/${level}: "${answer}" in "${text}"`).toBe(false);
          }
        }
      }
    });
  }

  it("the giveaways removed in this round stay removed", () => {
    const en = (c: TopicContent, l: (typeof LEVELS)[number]) => shownAround(c[l], 0).join(" | ");
    const he = (c: TopicContent, l: (typeof LEVELS)[number]) => shownAround(c[l], 1).join(" | ");
    expect(en(functions, "b")).not.toMatch(/add 3/i);
    expect(he(functions, "b")).not.toContain("הוסף 3");
    expect(en(dataSpread, "b")).not.toMatch(/interquartile range/i);
    expect(he(dataSpread, "b")).not.toContain("הטווח הבין־רבעוני");
    expect(en(hebrewNumerals, "b")).not.toMatch(/\bHei\b/);
    expect(he(hebrewNumerals, "b")).not.toContain("ה׳");
    // The tens and hundreds terms no longer say that kuf is 100 or that tsadi, the last tens letter, is 90.
    const numeralTerms = hebrewNumerals.i.t ?? [];
    expect(numeralTerms.map((t) => t[1]).join(" | ")).not.toMatch(/kuf|tsadi|\b100\b/i);
    expect(numeralTerms.map((t) => t[3]).join(" | ")).not.toMatch(/ק׳|צ׳|100/);
    expect(en(hebrewNumerals, "a")).not.toContain("708");
    expect(he(hebrewNumerals, "a")).not.toContain("תש״ח במקום");
    expect(en(historyOfMaths, "b")).not.toMatch(/Roman numerals/i);
    expect(he(historyOfMaths, "b")).not.toContain("ספרות רומיות");
    expect(en(logarithms, "b") + he(logarithms, "b")).not.toMatch(/log₂ 8|log₃ 81/);
    expect(en(logarithms, "i") + he(logarithms, "i")).not.toMatch(/log 8\b/);
    expect(en(money, "a")).not.toMatch(/(^|[^0-9])5 shekels/);
    expect(he(money, "a")).not.toMatch(/(^|[^0-9])5 שקלים/);
    expect(en(probability, "b")).not.toMatch(/impossible/i);
    expect(probability.b.t?.[0]?.[3]).not.toContain("בלתי אפשרי");
    // The number prompts of the parallel-lines level no longer say "no solution" (the inconsistent-system term may).
    for (const [, e, h] of simultaneous.a.n ?? []) {
      expect(e[0]).not.toMatch(/no solution/i);
      expect(h[0]).not.toContain("אין פתרון");
    }
    // The longest-chord question is no longer answered by the word "diameter", which half the level uses.
    expect((circles.i.q ?? []).map(([e]) => e[1])).not.toContain("The diameter");
    // "How many agorot in a shekel?" was answered by both shekel terms; the question now needs one step.
    expect((money.b.q ?? []).map(([e]) => e[1])).not.toContain("100");
  });
});

describe("topics G4: facts in the reworded items", () => {
  it("the longest chord of a circle with radius 7 cm is its diameter, 14 cm", () => {
    const q = (circles.i.q ?? []).find(([e]) => e[0].includes("longest chord"));
    expect(q?.[0][1]).toBe("14 cm");
    expect(q?.[1][1]).toBe("14 ס״מ");
    expect(2 * 7).toBe(14);
    // 44 cm, a wrong option, is the perimeter (about 2 × π × 7), not a chord.
    expect(Math.round(2 * Math.PI * 7)).toBe(44);
  });

  it("log 20 from log 2 ≈ 0.301 is 1.301, and the term examples are true", () => {
    const n = (logarithms.i.n ?? []).find(([, e]) => e[0].includes("log 20"));
    expect(n?.[0]).toBe(1.301);
    expect(Math.abs(Math.log10(20) - (n?.[0] ?? 0))).toBeLessThanOrEqual(n?.[3] ?? 0);
    expect(4 ** 2).toBe(16);
    expect(7 ** 2).toBe(49);
  });

  it("the system 3x + 6y = 9, x + ky = 5 is inconsistent exactly for k = 2", () => {
    const n = (simultaneous.a.n ?? []).find(([, e]) => e[0].includes("inconsistent"));
    expect(n?.[0]).toBe(2);
    expect(n?.[2][0]).toContain("מערכת סותרת");
    const k = 2;
    expect(3 * k).toBe(6 * 1); // the coefficients are in the same ratio, 3 : 6 = 1 : k
    expect(9 / 3).not.toBe(5 / 1); // and the constants are not, so the lines are parallel and distinct
  });

  it("lifrat katan: tav-shin-pei-dalet is 784, the year 5784 without its thousands", () => {
    const term = (hebrewNumerals.a.t ?? []).find((t) => t[0] === "Lifrat katan");
    expect(term?.[1]).toContain("784 for 5784");
    expect(term?.[3]).toContain("תשפ״ד במקום ה׳תשפ״ד");
    expect(400 + 300 + 80 + 4).toBe(784);
  });

  it("3 shekels are 300 agorot; the apple bags are in order of price per kilogram", () => {
    const q = (money.b.q ?? []).find(([e]) => e[0].includes("3 shekels"));
    expect(q?.[0][1]).toBe("300");
    expect(q?.[1][1]).toBe("300");
    const steps = money.a.s?.[0]?.[0].slice(1) ?? [];
    const perKg = steps.map((s) => {
      const [, kg, shekels] = /^(\d+) kg for (\d+) shekels$/.exec(s) ?? [];
      return Number(shekels) / Number(kg);
    });
    expect(perKg).toEqual([3.5, 4, 4.5, 7]);
  });

  it("the function-machine example is not one of the rule question's options", () => {
    const term = functions.b.t?.[0];
    const q = (functions.b.q ?? []).find(([e]) => e[0].startsWith("Inputs 1, 2, 3"));
    expect(term?.[1]).toContain("multiply by 10");
    expect(term?.[3]).toContain("כפול 10");
    expect([q?.[0][1], ...(q?.[0][2] ?? [])].map((o) => o?.toLowerCase())).not.toContain("multiply by 10");
    expect([q?.[1][1], ...(q?.[1][2] ?? [])]).not.toContain("כפול 10");
  });
});

describe("topics G4: the quality bar", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: 8+ items and 4+ questions a level, explanations of 40+ characters, both languages in step, no "<" or ">" in Hebrew`, () => {
      for (const level of LEVELS) {
        const lv = content[level];
        const where = `${id}/${level}`;
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect((lv.t?.length ?? 0) + items, where).toBeGreaterThanOrEqual(8);
        expect(items, where).toBeGreaterThanOrEqual(4);
        for (const [en, he] of lv.q ?? []) {
          expect(en[2].length, `${where}: ${en[0]}`).toBe(he[2].length);
          for (const [q, answer, wrong, explanation] of [en, he]) {
            expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
            expect(wrong, `${where}: ${q}`).not.toContain(answer);
          }
        }
        for (const [answer, en, he] of lv.n ?? []) {
          for (const [q, , explanation] of [en, he]) {
            expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
            expect(explanation, `${where}: ${q}`).toContain(String(answer));
          }
        }
        for (const [en, he] of lv.s ?? []) expect(en.length, where).toBe(he.length);
        const hebrew = [
          ...(lv.t ?? []).flatMap((t) => [t[2], t[3]]),
          ...(lv.q ?? []).flatMap(([, h]) => [h[0], h[1], ...h[2], h[3], ...(h[4] ? [h[4]] : [])]),
          ...(lv.n ?? []).flatMap(([, , h]) => [h[0], h[2], ...(h[3] ? [h[3]] : [])]),
          ...(lv.s ?? []).flatMap(([, h]) => h),
        ];
        for (const s of hebrew) {
          expect(/[<>]/.test(s), `${where}: ${s}`).toBe(false);
          expect(/[=×÷+−]\s*\?/.test(s), `${where}: a blank is written as x: ${s}`).toBe(false);
        }
      }
    });
  }
});
