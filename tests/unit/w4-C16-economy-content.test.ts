import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C16: seven economy topics (inflation, insurance, interest, Israel's economy, loans and debt, marketing, money
 * and banks) are held to the Plus and Pro collection's bar, even "Money and banks", which belongs to the original
 * library: every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained in 40+
 * characters, and the right answer is the longest option in at most 40 % of the questions in each language. "Money and
 * banks" had two questions per level and gave the answer away by its length in half of its English questions (barter:
 * 67 characters against wrong options of 20 to 24). Choice options that carry numbers carry the same numbers in English
 * and Hebrew, a numeric right answer is worked out in its explanation, and the sums behind the answers are recomputed.
 */

const IDS = [
  "econ-inflation", "econ-insurance", "econ-interest", "econ-israel-economy", "econ-loans-debt", "econ-marketing", "econ-money-banks",
] as const;
const LEVELS = ["b", "i", "a"] as const;
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")).sort();
/** Hebrew writes "two years" as one word, שנתיים. */
const heNumbersIn = (s: string) => numbersIn(s.replace(/שנתיים/g, "2 שנים"));

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

describe("economy topics (C16)", () => {
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
      expect(heNumbersIn(he[1]), `${id}/${l}: ${en[0]}`).toEqual(numbersIn(en[1]));
      en[2].forEach((w, i) => expect(heNumbersIn(he[2][i]!), `${id}/${l}: ${w}`).toEqual(numbersIn(w)));
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

  it("the sums behind the answers hold", async () => {
    const banks = await load("econ-money-banks"), loans = await load("econ-loans-debt"), interest = await load("econ-interest");
    const insurance = await load("econ-insurance"), inflation = await load("econ-inflation");
    // money and banks: agorot, a one-year loan, an overdraft
    expect(banks.b.n![0]![0]).toBe(3 * 100);
    expect(banks.i.n![0]![0]).toBe(1000 * 1.1);
    expect(banks.a.n![0]![0]).toBe((2000 * 10) / 100);
    // a debt at 20 % a year paying 150 ₪ a month grows: the month's interest is about 167 ₪
    const growing = loans.a.q!.find(([en]) => en[0].includes("pay 150 ₪ a month"))!;
    expect(Math.round((10000 * 0.2) / 12)).toBe(167);
    expect(growing[0][1]).toContain("167");
    expect(growing[1][1]).toContain("167");
    // compound interest
    expect(interest.i.n![0]![0]).toBeCloseTo(1000 * 1.05 ** 2, 6);
    expect(interest.a.n!.find(([a]) => a === 1331)).toBeTruthy();
    expect(Math.round(1000 * 1.1 ** 3)).toBe(1331);
    // underinsurance: insured for half the value, half of the loss is paid
    const under = insurance.a.q!.find(([en]) => en[0].includes("underinsurance clause"))!;
    expect(under[0][1]).toBe(`${((500000 / 1000000) * 100000).toLocaleString("en-US")} ₪`);
    // two years of 10 % inflation are 21 %, not 20 %
    const twoYears = inflation.a.q!.find(([en]) => en[0].includes("10% a year for 2 years"))!;
    expect(twoYears[0][1]).toBe(`${Math.round((1.1 ** 2 - 1) * 100)}%`);
  });
});
