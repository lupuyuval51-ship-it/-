import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, TopicContent } from "@/lib/game/topics/types";
import careJobs from "@/lib/game/topics/content/health-care-jobs";
import digitalWellbeing from "@/lib/game/topics/content/health-digital-wellbeing";
import emotions from "@/lib/game/topics/content/health-emotions";
import exercise from "@/lib/game/topics/content/health-exercise";
import firstAid from "@/lib/game/topics/content/health-first-aid";
import foodAllergies from "@/lib/game/topics/content/health-food-allergies";
import foodSafety from "@/lib/game/topics/content/health-food-safety";

/**
 * Seven health topics (four of the original library, three of the Plus and Pro collection) held to the collection's
 * quality bar: the right answer is rarely the strictly longest option (at most 40 % of the choice questions, per language;
 * emotions, first aid and digital wellbeing were at 67 to 88 %, exercise at 50 % in Hebrew), every level has 8+ items
 * with 4+ questions, numbers or orderings (the original four had 2 per level), every explanation has 40+ characters,
 * Hebrew has no "<" or ">", and the numbers add up.
 */
const TOPICS: Record<string, TopicContent> = {
  "health-care-jobs": careJobs,
  "health-digital-wellbeing": digitalWellbeing,
  "health-emotions": emotions,
  "health-exercise": exercise,
  "health-first-aid": firstAid,
  "health-food-allergies": foodAllergies,
  "health-food-safety": foodSafety,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);

describe("health topics C25: answer length is not a tell", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: the right answer is the strictly longest option in at most 40 % of the questions, in each language`, () => {
      const longest = [0, 0];
      let all = 0;
      for (const lv of levelsOf(content)) for (const pair of lv.q ?? []) {
        all++;
        pair.forEach(([, answer, wrong], lang) => { if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++; });
      }
      expect(all).toBeGreaterThan(0);
      expect(longest[0]! / all, `${id} en`).toBeLessThanOrEqual(0.4);
      expect(longest[1]! / all, `${id} he`).toBeLessThanOrEqual(0.4);
    });
  }
});

describe("health topics C25: every level is a full game", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: 8+ items and 4+ questions, numbers or orderings per level`, () => {
      LEVELS.forEach((l) => {
        const lv = content[l];
        const tasks = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect(tasks, `${id}/${l}`).toBeGreaterThanOrEqual(4);
        expect(tasks + (lv.t?.length ?? 0), `${id}/${l}`).toBeGreaterThanOrEqual(8);
      });
    });

    it(`${id}: explanations have 40+ characters, Hebrew has no angle brackets, both languages have the same options count`, () => {
      for (const lv of levelsOf(content)) {
        for (const [en, he] of lv.q ?? []) {
          expect(en[3].length, en[0]).toBeGreaterThanOrEqual(40);
          expect(he[3].length, he[0]).toBeGreaterThanOrEqual(40);
          expect(en[2].length, en[0]).toBe(he[2].length);
          for (const s of [he[0], he[1], ...he[2], he[3]]) expect(s, s).not.toMatch(/[<>]/);
        }
        for (const [, en, he] of lv.n ?? []) {
          expect(en[2].length, en[0]).toBeGreaterThanOrEqual(40);
          expect(he[2].length, he[0]).toBeGreaterThanOrEqual(40);
          for (const s of [he[0], he[2]]) expect(s, s).not.toMatch(/[<>]/);
        }
        for (const [, he] of lv.s ?? []) for (const s of he) expect(s, s).not.toMatch(/[<>]/);
        for (const [, , heTerm, heMeaning] of lv.t ?? []) for (const s of [heTerm, heMeaning]) expect(s, s).not.toMatch(/[<>]/);
      }
    });
  }
});

