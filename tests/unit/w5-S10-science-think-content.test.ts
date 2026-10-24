import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import sound from "@/lib/game/topics/content/science-sound";
import starsGalaxies from "@/lib/game/topics/content/science-stars-galaxies";
import statesOfMatter from "@/lib/game/topics/content/science-states-of-matter";
import staticElectricity from "@/lib/game/topics/content/science-static-electricity";
import tidesCurrents from "@/lib/game/topics/content/science-tides-currents";
import waterCycle from "@/lib/game/topics/content/science-water-cycle";
import weather from "@/lib/game/topics/content/science-weather";
import analogies from "@/lib/game/topics/content/think-analogies";
import askingQuestions from "@/lib/game/topics/content/think-asking-questions";
import assertiveness from "@/lib/game/topics/content/think-assertiveness";

/**
 * Ten topics (seven science, three thinking skills) held to the collection's quality bar. Four of the science topics
 * (sound, states of matter, the water cycle, weather) were thin (two or three questions a level) and gave the right
 * answer away by its length in 43 to 67 % of their questions; the stars topic did it in 57 to 64 %. They now have more
 * questions, orderings and numbers, and in every topic the right answer is the strictly longest option in at most 40 %
 * of the choice questions, in each language.
 */
const TOPICS: Record<string, TopicContent> = {
  "science-sound": sound,
  "science-stars-galaxies": starsGalaxies,
  "science-states-of-matter": statesOfMatter,
  "science-static-electricity": staticElectricity,
  "science-tides-currents": tidesCurrents,
  "science-water-cycle": waterCycle,
  "science-weather": weather,
  "think-analogies": analogies,
  "think-asking-questions": askingQuestions,
  "think-assertiveness": assertiveness,
};
const LEVELS = ["b", "i", "a"] as const;
const levelsOf = (c: TopicContent): LevelContent[] => LEVELS.map((l) => c[l]);
const numbers = (c: TopicContent) => LEVELS.flatMap((l) => c[l].n ?? []);
const questions = (c: TopicContent) => LEVELS.flatMap((l) => c[l].q ?? []);

describe("S10 topics: answer length is not a tell", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: the right answer is the strictly longest option in at most 40 % of the questions, in each language`, () => {
      const longest = [0, 0];
      let all = 0;
      for (const pair of questions(content)) {
        all++;
        pair.forEach(([, answer, wrong], lang) => {
          if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
        });
      }
      expect(all, id).toBeGreaterThanOrEqual(12);
      expect(longest[0]! / all, `${id} en`).toBeLessThanOrEqual(0.4);
      expect(longest[1]! / all, `${id} he`).toBeLessThanOrEqual(0.4);
    });
  }
});

describe("S10 topics: the collection's quality bar", () => {
  for (const [id, content] of Object.entries(TOPICS)) {
    it(`${id}: 8+ pieces and 4+ items per level, explanations of 40+ characters, no "<" or ">" in Hebrew, both languages in step`, () => {
      for (const [at, lv] of levelsOf(content).entries()) {
        const where = `${id}/${LEVELS[at]}`;
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect((lv.t?.length ?? 0) + items, where).toBeGreaterThanOrEqual(8);
        expect(items, where).toBeGreaterThanOrEqual(4);
        for (const pair of lv.q ?? []) {
          for (const [q, , , explanation] of pair) expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(pair[0][2].length, `${where}: ${pair[0][0]}`).toBe(pair[1][2].length);
        }
        for (const [, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) expect(explanation.length, `${where}: ${q}`).toBeGreaterThanOrEqual(40);
        for (const [en, he] of lv.s ?? []) expect(en.length, `${where}: ${en[0]}`).toBe(he.length);
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

  it("no question lists the right answer among its wrong options, and no option repeats", () => {
    for (const [id, content] of Object.entries(TOPICS)) {
      for (const pair of questions(content)) {
        for (const [q, answer, wrong] of pair) {
          const keys = [answer, ...wrong].map((o) => o.trim().toLowerCase().replace(/\s+/g, " "));
          expect(new Set(keys).size, `${id}: ${q}`).toBe(keys.length);
        }
      }
    }
  });
});

describe("S10 topics: numeric items", () => {
  it("the sums behind the new number items hold", () => {
    // vibrations: 50 Hz for 2 s
    const vibrations = numbers(sound).find(([, en]) => en[0].includes("50 Hz"))!;
    expect(vibrations[0]).toBe(50 * 2);
    // wavelength = speed / frequency
    const wavelength = numbers(sound).find(([, en]) => en[0].includes("wavelength"))!;
    expect(wavelength[0]).toBe(340 / 170);
    // melting 5 g of ice at about 334 J per gram
    const melt = numbers(statesOfMatter).find(([, en]) => en[0].includes("334 joules"))!;
    expect(melt[0]).toBe(334 * 5);
    // 3 % of 1,000 buckets are fresh water
    const buckets = numbers(waterCycle).find(([, en]) => en[0].includes("1,000 buckets"))!;
    expect(buckets[0]).toBeCloseTo(1000 * (1 - 0.97), 5);
    // 30 °C at the beach, 6.5 °C colder per kilometre, 2 km up
    const mountain = numbers(weather).find(([, en]) => en[0].includes("6.5 °C"))!;
    expect(mountain[0]).toBe(30 - 2 * 6.5);
    // a front 120 km away at 40 km per hour
    const front = numbers(weather).find(([, en]) => en[0].includes("120 km"))!;
    expect(front[0]).toBe(120 / 40);
    // sunlight: 150 million km at 300,000 km per second
    const sunlight = numbers(starsGalaxies).find(([, en]) => en[0].includes("150 million"))!;
    expect(sunlight[0]).toBe(150_000_000 / 300_000);
    // the age of the universe when Earth formed
    const age = numbers(starsGalaxies).find(([, en]) => en[0].includes("13.8 billion"))!;
    expect(age[0]).toBeCloseTo(13.8 - 4.5, 5);
    // tides: 12 h 25 min
    expect(numbers(tidesCurrents).some(([a]) => a === 12 * 60 + 25)).toBe(true);
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

describe("S10 topics: wording that used to be wrong or ambiguous", () => {
  it("the galaxy question asks for the nearest large SPIRAL galaxy (the Magellanic Clouds are nearer but are dwarf galaxies)", () => {
    const q = questions(starsGalaxies).find(([en]) => en[1] === "The Andromeda Galaxy")!;
    expect(q[0][0]).toContain("spiral");
    expect(q[1][0]).toContain("ספירלית");
  });

  it("the black-hole answer says only that no light escapes, and the detection by its effects is in the explanation", () => {
    const q = questions(starsGalaxies).find(([en]) => en[0].includes("black hole directly"))!;
    expect(q[0][1]).toBe("No light can escape from it");
    expect(q[0][3]).toContain("effect");
  });

  it("the Sun is not said to help only 'a little' with the tides (its pull is almost half of the Moon's)", () => {
    const q = questions(tidesCurrents).find(([en]) => en[0] === "What mainly causes the tides?")!;
    expect(q[0][3]).not.toContain("a little");
  });

  it("the Hebrew weather vane is a 'שבשבת'", () => {
    const q = questions(weather).find(([en]) => en[0].includes("which way the wind is blowing"))!;
    expect(q[1][1]).toBe("שבשבת");
  });
});
