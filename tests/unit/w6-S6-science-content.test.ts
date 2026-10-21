import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, TopicContent } from "@/lib/game/topics/types";
import chemicalReactions from "@/lib/game/topics/content/science-chemical-reactions";
import climateChange from "@/lib/game/topics/content/science-climate-change";
import conservation from "@/lib/game/topics/content/science-conservation";
import density from "@/lib/game/topics/content/science-density";
import digestion from "@/lib/game/topics/content/science-digestion";
import dinosaurs from "@/lib/game/topics/content/science-dinosaurs-fossils";
import volcanoes from "@/lib/game/topics/content/science-earth-volcanoes";
import electricity from "@/lib/game/topics/content/science-electricity";
import energy from "@/lib/game/topics/content/science-energy";
import famousScientists from "@/lib/game/topics/content/science-famous-scientists";

/**
 * Ten science topics held to the collection's quality bar: the right answer is the strictly longest option in at most 40 %
 * of the choice questions per language (chemical reactions was at 63 %, climate change at 100 %, electricity at 67 %,
 * dinosaurs and fossils at 67 %, the digestive system at 71 %), every level has 8+ items with 4+ questions, numbers or
 * orderings (climate change, the digestive system, electricity, volcanoes and energy had two questions a level), every
 * answer is explained in 40+ characters, and Hebrew has no "<" or ">".
 */
const TOPICS: Record<string, TopicContent> = {
  "science-chemical-reactions": chemicalReactions,
  "science-climate-change": climateChange,
  "science-conservation": conservation,
  "science-density": density,
  "science-digestion": digestion,
  "science-dinosaurs-fossils": dinosaurs,
  "science-earth-volcanoes": volcanoes,
  "science-electricity": electricity,
  "science-energy": energy,
  "science-famous-scientists": famousScientists,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);

describe("topics S6: answer length is not a tell", () => {
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

describe("topics S6: the collection's quality bar", () => {
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
          ...(lv.t ?? []).flatMap((t) => [t[2], t[3]]),
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

  it("a question that begins with \"Why\" begins with \"למה\" in Hebrew, and the other way round", () => {
    for (const [id, content] of Object.entries(TOPICS)) {
      for (const lv of levelsOf(content)) {
        for (const [en, he] of lv.q ?? []) {
          expect(/^why\b/i.test(en[0]), `${id}: ${en[0]} / ${he[0]}`).toBe(he[0].startsWith("למה"));
        }
      }
    }
  });
});

describe("topics S6: facts that were wrong or ambiguous", () => {
  const allWrong = (c: TopicContent, level: (typeof LEVELS)[number], match: RegExp): string[] => {
    const pair = c[level].q!.find(([en]) => match.test(en[0]));
    expect(pair, String(match)).toBeDefined();
    return [...pair![0][2], ...pair![1][2]];
  };

  it("fossil dating: no wrong option counts growth rings in the bone, because bone rings do give an animal's age at death", () => {
    const options = allWrong(dinosaurs, "i", /how old a fossil is/);
    for (const o of options) expect(/\brings?\b|טבעות/i.test(o), o).toBe(false);
  });

  it("the sea-level question keeps floating sea ice out of the right answer (melting floating ice does not raise the level)", () => {
    const pair = climateChange.i.q!.find(([en]) => /sea level is rising/.test(en[0]))!;
    expect(pair[0][1]).toMatch(/Ice on land/);
    expect(pair[1][1]).toMatch(/מהיבשה/);
    expect(pair[0][2].some((w) => /floating sea ice/.test(w))).toBe(true);
  });

  it("the fridge question names both the reactions and the microbes without a stray comma pair", () => {
    const pair = chemicalReactions.a.q!.find(([en]) => /go off more slowly in a fridge/.test(en[0]))!;
    expect(pair[0][1]).toBe("The cold slows down the reactions and the microbes that spoil food");
    expect(pair[1][1]).not.toMatch(/,/);
  });
});

describe("topics S6: the numbers add up", () => {
  const find = (c: TopicContent, level: (typeof LEVELS)[number], word: RegExp): NumberItem => {
    const n = c[level].n!.find(([, en]) => word.test(en[0]));
    expect(n, String(word)).toBeDefined();
    return n!;
  };

  it("the carbon dioxide of a 50 km car trip: 120 g × 50 = 6,000 g = 6 kg", () => {
    expect(find(climateChange, "a", /120 g of carbon dioxide/)[0]).toBe((120 * 50) / 1000);
  });

  it("a plate at 5 cm a year moves 50 m in 1,000 years", () => {
    expect(find(volcanoes, "i", /5 cm a year/)[0]).toBe((5 * 1000) / 100);
  });

  it("two steps of 32 times the energy are about 1,000 times (1,024), and the tolerance accepts both", () => {
    const [answer, , , tolerance] = find(volcanoes, "a", /magnitude 8/);
    expect(32 * 32).toBeGreaterThan(answer - (tolerance ?? 0) - 1);
    expect(Math.abs(32 * 32 - answer)).toBeLessThanOrEqual(tolerance ?? 0);
  });

  it("a 2 kg ball lifted 5 m gains 2 × 10 × 5 = 100 J", () => {
    expect(find(energy, "a", /2 kg ball/)[0]).toBe(2 * 10 * 5);
  });

  it("a footprint of 40 cm gives hips of 4 × 40 = 160 cm", () => {
    expect(find(dinosaurs, "a", /hip height/)[0]).toBe(4 * 40);
  });

  it("two 6 ohm resistors in parallel on 12 V carry 2 × (12 ÷ 6) = 4 A, and a motor on 12 V at 3 A uses 36 W", () => {
    expect(find(electricity, "a", /in parallel to a 12 V battery/)[0]).toBe(2 * (12 / 6));
    expect(find(electricity, "a", /12 V battery and takes a current of 3 A/)[0]).toBe(12 * 3);
  });
});
