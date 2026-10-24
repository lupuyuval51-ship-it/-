import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C10: seven computing topics (GPS, inside the computer, the history of the internet, internet safety, how the
 * internet works, sensors and smart devices, technology made in Israel) are held to the Plus and Pro collection's bar,
 * also the four that belong to the original library. Before this wave "inside the computer", "internet safety" and "how
 * the internet works" had only two questions per level (six items), three explanations were shorter than 40 characters
 * ("100 ÷ 20 = 5 seconds."), and the right answer was the longest option in 50 % (hardware), 83 % (internet safety, how
 * the internet works) and 62–69 % (smart devices) of the questions. The smart-thermometer count ("every 15 minutes, how
 * many measurements in 2 hours?") had two defensible answers, 8 or 9, depending on whether a reading is taken at the
 * start; it now says when the first one is taken. The number facts the questions state are checked by calculating them.
 */

const IDS = ["cs-gps", "cs-hardware", "cs-internet-history", "cs-internet-safety", "cs-internet", "cs-iot", "cs-israeli-tech"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Every Hebrew string of a topic that the game shows. */
function hebrewTexts(c: TopicContent): string[] {
  const out: string[] = [];
  for (const l of LEVELS) {
    const lv = c[l];
    for (const t of lv.t ?? []) out.push(t[2], t[3]);
    for (const [, he] of lv.q ?? []) out.push(he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : []));
    for (const [, , he] of lv.n ?? []) out.push(he[0], he[1], he[2], ...(he[3] ? [he[3]] : []));
    for (const [, he] of lv.s ?? []) out.push(...he);
  }
  return out;
}

/** The number item whose English question contains `text`. */
function numberItem(c: TopicContent, l: (typeof LEVELS)[number], text: string) {
  const item = (c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!item) throw new Error(`no number item "${text}" at ${l}`);
  return item;
}
const numberAnswer = (c: TopicContent, l: (typeof LEVELS)[number], text: string) => numberItem(c, l, text)[0];

/** The question (en, he) whose English prompt starts with `text`. */
function question(c: TopicContent, l: (typeof LEVELS)[number], text: string) {
  const q = (c[l].q ?? []).find(([en]) => en[0].startsWith(text));
  if (!q) throw new Error(`no question "${text}" at ${l}`);
  return q;
}

describe("computing topics (C10)", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
  });

  it.each(IDS)("%s: 8+ items per level, 4+ of them questions, numbers or orderings", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(IDS)("%s: every answer is explained in 40+ characters, in both languages", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) {
        for (const [q, , explanation] of [en, he]) {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(explanation.includes(String(answer)) || explanation.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${q}`).toBe(true);
        }
      }
    }
  });

  it.each(IDS)("%s: the right answer is the longest option in at most 40 % of the questions, per language", async (id) => {
    const c = await load(id);
    for (const lang of [0, 1] as const) {
      let all = 0, longest = 0;
      for (const l of LEVELS) for (const pair of c[l].q ?? []) {
        const [, answer, wrong] = pair[lang];
        all++;
        if (answer.length > Math.max(...wrong.map((w) => w.length))) longest++;
      }
      expect(longest / all, `${id} ${lang ? "he" : "en"}: ${longest}/${all}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: both languages offer the same number of wrong options, and no Hebrew text uses < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
    for (const s of hebrewTexts(c)) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
  });

  it("the number facts are right", async () => {
    const gps = await load("cs-gps");
    expect(numberAnswer(gps, "b", "North Pole")).toBe(90);
    expect(numberAnswer(gps, "i", "one millionth of a second")).toBe(300_000_000 * 0.000001);
    expect(numberAnswer(gps, "a", "20,000 km away")).toBe(Math.round((20_000 / 300_000) * 1_000));
    expect(numberAnswer(gps, "a", "3 degrees of latitude")).toBe(3 * 111);

    const hardware = await load("cs-hardware");
    expect(numberAnswer(hardware, "a", "4 cores")).toBe(8 / 4);

    const history = await load("cs-internet-history");
    expect(numberAnswer(history, "b", "end of 1969")).toBe(["UCLA", "SRI", "UCSB", "Utah"].length);
    expect(numberAnswer(history, "i", "560-kilobit")).toBe(560 / 56);
    expect(numberAnswer(history, "a", "128 bits")).toBe(128 / 32);

    const safety = await load("cs-internet-safety");
    expect(numberAnswer(safety, "a", "4 digits")).toBe(10 ** 4);

    const internet = await load("cs-internet");
    expect(numberAnswer(internet, "a", "10-megabyte file")).toBe((10 * 8) / 40);
    // The multiple-choice transfer time: 100 megabits at 20 megabits per second.
    expect(question(internet, "a", "A file is 100 megabits")[0][1]).toBe(`${100 / 20} seconds`);

    const iot = await load("cs-iot");
    expect(numberAnswer(iot, "i", "every 15 minutes")).toBe(120 / 15);
    expect(numberAnswer(iot, "a", "battery lasts 50 days")).toBe(50 * 2);

    const israel = await load("cs-israeli-tech");
    expect(numberAnswer(israel, "b", "founded in 1948")).toBe(1955 - 1948);
    expect(numberAnswer(israel, "a", "DiskOnKey went on sale")).toBe(2000 - 1955);
    // USSR 1957, USA 1958, France 1965, Japan 1970, China 1970, UK 1971, India 1980, then Israel 1988.
    expect(numberAnswer(israel, "i", "Ofek-1")).toBe(["USSR", "USA", "France", "Japan", "China", "UK", "India", "Israel"].length);
  });

  it("the smart-thermometer count has one answer: the question says when the first reading is taken", async () => {
    const iot = await load("cs-iot");
    const [answer, en, he] = numberItem(iot, "i", "every 15 minutes");
    expect(en[0]).toMatch(/first time 15 minutes after/);
    expect(he[0]).toMatch(/בפעם הראשונה 15 דקות אחרי/);
    // readings at 15, 30, …, 120 minutes
    const readings = Array.from({ length: 120 / 15 }, (_, k) => 15 * (k + 1));
    expect(readings.at(-1)).toBe(120);
    expect(answer).toBe(readings.length);
  });

  it("a distractor about a common misconception comes first, where the warm-up keeps it", async () => {
    // The two-option warm-up keeps the first wrong option, so it is the most plausible one, not a joke option.
    const hardware = await load("cs-hardware");
    expect(question(hardware, "i", "You want a photo to stay safe")[0][2][0]).toMatch(/^In RAM/);
    expect(question(hardware, "i", "You want a photo to stay safe")[1][2][0]).toMatch(/RAM/);
    expect(question(hardware, "a", "Why does a computer with more RAM")[0][2][0]).toMatch(/clock speed/);
    const safety = await load("cs-internet-safety");
    expect(question(safety, "a", "What does the padlock")[0][2][0]).toMatch(/definitely honest/);
    const internet = await load("cs-internet");
    expect(question(internet, "a", "In an online game")[0][2][0]).toMatch(/^Low bandwidth/);
    expect(question(internet, "b", "Is Wi-Fi the same")[0][2][0]).toMatch(/another name for the internet/);
  });
});
