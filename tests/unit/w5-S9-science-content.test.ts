import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import plantClassification from "@/lib/game/topics/content/science-plant-classification";
import plantParts from "@/lib/game/topics/content/science-plant-parts";
import pollution from "@/lib/game/topics/content/science-pollution";
import renewableEnergy from "@/lib/game/topics/content/science-renewable-energy";
import rocksMinerals from "@/lib/game/topics/content/science-rocks-minerals";
import senses from "@/lib/game/topics/content/science-senses";
import simpleMachines from "@/lib/game/topics/content/science-simple-machines";
import skin from "@/lib/game/topics/content/science-skin";
import soil from "@/lib/game/topics/content/science-soil";
import solarSystem from "@/lib/game/topics/content/science-solar-system";

/**
 * Ten science topics (five of the original library, five of the Plus and Pro collection) held to the collection's
 * quality bar: the right answer is rarely the longest option (at most 40 % of the choice questions, per language), every
 * level has 8+ items with 4+ questions, numbers or orderings, every explanation has 40+ characters, and Hebrew text has
 * no "<" or ">" (a right-to-left line mirrors them). The five original topics used to give the right answer away by its
 * length in 63 to 88 % of their questions.
 */
const TOPICS: Record<string, TopicContent> = {
  "science-plant-classification": plantClassification,
  "science-plant-parts": plantParts,
  "science-pollution": pollution,
  "science-renewable-energy": renewableEnergy,
  "science-rocks-minerals": rocksMinerals,
  "science-senses": senses,
  "science-simple-machines": simpleMachines,
  "science-skin": skin,
  "science-soil": soil,
  "science-solar-system": solarSystem,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);

describe("science topics: answer length is not a tell", () => {
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

describe("science topics: the collection's quality bar", () => {
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

describe("science topics: numeric items", () => {
  const numbers = (c: TopicContent) => LEVELS.flatMap((l) => c[l].n ?? []);

  it("the sums behind the new and the existing number items hold", () => {
    // light from the Moon: 384,000 km at 300,000 km per second
    const moon = numbers(solarSystem).find(([, en]) => en[0].includes("384,000"))!;
    expect(moon[0]).toBeCloseTo(384000 / 300000, 1);
    // a ramp 6 m long that rises 2 m multiplies force 6 / 2 times, without friction
    const ramp = numbers(simpleMachines).find(([, en]) => en[0].includes("6 m long"))!;
    expect(ramp[0]).toBe(6 / 2);
    // a seesaw balances when weight x distance matches: 30 x 2 = 40 x d
    const seesaw = numbers(simpleMachines).find(([, en]) => en[0].includes("seesaw"))!;
    expect(seesaw[0]).toBe((30 * 2) / 40);
    // gears: a 36-tooth gear drives a 12-tooth gear
    const gear = numbers(simpleMachines).find(([, en]) => en[0].includes("36 teeth"))!;
    expect(gear[0]).toBe(36 / 12);
    // mud settles 2 mm a year: 10 cm = 100 mm
    const mud = numbers(rocksMinerals)[0]!;
    expect(mud[0]).toBe(100 / 2);
    // food chain: a poison ten times stronger at each of three steps
    expect(numbers(pollution)[1]![0]).toBe(10 ** 3);
  });

  it("every number item states its unit in both languages or in neither, and the answer is in each explanation", () => {
    for (const [id, c] of Object.entries(TOPICS)) {
      for (const [answer, en, he] of numbers(c)) {
        expect(Boolean(en[1]), `${id}: ${en[0]}`).toBe(Boolean(he[1]));
        expect(en[2].includes(String(answer)) || en[2].includes(answer.toLocaleString("en-US")), `${id} en: ${en[0]}`).toBe(true);
        expect(he[2].includes(String(answer)) || he[2].includes(answer.toLocaleString("en-US")), `${id} he: ${en[0]}`).toBe(true);
      }
    }
  });
});
