import { describe, expect, it } from "vitest";
import type { LevelContent, QText, TopicContent } from "@/lib/game/topics/types";
import heHistory from "@/lib/game/topics/content/lang-he-history";
import heNewWords from "@/lib/game/topics/content/lang-he-new-words";
import heRoots from "@/lib/game/topics/content/lang-he-roots";
import heSentenceParts from "@/lib/game/topics/content/lang-he-sentence-parts";
import heSmichut from "@/lib/game/topics/content/lang-he-smichut";
import heSynonyms from "@/lib/game/topics/content/lang-he-synonyms";
import worldLanguages from "@/lib/game/topics/content/lang-world-languages";

/**
 * Topics lang-he-history … lang-world-languages (original library and Plus/Pro collection alike) held to the collection's
 * quality bar (scripts/check-topics.ts), plus the content fixes made to them in wave 5 (C41).
 */
const TOPICS: Record<string, TopicContent> = {
  "lang-he-history": heHistory,
  "lang-he-new-words": heNewWords,
  "lang-he-roots": heRoots,
  "lang-he-sentence-parts": heSentenceParts,
  "lang-he-smichut": heSmichut,
  "lang-he-synonyms": heSynonyms,
  "lang-world-languages": worldLanguages,
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

describe("wave 5 C41: answer keys and wrong options", () => {
  it("world languages: the long right answers are no longer the only long option (Romance, Semitic, endangered, creole, revival)", () => {
    for (const prompt of ["Spanish, French and Italian", "shalom", "worry about many", "Haitian Creole", "best-known example"]) {
      for (const lang of [0, 1] as const) expect(isLongest(question(worldLanguages, prompt, lang)), `${prompt} (${lang ? "he" : "en"})`).toBe(false);
    }
  });

  it("world languages: the answer keys stay the same, and the new wrong options are explained", () => {
    expect(question(worldLanguages, "Spanish, French and Italian")[1]).toBe("From Latin, the language of ancient Rome");
    expect(question(worldLanguages, "shalom", 1)[1]).toBe("הן שייכות לאותה משפחת שפות, השפות השמיות");
    const revival = question(worldLanguages, "best-known example");
    expect(revival[1]).toContain("revived");
    expect(revival[2].some((w) => w.includes("Ben-Yehuda invented"))).toBe(true);
    expect(revival[3]).toContain("did not invent the language");
    expect(question(worldLanguages, "best-known example", 1)[3]).toContain("לא המציא את השפה");
    expect(question(worldLanguages, "Haitian Creole")[3]).toContain("not how many words");
    expect(question(worldLanguages, "worry about many")[3]).toContain("No language is too simple");
  });

  it("world languages: Russian is the language written in Cyrillic, at the beginner level", () => {
    expect(question(worldLanguages, "Cyrillic")[1]).toBe("Russian");
    expect(question(worldLanguages, "Cyrillic", 1)[1]).toBe("רוסית");
    expect(worldLanguages.b.q?.some(([en]) => en[0].includes("Cyrillic"))).toBe(true);
  });

  it("roots: the prefix letters include כ, and the new questions have the right roots and binyanim", () => {
    const prefix = heRoots.b.t!.find(([en]) => en === "Prefix letters")!;
    for (const meaning of [prefix[1], prefix[3]]) for (const letter of ["ה", "ו", "ב", "כ", "ל", "מ", "ש"]) expect(meaning).toContain(letter);
    for (const lang of [0, 1] as const) {
      expect(question(heRoots, "שומר (a guard)", lang)[1]).toBe("משמרת");
      expect(question(heRoots, "משחק (a game)", lang)[1]).toBe("ש־ח־ק");
      expect(question(heRoots, "Which one is in hitpa'el", lang)[1]).toBe("התכתב");
      expect(question(heRoots, "קניתי", lang)[1]).toBe("ק־נ־ה");
    }
    expect(question(heRoots, "התרחץ במקלחת")[1]).toBe("That the boy washed himself");
    expect(heRoots.a.q?.some(([en]) => en[0].includes("קניתי"))).toBe(true);
  });
});
