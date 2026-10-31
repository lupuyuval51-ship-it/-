import { describe, expect, it } from "vitest";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, QText, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 7, G2: nine English topics no longer show a short answer (a word form, an example) word for word in a term
 * description, an ordering step or a number prompt of the same level, in either language. Reviewed mentions that do not
 * answer their question (a term listing every option together, the same word in an unrelated story) are listed below.
 */

const IDS = [
  "lang-en-food-drink", "lang-en-gerunds-infinitives", "lang-en-homophones", "lang-en-modals", "lang-en-past-perfect",
  "lang-en-past-simple", "lang-en-phonics", "lang-en-present-continuous", "lang-en-present-simple",
] as const;
const LEVELS = ["b", "i", "a"] as const;

/** `${id}/${level}/${answer}`: mentions that were checked and do not give the answer away. */
const REVIEWED = new Set([
  "lang-en-present-continuous/b/are", // the term lists am, is or are: every option of the question together
  "lang-en-present-simple/i/never", // the term lists always, usually, sometimes or never: every option together
  "lang-en-past-simple/i/were", // the was/were table names pronouns; the question's subject is "There + a plural"
  "lang-en-past-perfect/i/saw", // "the thief saw a bag" in the ordering story; the question is about another story
]);

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const shows = (text: string, word: string) => new RegExp(`(^|[^A-Za-z'])${esc(word)}($|[^A-Za-z'])`, "i").test(text);

/** Everything a game shows next to the level's questions, in one language (0 = en, 1 = he). */
function shown(lv: LevelContent, lang: 0 | 1): string[] {
  return [
    ...(lv.t ?? []).map((t) => (lang ? t[3] : t[1])),
    ...(lv.s ?? []).flatMap((s) => s[lang]),
    ...(lv.n ?? []).map((n) => (lang ? n[2] : n[1])[0]),
  ];
}

function question(c: TopicContent, needle: string, lang: 0 | 1 = 0): QText {
  for (const l of LEVELS) for (const pair of c[l].q ?? []) if (pair[lang][0].includes(needle)) return pair[lang];
  throw new Error(`no question with "${needle}"`);
}

describe("wave 7 G2: nine English topics keep the bar", () => {
  it.each(IDS)("%s: every level has 8+ items, 4+ of them asked", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const asked = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + asked, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(asked, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(IDS)("%s: no short answer is shown word for word by a term, an ordering or a number prompt of its level", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const lang of [0, 1] as const) {
      const texts = shown(c[l], lang);
      for (const pair of c[l].q ?? []) {
        const answer = pair[lang][1];
        if (answer.split(/\s+/).length > 3 || REVIEWED.has(`${id}/${l}/${answer}`)) continue;
        for (const text of texts) expect(shows(text, answer), `${id}/${l}/${lang ? "he" : "en"}: "${answer}" in "${text}"`).toBe(false);
      }
    }
  });
});

