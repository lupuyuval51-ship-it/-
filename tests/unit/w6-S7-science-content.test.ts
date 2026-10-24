import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, Question, TopicContent } from "@/lib/game/topics/types";
import foodChains from "@/lib/game/topics/content/science-food-chains";
import forces from "@/lib/game/topics/content/science-forces";
import genetics from "@/lib/game/topics/content/science-genetics";
import gravity from "@/lib/game/topics/content/science-gravity";
import habitats from "@/lib/game/topics/content/science-habitats";
import heartBlood from "@/lib/game/topics/content/science-heart-blood";
import heatTransfer from "@/lib/game/topics/content/science-heat-transfer";
import humanBody from "@/lib/game/topics/content/science-human-body-systems";
import insects from "@/lib/game/topics/content/science-insects";
import labSkills from "@/lib/game/topics/content/science-lab-skills";

/**
 * Ten science topics (food chains, forces, genetics, gravity, habitats, the heart and blood, heat, bones/lungs/nerves,
 * insects, the science lab). Six of them are original-library topics that were thin (two questions per level, and the
 * right answer the longest option in up to 83 % of the questions): they now have 8+ items and 4+ questions, numbers or
 * orderings at every level, explanations of 40+ characters, and a right answer that is the longest option in at most
 * 40 % of the questions in each language. The sums the new numbers rest on are recomputed here, so a wrong number in the
 * content fails.
 */
const TOPICS: Record<string, TopicContent> = {
  "science-food-chains": foodChains,
  "science-forces": forces,
  "science-genetics": genetics,
  "science-gravity": gravity,
  "science-habitats": habitats,
  "science-heart-blood": heartBlood,
  "science-heat-transfer": heatTransfer,
  "science-human-body-systems": humanBody,
  "science-insects": insects,
  "science-lab-skills": labSkills,
};
const LEVELS = ["b", "i", "a"] as const;
const levels = (c: TopicContent): [string, LevelContent][] => LEVELS.map((l) => [l, c[l]]);
const questions = (c: TopicContent): Question[] => LEVELS.flatMap((l) => c[l].q ?? []);

const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).flatMap((t) => [t[2], t[3]]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : [])]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2], ...(he[3] ? [he[3]] : [])]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];

function number(c: TopicContent, level: (typeof LEVELS)[number], start: string): NumberItem {
  const found = (c[level].n ?? []).filter(([, en]) => en[0].startsWith(start));
  expect(found.length, `${level}: "${start}"`).toBe(1);
  return found[0]!;
}
function question(c: TopicContent, start: string): Question {
  const found = questions(c).filter(([en]) => en[0].startsWith(start));
  expect(found.length, `"${start}"`).toBe(1);
  return found[0]!;
}

describe("science topics S7: the quality bar of the collection", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: every level has 8+ items, 4+ of them questions, numbers or orderings, and 40+ character explanations`, () => {
      for (const [l, lv] of levels(content)) {
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
        expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
        for (const pair of lv.q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        for (const [, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      }
    });

    it(`${id}: no "<" or ">" in Hebrew, and every question has the same number of wrong options in both languages, all different from the answer`, () => {
      for (const [l, lv] of levels(content)) {
        for (const s of hebrewTexts(lv)) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
        for (const [en, he] of lv.q ?? []) {
          expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
          for (const [, answer, wrong] of [en, he]) {
            expect(wrong.includes(answer), `${id}/${l}: ${en[0]}`).toBe(false);
            expect(new Set(wrong).size, `${id}/${l}: ${en[0]}`).toBe(wrong.length);
          }
        }
      }
    });

    it(`${id}: the right answer is the longest option in at most 40 % of the questions, in each language`, () => {
      for (const lang of [0, 1] as const) {
        let all = 0, longest = 0;
        for (const pair of questions(content)) {
          const [, answer, wrong] = pair[lang];
          all++;
          if (answer.length > Math.max(...wrong.map((w) => w.length))) longest++;
        }
        expect(all, id).toBeGreaterThanOrEqual(10);
        expect(longest / all, `${id} ${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.4);
      }
    });

    it(`${id}: a question that begins with "Why" begins with "למה", and the other way round`, () => {
      for (const [en, he] of questions(content)) expect(/^why\b/i.test(en[0]), `${en[0]} / ${he[0]}`).toBe(he[0].startsWith("למה"));
    });
  }
});

