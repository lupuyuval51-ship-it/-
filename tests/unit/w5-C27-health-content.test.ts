import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, C27: seven health topics (medicines, muscles, natural hazards, nutrition, peer pressure, personal safety,
 * puberty). Every fact was re-checked and no existing answer key moved. "Healthy eating" (the original library) had only two
 * questions per level, a 31-character numeric explanation and wrong options such as "They replace sleep"; it now meets the
 * collection's bar with checked content (breakfast, sugar and tooth decay, protein foods, 5 portions a day, iron with
 * vitamin C, values per 100 g, whole fruit or juice, sugar in a can, salt and blood pressure, what is ultra-processed,
 * energy from a label). The English "I-message" question gave itself away: only the answer started with "I"; a disguised
 * you-message ("I think you're the most annoying person...") is now the first wrong option.
 */

const IDS = ["health-medicines", "health-muscles", "health-natural-hazards", "health-nutrition", "health-peer-pressure", "health-personal-safety", "health-puberty"] as const;
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

describe("health topics (C27)", () => {
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
        expect([String(answer), answer.toLocaleString("en-US")].some((w) => explanation.includes(w)), `${id}/${l}: ${q}`).toBe(true);
        expect(q, `${id}/${l}`).not.toMatch(/[<>]/);
      }
    }
  });

  it("nutrition: the answers that were there keep their keys", async () => {
    const c = await load("health-nutrition");
    expect(question(c, "healthiest everyday choice")[0][1]).toBe("An apple");
    expect(question(c, "fruit and vegetables every day")[0][1]).toBe("They give us vitamins, minerals and fibre");
    expect(question(c, "red label")[0][1]).toBe("High sugar, sodium (salt) or saturated fat");
    expect(question(c, "red label")[1][1]).toBe("מכמות גבוהה של סוכר, נתרן (מלח) או שומן רווי");
    expect(question(c, "skin make")[0][1]).toBe("Vitamin D");
    expect(question(c, "most energy per gram")[0][1]).toBe("Fat");
    expect(question(c, "scurvy")[0][1]).toBe("Vitamin C");
    expect(c.a.n?.[0]?.[0]).toBe(180);
  });

  it("nutrition: the numbers follow from the facts in their own question", async () => {
    const c = await load("health-nutrition");
    const num = (l: "b" | "i" | "a", text: string) => {
      const item = (c[l].n ?? []).find(([, en]) => en[0].includes(text));
      if (!item) throw new Error(`no number with "${text}"`);
      return item[0];
    };
    expect(num("b", "portions of fruit and vegetables")).toBe(5);
    expect(num("i", "330 ml can")).toBe((330 * 10) / 100);
    expect(num("a", "20 g of fat")).toBe(20 * 9);
    expect(num("a", "A yoghurt has")).toBe(4 * 4 + 15 * 4 + 3 * 9);
  });

  it("nutrition: the new wrong options are real misconceptions that the explanation answers", async () => {
    const c = await load("health-nutrition");
    const salt = question(c, "eating less salt");
    expect(salt[0][1]).toMatch(/blood pressure/);
    expect(salt[0][2][0]).toMatch(/calories/);
    expect(salt[0][3]).toMatch(/no calories/);
    expect(salt[1][3]).toMatch(/אין קלוריות/);
    const upf = question(c, "ultra-processed food");
    expect(upf[0][1]).toBe("Instant noodles with a flavour sachet");
    expect(upf[0][2][0]).toMatch(/^Frozen peas/);
    expect(upf[0][3]).toMatch(/does not make it ultra-processed/);
    const juice = question(c, "whole orange");
    expect(juice[0][2][0]).toMatch(/no vitamins/);
    expect(juice[0][3]).toMatch(/still has vitamin C/);
    // The red label is not about the expiry date or allergens, and the explanation says where those are.
    const red = question(c, "red label");
    expect(red[0][2]).toContain("The food is past its expiry date and must not be eaten");
    expect(red[0][3]).toMatch(/expiry date and allergens are printed elsewhere/);
  });

  it("nutrition: the last wrong option shown, which the hint rules out and the warm-up keeps, is the easiest one", async () => {
    const c = await load("health-nutrition");
    const last = (text: string) => question(c, text).map(([, , wrong]) => wrong[Math.min(2, wrong.length - 1)]);
    expect(last("fruit and vegetables every day")).toEqual(["They replace sleep", "הם מחליפים שינה"]);
    expect(last("red label")).toEqual(["The food is spicy", "שהמזון חריף"]);
    expect(last("richest in protein")).toEqual(["A spoonful of sugar", "כפית סוכר"]);
    expect(last("eating less salt")).toEqual(["Salt makes the bones grow too long", "המלח גורם לעצמות לגדול יותר מדי"]);
  });

  it("peer pressure: an I-message is not given away by the word \"I\"", async () => {
    const [en, he] = question(await load("health-peer-pressure"), "I-message");
    expect(en[1]).toBe("\"I feel uncomfortable when you keep asking. I've already said no.\"");
    expect(he[1]).toBe("״לא נעים לי כשאתה ממשיך לבקש. כבר אמרתי לא.״");
    expect(en[2].some((w) => w.startsWith("\"I "))).toBe(true);
    expect(he[2].some((w) => w.startsWith("״אני "))).toBe(true);
    expect(en[3]).toMatch(/Starting with "I" is not enough/);
  });

  it("natural hazards: the dry-ground wrong option says the same in English and Hebrew", async () => {
    const [en, he] = question(await load("health-natural-hazards"), "Why does Israel have earthquakes");
    expect(en[1]).toBe("It lies along the Dead Sea fault, where two plates slide past each other");
    expect(en[2][0]).toMatch(/on hot days/);
    expect(he[2][0]).toMatch(/בימים חמים/);
  });
});
