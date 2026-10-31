import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { QText, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C36: seven English topics (comparatives, if-sentences and wishes, dates and the time, everyday phrases, family
 * and home, food and drink, the future) are held to the Plus and Pro collection's bar, the three of the original library
 * too (comparatives, everyday phrases, the future, which had only two or three questions per level): every level has 8+
 * items, 4+ of them questions, numbers or orderings, every answer is explained in 40+ characters, and the right answer is
 * the longest option in at most 40 % of the questions in each language (everyday phrases gave it away in 56 %, with wrong
 * options such as "XOXO" and "Yes, I mind." next to "Kind regards," and "No, not at all."). A few facts are recomputed.
 */

const IDS = [
  "lang-en-comparatives", "lang-en-conditionals", "lang-en-dates-time", "lang-en-everyday",
  "lang-en-family-home", "lang-en-food-drink", "lang-en-future",
] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The question (in one language, 0 = en, 1 = he) whose prompt contains `needle`. */
function question(c: TopicContent, needle: string, lang: 0 | 1 = 0): QText {
  for (const l of LEVELS) for (const pair of c[l].q ?? []) if (pair[lang][0].includes(needle)) return pair[lang];
  throw new Error(`no question with "${needle}"`);
}

describe("wave 4 C36: seven English topics at the collection's bar", () => {
  it.each(IDS)("%s: every level has 8+ items, 4+ of them asked, and every answer is explained in 40+ characters", async (id) => {
    expect(findTopic(id)).toBeDefined();
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const asked = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + asked, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(asked, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      for (const pair of lv.q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
    }
  });

  it.each(IDS)("%s: the right answer is the longest option in at most 40 %% of the questions, in each language", async (id) => {
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

  it.each(IDS)("%s: Hebrew text has no < or > (a right-to-left line mirrors them) and he/en options match", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
    }
  });
});

describe("wave 4 C36: facts and explanations", () => {
  it("conditionals: the explanation no longer files will have under the first conditional", async () => {
    const c = await load("lang-en-conditionals");
    const [, answer, , en] = question(c, "a million dollars");
    expect(answer).toBe("had");
    expect(en).not.toMatch(/will have belong/i);
    expect(en).toMatch(/neither will nor would is used in the if-part/);
  });

  it("comparatives: the new questions ask about than, as … as, less, doubling, -ier and much", async () => {
    const c = await load("lang-en-comparatives");
    expect(question(c, "cheetah")[1]).toBe("than");
    expect(question(c, "as heavy ___ yours")[1]).toBe("as");
    expect(question(c, "so it is cheaper")[1]).toBe("less");
    expect(question(c, "comparative of “hot”")[1]).toBe("hotter");
    expect(question(c, "(happy)")[1]).toBe("happier");
    expect(question(c, "easier than I expected")[1]).toBe("much");
  });

  it("future: every answer with will uses the base form after it (no -s, no to, no -ing)", async () => {
    const c = await load("lang-en-future");
    for (const l of LEVELS) for (const [en] of c[l].q ?? []) {
      const answer = en[1];
      const m = /\bwill (\w+)/.exec(answer) ?? /'ll (\w+)/.exec(answer);
      if (!m) continue;
      expect(m[1], answer).not.toMatch(/^(to|\w+s|\w+ing)$/);
    }
  });

  it("dates and the time: the numeric answers are recomputed", async () => {
    const c = await load("lang-en-dates-time");
    const n = (l: "b" | "i" | "a") => c[l].n![0]![0];
    expect(n("b")).toBe(new Date(Date.UTC(2025, 6, 0)).getUTCDate()); // days in June
    const week = new Date(Date.UTC(2025, 2, 29 + 7));
    expect(week.getUTCMonth()).toBe(3); // April
    expect(n("i")).toBe(week.getUTCDate());
    expect(n("a")).toBe((10 * 60 + 45) - (9 * 60 + 15));
    const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const [, answer, wrong] = question(c, "leap year");
    expect(leap(Number(answer))).toBe(true);
    for (const w of wrong) expect(leap(Number(w)), w).toBe(false);
  });
});
