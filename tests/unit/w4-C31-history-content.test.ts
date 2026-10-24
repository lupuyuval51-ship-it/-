import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C31: seven history topics (the age of exploration, feudal Japan, food through history, the French Revolution,
 * the Islamic Golden Age, the Hebrew revival and the Industrial Revolution) are held to the Plus and Pro collection's bar,
 * also the three that belong to the original library. Before this wave exploration and the Industrial Revolution gave the
 * answer away by its length in 5 of their 6 questions (83 %) and had only two challenges per level, and the Golden Age did
 * in 64 % (English) and 57 % (Hebrew). Now every level has 8+ items, 4+ of them questions, numbers or orderings, every
 * answer is explained in 40+ characters, the right answer is the longest option in at most 40 % of the questions per
 * language, and no Hebrew text has "<" or ">". The number facts the questions state are checked by calculating them.
 */

const IDS = [
  "history-exploration", "history-feudal-japan", "history-food", "history-french-revolution",
  "history-golden-age-islam", "history-hebrew-revival", "history-industrial-revolution",
] as const;
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

/** The answer of the number item whose English question contains `text`. */
function numberAnswer(c: TopicContent, l: (typeof LEVELS)[number], text: string): number {
  const item = (c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!item) throw new Error(`no number item "${text}" at ${l}`);
  return item[0];
}

/** The [en, he] question whose English text starts with `start`. */
function question(c: TopicContent, l: (typeof LEVELS)[number], start: string) {
  const q = (c[l].q ?? []).find(([en]) => en[0].startsWith(start));
  if (!q) throw new Error(`no question "${start}" at ${l}`);
  return q;
}

describe("history topics (C31)", () => {
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
    const exploration = await load("history-exploration");
    expect(numberAnswer(exploration, "b", "first voyage")).toBe(["Niña", "Pinta", "Santa María"].length);
    expect(numberAnswer(exploration, "i", "Vasco da Gama reached India in 1498")).toBe(1498 - 1492);
    expect(numberAnswer(exploration, "a", "360 degrees in 24 hours")).toBe(360 / 24);

    const industry = await load("history-industrial-revolution");
    expect(numberAnswer(industry, "a", "about 1.5 hours")).toBe(12 / 1.5);

    const islam = await load("history-golden-age-islam");
    expect(numberAnswer(islam, "i", "founded in 762")).toBe(1258 - 762);
    expect(numberAnswer(islam, "a", "820 and 1085")).toBe(1085 - 820);

    const japan = await load("history-feudal-japan");
    expect(numberAnswer(japan, "i", "1603 to 1868")).toBe(1868 - 1603);
    expect(numberAnswer(japan, "a", "arrived in 1853")).toBe(1868 - 1853);

    const france = await load("history-french-revolution");
    expect(numberAnswer(france, "i", "since 1614")).toBe(1789 - 1614);
    expect(numberAnswer(france, "a", "seized power in 1799")).toBe(1799 - 1789);

    const hebrew = await load("history-hebrew-revival");
    expect(numberAnswer(hebrew, "i", "founded in 1890")).toBe(1953 - 1890);
    expect(numberAnswer(hebrew, "a", "died in 1922")).toBe(1959 - 1922);
  });

  it("the most plausible distractor is a real misconception, and the explanation answers it", async () => {
    // The warm-up and the automatic hint use the third shown option, so the misconception comes first.
    const exploration = await load("history-exploration");
    const routes = question(exploration, "i", "Why did Europeans look for new sea routes");
    expect(routes[0][2][0]).toMatch(/Earth was round/);
    expect(routes[0][3]).toMatch(/already knew that the Earth is round/);
    const magellan = question(exploration, "i", "Magellan's expedition proved");
    expect(magellan[0][2][0]).toMatch(/smaller/);

    const islam = await load("history-golden-age-islam");
    const paper = question(islam, "b", "Why did paper help knowledge");
    expect(paper[0][2][0]).toMatch(/lasted much longer than parchment/);
    expect(paper[0][3]).toMatch(/Parchment actually lasts longer/);
    expect(paper[1][3]).toMatch(/הקלף מחזיק מעמד/);
    const numerals = question(islam, "i", "Why were the Hindu-Arabic numerals");
    expect(numerals[0][2][0]).toMatch(/same value/);

    const industry = await load("history-industrial-revolution");
    const watt = question(industry, "i", "Who greatly improved the steam engine");
    expect(watt[0][2][0]).toBe("Thomas Newcomen");
    expect(watt[0][3]).toMatch(/Newcomen/);
  });

  it("Hebrew wording that was wrong or inconsistent stays fixed", async () => {
    const industry = await load("history-industrial-revolution");
    // "נקיות מהכפרים" reads as "free of villages"; the option means "cleaner than the villages"
    expect(hebrewTexts(industry).some((s) => s.includes("נקיות מהכפרים"))).toBe(false);
    expect(question(industry, "i", "Why did cities grow so fast")[1][2][0]).toContain("נקיות ובריאות יותר מהכפרים");

    // the food topic names the Columbian Exchange the same way in its term and in its number question
    const food = await load("history-food");
    const term = (food.i.t ?? []).find(([en]) => en === "Columbian Exchange");
    expect(term?.[2]).toBe("ההחלפה הקולומביאנית");
    const year = (food.i.n ?? []).find(([answer]) => answer === 1492);
    expect(year?.[2][0]).toContain(term![2]);
  });
});
