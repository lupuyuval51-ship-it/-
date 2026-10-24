import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import photosynthesis from "@/lib/game/topics/content/science-photosynthesis";
import plantClassification from "@/lib/game/topics/content/science-plant-classification";
import statesOfMatter from "@/lib/game/topics/content/science-states-of-matter";
import designThinking from "@/lib/game/topics/content/think-design-thinking";
import memory from "@/lib/game/topics/content/think-memory";

/**
 * Five science and thinking topics. A game shows most items of a level together, and in these topics a term meaning,
 * an ordering step, a number prompt or another question often spelled out the answer of a choice question of the same
 * level (the stomata term was the stomata answer, "found in stars" answered the plasma question, the empathy-map term
 * listed its four parts, the short-term memory term used the phone-number example of its own question...). Those items
 * were rephrased or the question was replaced; the photosynthesis number explanation no longer claims that 6 water
 * molecules hold 12 oxygen atoms.
 */
const TOPICS: Record<string, TopicContent> = {
  "science-photosynthesis": photosynthesis,
  "science-plant-classification": plantClassification,
  "science-states-of-matter": statesOfMatter,
  "think-design-thinking": designThinking,
  "think-memory": memory,
};
const LEVELS = ["b", "i", "a"] as const;
type Lang = 0 | 1;
const norm = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, " ").trim();
const questions = (c: TopicContent) => LEVELS.flatMap((l) => c[l].q ?? []);

/** What a learner can read at a level before answering: term meanings, ordering steps, number prompts and question prompts. */
function visible(lv: LevelContent, lang: Lang) {
  return {
    meanings: (lv.t ?? []).map((t) => (lang ? t[3] : t[1])),
    steps: (lv.s ?? []).flatMap((s) => s[lang].slice(1)),
    numberPrompts: (lv.n ?? []).map((n) => (lang ? n[2] : n[1])[0]),
    prompts: (lv.q ?? []).map((q) => q[lang][0]),
  };
}
const shownTexts = (lv: LevelContent, lang: Lang) => {
  const v = visible(lv, lang);
  return [...v.meanings, ...v.steps, ...v.numberPrompts];
};

