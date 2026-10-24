import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { QText, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C38: seven English topics (phonics, prepositions, present continuous, present perfect, present simple, pronouns,
 * punctuation) are held to the Plus and Pro collection's bar, the three of the original library too (prepositions and the
 * present simple had only two or three questions per level, and explanations as short as "Months take in: in March."):
 * every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained in 40+ characters, and
 * the right answer is the longest option in at most 40 % of the questions in each language. Wrong options that were in
 * fact acceptable spoken English are gone.
 */

const IDS = [
  "lang-en-phonics", "lang-en-prepositions", "lang-en-present-continuous", "lang-en-present-perfect",
  "lang-en-present-simple", "lang-en-pronouns", "lang-en-punctuation",
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

describe("wave 4 C38: seven English topics at the collection's bar", () => {
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

  it.each(IDS)("%s: Hebrew text has no < or >, he/en options match and no option repeats", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
      for (const [, answer, wrong] of [en, he]) expect(new Set([answer, ...wrong]).size, `${id}/${l}: ${en[0]}`).toBe(wrong.length + 1);
    }
  });
});

describe("wave 4 C38: answer keys and wrong options", () => {
  it("present simple: the question about pizza no longer offers the spoken check question “He does like pizza?”", async () => {
    const c = await load("lang-en-present-simple");
    for (const lang of [0, 1] as const) {
      const [, answer, wrong] = question(c, lang ? "בחרו את השאלה הנכונה" : "Choose the correct question", lang);
      expect(answer).toBe("Does he like pizza?");
      expect(wrong).not.toContain("He does like pizza?");
      expect(wrong).toContain("Likes he pizza?");
    }
  });

  it("prepositions: the new questions keep one clearly right answer, the same in both languages", async () => {
    const c = await load("lang-en-prepositions");
    const keys: [string, string][] = [
      ["The ball is ___ the box and the chair", "between"],
      ["The shoes are ___ the bed", "under"],
      ["We are having a party ___ Saturday", "on"],
      ["I have played the piano ___ three years", "for"],
      ["Please send the form ___ Friday at the latest", "by"],
      ["She fell asleep ___ the film", "during"],
    ];
    for (const [needle, key] of keys) for (const lang of [0, 1] as const) {
      const [, answer, wrong] = question(c, needle, lang);
      expect(answer, needle).toBe(key);
      // "until Friday" and "while the film" are the learner's mistakes, not a second right answer
      expect(wrong.includes(key), needle).toBe(false);
    }
    // the "between" prompt says the ball is in the middle, so neither "behind" nor "under" can also be right
    expect(question(c, "The ball is ___ the box")[0]).toContain("in the middle");
  });

  it("present simple: third person -s and the general truth with a plural subject", async () => {
    const c = await load("lang-en-present-simple");
    expect(question(c, "The sun ___ in the east")[1]).toBe("rises");
    expect(question(c, "Cows ___ grass")[1]).toBe("eat");
    expect(question(c, "Cows ___ grass")[2]).toContain("eats");
    expect(question(c, "He ___ TV after dinner")[1]).toBe("watches");
    expect(question(c, "This bike ___ to my sister")[2]).toContain("is belonging");
  });

  it("punctuation: the question-mark question asks about a real question and only one", async () => {
    const c = await load("lang-en-punctuation");
    for (const lang of [0, 1] as const) {
      const [, answer, wrong] = question(c, lang ? "סימן שאלה בסופו" : "needs a question mark at the end", lang);
      expect(answer).toBe("Where do you live");
      for (const w of wrong) expect(/^(where|what|who|why|how|when|do|does|is|are|can)\b/i.test(w), w).toBe(false);
    }
  });
});