describe("science topics S7: the numbers add up", () => {
  it("every numeric explanation contains its own answer, in both languages", () => {
    for (const [id, content] of Object.entries(TOPICS)) {
      for (const [, lv] of levels(content)) {
        for (const [answer, en, he] of lv.n ?? []) {
          for (const [q, , explanation] of [en, he]) {
            const written = [String(answer), answer.toLocaleString("en-US")];
            expect(written.some((w) => explanation.includes(w)), `${id}: ${q}`).toBe(true);
          }
        }
      }
    }
  });

  it("forces: F = m × a both ways, and weight = mass × 10 N/kg", () => {
    expect(number(forces, "a", "A net force of 6 N")[0]).toBe(6 / 2);
    expect(number(forces, "a", "A 4 kg trolley")[0]).toBe(4 * 3);
    expect(number(forces, "i", "A box has a mass of 5 kg")[0]).toBe(5 * 10);
  });
  it("forces: the same force on half the mass gives twice the acceleration", () => {
    const pair = question(forces, "A 2 kg trolley and a 4 kg trolley");
    expect(pair[0][1]).toContain("twice");
    expect(10 / 2 / (10 / 4)).toBe(2);
  });
  it("food chains: 10 % of the energy passes on at each of the four steps", () => {
    expect(number(foodChains, "a", "Grass holds 100,000")[0]).toBe(100_000 / 10 ** 4);
    const pair = question(foodChains, "Plants hold 10,000");
    expect(pair[0][1]).toBe(`${10_000 / 10 / 10} units`);
  });
  it("genetics: 3/4 of 800 offspring of two Bb parents show the dominant trait; Tt × tt gives half short", () => {
    expect(number(genetics, "a", "Two Bb pea plants")[0]).toBe((3 / 4) * 800);
    const combos = ["T", "t"].flatMap((a) => ["t", "t"].map((b) => a + b));
    expect(combos.filter((g) => g === "tt").length / combos.length).toBe(1 / 2);
    expect(question(genetics, "In pea plants")[0][1]).toBe("1/2");
  });
  it("habitats: 120 hares on 4 km², and 50 rabbits doubling for 3 years", () => {
    expect(number(habitats, "i", "A field of 4 square kilometres")[0]).toBe(120 / 4);
    expect(number(habitats, "a", "A population of 50 rabbits")[0]).toBe(50 * 2 ** 3);
  });
  it("heart and blood: 20 beats in 15 s, 70 beats a minute for an hour, 70 mL × 70 beats", () => {
    expect(number(heartBlood, "b", "You count 20 heartbeats")[0]).toBe(20 * (60 / 15));
    expect(number(heartBlood, "i", "A resting heart beats about 70")[0]).toBe(70 * 60);
    expect(number(heartBlood, "a", "The left ventricle pumps about 70 mL")[0]).toBe(70 * 70);
  });
  it("bones, lungs and nerves: 15 breaths a minute for an hour, 31 pairs of spinal nerves", () => {
    expect(number(humanBody, "i", "An adult at rest breathes")[0]).toBe(15 * 60);
    expect(number(humanBody, "a", "A person has 31 pairs")[0]).toBe(31 * 2);
  });
});

