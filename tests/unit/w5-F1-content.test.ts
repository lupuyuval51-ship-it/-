import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, F1: eight economy topics and two capitals topics. The two capitals topics had too few items (Europe: 6 per level,
 * 2 questions; Asia and Africa: 7 at beginner) and gain fact-checked questions (Dublin, the Seine, Oslo, Bucharest,
 * Ljubljana, Tallinn, Beirut). Giveaways were removed: an ordering step, number prompt or term description of a level no
 * longer names or spells out the answer of a choice question of the same level (Marx and Das Kapital, Lehman Brothers, the
 * National Water Carrier, Degania, China's paper money, Pretoria, the cancellation-fee rule, the board of directors, Bern,
 * the payslip's employer and income tax, the ₪ sign, the Bank of Israel, franchise, legal entity, cowrie shells and others).
 * Where a question only restated its term, it now asks something the term does not say.
 */

const IDS = [
  "econ-business-types", "econ-consumer-rights", "econ-economic-thinkers", "econ-financial-crises", "econ-israel-economy",
  "econ-money-history", "econ-payslip", "econ-shekel-history", "geo-capitals-asia-africa", "geo-capitals-europe",
] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The question of a level whose English text contains `text`. */
function question(lv: LevelContent, text: string): Question {
  const found = (lv.q ?? []).find(([en]) => en[0].includes(text));
  if (!found) throw new Error(`no question with "${text}"`);
  return found;
}

/** Everything a learner sees of a level besides its choice questions: terms, meanings, number prompts, ordering steps. */
function shown(lv: LevelContent, lang: 0 | 1): string[] {
  return [
    ...(lv.t ?? []).flatMap((t) => (lang ? [t[2], t[3]] : [t[0], t[1]])),
    ...(lv.n ?? []).map((n) => n[lang + 1 as 1 | 2][0]),
    ...(lv.s ?? []).flatMap((s) => s[lang]),
  ];
}

describe("economy and capitals topics (F1)", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
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

  it.each(IDS)("%s: explanations are 40+ characters, en and he keep the same shape, Hebrew has no < or > and no ? blank", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(en[2].length, `${id}/${l}: ${en[0]}`).toBe(he[2].length);
        for (const [q, answer, wrong, explanation] of [en, he]) {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(new Set([answer, ...wrong]).size, `${id}/${l}: ${q}`).toBe(wrong.length + 1);
        }
        for (const s of [he[0], he[1], ...he[2], he[3]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [answer, en, he] of c[l].n ?? []) {
        for (const text of [en[2], he[2]]) {
          expect(text.length, `${id}/${l}: ${en[0]}`).toBeGreaterThanOrEqual(40);
          expect(text.includes(String(answer)) || text.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${en[0]}`).toBe(true);
        }
        for (const s of [he[0], he[2]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]|\?\s*[=+−×÷]/);
      }
      for (const [en, he] of c[l].s ?? []) expect(en.length, `${id}/${l}: ${en[0]}`).toBe(he.length);
    }
  });

  // [topic, level, English question text, answer the other items of that level must not contain (en, he)]
  const REMOVED: [string, "b" | "i" | "a", string, string, string][] = [
    ["econ-economic-thinkers", "b", "What did he argue in it?", "capitalism exploits", "מנצל את העובדים"],
    ["econ-financial-crises", "i", "The collapse of which bank", "Lehman", "ליהמן"],
    ["econ-israel-economy", "i", "Which great project, completed in 1964", "Water Carrier", "המוביל הארצי"],
    ["econ-israel-economy", "b", "Which was the first kibbutz", "Degania", "דגניה"],
    ["econ-money-history", "b", "In which country was paper money first used", "China", "סין"],
    ["econ-consumer-rights", "i", "the most it may keep", "whichever is lower", "הנמוך מביניהם"],
    ["econ-business-types", "a", "external directors", "conflict of interest", "ניגוד עניינים"],
    ["econ-business-types", "i", "Who elects the board of directors", "elected by", "בוחרים"],
    ["econ-business-types", "i", "How many votes does she have", "one vote", "קול אחד"],
    ["econ-payslip", "b", "Who gives a worker a payslip?", "employer", "מעסיק"],
    ["econ-payslip", "b", "Which line on a payslip is a deduction?", "tax", "מס הכנסה"],
    ["econ-payslip", "i", "Your payslip's pension lines", "on top of your pay", "מעבר לשכר"],
    ["econ-shekel-history", "b", "What does the symbol ₪ stand for?", "₪", "₪"],
    ["econ-shekel-history", "b", "Which body issues", "issues", "מנפיק"],
    ["econ-shekel-history", "b", "Where does the word", "weigh", "שקיל"],
    ["econ-shekel-history", "a", "main steps of Israel's 1985 stabilisation plan", "deficit", "גירעון"],
    ["econ-shekel-history", "a", "A currency reform drops three zeros", "what money buys", "מה שאפשר לקנות"],
    ["econ-shekel-history", "i", "Who issued the Palestine pound", "British", "הבריטי"],
    ["econ-money-history", "i", "Where does the word \"bank\" come from?", "bench", "ספסל"],
    ["econ-consumer-rights", "a", "A gym's standard contract", "court can cancel", "בית משפט יכול לבטל"],
    ["econ-consumer-rights", "i", "Which of these purchases is a distance sale?", "such as online", "למשל באינטרנט"],
    ["geo-capitals-asia-africa", "a", "Which country has three capital cities", "South Africa", "דרום אפריקה"],
    ["geo-capitals-asia-africa", "a", "Why did Nigeria move its capital", "middle of the country", "במרכז המדינה"],
    ["geo-capitals-europe", "a", "What is the capital of Switzerland", "Bern", "ברן"],
  ];

  it.each(REMOVED)("%s/%s: nothing else in the level gives away \"%s\"", async (id, l, text, en, he) => {
    const lv = (await load(id))[l];
    question(lv, text); // the question is still there
    for (const s of shown(lv, 0)) expect(s, `${id}/${l} en`).not.toContain(en);
    for (const s of shown(lv, 1)) expect(s, `${id}/${l} he`).not.toContain(he);
  });

  it("the questions that only restated a term now ask what the term does not say, with the facts kept", async () => {
    const business = await load("econ-business-types");
    expect(question(business.a, "Who owns the new branch?")[0][1]).toMatch(/^You do/);
    expect(question(business.a, "all its founders sell their shares")[0][1]).toMatch(/carries on/);
    expect(question(business.a, "Who usually ends up carrying that loss?")[0][1]).toMatch(/^The creditors/);
    const money = await load("econ-money-history");
    expect(question(money.b, "Why did cowrie shells work well as money")[0][1]).toMatch(/hard to fake/);
    const israel = await load("econ-israel-economy");
    expect(question(israel.i, "In what form did much of the payment come?")[0][1]).toMatch(/^Goods/);
    expect(question(israel.b, "biggest part of what Israel sells abroad")[0][1]).toMatch(/^High-tech/);
    const crises = await load("econ-financial-crises");
    const lender = question(crises.a, "lender of last resort");
    expect(lender[0][1]).toMatch(/sound banks/);
    expect(lender[0][2][0]).toMatch(/however badly it was run/);
  });

  it("the new capitals are right", async () => {
    const europe = await load("geo-capitals-europe");
    const capitals: [LevelContent, string, string, string][] = [
      [europe.b, "capital of Ireland", "Dublin", "דבלין"],
      [europe.b, "flows through the middle of Paris", "The Seine", "הסן"],
      [europe.i, "capital of Norway", "Oslo", "אוסלו"],
      [europe.i, "capital of Romania", "Bucharest", "בוקרשט"],
      [europe.a, "Ljubljana", "Slovenia", "סלובניה"],
      [europe.a, "capital of Estonia", "Tallinn", "טאלין"],
      [(await load("geo-capitals-asia-africa")).b, "capital of Lebanon", "Beirut", "ביירות"],
    ];
    for (const [lv, text, en, he] of capitals) {
      const [e, h] = question(lv, text);
      expect([e[1], h[1]], text).toEqual([en, he]);
    }
  });
});
