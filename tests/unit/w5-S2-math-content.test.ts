import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, Question, TopicContent } from "@/lib/game/topics/types";
import shapes from "@/lib/game/topics/content/math-shapes";
import similarTriangles from "@/lib/game/topics/content/math-similar-triangles";
import simultaneousEquations from "@/lib/game/topics/content/math-simultaneous-equations";
import sineCosineRules from "@/lib/game/topics/content/math-sine-cosine-rules";
import speedDistanceTime from "@/lib/game/topics/content/math-speed-distance-time";
import statistics from "@/lib/game/topics/content/math-statistics";
import symmetry from "@/lib/game/topics/content/math-symmetry";
import time from "@/lib/game/topics/content/math-time";
import timesTables from "@/lib/game/topics/content/math-times-tables";
import transformations from "@/lib/game/topics/content/math-transformations";

/**
 * Ten maths topics held to the collection's quality bar (scripts/check-topics.ts). Three of them were original-library
 * topics that were too thin (shapes, time, statistics: two questions a level, short explanations); they now have 8+ items
 * and 4+ questions, numbers or orderings at every level. The orderings that sort by size are checked against the values they
 * stand for, and the facts and sums the new items rest on are recomputed here.
 */
const TOPICS: Record<string, TopicContent> = {
  "math-shapes": shapes,
  "math-similar-triangles": similarTriangles,
  "math-simultaneous-equations": simultaneousEquations,
  "math-sine-cosine-rules": sineCosineRules,
  "math-speed-distance-time": speedDistanceTime,
  "math-statistics": statistics,
  "math-symmetry": symmetry,
  "math-time": time,
  "math-times-tables": timesTables,
  "math-transformations": transformations,
};
const LEVELS = ["b", "i", "a"] as const;

const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).flatMap((t) => [t[2], t[3]]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : [])]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2], ...(he[3] ? [he[3]] : [])]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];
const digits = (s: string): string[] => s.match(/\d+(?:[.,]\d+)?/g) ?? [];

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

  it("does not make the right answer the longest option in more than 40 % of the questions", () => {
    for (const lang of [0, 1] as const) {
      const qs = LEVELS.flatMap((l) => c[l].q ?? []).map((p) => p[lang]);
      const longest = qs.filter(([, a, w]) => a.length > Math.max(...w.map((x) => x.length))).length;
      expect(longest / qs.length, lang ? "he" : "en").toBeLessThanOrEqual(0.4);
    }
  });

  it("never uses < or > in Hebrew text", () => {
    for (const l of LEVELS) for (const s of hebrewTexts(c[l])) expect(/[<>]/.test(s), s).toBe(false);
  });

  it("the he and en versions of a question carry the same numbers and the same number of wrong options", () => {
    // a text may spell a number out in one language ("שנתיים", "a week", "twice as big" against "גדול פי 2") but never has
    // any other number the other language lacks
    const within = (he: string, en: string, what: string) => {
      const pool = digits(en);
      for (const d of digits(he.replace(/פי \d+(?:\.\d+)?/g, ""))) {
        const at = pool.indexOf(d);
        expect(at, `${what}: ${d} in "${he}" is not in "${en}"`).toBeGreaterThanOrEqual(0);
        pool.splice(at, 1);
      }
    };
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        within(he[0], en[0], "question");
        within(he[1], en[1], `answer of ${en[0]}`);
        expect(he[2].length, `wrong options: ${en[0]}`).toBe(en[2].length);
        en[2].forEach((w, i) => within(he[2][i]!, w, `wrong option of ${en[0]}`));
      }
      for (const [, en, he] of c[l].n ?? []) within(he[0], en[0], "number item");
    }
  });
});

// ───────────────────────────── helpers for the checks below ─────────────────────────────

const question = (c: TopicContent, l: (typeof LEVELS)[number], start: string): Question => {
  const found = (c[l].q ?? []).find(([en]) => en[0].startsWith(start));
  if (!found) throw new Error(`no question starting "${start}"`);
  return found;
};
const numberItem = (c: TopicContent, l: (typeof LEVELS)[number], start: string): NumberItem => {
  const found = (c[l].n ?? []).find(([, en]) => en[0].startsWith(start));
  if (!found) throw new Error(`no number item starting "${start}"`);
  return found;
};
/** The steps of the ordering whose title starts with `start`, in both languages (the title is left out). */
const ordering = (c: TopicContent, l: (typeof LEVELS)[number], start: string): [string[], string[]] => {
  const found = (c[l].s ?? []).find(([en]) => en[0]!.startsWith(start));
  if (!found) throw new Error(`no ordering starting "${start}"`);
  return [found[0].slice(1), found[1].slice(1)];
};
const ascending = (values: number[]): boolean => values.every((v, i) => i === 0 || v > values[i - 1]!);