describe("wave 7 G2: the giveaways found by the scan stay removed", () => {
  it("food and drink: the sandwich steps and the loaf say piece, not slice; the countable noun is apple", async () => {
    const c = await load("lang-en-food-drink");
    expect(question(c, "Can I have a ___ of bread")[1]).toBe("slice");
    for (const lang of [0, 1] as const) for (const text of shown(c.i, lang)) expect(text).not.toMatch(/slice/i);
    expect(c.i.s![0]![0][1]).toBe("Take two pieces of bread");
    // "Crack the eggs" (scrambled eggs) is in the same level, so the countable answer is no longer egg
    expect(question(c, "can you count")[1]).toBe("apple");
  });

  it("gerunds: the gerund example no longer shows swimming", async () => {
    const c = await load("lang-en-gerunds-infinitives");
    expect(question(c, "I enjoy ___ in the sea")[1]).toBe("swimming");
    for (const lang of [0, 1] as const) for (const text of shown(c.b, lang)) expect(text).not.toMatch(/swimming/i);
  });

  it("homophones: the number prompts no longer show two, you're or its, and stationery is not defined next to stationary", async () => {
    const c = await load("lang-en-homophones");
    const [twoCount, en] = [c.b.n![0]![0], c.b.n![0]![1]];
    expect(twoCount).toBe(2);
    expect(en[0]).toContain("These four flowers are for you.");
    for (const lang of [0, 1] as const) for (const text of shown(c.b, lang)) expect(shows(text, "two")).toBe(false);
    const wrong = c.i.n![0]!;
    expect(wrong[0]).toBe(3);
    expect(wrong[1][0]).toContain("I no it will be sunny, so meat me hear at the park.");
    for (const lang of [0, 1] as const) for (const text of shown(c.i, lang)) {
      expect(shows(text, "its"), text).toBe(false);
      expect(shows(text, "you're"), text).toBe(false);
    }
    expect(question(c, "at the red light")[1]).toBe("stationary");
    expect((c.a.t ?? []).map((t) => t[0])).not.toContain("stationery");
  });

  it("modals: terms no longer repeat the umbrella or the future-ability question, nor list should and must as examples", async () => {
    const c = await load("lang-en-modals");
    for (const lang of [0, 1] as const) {
      for (const text of shown(c.b, lang)) {
        expect(shows(text, "should"), text).toBe(false);
        expect(shows(text, "must"), text).toBe(false);
      }
      for (const text of shown(c.i, lang)) expect(text).not.toContain("rain later");
      for (const text of shown(c.a, lang)) expect(text).not.toContain("I will ___");
    }
  });

  it("past perfect: the film question asks for the whole verb, and no term repeats the film or names saw", async () => {
    const c = await load("lang-en-past-perfect");
    for (const lang of [0, 1] as const) {
      const [, answer, wrong] = question(c, "When we arrived, the film", lang);
      expect(answer).toBe("had already begun");
      expect(wrong).toContain("had already began");
      for (const text of shown(c.b, lang)) expect(text).not.toContain("film");
      for (const t of c.i.t ?? []) expect(shows(lang ? t[3] : t[1], "saw")).toBe(false);
    }
    expect(question(c, "Suddenly we saw a dolphin")[1]).toBe("saw");
  });

  it("past simple: the examples are walk, eat, plan and they were reading; the was/were question asks about there", async () => {
    const c = await load("lang-en-past-simple");
    for (const lang of [0, 1] as const) {
      const b = shown(c.b, lang).join(" | ");
      for (const word of ["went", "played", "finished"]) expect(shows(b, word), word).toBe(false);
      expect(shows(shown(c.i, lang).join(" | "), "stopped")).toBe(false);
      expect(shown(c.a, lang).join(" | ")).not.toContain("I was reading");
      const [, answer, wrong] = question(c, "There ___ a lot of people", lang);
      expect(answer).toBe("were");
      expect(wrong).toContain("was");
    }
  });

  it("phonics: no term lists the vowel o, ck, st, city or knee next to the question it answers", async () => {
    const c = await load("lang-en-phonics");
    expect(question(c, "two vowel letters")[1]).toBe("boat");
    for (const lang of [0, 1] as const) {
      for (const text of shown(c.i, lang)) for (const w of ["ck", "st"]) expect(shows(text, w), text).toBe(false);
      // knee stays in the number prompt ("How many sounds in knee?"); only the silent-letter term no longer names it
      for (const t of c.a.t ?? []) for (const w of ["city", "knee"]) expect(shows(lang ? t[3] : t[1], w), t[0]).toBe(false);
    }
  });

  it("present continuous: no example shows eating, swimming, lying, want or I am", async () => {
    const c = await load("lang-en-present-continuous");
    for (const lang of [0, 1] as const) {
      const b = shown(c.b, lang).join(" | ");
      expect(shows(b, "eating")).toBe(false);
      expect(b).not.toMatch(/\bI am\b/);
      const i = shown(c.i, lang).join(" | ");
      for (const w of ["swimming", "lying"]) expect(shows(i, w), w).toBe(false);
      expect(shows(shown(c.a, lang).join(" | "), "want")).toBe(false);
    }
    expect(c.b.n![0]![0]).toBe(2);
  });

  it("present simple: the examples no longer show watches, I walk to school or know", async () => {
    const c = await load("lang-en-present-simple");
    for (const lang of [0, 1] as const) {
      expect(shown(c.b, lang).join(" | ")).not.toContain("I walk to school");
      expect(shows(shown(c.i, lang).join(" | "), "watches")).toBe(false);
      expect(shows(shown(c.a, lang).join(" | "), "know")).toBe(false);
    }
    expect(question(c, "He ___ TV after dinner")[1]).toBe("watches");
  });
});
