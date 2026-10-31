import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C12: seven computing topics (operating systems, presentations, programming basics, programming languages,
 * robots, search engines, sorting). Four of them belong to the original library and were held only to its looser bar:
 * "Programming basics" and "Robots" had two questions per level, "Robots" gave the answer away by its length in 4 of 6
 * questions ("A machine that senses, decides and moves by itself" against "A hammer", "A spoon"), and "Search engines" did
 * so in 13 of 15 Hebrew questions. They now meet the Plus and Pro collection's bar, with wrong options that voice real
 * misconceptions (input taken for output, "true" in quotation marks taken for a Boolean, counting list positions from 1,
 * ads always at the bottom, quotation marks meaning famous quotes, paid ads taken for SEO). In Hebrew the questions on
 * Grace Hopper and Ada Lovelace asked "מי בנתה / מי כתבה": the feminine verb ruled out the men among the options, which the
 * English question does not do. The number facts are checked by calculating them, and the code in the orderings by
 * running it.
 */

const IDS = ["cs-operating-systems", "cs-presentations", "cs-programming-basics", "cs-programming-languages", "cs-robotics", "cs-search-engines", "cs-sorting"] as const;
const ORIGINAL = ["cs-operating-systems", "cs-programming-basics", "cs-robotics", "cs-search-engines"] as const;
const LEVELS = ["b", "i", "a"] as const;
type Level = (typeof LEVELS)[number];

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

function hebrewTexts(c: TopicContent): string[] {
  const out: string[] = [];
  for (const l of LEVELS) {
    const lv = c[l];
    for (const t of lv.t ?? []) out.push(t[2], t[3]);
    for (const [, he] of lv.q ?? []) out.push(he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : []));
    for (const [, , he] of lv.n ?? []) out.push(he[0], he[1], he[2], ...(he[3] ? [he[3]] : []));
    for (const [, he] of lv.s ?? []) out.push(...he);
  }
  return out;
}

function question(c: TopicContent, l: Level, start: string) {
  const pair = (c[l].q ?? []).find(([en]) => en[0].startsWith(start));
  if (!pair) throw new Error(`no question "${start}" at ${l}`);
  return pair;
}

function numberItem(c: TopicContent, l: Level, text: string) {
  const item = (c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!item) throw new Error(`no number item "${text}" at ${l}`);
  return item;
}

/** Runs assignments such as "t = a" (the code after the last colon of each step) on a set of variables. */
function run(steps: readonly string[], vars: Record<string, number>): Record<string, number> {
  const v = { ...vars };
  for (const step of steps) {
    const m = /([a-z]) = ([a-z])$/.exec(step.trim());
    if (!m) throw new Error(`not an assignment: ${step}`);
    v[m[1]!] = v[m[2]!]!;
  }
  return v;
}

