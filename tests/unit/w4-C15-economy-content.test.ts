import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C15: seven economy topics (great economists, price elasticity, starting a small business, public goods and
 * externalities, financial crises, GDP, goods and services) are held to the Plus and Pro collection's bar, even
 * "Starting a small business", which belongs to the original library: every level has 8+ items, 4+ of them questions,
 * numbers or orderings, every answer is explained in 40+ characters, and the right answer is the longest option in at
 * most 40 % of the questions in each language. "Starting a small business" had two questions per level and gave the answer
 * away by its length in half of its Hebrew questions. Choice options that carry numbers must carry the same numbers in
 * English and Hebrew, and a numeric right answer must be worked out in its explanation.
 */

const IDS = [
  "econ-economic-thinkers", "econ-elasticity", "econ-entrepreneurship", "econ-externalities",
  "econ-financial-crises", "econ-gdp", "econ-goods-services",
] as const;
const LEVELS = ["b", "i", "a"] as const;
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")).sort();

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

describe("economy topics (C15)", () => {
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
      expect(longest / all, `${id} ${lang ? "he" : "en"}: ${longest} of ${all}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: options carry the same numbers in English and Hebrew, and a numeric answer is worked out", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      expect(numbersIn(he[1]), `${id}/${l}: ${en[0]}`).toEqual(numbersIn(en[1]));
      en[2].forEach((w, i) => expect(numbersIn(he[2][i]!), `${id}/${l}: ${w}`).toEqual(numbersIn(w)));
      for (const [q, answer, , explanation] of [en, he]) for (const n of numbersIn(answer)) expect(explanation, `${id}/${l}: ${q}`).toContain(n);
    }
  });

  it.each(IDS)("%s: Hebrew text has no < or > (a right-to-left line mirrors them)", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const he = [
        ...(lv.t ?? []).flatMap((t) => [t[2], t[3]]),
        ...(lv.q ?? []).flatMap(([, h]) => [h[0], h[1], ...h[2], h[3], ...(h[4] ? [h[4]] : [])]),
        ...(lv.n ?? []).flatMap(([, , h]) => [h[0], h[1], h[2], ...(h[3] ? [h[3]] : [])]),
        ...(lv.s ?? []).flatMap(([, h]) => h),
      ];
      for (const s of he) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
    }
  });

  it("starting a small business: the break-even question agrees with the break-even number item", async () => {
    const c = await load("econ-entrepreneurship");
    const [answer, en] = c.a.n![0]!;
    expect(en[0]).toContain("300 ₪");
    expect(answer).toBe(300 / (15 - 5));
    const moved = c.a.q!.find(([e]) => e[0].includes("break-even point"))!;
    expect(moved[0][1]).toBe(`It rises from ${answer} to ${400 / (15 - 5)} bracelets`);
  });
});