describe("F7 topics: the collection's quality bar", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: 8+ pieces and 4+ items per level, explanations of 40+ characters, both languages in step`, () => {
      for (const l of LEVELS) {
        const lv = content[l];
        const where = `${id}/${l}`;
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect((lv.t?.length ?? 0) + items, where).toBeGreaterThanOrEqual(8);
        expect(items, where).toBeGreaterThanOrEqual(4);
        for (const pair of lv.q ?? []) {
          expect(pair[0][2].length, `${where}: ${pair[0][0]}`).toBe(pair[1][2].length);
          for (const [q, answer, wrong, explanation] of pair) {
            expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
            expect(new Set([answer, ...wrong].map((o) => o.trim().toLowerCase())).size, `${where}: options of ${q}`).toBe(wrong.length + 1);
          }
        }
        for (const [answer, en, he] of lv.n ?? []) {
          for (const [q, , explanation] of [en, he]) {
            expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
            expect(explanation.replace(/[,\s]/g, ""), `${where}: ${q}`).toContain(String(answer));
          }
        }
        for (const [en, he] of lv.s ?? []) expect(en.length, `${where}: ${en[0]}`).toBe(he.length);
      }
    });

    it(`${id}: no "<" or ">" in Hebrew and no "?" as a blank`, () => {
      for (const l of LEVELS) {
        const lv = content[l];
        const he = [
          ...(lv.t ?? []).flatMap((t) => [t[2], t[3]]),
          ...(lv.q ?? []).flatMap(([, h]) => [h[0], h[1], ...h[2], h[3], ...(h[4] ? [h[4]] : [])]),
          ...(lv.n ?? []).flatMap(([, , h]) => h.filter((s): s is string => typeof s === "string")),
          ...(lv.s ?? []).flatMap(([, h]) => h),
        ];
        for (const s of he) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
        for (const s of [...he, ...shownTexts(lv, 0)]) expect(/(=\s*\?|\?\s*=|\s\?\s)/.test(s), `${id}/${l}: ${s}`).toBe(false);
      }
    });

    it(`${id}: the right answer is the strictly longest option in at most 40 % of the questions, in each language`, () => {
      const longest = [0, 0];
      const all = questions(content);
      for (const pair of all) {
        pair.forEach(([, answer, wrong], lang) => {
          if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
        });
      }
      expect(all.length, id).toBeGreaterThanOrEqual(12);
      expect(longest[0]! / all.length, `${id} en`).toBeLessThanOrEqual(0.4);
      expect(longest[1]! / all.length, `${id} he`).toBeLessThanOrEqual(0.4);
    });

    it(`${id}: no term meaning, ordering step, number prompt or other prompt of a level contains a choice answer of that level`, () => {
      for (const l of LEVELS) {
        const lv = content[l];
        for (const lang of [0, 1] as const) {
          const v = visible(lv, lang);
          (lv.q ?? []).forEach((pair, qi) => {
            const answer = norm(pair[lang][1]);
            if (!answer.includes(" ")) return; // one-word answers (a group or a stage name) appear in prompts and in lists of every option
            const pool = [...v.meanings, ...v.numberPrompts, ...v.prompts.filter((_, j) => j !== qi), ...v.steps.filter((s) => norm(s) !== answer)];
            for (const text of pool) expect(norm(text).includes(answer), `${id}/${l} ${lang ? "he" : "en"}: "${pair[lang][1]}" in "${text}"`).toBe(false);
          });
        }
      }
    });
  }
});

describe("F7 topics: the giveaways that were removed stay removed", () => {
  const removed: [string, (typeof LEVELS)[number], Lang, RegExp][] = [
    ["science-photosynthesis", "a", 0, /water/i],
    ["science-photosynthesis", "a", 1, /מים/],
    ["science-photosynthesis", "a", 0, /day and night/i],
    ["science-photosynthesis", "b", 0, /where most of its food is made|leaves catch sunlight/i],
    ["science-photosynthesis", "b", 1, /מיוצר רוב המזון|העלים קולטים/],
    ["science-photosynthesis", "i", 0, /store extra sugar/i],
    ["science-photosynthesis", "i", 1, /אוגרים סוכר/],
    ["science-plant-classification", "b", 0, /damp|reproduces with spores/i],
    ["science-plant-classification", "b", 1, /לחים|מתרבה בנבגים ולא/],
    ["science-plant-classification", "i", 0, /from one flower to another|seeds in cones/i],
    ["science-states-of-matter", "b", 0, /takes the shape|spreads out to fill/i],
    ["science-states-of-matter", "b", 1, /מקבל את צורת|ממלא כל חלל/],
    ["science-states-of-matter", "i", 0, /move faster|cold glass/i],
    ["science-states-of-matter", "i", 1, /נעים מהר|כוס קרה/],
    ["science-states-of-matter", "a", 0, /dry ice|stars|temperature stays/i],
    ["science-states-of-matter", "a", 1, /קרח יבש|בכוכבים|הטמפרטורה לא משתנה/],
    ["think-design-thinking", "a", 0, /says, thinks, does/i],
    ["think-design-thinking", "a", 1, /אומר, חושב, עושה/],
    ["think-design-thinking", "i", 0, /without judging|open questions/i],
    ["think-design-thinking", "i", 1, /בלי לשפוט|שאלות פתוחות/],
    ["think-design-thinking", "b", 0, /quick, simple/i],
    ["think-memory", "i", 0, /short-term memory|number you have just heard/i],
    ["think-memory", "i", 1, /לטווח קצר|מספר ששמעתם/],
    ["think-memory", "b", 0, /easier to remember|have to remember/i],
    ["think-memory", "b", 1, /עוזרות לזכור|צריך לזכור/],
  ];
  for (const [id, l, lang, pattern] of removed) {
    it(`${id}/${l} ${lang ? "he" : "en"}: no term meaning, step or number prompt matches ${pattern}`, () => {
      // the term NAME may still be "Short-term memory"; only what describes it must not give the answer away
      for (const text of shownTexts(TOPICS[id]![l], lang)) expect(pattern.test(text), text).toBe(false);
    });
  }

  it("the Hebrew 'iterative' question no longer explains the word with its own answer", () => {
    for (const [, he] of designThinking.i.q ?? []) expect(he[0]).not.toContain("חוזר על עצמו");
  });

  it("a choice option of the planets question no longer names the phone-number trick", () => {
    for (const pair of memory.b.q ?? []) {
      if (!/planets/.test(pair[0][0])) continue;
      expect(pair[0][2].join(" ")).not.toMatch(/split/i);
      expect(pair[1][2].join(" ")).not.toMatch(/לחלק/);
    }
  });

  it("the towel question no longer asks what the evaporation term already says (drying below boiling point)", () => {
    for (const [en, he] of statesOfMatter.i.q ?? []) {
      expect(en[0]).not.toMatch(/never boils/i);
      expect(he[0]).not.toMatch(/אף פעם לא רותחים/);
    }
  });

  it("the mountain question is not answered by the pressure-cooker prompt", () => {
    for (const [en, he] of statesOfMatter.a.q ?? []) {
      expect(en[0]).not.toMatch(/pressure is higher/i);
      expect(he[0]).not.toMatch(/הלחץ גבוה/);
    }
  });

  it("the first-review question is gone from the level whose number prompt shows a review schedule", () => {
    expect((memory.a.n ?? []).some(([, en]) => /review/.test(en[0]))).toBe(true);
    for (const [en] of memory.a.q ?? []) expect(en[0]).not.toMatch(/first review/i);
  });
});

describe("F7 topics: facts", () => {
  it("photosynthesis: 6 O₂ hold 12 oxygen atoms; the explanation no longer says they come from 6 water molecules", () => {
    const [item] = photosynthesis.a.n ?? [];
    expect(item?.[0]).toBe(6);
    expect(item?.[1][2]).toContain("12 oxygen atoms");
    expect(item?.[1][2]).not.toMatch(/6 water/);
    expect(item?.[2][2]).toContain("12 אטומי חמצן");
    expect(item?.[2][2]).not.toMatch(/6 מולקולות מים/);
  });

  it("states of matter: the boiling point at sea level and the energy to melt 5 g of ice", () => {
    expect(statesOfMatter.i.n?.[0]?.[0]).toBe(100);
    expect(statesOfMatter.a.n?.[0]?.[0]).toBe(334 * 5);
  });
});

