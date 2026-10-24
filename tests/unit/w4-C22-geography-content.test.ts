import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C22: seven geography topics (landforms and coasts, map projections, maps and directions, the Negev and Eilat,
 * the Nordic countries, North and Central America, northern Israel). "Landforms and coasts" gave its answer away by length
 * in 4 of its 7 questions in both languages; two short wrong options became real misconceptions (waves carved the fjords,
 * a meteorite blasted out Makhtesh Ramon). "Landforms and coasts" and "Maps and directions" had only two questions per level
 * and now meet the collection's bar (8+ items, 4+ of them questions, numbers or orderings): cliffs and peninsulas, oases and
 * delta soil, the blue line and the compass order, latitude and map scale, GPS and the length of a degree. The Norway
 * capital question offers Helsinki instead of Madrid. No answer key moved.
 */

const IDS = ["geo-landforms", "geo-map-projections", "geo-maps", "geo-negev-eilat", "geo-nordic", "geo-north-america", "geo-northern-israel"] as const;
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

describe("geography topics (C22)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters; Hebrew has no < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect(explanation.includes(String(answer)) || explanation.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${q}`).toBe(true);
      }
      for (const [, he] of c[l].q ?? []) for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
    }
  });

  it("landforms: the rewritten misconceptions stay wrong and the answers did not move", async () => {
    const c = await load("geo-landforms");
    const fjord = question(c, "fjords. What carved them");
    expect(fjord[0][1]).toBe("Glaciers during the ice ages");
    expect(fjord[1][1]).toBe("קרחונים בתקופות הקרח");
    expect(fjord[0][2]).toContain("Ocean waves pounding the coast for millions of years");
    const ramon = question(c, "How did Makhtesh Ramon form");
    expect(ramon[0][1]).toBe("Water slowly washed away soft rock that lay under a harder top layer");
    expect(ramon[0][2].some((w) => w.includes("meteorite"))).toBe(true);
    expect(ramon[1][2].some((w) => w.includes("מטאוריט"))).toBe(true);
    // The meteorite story is the misconception the term itself corrects.
    expect(c.a.t!.find(([en]) => en === "Makhtesh")![1]).toContain("not by a meteorite");
  });

  it("landforms and maps: the new questions have one right answer, kept in step in he and en", async () => {
    const land = await load("geo-landforms");
    const maps = await load("geo-maps");
    const checks: [TopicContent, string, string, string][] = [
      [land, "waves smashing into a rocky coast", "A steep cliff", "מצוק תלול"],
      [land, "water on three sides", "A peninsula", "חצי אי"],
      [land, "date palms grow at an oasis", "There is water from a spring or a well", "יש שם מים ממעיין או מבאר"],
      [land, "soil of a river delta", "The river leaves rich mud there", "הנהר משאיר שם בוץ עשיר"],
      [maps, "blue line", "A river or stream", "נהר או נחל"],
      [maps, "Tel Aviv lies at a latitude", "It is north of the equator", "שהיא מצפון לקו המשווה"],
      [maps, "GPS satellites", "At least 4", "מ־4 לפחות"],
    ];
    for (const [c, text, en, he] of checks) {
      const [e, h] = question(c, text);
      expect(e[1], text).toBe(en);
      expect(h[1], text).toBe(he);
      expect(e[2].length, text).toBe(h[2].length);
      expect(e[2], text).not.toContain(en);
      expect(h[2], text).not.toContain(he);
    }
    // A peninsula is joined to the mainland; an island is not, so "An island" stays a wrong option.
    expect(question(land, "water on three sides")[0][2]).toContain("An island");
  });

  it("maps: the compass ordering and the new numbers are right", async () => {
    const c = await load("geo-maps");
    expect(c.b.s?.[0]?.[0].slice(1)).toEqual(["North", "East", "South", "West"]);
    expect(c.b.s?.[0]?.[1].slice(1)).toEqual(["צפון", "מזרח", "דרום", "מערב"]);
    // 1:100,000 → 1 cm is 100,000 cm = 1 km; 5 cm → 5 km.
    const scale = c.i.n!.find(([, en]) => en[0].includes("1:100,000"))!;
    expect(scale[0]).toBe((5 * 100_000) / 100_000);
    // 10 degrees of latitude × about 111 km.
    const degree = c.a.n!.find(([, en]) => en[0].includes("10° north"))!;
    expect(degree[0]).toBe(10 * 111);
    // Tel Aviv at 32° N is 90 − 32 = 58° from the North Pole, as the explanation says.
    expect(question(c, "Tel Aviv")[0][3]).toContain(`${90 - 32}°`);
  });

  it("nordic: the Norway capital question offers another Nordic capital, and Oslo stays the answer", async () => {
    const c = await load("geo-nordic");
    const [en, he] = question(c, "capital of Norway");
    expect(en[1]).toBe("Oslo");
    expect(he[1]).toBe("אוסלו");
    expect(en[2]).toEqual(["Bergen", "Stockholm", "Helsinki"]);
    expect(he[2]).toEqual(["ברגן", "סטוקהולם", "הלסינקי"]);
    expect(en[3]).toContain("Helsinki");
    expect(he[3]).toContain("הלסינקי");
  });
});
