import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C14: seven economy topics (types of businesses, central banks, competition, consumer rights, crypto, world
 * currencies, economic systems) are held to the Plus and Pro collection's bar, even "World currencies", which belongs to
 * the original library: every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained
 * in 40+ characters, and the right answer is the longest option in at most 40 % of the questions in each language.
 * "World currencies" gave the answer away by its length in 6 of its 14 English and 7 of its Hebrew questions, and one
 * worked sum was explained in 22 characters. A few facts were made exact: before the Bank of Israel (1954) a commercial
 * bank issued the banknotes (the coins came from the government), the fourth Bitcoin halving (2024) cut the reward to
 * 3.125, and a euro country gives up its own interest rate but still sets its own taxes.
 */

const IDS = [
  "econ-business-types", "econ-central-bank", "econ-competition", "econ-consumer-rights",
  "econ-crypto", "econ-currencies", "econ-economic-systems",
] as const;
const LEVELS = ["b", "i", "a"] as const;
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")).sort();

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

const questions = (c: TopicContent): Question[] => LEVELS.flatMap((l) => [...(c[l].q ?? [])]);

describe("economy topics (C14)", () => {
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
      for (const pair of questions(c)) {
        const [, answer, wrong] = pair[lang];
        all++;
        if (answer.length > Math.max(...wrong.map((w) => w.length))) longest++;
      }
      expect(longest / all, `${id} ${lang ? "he" : "en"}: ${longest} of ${all}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: options carry the same numbers in English and Hebrew, and the same number of wrong options", async (id) => {
    const c = await load(id);
    for (const [en, he] of questions(c)) {
      expect(he[2].length, en[0]).toBe(en[2].length);
      expect(numbersIn(he[1]), en[0]).toEqual(numbersIn(en[1]));
      en[2].forEach((w, i) => expect(numbersIn(he[2][i]!), `${en[0]}: ${w}`).toEqual(numbersIn(w)));
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

  it("central banks: before 1954 a commercial bank issued the banknotes (not all of the money: the coins came from the government)", async () => {
    const c = await load("econ-central-bank");
    const [answer, en, he] = c.b.n!.find(([, e]) => e[0].includes("Bank of Israel in 1954"))!;
    expect(answer).toBe(1954 - 1948);
    expect(en[2]).toMatch(/banknotes/);
    expect(en[2]).toMatch(/Anglo-Palestine Bank/);
    expect(he[2]).toMatch(/השטרות/);
    expect(he[2]).toMatch(/אנגלו־פלשתינה/);
  });

  it("crypto: the halving sum is right and the explanation is up to date with the fourth halving (2024)", async () => {
    const c = await load("econ-crypto");
    const [answer, en, he] = c.a.n!.find(([, e]) => e[0].includes("three halvings"))!;
    expect(answer).toBe(50 / 2 ** 3);
    for (const text of [en[2], he[2]]) {
      expect(text).toContain("2024");
      expect(text).toContain(String(50 / 2 ** 4));
    }
  });

  it("currencies: a euro country gives up its own interest rate, not its taxes, and the answer is not the longest option", async () => {
    const c = await load("econ-currencies");
    const [en, he] = c.a.q!.find(([e]) => e[0].includes("share one currency"))!;
    expect(en[1]).toMatch(/interest rate/);
    expect(en[2][0]).toMatch(/taxes/);
    expect(he[2][0]).toMatch(/המסים/);
    expect(en[3]).toMatch(/European Central Bank/);
    expect(he[3]).toMatch(/הבנק המרכזי האירופי/);
    for (const [, answer, wrong] of [en, he]) expect(answer.length).toBeLessThanOrEqual(Math.max(...wrong.map((w) => w.length)));
  });

  it("currencies: the money-changer sum is worked out, not just stated", async () => {
    const c = await load("econ-currencies");
    const [answer, en, he] = c.i.n![0]!;
    expect(answer).toBe(50 * 3.6);
    for (const [, , explanation] of [en, he]) {
      expect(explanation).toContain("50 × 3.6 = 180");
      expect(explanation.length).toBeGreaterThanOrEqual(40);
    }
  });
});