function permutations<T>(xs: readonly T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

describe("computing topics (C12)", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
  });

  it.each(ORIGINAL)("%s (original library) meets the collection's bar: 8+ items, 4+ questions, explanations of 40+", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      for (const pair of lv.q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
    }
  });

  it.each(IDS)("%s: the right answer is the longest option in at most 40 % of the questions, in each language", async (id) => {
    const c = await load(id);
    for (const lang of [0, 1] as const) {
      let all = 0, longest = 0;
      for (const l of LEVELS) for (const pair of c[l].q ?? []) {
        const [, answer, wrong] = pair[lang];
        all++;
        if (answer.length > Math.max(...wrong.map((w) => w.length))) longest++;
      }
      expect(longest / all, `${id} ${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: Hebrew text never uses < or >, and both languages offer the same number of wrong options", async (id) => {
    const c = await load(id);
    for (const s of hebrewTexts(c)) expect(s, id).not.toMatch(/[<>]/);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) expect(he[2].length, en[0]).toBe(en[2].length);
  });

  it("the Hebrew questions on Grace Hopper and Ada Lovelace do not give the answer away with a feminine verb", async () => {
    const c = await load("cs-programming-languages");
    for (const start of ["Who built one of the very first compilers", "Who wrote what is often called the first computer program"]) {
      const [en, he] = question(c, "i", start);
      expect(en[2].some((w) => /Turing|Gates|Jobs/.test(w)), start).toBe(true);
      expect(he[0], start).not.toMatch(/^מי (בנתה|כתבה)/);
      expect(he[0], start).toMatch(/^בידי מי /);
    }
  });

  it("the robot questions state what they depend on: the sensor layout, and that not every self-driving car uses lidar", async () => {
    const c = await load("cs-robotics");
    const [lineEn, lineHe] = question(c, "i", "A line-following robot");
    expect(lineEn[0]).toMatch(/on each side of a black line/);
    expect(lineHe[0]).toMatch(/בכל צד של קו שחור/);
    const [carEn, carHe] = question(c, "a", "Why do many self-driving cars");
    expect(carEn[0]).toContain("many");
    expect(carHe[0]).toContain("רבות");
    // the giveaway one-word options are gone
    const [robotEn] = question(c, "b", "Which of these is a robot?");
    expect(robotEn[2]).not.toContain("A spoon");
  });

  it("the number answers are what the calculation gives", async () => {
    const robots = await load("cs-robotics");
    expect(numberItem(robots, "b", "rolls 15 cm")[0]).toBe(4 * 15);
    expect(numberItem(robots, "i", "50 times every second")[0]).toBe(3 * 50);
    // a lidar pulse goes there and back: 200 ns × 30 cm/ns, halved, in metres
    expect(numberItem(robots, "a", "lidar pulse")[0]).toBe((200 * 30) / 2 / 100);
    const basics = await load("cs-programming-basics");
    expect(numberItem(basics, "b", "2 steps forward")[0]).toBe(2 + 3 - 1);
    let x = 10;
    x = x - 3;
    x = x * 2;
    expect(numberItem(basics, "i", "x = 10")[0]).toBe(x);
    expect(numberItem(basics, "a", "5 items")[0]).toBe(5 - 1);
    const os = await load("cs-operating-systems");
    expect(numberItem(os, "i", "64 GB")[0]).toBe(64 - 20 - 30);
    expect(numberItem(os, "a", "2,000 photos")[0]).toBe((2000 * 4) / 1000);
    const search = await load("cs-search-engines");
    expect(numberItem(search, "a", "15 of 20")[0]).toBe((15 / 20) * 100);
    expect(numberItem(search, "i", "50 pages every second")[0]).toBe(50 * 60);
  });

  it("the list questions in programming basics agree with zero-based indexing", async () => {
    const c = await load("cs-programming-basics");
    const list = [10, 20, 30];
    expect(question(c, "a", "In most languages, the first item")[0][1]).toBe(String(list.indexOf(10)));
    expect(question(c, "a", "In most languages, what is list[2]")[0][1]).toBe(String(list[2]));
    expect(question(c, "a", "A function double(n)")[0][1]).toBe(String(3 * 2 * 2));
  });

  it("the swap ordering really swaps a and b, and no other order of its steps does", async () => {
    const c = await load("cs-programming-basics");
    const ordering = (c.i.s ?? []).find(([en]) => (en[0] ?? "").startsWith("Swapping the values"));
    expect(ordering).toBeTruthy();
    for (const lang of [0, 1] as const) {
      const steps = ordering![lang].slice(1);
      expect(run(steps, { a: 1, b: 2, t: 0 })).toMatchObject({ a: 2, b: 1 });
      const swapping = permutations(steps).filter((p) => {
        const r = run(p, { a: 1, b: 2, t: 0 });
        return r.a === 2 && r.b === 1;
      });
      expect(swapping).toHaveLength(1);
    }
  });

  it("the sorting traces match a real run of the algorithms", async () => {
    const c = await load("cs-sorting");
    const bubblePass = (xs: number[]) => {
      const a = xs.slice();
      for (let i = 0; i + 1 < a.length; i++) if (a[i]! > a[i + 1]!) [a[i], a[i + 1]] = [a[i + 1]!, a[i]!];
      return a;
    };
    expect(question(c, "i", "What is 5, 1, 4, 2 after the first pass")[0][1]).toBe(bubblePass([5, 1, 4, 2]).join(", "));
    let swaps = 0;
    const a = [3, 1, 2];
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 0; i + 1 < a.length; i++) if (a[i]! > a[i + 1]!) { [a[i], a[i + 1]] = [a[i + 1]!, a[i]!]; swaps++; changed = true; }
    }
    expect(numberItem(c, "i", "3, 1, 2")[0]).toBe(swaps);
    const sel = [4, 2, 7, 1];
    const m = sel.indexOf(Math.min(...sel));
    [sel[0], sel[m]] = [sel[m]!, sel[0]!];
    expect(question(c, "i", "Selection sort finds the smallest")[0][1]).toBe(sel.join(", "));
    expect(numberItem(c, "a", "10 items")[0]).toBe((10 * 9) / 2);
  });
});
