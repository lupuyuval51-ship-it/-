import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C20: seven geography topics (capitals of Asia and Africa, capitals of Europe, climate zones, continents and
 * oceans, deserts, forests, grasslands). "Climate zones" gave its answer away by length in 5 of its 6 questions, "Deserts"
 * in 10 of 14 and "Continents and oceans" in 3 of 7 Hebrew questions; their shortest wrong options were rewritten into real
 * misconceptions (Australia is nearer the sun, the Judean Desert is too low for rain, Britain's mountains block the Arctic
 * wind, Makhtesh Ramon is a meteorite crater or a collapsed volcano, the mirage is a drying spring, the Atacama is too near
 * the equator, ocean waves carved matching coasts, Greenland's meltwater widens the Atlantic). "Climate zones" also had only
 * two questions per level and gained a question and a number or an ordering at each; the Danube question now offers the
 * capitals people really confuse (Bucharest, Prague, Warsaw) instead of Paris, Madrid and Lisbon. The answer keys did not move.
 */

const IDS = ["geo-capitals-asia-africa", "geo-capitals-europe", "geo-climate-zones", "geo-continents-oceans", "geo-deserts", "geo-forests", "geo-grasslands"] as const;
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

describe("geography topics (C20)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters; Hebrew has no < or > and no ? blank", async (id) => {
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

  it("climate zones has a full level of content at every level", async () => {
    const c = await load("geo-climate-zones");
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, l).toBeGreaterThanOrEqual(8);
      expect(items, l).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps the answer keys of the rewritten questions", async () => {
    const climate = await load("geo-climate-zones");
    const deserts = await load("geo-deserts");
    const continents = await load("geo-continents-oceans");
    const keys: [TopicContent, string, string, string][] = [
      [climate, "summer in Australia", "The two places are in different hemispheres, tilted towards the sun at opposite times", "הן נמצאות בחצאי כדור שונים, שנוטים לכיוון השמש בזמנים הפוכים"],
      [climate, "Kilimanjaro", "It is very high, and air gets colder with altitude", "הוא גבוה מאוד, והאוויר מתקרר ככל שעולים"],
      [climate, "Judean Desert", "It lies in the rain shadow: air loses its moisture over the hills and sinks warm and dry", "הוא נמצא בצל גשם: האוויר מאבד את לחותו מעל ההרים ויורד חם ויבש"],
      [climate, "Edinburgh and Moscow", "Moscow is far from the sea, and land cools much faster than water", "מוסקבה רחוקה מהים, והיבשה מתקררת הרבה יותר מהר מהמים"],
      [deserts, "Makhtesh Ramon", "A huge valley with steep walls that was carved out by erosion", "עמק ענקי עם קירות תלולים שנוצר בתהליך של סחיפה"],
      [deserts, "The Atacama", "A cold ocean current cools the air, which makes fog but almost no rain", "זרם ים קר מקרר את האוויר, וכך נוצר ערפל אבל כמעט שום גשם"],
      [continents, "puzzle pieces", "They were once joined and drifted apart", "פעם הן היו מחוברות והתרחקו זו מזו"],
    ];
    for (const [c, text, en, he] of keys) {
      const [e, h] = question(c, text);
      expect(e[1], text).toBe(en);
      expect(h[1], text).toBe(he);
      expect(e[2].length, text).toBe(h[2].length);
    }
  });

  it("the Danube question has one right answer: none of the wrong options lies on the Danube", async () => {
    const [en, he] = question(await load("geo-capitals-europe"), "River Danube");
    expect(en[1]).toBe("Budapest");
    expect(he[1]).toBe("בודפשט");
    for (const w of en[2]) expect(["Vienna", "Bratislava", "Belgrade", "Budapest"]).not.toContain(w);
    expect(en[2]).toContain("Bucharest");
  });

  it("the altitude number adds up: 25 °C minus 6.5 degrees per 1,000 m over 2,000 m", async () => {
    const [n] = (await load("geo-climate-zones")).i.n!;
    expect(n![0]).toBe(25 - 2 * 6.5);
  });

  it("the Tokyo clock question says the gap shrinks to 6 hours in Israel's summer time", async () => {
    const [n] = (await load("geo-capitals-asia-africa")).i.n!;
    expect(n![0]).toBe(17);
    expect(n![1][2]).toContain("6 hours");
    expect(n![2][2]).toContain("6 שעות");
  });
});
