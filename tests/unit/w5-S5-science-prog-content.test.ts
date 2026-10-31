import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, TopicContent } from "@/lib/game/topics/types";
import progStrings from "@/lib/game/topics/content/prog-strings";
import progTurtle from "@/lib/game/topics/content/prog-turtle";
import progVariables from "@/lib/game/topics/content/prog-variables";
import acidsBases from "@/lib/game/topics/content/science-acids-bases";
import animalBehaviour from "@/lib/game/topics/content/science-animal-behaviour";
import animalClassification from "@/lib/game/topics/content/science-animal-classification";
import atmosphere from "@/lib/game/topics/content/science-atmosphere";
import atoms from "@/lib/game/topics/content/science-atoms";
import birds from "@/lib/game/topics/content/science-birds";
import cells from "@/lib/game/topics/content/science-cells";

/**
 * Ten topics (three programming, seven science) held to the collection's quality bar: the right answer is the strictly
 * longest option in at most 40 % of the choice questions per language (acids and bases was at 71 % and 57 %, classifying
 * animals at 50 % and 67 %, cells at 43 %), every level has 8+ items with 4+ questions, numbers or orderings (acids and
 * bases, atoms, cells and animal classification were thin), explanations have 40+ characters, and Hebrew has no "<" or
 * ">" (the Hebrew of a variables question used to read "5 > 2").
 */
const TOPICS: Record<string, TopicContent> = {
  "prog-strings": progStrings,
  "prog-turtle": progTurtle,
  "prog-variables": progVariables,
  "science-acids-bases": acidsBases,
  "science-animal-behaviour": animalBehaviour,
  "science-animal-classification": animalClassification,
  "science-atmosphere": atmosphere,
  "science-atoms": atoms,
  "science-birds": birds,
  "science-cells": cells,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);

describe("topics S5: answer length is not a tell", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: the right answer is the strictly longest option in at most 40 % of the questions, in each language`, () => {
      const longest = [0, 0];
      let all = 0;
      for (const lv of levelsOf(content)) {
        for (const pair of lv.q ?? []) {
          all++;
          pair.forEach(([, answer, wrong], lang) => {
            if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
          });
        }
      }
      expect(all, id).toBeGreaterThanOrEqual(10);
      expect(longest[0]! / all, `${id} en`).toBeLessThanOrEqual(0.4);
      expect(longest[1]! / all, `${id} he`).toBeLessThanOrEqual(0.4);
    });
  }
});

describe("topics S5: the collection's quality bar", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: 8+ items and 4+ questions per level, explanations of 40+ characters, no "<" or ">" in Hebrew`, () => {
      for (const [at, lv] of levelsOf(content).entries()) {
        const where = `${id}/${LEVELS[at]}`;
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect((lv.t?.length ?? 0) + items, where).toBeGreaterThanOrEqual(8);
        expect(items, where).toBeGreaterThanOrEqual(4);
        for (const pair of lv.q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
        for (const [, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
        const hebrew = [
          ...(lv.t ?? []).map((t) => t[3]),
          ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : [])]),
          ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2], ...(he[3] ? [he[3]] : [])]),
          ...(lv.s ?? []).flatMap(([, he]) => he),
        ];
        for (const s of hebrew) expect(/[<>]/.test(s), `${where}: ${s}`).toBe(false);
      }
    });
  }

  it("a question never repeats its right answer among the wrong options, and en and he have as many options", () => {
    for (const [id, content] of Object.entries(TOPICS)) {
      for (const lv of levelsOf(content)) {
        for (const [en, he] of lv.q ?? []) {
          expect(en[2].length, `${id}: ${en[0]}`).toBe(he[2].length);
          for (const [, answer, wrong] of [en, he]) expect(wrong.includes(answer), `${id}: ${answer}`).toBe(false);
        }
      }
    }
  });
});

