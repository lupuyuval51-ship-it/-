import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, C24: seven topics (South America, time zones, world landmarks, animals and stings, cycling and e-scooters,
 * bullying, caffeine). Every fact was re-checked; no answer key moved. "Famous landmarks" had only three questions at the
 * beginner level and a numeric explanation of 17 characters: it gains a Great Wall question (with the "seen from the Moon"
 * myth as a wrong option) and an explained sum. Two silly wrong options of the caffeine heart question became real
 * misconceptions (caffeine "dries out" the heart, the bubbles squeeze it), the e-scooter passenger question no longer
 * speaks of a seat (an e-scooter has none), and a Hebrew time-zone explanation says "official times" instead of "time
 * clocks".
 */

const IDS = ["geo-south-america", "geo-time-zones", "geo-world-landmarks", "health-animal-safety", "health-bike-scooter", "health-bullying", "health-caffeine"] as const;
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

describe("geography and health topics (C24)", () => {
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
      for (const pair of c[l].q ?? []) {
        expect(pair[0][2].length, `${id}/${l}: ${pair[0][0]}`).toBe(pair[1][2].length);
        for (const [q, answer, wrong, explanation] of pair) {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(new Set([answer, ...wrong]).size, `${id}/${l}: ${q}`).toBe(wrong.length + 1);
        }
        for (const s of [pair[1][0], pair[1][1], ...pair[1][2], pair[1][3]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect(explanation, `${id}/${l}: ${q}`).toContain(String(answer));
      }
    }
  });

  it("landmarks: the Great Wall was built against attackers from the north; the Moon myth is a wrong option", async () => {
    const [en, he] = question(await load("geo-world-landmarks"), "Great Wall of China built");
    expect(en[1]).toBe("To protect China from attackers coming from the north");
    expect(en[2]).toContain("So that it could be seen from the Moon");
    expect(en[3]).toMatch(/cannot be seen from the Moon/);
    expect(he[1]).toBe("כדי להגן על סין מפני תוקפים שהגיעו מהצפון");
    expect(he[2]).toContain("כדי שאפשר יהיה לראות אותה מהירח");
  });

  it("landmarks: the torch of the Statue of Liberty is 93 metres up, and the sum is explained", async () => {
    const [answer, en, he] = (await load("geo-world-landmarks")).a.n![0]!;
    expect(answer).toBe(93);
    expect(en[2]).toContain("46 + 47 = 93");
    expect(he[2]).toContain("46 + 47 = 93");
  });

  it("caffeine: the energy drink and heart question keeps its answer and offers real misconceptions", async () => {
    const [en, he] = question(await load("health-caffeine"), "before hard sport");
    expect(en[1]).toBe("Caffeine raises heart rate and blood pressure on top of the effort of exercise");
    expect(en[2].join(" ")).not.toMatch(/explodes|turns the muscles into heart muscle/);
    expect(en[2][0]).toMatch(/dries out/);
    expect(he[1]).toBe("הקפאין מעלה את הדופק ואת לחץ הדם, בנוסף למאמץ של הפעילות");
    expect(he[2].join(" ")).not.toMatch(/מתפרץ|לשריר לב/);
  });

  it("e-scooter: the passenger question keeps its answer and does not speak of a seat", async () => {
    const [en, he] = question(await load("health-bike-scooter"), "passenger on an electric scooter");
    expect(en[1]).toBe("The extra weight makes braking longer and steering much harder");
    expect(en[2].join(" ")).not.toMatch(/seat/i);
    expect(he[2].join(" ")).not.toMatch(/מושב/);
  });

  it("time zones: the Hebrew explanation of the 24 zones speaks of official times", async () => {
    const [answer, , he] = (await load("geo-time-zones")).b.n![0]!;
    expect(answer).toBe(24);
    expect(he[2]).not.toContain("שעוני זמן");
    expect(he[2]).toContain("זמנים רשמיים");
  });
});
