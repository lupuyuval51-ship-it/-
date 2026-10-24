import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, QText, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, F5: ten topics (past continuous, present perfect, Hebrew acronyms, gender and number, smichut, data spread,
 * history of maths, money, probability, simultaneous equations) at the collection's bar, with no giveaways: a game shows
 * the items of a level together, so no term, number prompt, ordering step or other question of a level may name the answer
 * of a choice question of the same level. The cases removed here (an ordering step that wrote "was eating", a term whose
 * example was the answer, a number prompt that named Euclid as the author of the Elements, an ordering that ended in the
 * answer 1/4, ...) are pinned so they stay removed.
 */

const IDS = [
  "lang-en-past-continuous", "lang-en-present-perfect", "lang-he-acronyms", "lang-he-gender-number", "lang-he-smichut",
  "math-data-spread", "math-history-of-maths", "math-money", "math-probability", "math-simultaneous-equations",
] as const;
const LEVELS = ["b", "i", "a"] as const;
type Level = (typeof LEVELS)[number];

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Everything of a level a player reads next to its questions, in one language (0 = en, 1 = he). */
function shownWith(lv: LevelContent, lang: 0 | 1): string[] {
  return [
    ...(lv.t ?? []).flatMap((t) => (lang ? [t[3]] : [t[1]])),
    ...(lv.q ?? []).map((pair) => pair[lang][0]),
    ...(lv.n ?? []).map((n) => (lang ? n[2] : n[1])[0]),
    ...(lv.s ?? []).flatMap((o) => o[lang].slice(1)),
  ];
}

/** The question (in one language) of a level whose prompt contains `needle`. */
function question(c: TopicContent, l: Level, needle: string, lang: 0 | 1 = 0): QText {
  for (const pair of c[l].q ?? []) if (pair[lang][0].includes(needle)) return pair[lang];
  throw new Error(`no question with "${needle}" at ${l}`);
}

/** No text shown at that level (other than the question itself) contains the question's answer. */
async function expectNotGivenAway(id: string, l: Level, needle: string, lang: 0 | 1): Promise<void> {
  const c = await load(id);
  const [prompt, answer] = question(c, l, needle, lang);
  for (const text of shownWith(c[l], lang)) if (text !== prompt) expect(text.toLowerCase(), `${id}/${l}: ${prompt}`).not.toContain(answer.toLowerCase());
}

