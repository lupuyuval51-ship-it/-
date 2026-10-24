import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import architects from "@/lib/game/topics/content/arts-architects";
import architecture from "@/lib/game/topics/content/arts-architecture";
import artStyles from "@/lib/game/topics/content/arts-art-styles";
import bridges from "@/lib/game/topics/content/arts-bridges";
import ceramics from "@/lib/game/topics/content/arts-ceramics";
import childrensClassics from "@/lib/game/topics/content/arts-childrens-classics";
import classicalMusic from "@/lib/game/topics/content/arts-classical-music";
import colour from "@/lib/game/topics/content/arts-colour";

/**
 * The first eight arts topics (original library and Plus/Pro collection alike) held to the collection's quality bar
 * (scripts/check-topics.ts): enough items per level, real explanations, the right answer not given away by being the
 * longest option, no mirrored < or > in Hebrew — plus the content fixes made to them.
 */
const TOPICS: Record<string, TopicContent> = {
  "arts-architects": architects,
  "arts-architecture": architecture,
  "arts-art-styles": artStyles,
  "arts-bridges": bridges,
  "arts-ceramics": ceramics,
  "arts-childrens-classics": childrensClassics,
  "arts-classical-music": classicalMusic,
  "arts-colour": colour,
};
const LEVELS = ["b", "i", "a"] as const;
const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).map((t) => t[3]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3]]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2]]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];

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
      expect(longest / qs.length).toBeLessThanOrEqual(0.4);
    }
  });

  it("never uses < or > in Hebrew text", () => {
    for (const l of LEVELS) for (const s of hebrewTexts(c[l])) expect(/[<>]/.test(s), s).toBe(false);
  });
});

describe("content fixes", () => {
  it("the Alice question does not name Alice (the answer is the book about her)", () => {
    const q = (childrensClassics.a.q ?? []).find(([en]) => en[1] === "Alice's Adventures in Wonderland");
    expect(q).toBeDefined();
    expect(q![0][0]).not.toMatch(/Alice/);
    expect(q![1][0]).not.toMatch(/אליס|עליסה/);
  });

  it("the Burj Khalifa opened in 2010 (its construction was completed in 2009)", () => {
    const q = (architecture.i.q ?? []).find(([en]) => en[1] === "The Burj Khalifa");
    expect(q![0][0]).toMatch(/opened in 2010/);
    expect(q![1][0]).toMatch(/שנפתח ב־2010/);
  });

  it("only the first Dead Sea Scrolls were found in clay jars, not many of them", () => {
    const q = (ceramics.i.q ?? []).find(([en]) => en[1] === "Clay jars hidden in a cave");
    expect(q![0][0]).toMatch(/first Dead Sea Scrolls/);
    expect(q![0][0]).not.toMatch(/many of them/);
    expect(q![1][0]).toMatch(/הראשונות/);
  });

  it("colour theory has real questions at every level (it had two per level)", () => {
    for (const l of LEVELS) expect(colour[l].q!.length).toBeGreaterThanOrEqual(4);
  });
});
