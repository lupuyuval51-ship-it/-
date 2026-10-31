import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import designThinking from "@/lib/game/topics/content/think-design-thinking";
import empathy from "@/lib/game/topics/content/think-empathy";
import fairPlay from "@/lib/game/topics/content/think-fair-play";
import feedback from "@/lib/game/topics/content/think-feedback";
import goalSetting from "@/lib/game/topics/content/think-goal-setting";
import growthMindset from "@/lib/game/topics/content/think-growth-mindset";
import listening from "@/lib/game/topics/content/think-listening";
import logic from "@/lib/game/topics/content/think-logic";
import mediaLiteracy from "@/lib/game/topics/content/think-media-literacy";
import memory from "@/lib/game/topics/content/think-memory";

/**
 * Ten thinking-skills topics (design thinking, empathy, fair play, feedback, goal setting, growth mindset, listening,
 * logic, media literacy, memory). Media literacy and memory gave the right answer away by its length in 70 to 86 % of
 * their questions, and logic and memory had only two or three questions a level (six or seven pieces, under the
 * collection's bar of eight). They now have plausible, longer wrong options, more questions, orderings and numbers.
 */
const TOPICS: Record<string, TopicContent> = {
  "think-design-thinking": designThinking,
  "think-empathy": empathy,
  "think-fair-play": fairPlay,
  "think-feedback": feedback,
  "think-goal-setting": goalSetting,
  "think-growth-mindset": growthMindset,
  "think-listening": listening,
  "think-logic": logic,
  "think-media-literacy": mediaLiteracy,
  "think-memory": memory,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);
const questions = (c: TopicContent) => LEVELS.flatMap((l) => c[l].q ?? []);
const everyText = (c: TopicContent): string[] =>
  levelsOf(c).flatMap((lv) => [
    ...(lv.t ?? []).flat(),
    ...(lv.q ?? []).flatMap((pair) => pair.flatMap(([q, a, w, e, h]) => [q, a, ...w, e, ...(h ? [h] : [])])),
    ...(lv.n ?? []).flatMap(([, en, he]) => [...en, ...he]),
    ...(lv.s ?? []).flatMap(([en, he]) => [...en, ...he]),
  ]).filter((s): s is string => typeof s === "string");

describe("S12 topics: answer length is not a tell", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: the right answer is the strictly longest option in at most 40 % of the questions, in each language`, () => {
      const longest = [0, 0];
      let all = 0;
      for (const pair of questions(content)) {
        all++;
        pair.forEach(([, answer, wrong], lang) => {
          if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
        });
      }
      expect(all, id).toBeGreaterThanOrEqual(15);
      expect(longest[0]! / all, `${id} en`).toBeLessThanOrEqual(0.4);
      expect(longest[1]! / all, `${id} he`).toBeLessThanOrEqual(0.4);
    });
  }
});

describe("S12 topics: the collection's quality bar", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: 8+ pieces and 4+ items per level, explanations of 40+ characters, no "<" or ">" in Hebrew, both languages in step`, () => {
      const prompts = [new Set<string>(), new Set<string>()];
      for (const [at, lv] of levelsOf(content).entries()) {
        const where = `${id}/${LEVELS[at]}`;
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect((lv.t?.length ?? 0) + items, where).toBeGreaterThanOrEqual(8);
        expect(items, where).toBeGreaterThanOrEqual(4);
        for (const pair of lv.q ?? []) {
          for (const [q, answer, wrong, explanation] of pair) {
            expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
            expect(new Set([answer, ...wrong].map((o) => o.trim().toLowerCase())).size, `${where}: options of ${q}`).toBe(wrong.length + 1);
          }
          expect(pair[0][2].length, `${where}: ${pair[0][0]}`).toBe(pair[1][2].length);
          pair.forEach(([q], lang) => {
            expect(prompts[lang]!.has(q), `${where}: repeated question ${q}`).toBe(false);
            prompts[lang]!.add(q);
          });
        }
        for (const [answer, en, he] of lv.n ?? []) {
          for (const [q, , explanation] of [en, he]) expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(Boolean(en[1]), `${where}: unit in one language only: ${en[0]}`).toBe(Boolean(he[1]));
          const written = [String(answer), answer.toLocaleString("en-US")];
          for (const text of [en[2], he[2]]) expect(written.some((w) => text.includes(w)), `${where}: the answer ${answer} is in its explanation`).toBe(true);
        }
        for (const [en, he] of lv.s ?? []) {
          expect(en.length, `${where}: ${en[0]}`).toBe(he.length);
          expect(en.length - 1, `${where}: ${en[0]}`).toBeGreaterThanOrEqual(3);
          expect(en.length - 1, `${where}: ${en[0]}`).toBeLessThanOrEqual(6);
        }
      }
      for (const s of everyText(content)) {
        // a right-to-left line mirrors them; English may use them, so only the Hebrew halves are read here
        if (/\p{Script=Hebrew}/u.test(s)) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
      }
    });
  }

  it("memory and logic are no longer thin: four or more questions at every level and fourteen or more in the topic", () => {
    for (const [id, content] of [["think-memory", memory], ["think-logic", logic]] as const) {
      for (const l of LEVELS) expect(content[l].q?.length ?? 0, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      expect(questions(content).length, id).toBeGreaterThanOrEqual(14);
    }
  });

  it("the empathy topic now has an ordering at every level, not only at the beginner level", () => {
    for (const l of LEVELS) expect(empathy[l].s?.length ?? 0, `think-empathy/${l}`).toBeGreaterThanOrEqual(1);
  });
});

