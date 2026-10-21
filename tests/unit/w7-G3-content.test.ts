import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, QText, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 7, G3: nine language topics (English pronouns, punctuation, questions, relative clauses, reported speech, synonyms
 * and antonyms, word parts, Hebrew connectives, world languages) with no short answer spelled out next to its question.
 * A game shows the items of a level together, so a term description, a number prompt, an ordering step or another
 * question of a level must not name the answer of a choice question of that level (a term "possessive pronoun: mine,
 * yours, hers" next to "It's ___ (it belongs to her)"). The examples were reworded; the cases are pinned here so they
 * stay removed. A list that names every option together (who, which, whose) is left: it does not pick the answer.
 */

const IDS = [
  "lang-en-pronouns", "lang-en-punctuation", "lang-en-questions", "lang-en-relative-clauses", "lang-en-reported-speech",
  "lang-en-synonyms-antonyms", "lang-en-word-parts", "lang-he-connectors", "lang-world-languages",
] as const;
const LEVELS = ["b", "i", "a"] as const;
type Level = (typeof LEVELS)[number];
type Lang = 0 | 1;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Everything of a level a player reads next to its questions, in one language (0 = en, 1 = he). */
function shownWith(lv: LevelContent, lang: Lang): string[] {
  return [
    ...(lv.t ?? []).map((t) => (lang ? t[3] : t[1])),
    ...(lv.q ?? []).map((pair) => pair[lang][0]),
    ...(lv.n ?? []).map((n) => (lang ? n[2] : n[1])[0]),
    ...(lv.s ?? []).flatMap((o) => o[lang].slice(1)),
  ];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** `word` appears in `text` as a whole word (not inside whose, that's, unhappy, ...), ignoring case. */
const hasWord = (text: string, word: string) =>
  new RegExp(`(^|[^\\p{L}'])${esc(word.toLowerCase())}(?![\\p{L}'])`, "u").test(text.toLowerCase());

/** The question (in one language) of a level whose prompt contains `needle`. */
function question(c: TopicContent, l: Level, needle: string, lang: Lang = 0): QText {
  for (const pair of c[l].q ?? []) if (pair[lang][0].includes(needle)) return pair[lang];
  throw new Error(`no question with "${needle}" at ${l}`);
}

/** No text shown at that level, other than the question itself, names the question's answer. */
async function expectNotGivenAway(id: string, l: Level, needle: string, lang: Lang): Promise<void> {
  const c = await load(id);
  const [prompt, answer] = question(c, l, needle, lang);
  const word = answer.trim().replace(/[.!?]$/, "");
  for (const text of shownWith(c[l], lang)) if (text !== prompt) expect(hasWord(text, word), `${id}/${l}: "${word}" in "${text}"`).toBe(false);
}

/** The meaning of the term `name` (en) at a level, in one language. */
function termMeaning(c: TopicContent, l: Level, name: string, lang: Lang): string {
  const t = (c[l].t ?? []).find((x) => x[0] === name);
  if (!t) throw new Error(`no term ${name} at ${l}`);
  return lang ? t[3] : t[1];
}

describe("wave 7 G3: nine language topics at the collection's bar", () => {
  it.each(IDS)("%s: every level has 8+ items, 4+ of them asked, and every answer is explained in 40+ characters", async (id) => {
    expect(findTopic(id)).toBeDefined();
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const asked = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + asked, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(asked, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      for (const pair of lv.q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect(explanation, `${id}/${l}: ${q}`).toContain(String(answer));
      }
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

  it.each(IDS)("%s: Hebrew has no < or >, a blank is never ?, and he/en keep the same items in the same shape", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      for (const text of shownWith(lv, 1)) {
        expect(text, `${id}/${l}`).not.toMatch(/[<>]/);
        expect(text, `${id}/${l}`).not.toMatch(/=\s*\?|\?\s*=/);
      }
      for (const [en, he] of lv.q ?? []) {
        expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
        expect(new Set([he[1], ...he[2]]).size, `${id}/${l}: ${he[0]}`).toBe(he[2].length + 1);
      }
      for (const [en, he] of lv.s ?? []) expect(he.length, `${id}/${l}: ${en[0]}`).toBe(en.length);
      for (const [, en, he] of lv.n ?? []) expect(Boolean(en[1])).toBe(Boolean(he[1]));
    }
  });
});

describe("wave 7 G3: short answers are not spelled out next to their questions", () => {
  it("pronouns: the subject list no longer names they; the possessive and reflexive examples no longer name mine, hers, its, our or themselves", async () => {
    for (const lang of [0, 1] as const) {
      await expectNotGivenAway("lang-en-pronouns", "b", lang ? "איזו מילה היא כינוי גוף" : "Which word is a pronoun", lang);
      await expectNotGivenAway("lang-en-pronouns", "i", "This book is ___", lang);
      await expectNotGivenAway("lang-en-pronouns", "i", "That isn't my bag", lang);
      await expectNotGivenAway("lang-en-pronouns", "i", "The cat licked ___ paw", lang);
      await expectNotGivenAway("lang-en-pronouns", "i", "We love ___ new teacher", lang);
      await expectNotGivenAway("lang-en-pronouns", "a", "They looked at ___ in the mirror", lang);
    }
    const c = await load("lang-en-pronouns");
    // the each-other question now uses we, so it no longer prints the answer "themselves"
    expect(question(c, "a", "We hurt ourselves")[1]).toContain("each of us");
    expect(c.i.n![0]![0]).toBe(3);
  });

  it("punctuation: the apostrophe term no longer shows don't or Dan's bag, and the capitals count no longer writes monday", async () => {
    for (const lang of [0, 1] as const) {
      await expectNotGivenAway("lang-en-punctuation", "i", "do not", lang);
      await expectNotGivenAway("lang-en-punctuation", "i", lang ? "חייבת תמיד להתחיל באות גדולה" : "must always start with a capital letter", lang);
      const c = await load("lang-en-punctuation");
      for (const text of shownWith(c.i, lang)) expect(text.toLowerCase(), "the Dan's bag question").not.toContain("dan's bag");
    }
    const c = await load("lang-en-punctuation");
    expect(c.i.n![0]![0]).toBe(5);
    expect(c.i.n![0]![1][0]).toContain("on friday dan and i visited paris");
  });

  it("questions: the count no longer lists where, who or why (nor opens with How), and the short-answer term no longer shows Yes, I do", async () => {
    for (const lang of [0, 1] as const) {
      const c = await load("lang-en-questions");
      const count = (lang ? c.b.n![0]![2] : c.b.n![0]![1])[0];
      for (const w of ["who", "where", "why", "when", "how"]) expect(hasWord(count, w), `${w} in "${count}"`).toBe(false);
      await expectNotGivenAway("lang-en-questions", "i", "Do you like apples", lang);
      await expectNotGivenAway("lang-en-questions", "i", "Is your brother at school", lang);
    }
  });

  it("relative clauses: that, the girl who sings, Everest + which and the sentential which are gone from the shown texts", async () => {
    const c = await load("lang-en-relative-clauses");
    for (const lang of [0, 1] as const) {
      await expectNotGivenAway("lang-en-relative-clauses", "b", lang ? "איזו מילה אחת מתאימה לשני החסרים" : "Which one word fits both gaps", lang);
      for (const text of shownWith(c.b, lang)) {
        expect(text, "a who example next to “The man ___ lives next door”").not.toMatch(/girl who sings|boy who won/);
        expect(text, "a which example next to “the book ___ I told you about”").not.toMatch(/bike which I bought/);
      }
      for (const text of shownWith(c.i, lang)) expect(text, "a which example next to “Paris, ___ is the capital”").not.toMatch(/Everest which/);
      expect(hasWord(termMeaning(c, "a", "sentential relative clause", lang), "which")).toBe(false);
    }
    expect(c.b.n![0]![0]).toBe(3);
    expect(question(c, "b", "Which one word fits both gaps")[2]).toEqual(["who", "which", "what"]);
  });

  it("reported speech: no b-level text writes was or said that next to the questions that ask for them", async () => {
    const c = await load("lang-en-reported-speech");
    for (const lang of [0, 1] as const) {
      await expectNotGivenAway("lang-en-reported-speech", "b", "Tom said that he ___ hungry", lang);
      await expectNotGivenAway("lang-en-reported-speech", "b", "Omer said that he ___ sick", lang);
      await expectNotGivenAway("lang-en-reported-speech", "b", "She ___ me that", lang);
    }
    // "He ___ that he liked pizza" (answer said) sat next to three prompts that wrote "X said that he/she"
    for (const pair of c.b.q ?? []) expect(pair[0][1]).not.toBe("said");
    expect(termMeaning(c, "b", "backshift", 0)).toContain("go becomes went");
  });

  it("synonyms and antonyms: the term examples and the pairs count no longer show hot – cold or big – large", async () => {
    for (const lang of [0, 1] as const) {
      await expectNotGivenAway("lang-en-synonyms-antonyms", "b", lang ? "מה ההפך של hot" : "opposite of “hot”", lang);
      await expectNotGivenAway("lang-en-synonyms-antonyms", "b", lang ? "אותו דבר כמו big" : "means the same as “big”", lang);
    }
    const c = await load("lang-en-synonyms-antonyms");
    expect(c.b.n![0]![0]).toBe(2);
  });

  it("word parts: the noun-suffix term no longer shows -ness or kindness, and the ordering no longer builds a word with un-", async () => {
    const c = await load("lang-en-word-parts");
    for (const lang of [0, 1] as const) {
      const noun = termMeaning(c, "i", "Noun suffix", lang);
      expect(noun).not.toMatch(/ness|kindness/);
      for (const step of c.i.s![0]![lang].slice(1)) expect(step).not.toMatch(/\bun\b|unhelp/);
      for (const text of shownWith(c.i, lang)) expect(text).not.toContain("kindness");
    }
  });

  it("Hebrew connectives: the relation terms no longer name the connective their question asks about", async () => {
    const c = await load("lang-he-connectors");
    for (const lang of [0, 1] as const) {
      expect(termMeaning(c, "b", "Contrast", lang)).not.toContain("אבל");
      expect(termMeaning(c, "b", "Result", lang)).not.toContain("לכן");
      expect(termMeaning(c, "i", "Concession", lang)).not.toContain("למרות");
      expect(termMeaning(c, "i", "Concession", lang)).not.toContain("אף ש");
      expect(termMeaning(c, "i", "Purpose", lang)).not.toContain("כדי");
      expect(termMeaning(c, "a", "Hypothetical condition", lang)).not.toContain("אילו");
      await expectNotGivenAway("lang-he-connectors", "i", "___ שירד גשם כל היום", lang);
    }
    // "איזה משפט מבטא תנאי?" no longer has the answer "בתנאי ש", which repeated the word of the question
    expect(question(c, "i", "איזה משפט מבטא תנאי", 1)[1]).not.toContain("תנאי");
  });

  it("world languages: the Indo-European term no longer lists English next to “which language is spoken by the most people”", async () => {
    // (the tsunami question still says the word is used "in English, Hebrew and many other languages": a topical mention)
    const c = await load("lang-world-languages");
    expect(question(c, "i", "second language are counted too", 0)[1]).toBe("English");
    expect(question(c, "i", "כשסופרים גם אנשים", 1)[1]).toBe("אנגלית");
    expect(termMeaning(c, "i", "Indo-European languages", 0)).not.toContain("English");
    expect(termMeaning(c, "i", "Indo-European languages", 1)).not.toContain("אנגלית");
  });
});