describe("topics S5: the Hebrew question asks what the English one asks", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: a question that begins with "Why" begins with "למה", and the other way round`, () => {
      for (const lv of levelsOf(content)) {
        for (const [en, he] of lv.q ?? []) {
          expect(/^why\b/i.test(en[0]), `${en[0]} / ${he[0]}`).toBe(he[0].startsWith("למה"));
        }
      }
    });
  }

  it("the Hebrew of the cell term no longer ends in a lone «מיותר» (which reads as «superfluous»)", () => {
    const cell = cells.b.t!.find(([en]) => en === "Cell")!;
    expect(cell[3]).not.toMatch(/מיותר/);
  });

  it("the spider question's wrong option says the spider is in the reptile group, not that it «crawls»", () => {
    const pair = animalClassification.i.q!.find(([en]) => en[0] === "Is a spider an insect?")!;
    expect(pair[1][2].some((w) => w === "לא: הוא זוחל")).toBe(false);
    expect(pair[1][2].some((w) => w.startsWith("לא:") && w.includes("זוחלים"))).toBe(true);
  });

  it("the variables comparison question uses == in both languages (the Hebrew had a mirrored >)", () => {
    const pair = progVariables.a.q!.find(([en]) => /type is the result of/.test(en[0]))!;
    expect(pair[0][0]).toContain("==");
    expect(pair[1][0]).toContain("==");
    expect(pair[1][0]).not.toMatch(/[<>]/);
  });
});

describe("topics S5: the numbers add up", () => {
  const find = (c: TopicContent, level: (typeof LEVELS)[number], word: string): NumberItem => {
    const item = (c[level].n ?? []).find(([, en]) => en[0].includes(word));
    expect(item, word).toBeDefined();
    return item!;
  };

  it("acids and bases: ten times fewer H⁺ ions than pure water is one pH step up, from 7 to 8", () => {
    expect(find(acidsBases, "a", "ten times fewer")[0]).toBe(7 + 1);
  });
  it("atoms: an iron atom has 26 protons; S²⁻ has 16 + 2 electrons", () => {
    expect(find(atoms, "i", "iron atom")[0]).toBe(26);
    expect(find(atoms, "a", "sulfide")[0]).toBe(16 + 2);
  });
  it("cells: a bacterium dividing every 20 minutes makes 2³ = 8 in an hour", () => {
    expect(find(cells, "a", "20 minutes")[0]).toBe(2 ** (60 / 20));
  });
  it("variables: y = x + 2 is worked out once, with x = 5, so y stays 7", () => {
    expect(find(progVariables, "b", "y = x + 2")[0]).toBe(5 + 2);
  });
  it("variables: 17 % 4 is 1 and 20 // 3 is 6", () => {
    expect(find(progVariables, "a", "17 % 4")[0]).toBe(17 % 4);
    expect(find(progVariables, "a", "20 // 3")[0]).toBe(Math.floor(20 / 3));
  });
  it("atmosphere: 15 minus (−18) is 33; pressure halves twice between sea level and 11 km", () => {
    expect(find(atmosphere, "i", "greenhouse")[0]).toBe(15 - -18);
    expect(find(atmosphere, "a", "5.5 km")[0]).toBe(1000 / 2 ** (11 / 5.5));
  });
  it("turtle: 4 × 90 = 360, 4 × 50 = 200, 360 ÷ 5 = 72, 180 − 360 ÷ 8 = 135, 360 ÷ 24 = 15", () => {
    expect(find(progTurtle, "b", "degrees does the turtle turn in all")[0]).toBe(4 * 90);
    expect(find(progTurtle, "b", "whole path")[0]).toBe(4 * 50);
    expect(find(progTurtle, "i", "pentagon")[0]).toBe(360 / 5);
    expect(find(progTurtle, "a", "octagon")[0]).toBe(180 - 360 / 8);
    expect(find(progTurtle, "a", "right 24")[0]).toBe(360 / 24);
  });
  it("birds: a hummingbird beating 50 times a second makes 3000 beats a minute; a hen sits 21 days", () => {
    expect(find(birds, "a", "hummingbird")[0]).toBe(50 * 60);
    expect(find(birds, "i", "chicken")[0]).toBe(21);
  });
  it("every numeric explanation contains its own answer, in both languages", () => {
    for (const [id, content] of Object.entries(TOPICS)) {
      for (const lv of levelsOf(content)) {
        for (const [answer, en, he] of lv.n ?? []) {
          for (const [q, , explanation] of [en, he]) {
            const written = [String(answer), answer.toLocaleString("en-US")];
            expect(written.some((w) => explanation.includes(w)), `${id}: ${q}`).toBe(true);
          }
        }
      }
    }
  });
});
