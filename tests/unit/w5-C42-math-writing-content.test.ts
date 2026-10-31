import { describe, expect, it } from "vitest";
import type { LevelContent, QText, TopicContent } from "@/lib/game/topics/types";
import writingSkills from "@/lib/game/topics/content/lang-writing-skills";
import angles from "@/lib/game/topics/content/math-angles";
import areaPerimeter from "@/lib/game/topics/content/math-area-perimeter";
import circles from "@/lib/game/topics/content/math-circles";
import columnArithmetic from "@/lib/game/topics/content/math-column-arithmetic";
import conditionalProbability from "@/lib/game/topics/content/math-conditional-probability";
import congruentTriangles from "@/lib/game/topics/content/math-congruent-triangles";

/**
 * Topics lang-writing-skills … math-congruent-triangles (original library and Plus/Pro collection alike) held to the
 * collection's quality bar (scripts/check-topics.ts), plus the content fixes made to them in wave 5 (C42).
 */
const TOPICS: Record<string, TopicContent> = {
  "lang-writing-skills": writingSkills,
  "math-angles": angles,
  "math-area-perimeter": areaPerimeter,
  "math-circles": circles,
  "math-column-arithmetic": columnArithmetic,
  "math-conditional-probability": conditionalProbability,
  "math-congruent-triangles": congruentTriangles,
};
const LEVELS = ["b", "i", "a"] as const;
const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).map((t) => t[3]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : [])]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2], ...(he[3] ? [he[3]] : [])]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];
const question = (c: TopicContent, prompt: string, lang: 0 | 1 = 0) => {
  const pair = LEVELS.flatMap((l) => c[l].q ?? []).find(([en]) => en[0].includes(prompt));
  expect(pair, prompt).toBeDefined();
  return pair![lang];
};
const isLongest = ([, answer, wrong]: QText) => answer.length > Math.max(...wrong.map((w) => w.length));

describe.each(Object.entries(TOPICS))("%s", (_id, c) => {
  it.each(LEVELS)("level %s has 8+ items, 4+ of them questions, numbers or orderings", (l) => {
    const lv = c[l];
    const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
    expect(items).toBeGreaterThanOrEqual(4);
    expect((lv.t?.length ?? 0) + items).toBeGreaterThanOrEqual(8);
  });

  it("explains every answer in 40+ characters, and every numeric explanation shows the answer", () => {
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, q).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) {
        for (const text of [en[2], he[2]]) {
          expect(text.length, en[0]).toBeGreaterThanOrEqual(40);
          expect([String(answer), answer.toLocaleString("en-US")].some((w) => text.includes(w)), en[0]).toBe(true);
        }
      }
    }
  });

  it("does not make the right answer the longest option in more than 40 % of the questions, in either language", () => {
    for (const lang of [0, 1] as const) {
      const qs = LEVELS.flatMap((l) => c[l].q ?? []).map((p) => p[lang]);
      expect(qs.filter(isLongest).length / qs.length, lang ? "he" : "en").toBeLessThanOrEqual(0.4);
    }
  });

  it("keeps he and en in step, and never writes < or > in Hebrew", () => {
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) expect(he[2].length, en[0]).toBe(en[2].length);
      for (const s of hebrewTexts(c[l])) expect(/[<>]/.test(s), s).toBe(false);
    }
  });
});

describe("wave 5 content fixes (C42)", () => {
  it("plagiarism: copying without quotation marks or a source is offered as 'quoting', which is wrong", () => {
    for (const lang of [0, 1] as const) {
      const [, answer, wrong, explanation] = question(writingSkills, "Dan copies a paragraph", lang);
      expect(answer).toBe(lang ? "גניבה ספרותית" : "Plagiarism");
      expect(wrong[0]).toBe(lang ? "ציטוט מן המקור" : "Quoting the source");
      expect(explanation).toMatch(lang ? /לא ציטוט/ : /not a quotation/);
    }
  });

  it("the formal-letter, paragraph and evidence questions no longer give the answer away by its length", () => {
    for (const prompt of ["letter to the school principal", "start a new paragraph", "strongest support"]) {
      for (const lang of [0, 1] as const) expect(isLongest(question(writingSkills, prompt, lang)), `${prompt} ${lang}`).toBe(false);
    }
  });

  it("the new circle numbers are right: radius from a diameter, a perimeter with π ≈ 3.14, a chord by Pythagoras", () => {
    const [b] = circles.b.n!, [i] = circles.i.n!, [a] = circles.a.n!;
    expect(b![0]).toBe(18 / 2);
    expect(i![0]).toBeCloseTo(2 * 3.14 * 2, 10);
    expect(a![0]).toBe(2 * Math.sqrt(5 ** 2 - 3 ** 2));
  });

  it("the new angle and area numbers are right", () => {
    expect(angles.i.n!.map(([x]) => x)).toEqual([180 - 35, 90 - 25]);
    expect(areaPerimeter.i.n!.map(([x]) => x)).toEqual([6 * 4, 36 / 9]);
    const obtuse = question(angles, "Which of these angles is obtuse?");
    const deg = (s: string) => Number(s.replace("°", ""));
    expect(deg(obtuse[1]) > 90 && deg(obtuse[1]) < 180).toBe(true);
    for (const w of obtuse[2]) expect(deg(w) > 90 && deg(w) < 180, w).toBe(false);
  });
});