describe("health topics C25: the numbers add up", () => {
  const numbers = (c: TopicContent, l: (typeof LEVELS)[number]): NumberItem[] => [...(c[l].n ?? [])];
  const answerTo = (c: TopicContent, l: (typeof LEVELS)[number], startsWith: string) => {
    const item = numbers(c, l).find(([, en]) => en[0].startsWith(startsWith));
    expect(item, startsWith).toBeDefined();
    return item![0];
  };

  it("pulse, breathing and training numbers", () => {
    expect(answerTo(careJobs, "a", "A nurse counts 18 heartbeats")).toBe(18 * 4);
    expect(answerTo(emotions, "b", "In “box breathing”")).toBe(4 + 4 + 4 + 4);
    expect(answerTo(exercise, "i", "You count 25 heartbeats")).toBe(25 * 4);
    expect(answerTo(exercise, "a", "A training plan asks a 15-year-old")).toBe(Math.round(0.8 * (220 - 15)));
    // the guideline rhythm of CPR with rescue breaths is 30 compressions to 2 breaths
    expect(answerTo(firstAid, "a", "In CPR with rescue breaths")).toBe(30);
  });

  it("screen-time and food-safety numbers", () => {
    expect(answerTo(digitalWellbeing, "b", "A common rule says")).toBe(120 / 20);
    expect(answerTo(digitalWellbeing, "i", "Noa decides")).toBe(30 * 7);
    expect(answerTo(digitalWellbeing, "a", "Maya uses her phone")).toBe(0.25 * 4 * 60);
    expect(answerTo(foodSafety, "i", "A fridge is at 4 °C")).toBe(4 - (-18));
    expect(answerTo(foodSafety, "a", "In warm food some bacteria")).toBe(2 ** ((3 * 60) / 20));
    expect(answerTo(foodAllergies, "a", "Under European Union food law")).toBe(14);
  });

  it("the maximum heart rate question gives 220 minus the age, in both languages", () => {
    const pair = exercise.a.q!.find(([en]) => en[0].includes("220 minus your age"))!;
    expect(pair[0][1]).toBe(`${220 - 15} beats per minute`);
    expect(pair[1][1]).toBe(`${220 - 15} פעימות בדקה`);
  });
});

describe("health topics C25: first-aid answers follow the guidelines", () => {
  const q = (lv: LevelContent, startsWith: string) => {
    const pair = (lv.q ?? []).find(([en]) => en[0].startsWith(startsWith));
    expect(pair, startsWith).toBeDefined();
    return pair!;
  };

  it("safety comes first, both in the question and at the start of the ordering", () => {
    expect(q(firstAid.b, "Someone is hurt. What should you check first?")[0][1]).toMatch(/safe/);
    const [en, he] = firstAid.b.s![0]!;
    expect(en[1]).toMatch(/safe/);
    expect(he[1]).toMatch(/בטוח/);
  });

  it("a nosebleed: lean forward, and tilting the head back is offered as the misconception", () => {
    const [en, he] = q(firstAid.i, "A friend's nose is bleeding");
    expect(en[1]).toMatch(/lean forward/);
    expect(en[2].some((w) => /Tilt the head far back/.test(w))).toBe(true);
    expect(he[2].some((w) => /להטות את הראש/.test(w))).toBe(true);
  });

  it("a burn is cooled with water, never butter or toothpaste; a bee sting is scraped out, not squeezed", () => {
    const [burnEn] = q(firstAid.i, "What is the right first aid for a small burn");
    expect(burnEn[1]).toMatch(/running water/);
    expect(burnEn[1]).not.toMatch(/butter|toothpaste/);
    const [stingEn, stingHe] = q(firstAid.i, "A bee has stung a friend");
    expect(stingEn[1]).toMatch(/Scrape/);
    expect(stingHe[1]).toMatch(/מגרדים/);
  });

  it("choking: back blows and abdominal thrusts, never water", () => {
    const [en, he] = q(firstAid.a, "An adult is choking");
    expect(en[1]).toMatch(/back blows.*abdominal thrusts/);
    expect(he[1]).toMatch(/מכות.*בגב.*לחיצות בטן/);
    expect(en[1]).not.toMatch(/water/);
  });
});
