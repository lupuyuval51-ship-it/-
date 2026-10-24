import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { QText, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, C39: seven English topics (questions, relative clauses, reported speech, spelling, synonyms and antonyms, the
 * verb to be, word parts) are held to the Plus and Pro collection's bar, the two of the original library too (asking
 * questions had only two questions per level and explanations as short as "Short answers repeat the helper verb: do.",
 * word parts three beginner questions): every level has 8+ items, 4+ of them questions, numbers or orderings, every answer
 * is explained in 40+ characters, and the right answer is the longest option in at most 40 % of the questions in each
 * language. A number question no longer counts its own answer out loud.
 */

const IDS = [
  "lang-en-questions", "lang-en-relative-clauses", "lang-en-reported-speech", "lang-en-spelling",
  "lang-en-synonyms-antonyms", "lang-en-verb-to-be", "lang-en-word-parts",
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

describe("wave 5 C39: seven English topics at the collection's bar", () => {
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

  it.each(IDS)("%s: Hebrew text has no < or >, he/en options match, no option repeats and no prompt is asked twice", async (id) => {
    const c = await load(id);
    const prompts = new Set<string>();
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
      for (const [, answer, wrong] of [en, he]) expect(new Set([answer, ...wrong]).size, `${id}/${l}: ${en[0]}`).toBe(wrong.length + 1);
      expect(prompts.has(en[0]), `${id}/${l}: ${en[0]} is asked twice`).toBe(false);
      prompts.add(en[0]);
    }
  });
});

describe("wave 5 C39: answer keys, wrong options and give-aways", () => {
  it("asking questions: a subject question needs no did, an object question does, and the tag for I am is aren't I", async () => {
    const c = await load("lang-en-questions");
    const subject = question(c, "Someone broke the window");
    expect(subject[1]).toBe("Who broke the window?");
    expect(subject[2]).toContain("Who did broke the window?");
    const object = question(c, "Tom called someone");
    expect(object[1]).toBe("Who did Tom call?");
    // "Who called Tom?" asks about the subject: a real wrong answer, not a second right one.
    expect(object[2]).toContain("Who called Tom?");
    const tag = question(c, "I'm in your team");
    expect(tag[1]).toBe("aren't I");
    // "am I not" is formal but correct English, so it must never be offered as a wrong tag.
    for (const lang of [0, 1] as const) expect(question(c, "I'm in your team", lang)[2]).not.toContain("am I not");
    expect(question(c, "She can't swim")[1]).toBe("can she");
    expect(question(c, "old are you")[1]).toBe("How");
  });

  it("asking questions: the advanced level still has a meaning that is itself a question (a tag question)", async () => {
    const c = await load("lang-en-questions");
    expect(c.a.t?.some(([, meaning]) => meaning.endsWith("?"))).toBe(true);
  });

  it("the verb to be: the number question does not count its own answer out loud", async () => {
    const c = await load("lang-en-verb-to-be");
    const item = c.b.n?.find(([answer, en]) => answer === 3 && en[0].includes("present forms"));
    expect(item).toBeDefined();
    const [, en, he] = item!;
    expect(en[0]).not.toMatch(/one for/i);
    expect(he[0]).not.toContain("אחת ל־");
  });

  it("word parts: pre- means before, and kindful is not called a non-word (it is old and rare, not impossible)", async () => {
    const c = await load("lang-en-word-parts");
    const pre = question(c, "pre-");
    expect(pre[1]).toBe("before");
    expect(question(c, "pre", 1)[1]).toBe("לפני");
    const kind = question(c, "turns the adjective");
    expect(kind[3]).not.toMatch(/is not a word/);
    expect(question(c, "kind", 1)[3]).not.toContain("אינה מילה");
  });
});
