import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import esArticlesGender from "@/lib/game/topics/content/lang-es-articles-gender";
import esBasics from "@/lib/game/topics/content/lang-es-basics";
import esFamily from "@/lib/game/topics/content/lang-es-family";
import esPresentVerbs from "@/lib/game/topics/content/lang-es-present-verbs";
import heAcronyms from "@/lib/game/topics/content/lang-he-acronyms";
import heConnectors from "@/lib/game/topics/content/lang-he-connectors";
import heGenderNumber from "@/lib/game/topics/content/lang-he-gender-number";

/**
 * Topics lang-es-articles-gender … lang-he-gender-number (original library and Plus/Pro collection alike) held to the
 * collection's quality bar (scripts/check-topics.ts), plus the content fixes made to them in wave 5 (C40).
 */
const TOPICS: Record<string, TopicContent> = {
  "lang-es-articles-gender": esArticlesGender,
  "lang-es-basics": esBasics,
  "lang-es-family": esFamily,
  "lang-es-present-verbs": esPresentVerbs,
  "lang-he-acronyms": heAcronyms,
  "lang-he-connectors": heConnectors,
  "lang-he-gender-number": heGenderNumber,
};
const LEVELS = ["b", "i", "a"] as const;
const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).map((t) => t[3]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3]]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2]]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];
const question = (c: TopicContent, prompt: string, lang: 0 | 1 = 0) => {
  const pair = LEVELS.flatMap((l) => c[l].q ?? []).find(([en]) => en[0].includes(prompt));
  expect(pair, prompt).toBeDefined();
  return pair![lang];
};

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
      const longest = qs.filter(([, a, w]) => a.length > Math.max(...w.map((x) => x.length))).length;
      expect(longest / qs.length, lang ? "he" : "en").toBeLessThanOrEqual(0.4);
    }
  });

  it("has no < or > in Hebrew, the same wrong-option count in both languages and no repeated option or prompt", () => {
    const prompts = new Set<string>();
    for (const l of LEVELS) {
      for (const s of hebrewTexts(c[l])) expect(/[<>]/.test(s), s).toBe(false);
      for (const [en, he] of c[l].q ?? []) {
        expect(he[2].length, en[0]).toBe(en[2].length);
        for (const [, answer, wrong] of [en, he]) expect(new Set([answer, ...wrong]).size, en[0]).toBe(wrong.length + 1);
        expect(prompts.has(en[0]), `${en[0]} is asked twice`).toBe(false);
        prompts.add(en[0]);
      }
    }
  });
});

describe("wave 5 C40: answer keys and wrong options", () => {
  it("Spanish basics: buenos días is good morning, and good afternoon (buenas tardes) is a wrong option, not thank you", () => {
    for (const lang of [0, 1] as const) {
      const q = question(esBasics, "buenos días", lang);
      expect(q[1]).toBe(lang ? "בוקר טוב" : "Good morning");
      expect(q[2]).toContain(lang ? "צהריים טובים" : "Good afternoon");
      expect(q[3]).toContain("buenas tardes");
    }
  });

  it("Spanish basics: mucho gusto is nice to meet you, and the me gusta mucho confusion is the tempting wrong option", () => {
    const en = question(esBasics, "Mucho gusto");
    expect(en[1]).toBe("Nice to meet you");
    expect(en[2]).toContain("I like it very much");
    expect(en[3]).toContain("me gusta mucho");
    expect(question(esBasics, "Mucho gusto", 1)[2]).toContain("אני אוהב את זה מאוד");
  });

  it("Spanish basics: ocho is 8 and martes comes right after lunes", () => {
    expect(question(esBasics, "ocho")[1]).toBe("8");
    expect(question(esBasics, "ocho", 1)[1]).toBe("8");
    expect(question(esBasics, "after lunes")[1]).toBe("martes");
    expect(question(esBasics, "after lunes", 1)[1]).toBe("martes");
    expect(esBasics.b.q?.some(([en]) => en[0].includes("ocho"))).toBe(true);
    expect(esBasics.i.q?.some(([en]) => en[0].includes("after lunes"))).toBe(true);
  });

  it("Hebrew gender and number: the plural of שמלה is שמלות, in the beginner level", () => {
    for (const lang of [0, 1] as const) expect(question(heGenderNumber, "שמלה (a dress)", lang)[1]).toBe("שמלות");
    expect(heGenderNumber.b.q?.some(([en]) => en[0].includes("שמלה"))).toBe(true);
  });
});