describe("orderings that sort by size are in the right order, in both languages", () => {
  it("shapes: from the fewest sides to the most", () => {
    const [en, he] = ordering(shapes, "b", "From the shape with the fewest sides");
    const sidesEn: Record<string, number> = { "A triangle": 3, "A square": 4, "A pentagon": 5, "A hexagon": 6, "An octagon": 8 };
    const sidesHe: Record<string, number> = { משולש: 3, ריבוע: 4, מחומש: 5, משושה: 6, מתומן: 8 };
    expect(ascending(en.map((s) => sidesEn[s]!))).toBe(true);
    expect(ascending(he.map((s) => sidesHe[s]!))).toBe(true);
  });

  it("transformations: turns from the smallest to the largest", () => {
    const [en, he] = ordering(transformations, "b", "From the smallest turn");
    const turnsEn: Record<string, number> = { "A quarter turn": 90, "A half turn": 180, "Three quarters of a turn": 270, "A full turn": 360 };
    const turnsHe: Record<string, number> = { "רבע סיבוב": 90, "חצי סיבוב": 180, "שלושה רבעי סיבוב": 270, "סיבוב שלם": 360 };
    expect(ascending(en.map((s) => turnsEn[s]!))).toBe(true);
    expect(ascending(he.map((s) => turnsHe[s]!))).toBe(true);
  });

  it("times tables: the products from the smallest to the largest", () => {
    const [en, he] = ordering(timesTables, "a", "From the smallest product");
    for (const steps of [en, he]) expect(ascending(steps.map((s) => { const [a, b] = s.split("×").map(Number); return a! * b!; }))).toBe(true);
    expect(en).toEqual(he);
  });

  it("speed: speeds in different units, slowest first (km/h and m/s are converted)", () => {
    const [en, he] = ordering(speedDistanceTime, "i", "From the slowest speed");
    const kmh = (s: string): number => {
      const n = Number(/^\d+/.exec(s)![0]);
      return /m\/s|מ׳ לשנייה/.test(s) ? n * 3.6 : n;
    };
    expect(ascending(en.map(kmh))).toBe(true);
    expect(ascending(he.map(kmh))).toBe(true);
  });

  it("speed: journeys by average speed, slowest first", () => {
    const [en, he] = ordering(speedDistanceTime, "a", "Put these journeys in order of average speed");
    const km = (s: string): number => Number(/^\d+/.exec(s)![0]);
    const hoursEn = (s: string): number => (Number(/(\d+) hours?/.exec(s)?.[1] ?? 0) * 60 + Number(/(\d+) minutes/.exec(s)?.[1] ?? 0)) / 60;
    const hoursHe = (s: string): number => {
      const h = /בשעתיים/.test(s) ? 2 : /בשעה/.test(s) ? 1 : Number(/(\d+) שעות/.exec(s)?.[1] ?? 0);
      return (h * 60 + Number(/(\d+) דקות/.exec(s)?.[1] ?? 0)) / 60;
    };
    expect(ascending(en.map((s) => km(s) / hoursEn(s)))).toBe(true);
    expect(ascending(he.map((s) => km(s) / hoursHe(s)))).toBe(true);
    expect(en.map((s) => km(s) / hoursEn(s))).toEqual([30, 40, 45, 50, 75]);
  });

  it("time: units from the shortest to the longest, and durations in mixed units", () => {
    const unitsEn: Record<string, number> = { "1 minute": 60, "1 hour": 3600, "1 day": 86400, "1 week": 604800, "1 year": 31536000 };
    const unitsHe: Record<string, number> = { "דקה אחת": 60, "שעה אחת": 3600, "יום אחד": 86400, "שבוע אחד": 604800, "שנה אחת": 31536000 };
    const [bEn, bHe] = ordering(time, "b", "From the shortest time");
    expect(ascending(bEn.map((s) => unitsEn[s]!))).toBe(true);
    expect(ascending(bHe.map((s) => unitsHe[s]!))).toBe(true);
    const mixedEn: Record<string, number> = { "90 seconds": 90, "2 minutes": 120, "A quarter of an hour": 900, "1,000 seconds": 1000, "1 hour": 3600 };
    const mixedHe: Record<string, number> = { "90 שניות": 90, "2 דקות": 120, "רבע שעה": 900, "1,000 שניות": 1000, "שעה אחת": 3600 };
    const [iEn, iHe] = ordering(time, "i", "From the shortest time to the longest, in different units");
    expect(ascending(iEn.map((s) => mixedEn[s]!))).toBe(true);
    expect(ascending(iHe.map((s) => mixedHe[s]!))).toBe(true);
  });

  it("symmetry: lines of symmetry from the fewest to the most", () => {
    const [en] = ordering(symmetry, "i", "From the fewest lines of symmetry");
    const lines: Record<string, number> = {
      "A triangle with three different sides": 0, "A triangle with exactly two equal sides": 1, "A rectangle that is not a square": 2,
      "A triangle with three equal sides": 3, "A square": 4, "A regular hexagon": 6,
    };
    expect(ascending(en.map((s) => lines[s]!))).toBe(true);
  });
});

