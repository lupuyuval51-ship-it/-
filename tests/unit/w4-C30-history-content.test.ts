import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C30: seven history topics (ancient India, ancient Rome, the Seven Wonders, archaeology, aviation, the Black
 * Death, calendars) are held to the Plus and Pro collection's bar, even ancient India and ancient Rome, which belong to
 * the original library: every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained
 * in 40+ characters, and the right answer is the longest option in at most 40 % of the questions in each language.
 * Ancient Rome had two questions per level, and ancient India gave the answer away by its length in 60 % of its questions.
 * Choice options that carry numbers carry the same numbers in English and Hebrew, and a numeric answer is worked out in
 * its explanation.
 */

const IDS = [
  "history-ancient-india", "history-ancient-rome", "history-ancient-wonders", "history-archaeology",
  "history-aviation", "history-black-death", "history-calendars",
] as const;
const LEVELS = ["b", "i", "a"] as const;
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")).sort();
/** Hebrew says "two hours" with a dual word (שעתיים) where English may write a digit, so a dual may stand for a 2. */
const HE_DUAL = /(?:שעתיים|יומיים|שבועיים|חודשיים|שנתיים)/g;
const sameNumbers = (en: string, he: string) => {
  const e = numbersIn(en).join(" ");
  return e === numbersIn(he).join(" ") || e === numbersIn(he.replace(HE_DUAL, " 2 ")).join(" ");
};

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

describe("history topics (C30)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters, and a numeric answer is worked out", async (id) => {
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

  it.each(IDS)("%s: options carry the same numbers in English and Hebrew, and the same number of wrong options", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
      expect(sameNumbers(en[1], he[1]), `${id}/${l}: ${en[1]} / ${he[1]}`).toBe(true);
      en[2].forEach((w, i) => expect(sameNumbers(w, he[2][i]!), `${id}/${l}: ${w} / ${he[2][i]}`).toBe(true));
    }
  });

  it.each(IDS)("%s: Hebrew text has no < or > (a right-to-left line mirrors them)", async (id) => {
    const c = await load(id);
    const he: string[] = [];
    for (const l of LEVELS) {
      const lv = c[l];
      for (const [, , term, meaning] of lv.t ?? []) he.push(term, meaning);
      for (const [, [q, a, w, e, h]] of lv.q ?? []) he.push(q, a, ...w, e, ...(h ? [h] : []));
      for (const [, , [q, u, e, h]] of lv.n ?? []) he.push(q, u, e, ...(h ? [h] : []));
      for (const [, steps] of lv.s ?? []) he.push(...steps);
    }
    for (const s of he) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
  });
});