describe("S12 topics: every number is the arithmetic of its own question", () => {
  const numbers = (c: TopicContent) => LEVELS.map((l) => c[l].n?.map(([answer]) => answer) ?? []);

  it("the numeric answers match the sums written in the questions", () => {
    expect(numbers(fairPlay)).toEqual([[5], [2024 - 1896], []]);
    expect(numbers(feedback)).toEqual([[], [12 * (2 + 1)], []]);
    expect(numbers(goalSetting)).toEqual([[120 / 15], [(5 - 2) / 0.5], [(30 - 12) / 6]]);
    expect(numbers(growthMindset)).toEqual([[14 * 15], [8 + 3 * 2], [(100 - 60) / 5]]);
    expect(numbers(listening)).toEqual([[], [150 * 4], []]);
    expect(numbers(designThinking)).toEqual([[], [], [((5 - 3) * 100) / 5]]);
    expect(numbers(mediaLiteracy)).toEqual([[], [(8 * 100) / 10], [(520 * 100) / 1000]]);
    expect(numbers(logic)).toEqual([[2], [], [(5 * 4) / 2]]);
  });

  it("memory: 12 digits in groups of 4, Miller's seven, and reviews after gaps of 1, 2, 4 and 8 days fall on day 15", () => {
    expect(numbers(memory)).toEqual([[12 / 4], [7], [1 + 2 + 4 + 8]]);
    const en = memory.i.n![0]![1];
    expect(en[0]).toContain("George Miller");
    expect(en[0]).toContain("1956");
  });
});

describe("S12 topics: the new questions have one right answer", () => {
  it("logic: the secret number 8 is the only number from 1 to 10 that fits all three clues, and each wrong option breaks one", () => {
    const [en, he] = logic.b.q!.find(([q]) => q[0].startsWith("A secret number"))!;
    const fits = (n: number) => n % 2 === 0 && n > 6 && n !== 10;
    expect(Array.from({ length: 10 }, (_, i) => i + 1).filter(fits)).toEqual([8]);
    for (const [, answer, wrong] of [en, he]) {
      expect(fits(Number(answer))).toBe(true);
      for (const w of wrong) expect(fits(Number(w)), w).toBe(false);
    }
  });

  it("logic: the counterexample to 'every animal in the sea is a fish' is the octopus, and the options it is set among are real fish", () => {
    const [en, he] = logic.i.q!.find(([q]) => q[0].includes("counterexample to “Every animal that lives in the sea"))!;
    expect(en[1]).toBe("An octopus");
    expect(he[1]).toBe("תמנון");
    expect([...en[2]].sort()).toEqual(["A seahorse", "A shark", "A tuna"]);
    expect([...he[2]].sort()).toEqual(["כריש", "סוסון ים", "טונה"].sort());
  });

  it("memory: the study-method question keeps retrieval practice as its only right answer", () => {
    const [en, he] = memory.a.q!.find(([q]) => q[0].startsWith("Which study method"))!;
    expect(en[1]).toMatch(/recall/);
    expect(en[2].some((w) => /recall/.test(w))).toBe(false);
    expect(he[1]).toMatch(/להיזכר/);
    expect(he[2].some((w) => /להיזכר/.test(w))).toBe(false);
  });

  it("fair play: the Olympic fair-play moments are listed earliest first, and the sailing rescue is placed at the Games, not in the city of Seoul", () => {
    const [en, he] = fairPlay.a.s![0]!;
    const order = ["Boin", "Monti", "Lemieux", "D'Agostino", "Barshim"];
    expect(order.map((name) => en.findIndex((step) => step.includes(name)))).toEqual([1, 2, 3, 4, 5]);
    expect(en[3]).toContain("Seoul Games");
    expect(he[3]).toContain("באולימפיאדת סיאול");
    expect(he.length).toBe(en.length);
  });
});

describe("S12 topics: wrong options are real misconceptions, not filler", () => {
  it("none of the rewritten wrong options in media literacy and memory is one of the old throw-away lines", () => {
    const filler = [
      "A shopping list", "A drawing", "A rhyme", "The report is always written by the mayor", "The opinion piece contains only numbers",
      "They are two names for news about the weather", "Charts should never use numbers", "The chart uses too many colours",
      "Apps must show false stories first by law", "True stories are not allowed online", "Breakfast cannot be studied at all",
    ];
    for (const content of [mediaLiteracy, memory]) {
      for (const [en] of questions(content)) for (const w of en[2]) expect(filler, w).not.toContain(w);
    }
  });
});