describe("the facts and sums the new items rest on", () => {
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };

  it("statistics: medians, means and totals", () => {
    expect(question(statistics, "i", "What is the median of 2, 4, 6, 10?")[0][1]).toBe(String(median([2, 4, 6, 10])));
    expect(question(statistics, "i", "What is the median of 2, 4, 6, 10?")[0][2]).toContain(String(mean([2, 4, 6, 10])));
    expect(question(statistics, "i", "The mean of 4 numbers is 6")[0][1]).toBe(String(6 * 4));
    expect(numberItem(statistics, "i", "The mean of the four numbers 5, 7, 8 and x is 7")[0]).toBe(4 * 7 - (5 + 7 + 8));
    expect(numberItem(statistics, "i", "A pie chart shows a survey of 40 pupils")[0]).toBe(40 / 4);
    expect(numberItem(statistics, "a", "The mean of 5 test scores is 70")[0]).toBe((5 * 70 + 100) / 6);
    expect(numberItem(statistics, "a", "One class has 10 pupils")[0]).toBe((10 * 60 + 20 * 90) / 30);
    expect(numberItem(statistics, "b", "A tally chart shows 2 full groups")[0]).toBe(2 * 5 + 3);
    expect(numberItem(statistics, "b", "In a bar chart, the bar for cats")[0]).toBe(12 - 7);
    // the salaries question: the mean is pulled up by the outlier, the median is not
    expect(mean([8, 9, 9, 10, 64])).toBe(20);
    expect(median([8, 9, 9, 10, 64])).toBe(9);
    // a bar chart that starts at 90: the heights above 90 differ threefold, the values only by about 4 %
    expect((96 - 90) / (92 - 90)).toBe(3);
    expect(Math.round(((96 - 92) / 92) * 100)).toBe(4);
  });

  it("time: durations, leap years and time zones", () => {
    const minutes = (h: number, m: number) => h * 60 + m;
    expect(minutes(1, 45) + minutes(1, 5)).toBe(minutes(2, 50)); // 22:15 to 01:05
    expect(question(time, "i", "A bus leaves at 22:15")[0][1]).toBe("2 hours 50 minutes");
    expect(numberItem(time, "i", "A film starts at 18:40")[0]).toBe(minutes(20, 15) - minutes(18, 40));
    expect(question(time, "i", "What is 7:30 p.m.")[0][1]).toBe(`${7 + 12}:30`);
    expect(new Date(2024, 1, 29).getMonth()).toBe(1); // 2024 has a 29 February
    expect(new Date(2023, 1, 29).getMonth()).toBe(2); // 2023 does not
    expect(numberItem(time, "a", "A common year has 365 days")[0]).toBe(365 + 366 + 365);
    expect(numberItem(time, "a", "It is 21:00 in Tokyo")[0]).toBe(21 - (9 - 2));
    expect(question(time, "a", "A plane leaves Tel Aviv")[0][1]).toBe(`${9 + 5 - 2}:00`);
    expect(question(time, "b", "A lesson starts at 8:15")[0][1]).toBe("9:00");
    expect(15 + 45).toBe(60);
    // a week is the longest of the four times in the beginner question
    expect(7 * 24).toBeGreaterThan(Math.max(100, 2 * 24, 1000 / 60));
  });

  it("shapes: angle sums, sides and area scaling", () => {
    expect(180 - 50 - 60).toBe(numberItem(shapes, "i", "Two angles of a triangle are 50° and 60°")[0]);
    expect(6 * 4).toBe(numberItem(shapes, "i", "All the sides of a regular hexagon")[0]);
    expect(360 - (90 + 80 + 110)).toBe(numberItem(shapes, "a", "Three angles of a quadrilateral")[0]);
    expect(3 + 4 + 5).toBe(numberItem(shapes, "b", "A triangle has 3 sides")[0]);
    expect(question(shapes, "a", "A square with sides of 2 cm")[0][1]).toBe(`${(6 / 2) ** 2} times`);
    expect(question(shapes, "a", "What do the four angles")[0][1]).toBe(`${2 * 180}°`);
    expect(question(shapes, "i", "What do the three angles")[0][1]).toBe("180°");
  });

  it("the elimination ordering solves its own system: 2x + 3y = 11 and 3x − 2y = 10 give x = 4, y = 1", () => {
    const [en] = ordering(simultaneousEquations, "a", "Solving 2x + 3y = 11 and 3x − 2y = 10 by elimination");
    const [x, y] = [4, 1];
    expect(2 * x + 3 * y).toBe(11);
    expect(3 * x - 2 * y).toBe(10);
    expect(2 * (2 * x + 3 * y) + 3 * (3 * x - 2 * y)).toBe(13 * x); // 4x + 6y + 9x − 6y = 13x
    expect(en.join(" ")).toContain("13x = 52");
    expect(13 * x).toBe(52);
    expect(en.join(" ")).toContain("8 + 3y = 11");
    // and it does not give away another question's answer (2x + 3y = 12 and 3x − 2y = 5 has x = 3, y = 2)
    expect(en.join(" ")).not.toContain("x = 3");
  });
});