describe("science topics S7: facts the review corrected", () => {
  it("food chains: the producer question has a plant as the answer and a fungus among the wrong options", () => {
    const [en, he] = question(foodChains, "Which of these living things is a producer");
    expect(en[1]).toBe("A tomato plant");
    expect(en[2].some((w) => /mushroom/.test(w))).toBe(true);
    expect(he[2].some((w) => /פטרייה/.test(w))).toBe(true);
  });
  it("food chains: the arrow points from the food to the animal that eats it (energy flow), not “eats”", () => {
    const [en, he] = question(foodChains, "In the food chain");
    expect(en[1]).toMatch(/Energy passes from the grass to the rabbit/);
    expect(he[1]).toContain("האנרגיה עוברת מהעשב אל הארנב");
    expect(en[2].some((w) => /means “eats”/.test(w))).toBe(true);
  });
  it("food chains: the energy-pyramid question says secondary consumers (two steps up), in the right words", () => {
    const [en, he] = question(foodChains, "Plants hold 10,000");
    expect(en[0]).toContain("secondary consumers");
    expect(en[3]).toContain("primary consumers");
    expect(he[0]).toContain("מדרגה שנייה");
    expect(he[3]).toContain("מדרגה ראשונה");
  });
  it("habitats: the myna question no longer states a decade it was brought in", () => {
    const [en, he] = question(habitats, "The common myna");
    expect(en[0]).not.toMatch(/19\d0s/);
    expect(he[0]).not.toMatch(/שנות ה־\d+/);
    expect(en[0]).toContain("southern Asia");
  });
  it("heart: the Hebrew chambers question asks for חללים, not חדרים (חדרים are the two ventricles)", () => {
    const [en, he] = question(heartBlood, "How many chambers");
    expect(en[1]).toBe("4");
    expect(he[1]).toBe("4");
    expect(he[0]).toContain("חללים");
    expect(he[0]).not.toContain("חדרים");
    expect(he[3]).toContain("שתי עליות");
    expect(he[3]).toContain("שני חדרים");
  });
  it("heart: the blood question asks for a part of the blood (plasma and platelets are not cells)", () => {
    const [en, he] = question(heartBlood, "Which part of the blood helps");
    expect(en[1]).toBe("White blood cells");
    expect(he[0]).toContain("איזה חלק בדם");
    expect(en[2].some((w) => /^Plasma/.test(w))).toBe(true);
  });
  it("heart: the pulmonary artery is the answer; the aorta, the pulmonary vein and the vena cava are the wrong options", () => {
    const [en] = question(heartBlood, "Which vessel carries oxygen-poor blood");
    expect(en[1]).toBe("The pulmonary artery");
    expect(en[2].map((w) => w.split(",")[0])).toEqual(["The aorta", "The pulmonary vein", "The vena cava"]);
  });
  it("genetics: chimpanzees really have 48 chromosomes, and the wrong options do not give away that the answer is 46", () => {
    const [en, he] = question(genetics, "How many chromosomes are in a typical human body cell");
    expect(en[1]).toBe("46 (23 pairs)");
    expect(en[2].some((w) => w.startsWith("48"))).toBe(true);
    for (const w of [...en[2], ...he[2]]) expect(w.includes("46"), w).toBe(false);
  });
  it("habitats: the camel's hump holds fat, not water (the myth is a wrong option and is corrected)", () => {
    const [en, he] = question(habitats, "How is a camel adapted");
    expect(en[2].some((w) => /hump/.test(w))).toBe(true);
    expect(en[3]).toMatch(/fat, not water/);
    expect(he[3]).toContain("שומן ולא מים");
  });
  it("bones, lungs and nerves: the diaphragm flattens when we breathe in; the ribs protect the heart and lungs", () => {
    const [en] = question(humanBody, "When you breathe in, what does the diaphragm do");
    expect(en[1]).toMatch(/contracts and flattens/);
    expect(question(humanBody, "What do the ribs protect")[0][1]).toBe("The heart and lungs");
  });
  it("forces: a ball stops because of friction, not because it “uses up” its push (inertia)", () => {
    const [en] = question(forces, "A ball rolls across the grass");
    expect(en[1]).toMatch(/^Friction/);
    expect(en[2].some((w) => /uses up the push/.test(w))).toBe(true);
  });
});
