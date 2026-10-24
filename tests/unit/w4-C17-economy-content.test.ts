import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { NumberItem, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C17: seven economy topics (the history of money, money scams, payments, the payslip, pensions, factors of
 * production, scarcity and choice) are held to the Plus and Pro collection's bar, even "Scarcity and choice", which belongs
 * to the original library: every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained
 * in 40+ characters, and the right answer is the longest option in at most 40 % of the questions in each language.
 * "Scarcity and choice" had three questions at the beginner level and gave the answer away by its length in 7 of its 10
 * questions (for example "Resources are limited, but wants are almost endless" against wrong options of 26 to 31
 * characters); its short wrong options were rewritten into real misconceptions (each item is affordable alone, absolute
 * instead of comparative advantage, a point inside the frontier, a "free" park). Options that carry numbers carry the same
 * numbers in English and Hebrew, and the sums behind the answers are recomputed.
 */

const IDS = [
  "econ-money-history", "econ-money-scams", "econ-payments", "econ-payslip", "econ-pensions", "econ-production-factors", "econ-scarcity-choices",
] as const;
const LEVELS = ["b", "i", "a"] as const;
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")).sort();
/** Hebrew writes "two years" as one word, שנתיים. */
const heNumbersIn = (s: string) => numbersIn(s.replace(/שנתיים/g, "2 שנים"));
const NUMERIC = /^[\d,.]+\s*(₪|%)?$/;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The number item of a level whose English question contains `text`. */
function numberItem(c: TopicContent, text: string): NumberItem {
  const found = LEVELS.flatMap((l) => c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!found) throw new Error(`no number item with "${text}"`);
  return found;
}

describe("economy topics (C17)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters, and a number answer appears in its explanation", async (id) => {
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
      expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
      expect(heNumbersIn(he[1]), `${id}/${l}: ${en[0]}`).toEqual(numbersIn(en[1]));
      en[2].forEach((w, i) => expect(heNumbersIn(he[2][i]!), `${id}/${l}: ${w}`).toEqual(numbersIn(w)));
      // a right answer that is a number ("50 ₪", "1,250 ₪") is worked out in its explanation
      for (const [q, answer, , explanation] of [en, he]) if (NUMERIC.test(answer)) for (const n of numbersIn(answer)) expect(explanation, `${id}/${l}: ${q}`).toContain(n);
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

  it("scarcity and choice: comparative advantage goes to the lower opportunity cost, not to the faster baker", async () => {
    const c = await load("econ-scarcity-choices");
    const q = c.a.q!.find(([en]) => en[0].includes("Who should knit the scarves?"))!;
    const mayaScarf = 6 / 2, tomScarf = 4 / 4; // cakes given up per scarf
    expect(tomScarf).toBeLessThan(mayaScarf);
    expect(q[0][1].startsWith("Tom")).toBe(true);
    expect(q[1][1].startsWith("תום")).toBe(true);
    // the absolute-advantage misconception is offered, and named in the explanation
    expect(q[0][2][0]).toContain("more cakes");
    expect(q[0][3]).toContain("Baking more cakes");
    // the beginner level has a sum of its own: 20 ₪ minus two ice creams of 8 ₪
    expect(numberItem(c, "ice cream")[0]).toBe(20 - 2 * 8);
    expect(numberItem(c, "babysitting or study")[0]).toBe(2 * 30);
    expect(numberItem(c, "10 chairs or 5 tables")[0]).toBe(10 / 5);
  });

  it("the sums behind the other answers hold", async () => {
    const history = await load("econ-money-history"), scams = await load("econ-money-scams"), payments = await load("econ-payments");
    const payslip = await load("econ-payslip"), pensions = await load("econ-pensions"), factors = await load("econ-production-factors");
    // the history of money
    expect(numberItem(history, "3 chickens")[0]).toBe(3 * 4);
    expect(numberItem(history, "cash machine")[0]).toBe(1967 - 1950);
    expect(numberItem(history, "1 gram of gold")[0]).toBe(1000 / 50);
    expect(numberItem(history, "120 grams of silver")[0]).toBe(120 / 3 - 120 / 4);
    // scams: pyramids grow by powers, a Ponzi pot runs dry
    expect(numberItem(scams, "50 shekels into 500")[0]).toBe(500 / 50);
    expect(numberItem(scams, "recruit 5 new members")[0]).toBe(5 ** 4);
    expect(numberItem(scams, "10% profit every month")[0]).toBe(2000 * 0.1);
    expect(numberItem(scams, "1,000,000 shekels")[0]).toBe(1_000_000 / (1_000_000 * 0.1));
    expect(numberItem(scams, "recruit 10 new members")[0]).toBe(10 ** 7);
    // payments
    expect(numberItem(payments, "debit card")[0]).toBe(50);
    expect(numberItem(payments, "bus ride")[0]).toBe(5 * 6);
    expect(numberItem(payments, "85 ₪ every month")[0]).toBe(85 * 12);
    expect(numberItem(payments, "2% fee")[0]).toBeCloseTo(250 * 0.02, 9);
    expect(numberItem(payments, "6 ₪ for each transfer")[0]).toBe(12 * 6);
    // the payslip
    expect(numberItem(payslip, "80 hours")[0]).toBe(80 * 40);
    expect(numberItem(payslip, "1,500 ₪")[0]).toBe(8000 - 1500);
    expect(numberItem(payslip, "6,000 ₪ and your pension deduction")[0]).toBeCloseTo(6000 * 0.06, 9);
    expect(numberItem(payslip, "up to 7,000 ₪")[0]).toBeCloseTo(7000 * 0.1 + 2000 * 0.14, 9);
    expect(numberItem(payslip, "Income tax is 900 ₪")[0]).toBeCloseTo(9000 - 900 - 9000 * 0.05 - 9000 * 0.06, 9);
    const overtime = payslip.i.q!.find(([en]) => en[0].includes("125%"))!;
    expect(overtime[0][1]).toBe(`${40 * 1.25} ₪`);
    const raise = payslip.a.q!.find(([en]) => en[0].includes("rises by 500 ₪"))!;
    expect(raise[0][1]).toBe(`${Math.round(500 * (1 - 0.2 - 0.07))} ₪`);
    const fund = payslip.a.q!.find(([en]) => en[0].includes("employer adds 6.5%"))!;
    expect(fund[0][1]).toBe(`${(10000 * 0.06 + 10000 * 0.065).toLocaleString("en-US")} ₪`);
    // pensions: compound growth, the rule of 72, a conversion factor, a fee gap
    const twoYears = numberItem(pensions, "5% a year");
    expect(Math.abs(twoYears[0] - 1000 * 1.05 ** 2)).toBeLessThanOrEqual(twoYears[3] ?? 0);
    expect(numberItem(pensions, "rule of 72")[0]).toBe(72 / 6);
    expect(numberItem(pensions, "300 ₪ a month")[0]).toBe((300 + 300) * 12);
    expect(numberItem(pensions, "conversion factor of 200")[0]).toBe(1_000_000 / 200);
    expect(numberItem(pensions, "4.75%")[0]).toBeCloseTo(100_000 * (1.0475 - 1.04), 6);
    // factors of production
    expect(numberItem(factors, "lemonade stand")[0]).toBe(100 - 20 - 30 - 10);
    expect(numberItem(factors, "600 chairs")[0]).toBe(600 / 20);
    expect(numberItem(factors, "5 workers it makes 460")[0]).toBe(460 - 400);
  });
});
