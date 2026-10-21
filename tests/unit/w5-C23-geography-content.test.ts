import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, C23: seven geography topics (polar regions, population, rainforests, the rift valley, rivers and mountains, seas
 * and straits, the seasons). Every fact was re-checked; no answer key moved. In "The polar regions" and "Rivers and
 * mountains" the right answer was the longest option in 60–67 % of the questions: the shortest wrong options became longer,
 * real misconceptions (the Arctic as land, distance from the Sun, storms hiding the polar sun, treaty "slices", volcanoes
 * raising the Himalayas, the Rockies' continent, the Yangtze and the Mississippi as "the longest"). "People and cities" and
 * "Rivers and mountains" had only two questions per level (the same two in every game): each level gains fact-checked
 * questions and numbers (the Jordan, Angel Falls, V-shaped valleys and deltas; Asia, Mongolia, birth rate, an ageing
 * population, growth in per cent), and a 37-character Hebrew density explanation now says how density is worked out.
 */

const IDS = ["geo-polar-regions", "geo-population", "geo-rainforests", "geo-rift-valley", "geo-rivers-mountains", "geo-seas-straits", "geo-seasons"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The question of a topic whose English text contains `text`. */
function question(c: TopicContent, text: string): Question {
  const found = LEVELS.flatMap((l) => c[l].q ?? []).find(([en]) => en[0].includes(text));
  if (!found) throw new Error(`no question with "${text}"`);
  return found;
}

describe("geography topics (C23)", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
  });

  it.each(IDS)("%s: the right answer is the longest option in at most 40 % of the questions, in each language", async (id) => {
    const c = await load(id);
    const longest = [0, 0], all = [0, 0];
    for (const l of LEVELS) for (const pair of c[l].q ?? []) pair.forEach(([, answer, wrong], lang) => {
      all[lang]!++;
      if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
    });
    expect(longest[0]! / all[0]!, `${id} en`).toBeLessThanOrEqual(0.4);
    expect(longest[1]! / all[1]!, `${id} he`).toBeLessThanOrEqual(0.4);
  });

  it.each(IDS)("%s: every level has 8+ items, 4+ of them questions, numbers or orderings", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(IDS)("%s: every answer and number is explained in 40+ characters, options are distinct, Hebrew has no < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(en[2].length, `${id}/${l}: ${en[0]}`).toBe(he[2].length);
        for (const [q, answer, wrong, explanation] of [en, he]) {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(new Set([answer, ...wrong]).size, `${id}/${l}: ${q}`).toBe(wrong.length + 1);
        }
        for (const s of [he[0], he[1], ...he[2], he[3]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [, en, he] of c[l].n ?? []) {
        expect(en[2].length, `${id}/${l}: ${en[0]}`).toBeGreaterThanOrEqual(40);
        expect(he[2].length, `${id}/${l}: ${he[0]}`).toBeGreaterThanOrEqual(40);
        for (const s of [he[0], he[1], he[2]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
    }
  });

  it("the polar regions keep their answers, with real misconceptions as the long wrong options", async () => {
    const c = await load("geo-polar-regions");
    const continent = question(c, "Which polar region is a continent?");
    expect([continent[0][1], continent[1][1]]).toEqual(["Antarctica", "אנטארקטיקה"]);
    expect(continent[0][2][0]).toContain("The Arctic");
    const cold = question(c, "Why is it so cold at the poles?");
    expect(cold[0][1]).toContain("never high in the sky");
    expect(cold[0][2][0]).toContain("farther away from the Sun");
    const treaty = question(c, "Antarctic Treaty");
    expect(treaty[0][1]).toContain("peace and science");
    expect(treaty[0][2][0]).toContain("divides Antarctica");
    expect(question(c, "emperor penguins")[0][1]).toContain("huddle together");
    expect(question(c, "South Pole the sun does not rise")[0][1]).toContain("tilted away");
  });

  it("rivers and mountains keep their answers and gain Israel's longest river, the Jordan's mouth, Angel Falls, valleys and deltas", async () => {
    const c = await load("geo-rivers-mountains");
    expect(question(c, "highest mountain on Earth")[0][1]).toBe("Mount Everest");
    const andes = question(c, "The Andes");
    expect([andes[0][1], andes[1][1]]).toEqual(["South America", "דרום אמריקה"]);
    expect(andes[0][2]).toContain("North America");
    const longest = question(c, "longest in the world");
    expect(longest[0][1]).toBe("The Nile and the Amazon");
    expect(longest[0][3]).toContain("Yangtze");
    expect([question(c, "longest river in Israel")[0][1], question(c, "longest river in Israel")[1][1]]).toEqual(["The Jordan River", "נהר הירדן"]);
    const mouth = question(c, "mouth of the Jordan");
    expect([mouth[0][1], mouth[1][1]]).toEqual(["In the Dead Sea", "בים המלח"]);
    expect(question(c, "Angel Falls")[0][1]).toBe("Venezuela");
    expect(question(c, "V-shaped valley")[0][1]).toContain("river");
    expect(question(c, "delta")[0][1]).toContain("slows down");
    expect(c.i.n?.[0]?.[0]).toBe(3);
  });

  it("people and cities: new questions and numbers are worked out correctly", async () => {
    const c = await load("geo-population");
    expect([question(c, "On which continent")[0][1], question(c, "On which continent")[1][1]]).toEqual(["Asia", "אסיה"]);
    expect([question(c, "lowest population densities")[0][1], question(c, "lowest population densities")[1][1]]).toEqual(["Mongolia", "מונגוליה"]);
    expect(question(c, "getting older")[0][1]).toContain("Fewer babies");
    expect(c.b.n?.[0]?.[0]).toBe(300 * 100);
    expect(c.i.n?.[0]?.[0]).toBe(600 / (50000 / 1000));
    expect(c.a.n?.[0]?.[0]).toBe(((2.5 - 2) / 2) * 100);
    expect(question(c, "population density?")[1][3]).toContain("חלקי השטח");
  });
});
