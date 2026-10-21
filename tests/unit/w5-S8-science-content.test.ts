import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, TopicContent } from "@/lib/game/topics/types";
import lifeCycles from "@/lib/game/topics/content/science-life-cycles";
import light from "@/lib/game/topics/content/science-light";
import magnetism from "@/lib/game/topics/content/science-magnetism";
import materials from "@/lib/game/topics/content/science-materials";
import microorganisms from "@/lib/game/topics/content/science-microorganisms";
import mixtures from "@/lib/game/topics/content/science-mixtures-separation";
import moon from "@/lib/game/topics/content/science-moon";
import oceanLife from "@/lib/game/topics/content/science-ocean-life";
import periodicTable from "@/lib/game/topics/content/science-periodic-table";
import photosynthesis from "@/lib/game/topics/content/science-photosynthesis";

/**
 * Ten science topics (seven of the original library, three of the Plus and Pro collection) held to the collection's
 * quality bar: the right answer is rarely the longest option (at most 40 % of the choice questions, per language; the
 * original topics were at 43 to 71 %), every level has 8+ items with 4+ questions, numbers or orderings, every explanation
 * has 40+ characters, Hebrew has no "<" or ">", the Hebrew question asks what the English one asks, and the numbers
 * add up.
 */
const TOPICS: Record<string, TopicContent> = {
  "science-life-cycles": lifeCycles,
  "science-light": light,
  "science-magnetism": magnetism,
  "science-materials": materials,
  "science-microorganisms": microorganisms,
  "science-mixtures-separation": mixtures,
  "science-moon": moon,
  "science-ocean-life": oceanLife,
  "science-periodic-table": periodicTable,
  "science-photosynthesis": photosynthesis,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);

describe("science topics S8: answer length is not a tell", () => {
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
      expect(all, id).toBeGreaterThanOrEqual(12);
      expect(longest[0]! / all, `${id} en`).toBeLessThanOrEqual(0.4);
      expect(longest[1]! / all, `${id} he`).toBeLessThanOrEqual(0.4);
    });
  }
});

describe("science topics S8: the collection's quality bar", () => {
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
});

describe("science topics S8: the Hebrew question asks what the English one asks", () => {
  // The Hebrew of "Which has a longer wavelength?" used to read "Why does it have a longer wavelength?" (למה …).
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: a question that begins with "Why" begins with "למה", and the other way round`, () => {
      for (const lv of levelsOf(content)) {
        for (const [en, he] of lv.q ?? []) {
          expect(/^why\b/i.test(en[0]), `${en[0]} / ${he[0]}`).toBe(he[0].startsWith("למה"));
        }
      }
    });
  }

  it("the wavelength question of the light topic asks which light, not why", () => {
    const pair = light.a.q!.find(([en]) => /wavelength/i.test(en[0]) && /^which/i.test(en[0]))!;
    expect(pair).toBeDefined();
    expect(pair[1][0].startsWith("לאיזה")).toBe(true);
    expect(pair[1][1]).toBe("לאור אדום");
  });
});

describe("science topics S8: the numbers add up", () => {
  const find = (c: TopicContent, level: (typeof LEVELS)[number], word: string): NumberItem => {
    const item = (c[level].n ?? []).find(([, en]) => en[0].includes(word));
    expect(item, word).toBeDefined();
    return item!;
  };
  const near = (item: NumberItem, exact: number) => {
    const [answer, , , tolerance] = item;
    expect(Math.abs(answer - exact), `${item[1][0]}`).toBeLessThanOrEqual(Math.max(tolerance ?? 0, 1e-9));
  };

  it("light: sunlight takes about 8 minutes (150 million km at 300,000 km per second)", () => {
    near(find(light, "a", "150 million km"), 150_000_000 / 300_000 / 60);
  });
  it("light: the angle of reflection equals the angle of incidence", () => {
    const item = find(light, "i", "flat mirror");
    expect(item[0]).toBe(30);
    expect(item[1][2]).toContain("30");
  });
  it("moon: six landings with two astronauts each; light from the Moon takes 1.3 s; about 12 full moons a year", () => {
    expect(find(moon, "b", "six Apollo missions")[0]).toBe(6 * 2);
    near(find(moon, "a", "384,000 km"), 384_000 / 300_000);
    near(find(moon, "i", "full moons"), 365 / 29.5);
  });
  it("microorganisms: doubling every 30 minutes for 2 hours, every 20 minutes for 5 hours", () => {
    expect(find(microorganisms, "b", "splits into two")[0]).toBe(2 * 2);
    expect(find(microorganisms, "i", "30 minutes")[0]).toBe(2 ** (120 / 30));
    expect(find(microorganisms, "a", "20 minutes")[0]).toBe(2 ** (300 / 20));
  });
  it("photosynthesis: bubbles per minute times minutes; 6 O₂ in 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", () => {
    expect(find(photosynthesis, "i", "pondweed")[0]).toBe(8 * 15);
    expect(find(photosynthesis, "a", "balanced equation")[0]).toBe(6);
  });
  it("magnetism: an ideal transformer, 12 V times 500 / 100 turns", () => {
    expect(find(magnetism, "a", "transformer")[0]).toBe((12 * 500) / 100);
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
