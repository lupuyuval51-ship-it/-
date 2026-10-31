import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import origami from "@/lib/game/topics/content/arts-origami";
import photography from "@/lib/game/topics/content/arts-photography";
import poetry from "@/lib/game/topics/content/arts-poetry";
import popularMusic from "@/lib/game/topics/content/arts-popular-music";
import rhythmTempo from "@/lib/game/topics/content/arts-rhythm-tempo";
import scalesKeys from "@/lib/game/topics/content/arts-scales-keys";
import sciFiFantasy from "@/lib/game/topics/content/arts-sci-fi-fantasy";
import sculpture from "@/lib/game/topics/content/arts-sculpture";

/**
 * Arts topics origami … sculpture (original library and Plus/Pro collection alike) held to the collection's quality bar
 * (scripts/check-topics.ts): enough items per level, real explanations, the right answer not given away by being the
 * longest option, no mirrored < or > in Hebrew — plus the content fixes made to them.
 */
const TOPICS: Record<string, TopicContent> = {
  "arts-origami": origami,
  "arts-photography": photography,
  "arts-poetry": poetry,
  "arts-popular-music": popularMusic,
  "arts-rhythm-tempo": rhythmTempo,
  "arts-scales-keys": scalesKeys,
  "arts-sci-fi-fantasy": sciFiFantasy,
  "arts-sculpture": sculpture,
};
const LEVELS = ["b", "i", "a"] as const;
const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).map((t) => t[3]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3]]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2]]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];
const question = (c: TopicContent, answer: string) => LEVELS.flatMap((l) => c[l].q ?? []).find(([en]) => en[1] === answer);

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
});

describe("content fixes", () => {
  it("does not claim every Shakespeare sonnet has 14 lines (Sonnet 99 has 15, Sonnet 126 has 12)", () => {
    const sonnet = (poetry.a.n ?? []).find(([answer]) => answer === 14)!;
    expect(sonnet[1][2]).not.toMatch(/each of them 14/);
    expect(sonnet[1][2]).toMatch(/almost all/);
    expect(sonnet[2][2]).not.toMatch(/וכל אחת מהן/);
    expect(sonnet[2][2]).toMatch(/כמעט כולן/);
  });

  it("the national-poet question offers other Hebrew poets, so it is not answered by 'the only poet listed'", () => {
    const q = question(poetry, "Hayim Nahman Bialik")!;
    expect(q[0][2]).toEqual(expect.arrayContaining(["Shaul Tchernichovsky", "Leah Goldberg"]));
    expect(q[0][2]).not.toContain("Theodor Herzl");
    expect(q[1][2]).toEqual(expect.arrayContaining(["שאול טשרניחובסקי", "לאה גולדברג"]));
  });

  it("the Statue of Liberty was never painted green: the copper turned green by itself", () => {
    const q = question(sculpture, "A green layer that formed on its copper over time")!;
    expect(q[0][3]).toMatch(/Nobody painted it/);
    expect(q[1][3]).toMatch(/איש לא צבע אותו/);
  });

  it("photography and poetry have real questions at every level (photography had two at the beginner level)", () => {
    for (const l of LEVELS) {
      expect(photography[l].q!.length + (photography[l].n?.length ?? 0)).toBeGreaterThanOrEqual(4);
      expect(poetry[l].q!.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("the megapixel question is right: 4,000 × 3,000 pixels is 12 megapixels", () => {
    const mp = (photography.i.n ?? []).find(([, en]) => /megapixels/.test(en[0]))!;
    expect(mp[0]).toBe((4000 * 3000) / 1_000_000);
    expect(mp[1][1]).toBe("megapixels");
    expect(mp[2][1]).toBe("מגה־פיקסל");
  });
});
