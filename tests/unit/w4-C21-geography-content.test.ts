import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C21: seven geography topics (islands, Israel's cities, climate, nature reserves and water, the geography of
 * Israel, lakes). "The geography of Israel" (a free topic of the original library) had only two questions per level and
 * gave its answer away by length in 5 of 6 English and 4 of 6 Hebrew questions. It gained a question and a number or an
 * ordering at each level, and its shortest wrong options were rewritten into real misconceptions: warm water lifts a
 * swimmer, the coast is rainiest because it is by the sea, sinkholes swallow the Dead Sea, the Kinneret still supplies most
 * of the drinking water. Its Hebrew definition of a makhtesh said "בקע" (a rift) and now says a closed valley. The lakes
 * topic put the Dead Sea at 430 m below sea level; it was 439.78 m in 2025, so the sum now uses 440 m (answer 230).
 * The answer keys of the existing choice questions did not move.
 */

const IDS = ["geo-islands", "geo-israel-cities", "geo-israel-climate", "geo-israel-nature", "geo-israel-water", "geo-israel", "geo-lakes"] as const;
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

describe("geography topics (C21)", () => {
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

  it.each(IDS)("%s: 8+ items per level, 4+ of them played; every answer is explained in 40+ characters; no < or > in Hebrew", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      for (const pair of lv.q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect(explanation.includes(String(answer)) || explanation.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${q}`).toBe(true);
      }
      for (const [, he] of lv.q ?? []) for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      for (const [, , he] of lv.n ?? []) for (const s of [he[0], he[2]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
    }
  });

  it("the geography of Israel: the answer keys stayed and the new wrong options are real misconceptions", async () => {
    const c = await load("geo-israel");
    const float = question(c, "float so easily");
    expect(float[0][1]).toBe("The very salty water is much denser than the body");
    expect(float[0][2][0]).toMatch(/warm water/);
    const rain = question(c, "gets the most rain");
    expect(rain[0][1]).toBe("The north, especially the Upper Galilee and the Golan");
    expect(rain[1][1]).toBe("הצפון, בעיקר הגליל העליון והגולן");
    const level = question(c, "water level falling");
    expect(level[0][1]).toMatch(/^Most of the Jordan's water/);
    expect(level[0][2][0]).toMatch(/Sinkholes/);
    expect(level[0][3]).toMatch(/result of the falling level/);
    const drinking = question(c, "drinking water come from");
    expect(drinking[0][1]).toBe("Desalination of seawater");
    expect(drinking[1][1]).toBe("מהתפלת מי ים");
    // Every level is a full topic now: two questions and one more played item at least.
    expect(c.b.s?.[0]?.[0]).toEqual(["These places, from north to south", "Mount Hermon", "The Sea of Galilee", "The Dead Sea", "Ramon Crater", "Eilat"]);
    expect(c.i.n?.[0]?.[0]).toBe(960);
    expect(question(c, "fresh, while the Dead Sea is so salty")[0][1]).toMatch(/has an outlet/);
    expect(question(c, "earthquakes")[0][1]).toMatch(/plates slide past each other/);
  });

  it("the geography of Israel: a makhtesh is a closed valley, not a rift (בקע)", async () => {
    const c = await load("geo-israel");
    const makhtesh = c.a.t?.find(([en]) => en === "Makhtesh");
    expect(makhtesh?.[3]).toMatch(/^עמק סגור/);
    expect(makhtesh?.[3]).not.toMatch(/בקע/);
    expect(makhtesh?.[1]).toMatch(/closed valley/);
  });

  it("lakes: the Dead Sea sum uses today's level, about 440 m below sea level", async () => {
    const c = await load("geo-lakes");
    const item = c.i.n?.find(([, en]) => en[0].includes("Dead Sea"));
    expect(item?.[0]).toBe(230);
    expect(item?.[1][0]).toContain("440 m below");
    expect(item?.[2][0]).toContain("כ־440 מטר");
  });

  it("climate: the English wrong options say what the Hebrew ones say", async () => {
    const c = await load("geo-israel-climate");
    expect(question(c, "drink plenty of water")[0][2][0]).toBe("Drinking water helps the hot wind stop blowing sooner");
    expect(question(c, "Frost is rare")[0][2][1]).toMatch(/so frost reaches only the Negev$/);
  });
});
