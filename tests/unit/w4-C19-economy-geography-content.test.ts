import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C19: four economy topics (supply and demand, taxes, trade between countries, work and jobs) and three geography
 * topics (Africa, farming around the world, capitals of the Americas) are held to the Plus and Pro collection's bar, also the
 * six that belong to the original library: every level has 8+ items, 4+ of them questions, numbers or orderings, every answer
 * is explained in 40+ characters, and the right answer is the longest option in at most 40 % of the questions in each
 * language. "Work and jobs" gave the answer away by its length in 9 of its 10 English questions, "Farming" in 8 of 13,
 * "Supply and demand" and "Taxes" in half; their shortest wrong options were rewritten into real misconceptions (a bank
 * fee swallows the gross-to-net gap, pension money funds the employer, new workers are paid more, a doctor must first be a
 * nurse, a greenhouse keeps the light out, legumes kill weeds by drinking the water, too many trees caused the Dust Bowl, a
 * price ceiling makes a surplus, shops keep the tax, a higher tax bracket lowers your income). "Supply and demand" and
 * "Taxes" had only two questions per level and gained a question or a number at each. The answer keys did not move.
 */

const IDS = ["econ-supply-demand", "econ-taxes", "econ-trade", "econ-work-jobs", "geo-africa", "geo-agriculture", "geo-capitals-americas"] as const;
const LEVELS = ["b", "i", "a"] as const;
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")).sort();
/** Hebrew writes "1 dollar" as דולר אחד. */
const heNumbersIn = (s: string) => numbersIn(s.replace(/דולר אחד/g, "1 דולר"));

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

describe("economy and geography topics (C19)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters, and a number item says the same numbers in both languages", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) {
        for (const [q, , explanation] of [en, he]) {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(explanation.includes(String(answer)) || explanation.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${q}`).toBe(true);
        }
        expect(heNumbersIn(he[0]), `${id}/${l}: ${en[0]}`).toEqual(numbersIn(en[0]));
        expect(heNumbersIn(he[2]), `${id}/${l}: ${en[2]}`).toEqual(numbersIn(en[2]));
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
      expect(longest / all, `${id} ${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: no '<' or '>' in Hebrew text (a right-to-left line mirrors them)", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const he = [
        ...(lv.t ?? []).flatMap((t) => [t[2], t[3]]),
        ...(lv.q ?? []).flatMap(([, h]) => [h[0], h[1], ...h[2], h[3], h[4] ?? ""]),
        ...(lv.n ?? []).flatMap(([, , h]) => [h[0], h[1], h[2], h[3] ?? ""]),
        ...(lv.s ?? []).flatMap(([, h]) => h),
      ];
      for (const s of he) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
    }
  });

  it("the sums behind the number answers are right", async () => {
    const value = async (id: string, l: (typeof LEVELS)[number], text: string) => {
      const found = (await load(id))[l].n?.find(([, en]) => en[0].includes(text));
      if (!found) throw new Error(`${id}: no number item with "${text}"`);
      return found[0];
    };
    expect(await value("econ-supply-demand", "i", "500 tickets")).toBe(500 - 300);
    expect(await value("econ-taxes", "i", "8,000")).toBe(8000 * 0.1);
    expect(await value("econ-trade", "i", "20 dollars")).toBe(20 * 4);
    expect(await value("econ-trade", "a", "trade balance")).toBe(50 - 60);
    expect(await value("econ-work-jobs", "i", "5-hour shift")).toBe(40 * 5);
    expect(await value("econ-work-jobs", "a", "net salary")).toBe(9000 - 1200);
    expect(await value("geo-agriculture", "i", "500 mm")).toBe(500 - 350);
    expect(await value("geo-africa", "a", "How many kilometres longer")).toBe(6650 - 4700);
    expect(await value("geo-capitals-americas", "i", "New York")).toBe(12 - 7);
    // VAT in Israel has been 18 % since January 2025, and the progressive example taxes only the part above the threshold
    const taxes = await load("econ-taxes");
    expect(question(taxes, "VAT is 18%")[0][1]).toBe(`${100 + 18} ₪`);
    expect(question(taxes, "first 10,000")[0][1]).toBe(`${(10_000 * 0.1 + 5_000 * 0.2).toLocaleString("en-US")} ₪`);
  });

  it("rewritten distractors kept their questions' right answers", async () => {
    const keys: [string, string, string, string][] = [
      ["econ-supply-demand", "lots of tomatoes", "Lower the price to sell them", "להוריד את המחיר כדי למכור אותן"],
      ["econ-supply-demand", "price of coffee rises", "It rises, because tea is a substitute", "הוא עולה, כי תה הוא מוצר תחליפי"],
      ["econ-supply-demand", "maximum price below", "A shortage: more is wanted than offered", "מחסור: רוצים יותר ממה שמוצע"],
      ["econ-taxes", "mainly used for", "Paying for public services like schools and roads", "למימון שירותים ציבוריים כמו בתי ספר וכבישים"],
      ["econ-taxes", "unfair to others", "Everyone else pays for the services you also use", "כל השאר משלמים על שירותים שגם אתם משתמשים בהם"],
      ["econ-taxes", "less progressive", "Poorer families spend a bigger share of their income on taxed goods", "משפחות עניות יותר מוציאות חלק גדול יותר מהכנסתן על מוצרים שממוסים"],
      ["econ-trade", "imported steel", "To protect its own steel makers from cheaper foreign competition", "כדי להגן על יצרני הפלדה המקומיים מפני תחרות זולה מחו״ל"],
      ["econ-work-jobs", "end of every month", "A salary", "משכורת"],
      ["econ-work-jobs", "become a pilot", "Training and practice to learn the skills of flying", "הכשרה ותרגול כדי ללמוד את מיומנויות הטיסה"],
      ["econ-work-jobs", "own bakery", "Self-employed", "עצמאית"],
      ["econ-work-jobs", "pay slip", "Income tax, National Insurance and pension savings were taken off", "נוכו מס הכנסה, ביטוח לאומי וחיסכון לפנסיה"],
      ["econ-work-jobs", "pension fund", "So that workers will have an income after they retire", "כדי שלעובדים תהיה הכנסה אחרי שיפרשו"],
      ["geo-agriculture", "greenhouse in winter", "It stays warm and protected inside, so the plants can grow in cold weather", "בפנים חם ומוגן, ולכן הצמחים יכולים לגדול גם בקור"],
      ["geo-agriculture", "giant steps", "To make flat fields and stop rain from washing the soil away", "כדי ליצור שדות שטוחים ולמנוע מהגשם לסחוף את האדמה"],
      ["geo-agriculture", "peas, beans or clover", "Bacteria on their roots add nitrogen to the soil, which feeds the next crop", "חיידקים על השורשים שלהם מוסיפים חנקן לקרקע, והוא מזין את הגידול הבא"],
      ["geo-agriculture", "Dust Bowl", "Ploughing had removed the grasses that held the soil, and then came years of drought", "החריש סילק את העשבים שהחזיקו את האדמה, ואחר כך באו שנים של בצורת"],
    ];
    for (const [id, text, en, he] of keys) {
      const [e, h] = question(await load(id), text);
      expect(e[1], `${id}: ${text}`).toBe(en);
      expect(h[1], `${id}: ${text}`).toBe(he);
      expect(e[2]).not.toContain(en);
      expect(h[2]).not.toContain(he);
    }
  });
});