describe("wave 5 F5: ten topics at the collection's bar", () => {
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

  it.each(IDS)("%s: Hebrew has no < or >, a blank is x and never ?, and he/en keep the same items in the same shape", async (id) => {
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
    }
  });

  it("the giveaways the scan found stay removed", async () => {
    // An ordering step wrote the answer "was eating"; a number prompt wrote "We have known each other".
    await expectNotGivenAway("lang-en-past-continuous", "b", "At 8 o'clock last night", 0);
    await expectNotGivenAway("lang-en-past-continuous", "b", "At 8 o'clock last night", 1);
    await expectNotGivenAway("lang-en-present-perfect", "a", "each other since primary school", 0);
    await expectNotGivenAway("lang-en-present-perfect", "a", "each other since primary school", 1);
    // The gershayim term said where they go; the smichut and number terms used the answer as their example.
    await expectNotGivenAway("lang-he-acronyms", "b", "gershayim (״) go", 0);
    await expectNotGivenAway("lang-he-acronyms", "b", "את הגרשיים", 1);
    await expectNotGivenAway("lang-he-gender-number", "a", "three books", 0);
    await expectNotGivenAway("lang-he-gender-number", "a", "המספר שלוש", 1);
    await expectNotGivenAway("lang-he-smichut", "a", "the three boys", 0);
    await expectNotGivenAway("lang-he-smichut", "a", "בשלושה ילדים", 1);
    // A number prompt named Euclid's Elements; an ordering step put al-Khwarizmi in Baghdad.
    await expectNotGivenAway("math-history-of-maths", "b", "Who wrote the 'Elements'", 0);
    await expectNotGivenAway("math-history-of-maths", "b", "מי כתב את", 1);
    await expectNotGivenAway("math-history-of-maths", "i", "House of Wisdom", 0);
    await expectNotGivenAway("math-history-of-maths", "i", "בית החוכמה", 1);
  });

  it("short answers are not spelled out either: examples in terms and the last step of an ordering", async () => {
    // "gone" was an example of a past participle; מס׳ the example of an abbreviation; אבות of an irregular plural; יומיים of the dual.
    await expectNotGivenAway("lang-en-present-perfect", "b", "past participle of go", 0);
    await expectNotGivenAway("lang-en-present-perfect", "b", "הצורה השלישית של go", 1);
    await expectNotGivenAway("lang-he-acronyms", "b", "written in short", 0);
    await expectNotGivenAway("lang-he-acronyms", "b", "בקיצור", 1);
    await expectNotGivenAway("lang-he-gender-number", "i", "plural of אב", 0);
    await expectNotGivenAway("lang-he-gender-number", "i", "הרבים של ״אב״", 1);
    await expectNotGivenAway("lang-he-gender-number", "i", "two days", 0);
    // The multiplication-rule ordering ended in "Write the answer: 1/4", the answer of "two heads in two flips".
    await expectNotGivenAway("math-probability", "a", "flip a fair coin twice. What is the probability of two heads", 0);
    await expectNotGivenAway("math-probability", "a", "מטילים מטבע הוגן פעמיים. מה ההסתברות לקבל", 1);
    // "You ___ laughing" sat next to the prompt "What were you doing?"; the subject is now we.
    const pc = await load("lang-en-past-continuous");
    const be = question(pc, "b", "right past form of be");
    expect(be[0]).toContain("We ___ laughing");
    expect(be[1]).toBe("were");
  });

  it("terms no longer state the reason a question asks for", async () => {
    const acr = await load("lang-he-acronyms");
    const tetVav = acr.a.t!.find((t) => t[0].startsWith("ט״ו"))!;
    expect(tetVav[1]).not.toMatch(/God/);
    expect(tetVav[3]).not.toMatch(/האל/);
    const spread = await load("math-data-spread");
    const deviation = spread.a.t!.find((t) => t[0] === "Deviation from the mean")!;
    expect(deviation[1]).not.toMatch(/add up to 0/);
    expect(deviation[3]).not.toMatch(/סכום/);
    const hist = await load("math-history-of-maths");
    const coords = hist.a.t!.find((t) => t[0] === "Coordinate geometry")!;
    expect(coords[1]).not.toMatch(/equation/);
    expect(coords[3]).not.toMatch(/משוואות/);
  });

  it("facts that were checked stay right", async () => {
    // Rashi (1040–1105) lived more than 900 years ago, not "about 900".
    const acr = await load("lang-he-acronyms");
    const rashi = question(acr, "i", "רש״י");
    expect(rashi[3]).toContain("more than 900 years ago");
    expect(question(acr, "i", "רש״י", 1)[3]).toContain("לפני יותר מ־900 שנה");
    // The new term examples are grammatical: ארבעה with the masculine כיסאות, ארבע with the feminine כיתות; חמשת הספרים.
    const gn = await load("lang-he-gender-number");
    expect(gn.a.t!.find((t) => t[0] === "Gender of numbers")![1]).toContain("ארבעה כיסאות but ארבע כיתות");
    const sm = await load("lang-he-smichut");
    expect(sm.a.t!.find((t) => t[0] === "Number construct")![1]).toContain("חמשת הספרים");
    // The new probability ordering: 1/3 × 1/3 = 1/9.
    const pr = await load("math-probability");
    expect(pr.a.s![0]![0].slice(-2)).toEqual(["Multiply the chances of the two spins: 1/3 × 1/3", "Write the answer: 1/9"]);
    // Present perfect: three of the four sentences are correct (only the one with yesterday is wrong).
    const pp = await load("lang-en-present-perfect");
    const [count, en] = pp.a.n![0]!;
    expect(count).toBe(3);
    expect(en[0]).toContain("I've seen him yesterday.");
    expect(en[0]).not.toMatch(/known/);
  });
});
