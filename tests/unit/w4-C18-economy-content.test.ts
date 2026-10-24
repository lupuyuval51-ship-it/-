import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { NumberItem, Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C18: seven economy topics (sectors of the economy, the sharing economy, the story of the shekel, smart shopping,
 * specialisation, stocks and investing, the supply chain) are held to the Plus and Pro collection's bar, also the three that
 * belong to the original library: every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is
 * explained in 40+ characters, and the right answer is the longest option in at most 40 % of the questions in each language.
 * "From farm to shop" gave the answer away by its length in 10 of its 12 questions, "Stocks and investing" in 9 of 14 and
 * "Smart shopping" in 5 of 8; their shortest wrong options were rewritten into real misconceptions (the barcode carries the
 * shop and the delivery day, the shop keeps the whole price gap as profit, re-cooling undoes a broken cold chain, an index
 * measures profits, shareholders are repaid first, an IPO is a loan, a receipt lets you return anything for ever, 10 agorot
 * matter, #ad means the star paid). "Smart shopping" also had too few items at two levels: it gained an ordering and a
 * warranty question. The sums behind the answers are recomputed.
 */

const IDS = [
  "econ-sectors", "econ-sharing-economy", "econ-shekel-history", "econ-smart-shopping", "econ-specialisation", "econ-stock-market", "econ-supply-chain",
] as const;
const LEVELS = ["b", "i", "a"] as const;
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")).sort();
/** Hebrew writes "one shekel" as שקל אחד and "one lira" as לירה אחת. */
const heNumbersIn = (s: string) => numbersIn(s.replace(/שקל אחד/g, "1 שקל").replace(/לירה אחת/g, "1 לירה"));

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The number item of a topic whose English question contains `text`. */
function numberItem(c: TopicContent, text: string): NumberItem {
  const found = LEVELS.flatMap((l) => c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!found) throw new Error(`no number item with "${text}"`);
  return found;
}

/** The question of a topic whose English text contains `text`. */
function question(c: TopicContent, text: string): Question {
  const found = LEVELS.flatMap((l) => c[l].q ?? []).find(([en]) => en[0].includes(text));
  if (!found) throw new Error(`no question with "${text}"`);
  return found;
}

describe("economy topics (C18)", () => {
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

  it.each(IDS)("%s: options are the same in number and carry the same numbers in English and Hebrew", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
      expect(heNumbersIn(he[1]), `${id}/${l}: ${en[0]}`).toEqual(numbersIn(en[1]));
      en[2].forEach((w, i) => expect(heNumbersIn(he[2][i]!), `${id}/${l}: ${w}`).toEqual(numbersIn(w)));
      expect(new Set([en[1], ...en[2]]).size, `${id}/${l}: ${en[0]}`).toBe(en[2].length + 1);
      expect(new Set([he[1], ...he[2]]).size, `${id}/${l}: ${he[0]}`).toBe(he[2].length + 1);
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

  it("the sums behind the number answers hold", async () => {
    const sectors = await load("econ-sectors"), sharing = await load("econ-sharing-economy"), shekel = await load("econ-shekel-history");
    const shopping = await load("econ-smart-shopping"), special = await load("econ-specialisation"), stocks = await load("econ-stock-market");
    const chain = await load("econ-supply-chain");
    expect(numberItem(sectors, "100 workers")[0]).toBe(100 - 10 - 30);
    expect(numberItem(sectors, "2% of workers")[0]).toBe(100 - 2 - 18);
    expect(numberItem(sectors, "baker's value added")[0]).toBe(600 - 350);
    expect(numberItem(sharing, "20 ₪ a day")[0]).toBe(20 * 3);
    expect(numberItem(sharing, "300 ₪ to buy")[0]).toBe(300 / 30);
    expect(numberItem(sharing, "cost per wear")[0]).toBe(200 / 100);
    expect(numberItem(sharing, "40% of its value")[0]).toBe(2000 * (1 - 0.4));
    expect(numberItem(shekel, "half a lira")[0]).toBe(1000 / 2);
    expect(numberItem(shekel, "100 agorot")[0]).toBe(1000 / 100);
    expect(numberItem(shekel, "2,500 lirot")[0]).toBe(2500 / 10);
    expect(numberItem(shekel, "How many lirot is 1 new shekel")[0]).toBe(1000 * 10);
    expect(numberItem(shekel, "4,500 old shekels")[0]).toBe(4500 / 1000);
    expect(numberItem(shopping, "25% off")[0]).toBe(60 * (1 - 0.25));
    expect(numberItem(shopping, "3 for the price of 2")[0]).toBe((2 * 12) / 3);
    expect(numberItem(special, "50 chairs")[0]).toBe(50 - 5 * 4);
    expect(numberItem(special, "48,000 pins")[0]).toBe(48000 / 10);
    expect(numberItem(special, "12 hours")[0]).toBe(12 / 1.5);
    expect(numberItem(special, "opportunity cost of one shirt")[0]).toBe(6 / 3);
    expect(numberItem(stocks, "dividend of 2 shekels")[0]).toBe(50 * 2);
    expect(numberItem(stocks, "2 million shares")[0]).toBe(2 * 30);
    expect(numberItem(chain, "20 pallets")[0]).toBe(20 * 60);
    expect(numberItem(chain, "between 2 and 8 °C")[0]).toBe(11 - 8);
  });

  it("the worked-out choice answers hold", async () => {
    const shekel = await load("econ-shekel-history"), shopping = await load("econ-smart-shopping"), stocks = await load("econ-stock-market");
    const special = await load("econ-specialisation"), sharing = await load("econ-sharing-economy"), chain = await load("econ-supply-chain");
    // cash is rounded to the nearest 10 agorot: 9.97 is 3 agorot from 10.00 and 7 from 9.90
    expect(question(shekel, "9.97 ₪")[0][1]).toBe(`${(Math.round(997 / 10) / 10).toFixed(2)} ₪`);
    // a fall of 20% and a rise of 20% leave less than the start
    expect(question(stocks, "falls by 20% and then rises by 20%")[0][1]).toBe(`${50 * 0.8 * 1.2} shekels`);
    expect(question(stocks, "sell it for 30 shekels")[0][1]).toBe(`A profit of ${30 - 20} shekels`);
    expect(question(shopping, "40 ₪ in one shop")[0][1]).toBe(`${40 - 32} ₪`);
    // the jacket: 30% off (70 ₪) beats 25 ₪ off (75 ₪), 20% off (80 ₪) and 10 ₪ off (90 ₪)
    expect(Math.min(100 * 0.7, 100 - 25, 100 * 0.8, 100 - 10)).toBe(100 * 0.7);
    expect(question(shopping, "Which deal gives the lowest price")[0][1]).toBe("30% off");
    // per kilogram, 1 kg for 16 ₪ beats 500 g for 10 ₪ (20 ₪ a kg)
    expect(16).toBeLessThan(10 * (1000 / 500));
    expect(question(shopping, "Pack A has 500 g")[0][1]).toBe("Pack B: 16 ₪ per kg");
    // comparative advantage goes to the lower opportunity cost (Dan gives up 1 cake a shirt, Ana 2), not to the faster one
    expect(2 / 2).toBeLessThan(6 / 3);
    const dan = question(special, "Who has the comparative advantage in shirts?");
    expect([dan[0][1], dan[1][1]]).toEqual(["Dan", "לדן"]);
    // the tent: 2 trips a year for 3 years at 100 ₪, against 800 ₪
    expect(question(sharing, "Buying a tent costs 800 ₪")[0][1]).toBe(`Renting, by ${800 - 2 * 3 * 100} ₪`);
    // the supermarket's misconception is about the real gap of 8 − 3 shekels, in both languages
    const tomato = question(chain, "a kilo of tomatoes");
    expect(tomato[0][2][0]).toContain(`${8 - 3} shekels`);
    expect(tomato[1][2][0]).toContain(`${8 - 3} השקלים`);
  });

  it("the stock exchange question names the only Israeli exchange, against a capital-city misconception", async () => {
    const stocks = await load("econ-stock-market");
    const [en, he] = question(stocks, "Israel's stock exchange");
    expect(en[1]).toBe("The Tel Aviv Stock Exchange");
    expect(he[1]).toBe("הבורסה לניירות ערך בתל אביב");
    expect(en[2][0]).toContain("Jerusalem");
    expect(he[2][0]).toContain("בירושלים");
    expect(en[3]).toContain("only stock exchange");
    expect(he[3]).toContain("הבורסה היחידה");
  });
});
