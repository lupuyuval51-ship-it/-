import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { QText, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C37: seven English grammar topics (-ing or to, homophones, modals, the passive, past continuous, past perfect,
 * past simple) are held to the Plus and Pro collection's bar, the two of the original library too (modals and past simple
 * had only two or three questions per level and two explanations under 40 characters): every level has 8+ items, 4+ of
 * them questions, numbers or orderings, every answer is explained in 40+ characters, and the right answer is the longest
 * option in at most 40 % of the questions in each language. Wrong options that were in fact correct English are gone.
 */

const IDS = [
  "lang-en-gerunds-infinitives", "lang-en-homophones", "lang-en-modals", "lang-en-passive",
  "lang-en-past-continuous", "lang-en-past-perfect", "lang-en-past-simple",
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

describe("wave 4 C37: seven English grammar topics at the collection's bar", () => {
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

describe("wave 4 C37: no correct English among the wrong options", () => {
  it("past simple: the question about the film no longer offers the spoken check “You did see the film?”", async () => {
    const c = await load("lang-en-past-simple");
    for (const [lang, needle] of [[0, "Choose the correct question"], [1, "בחרו את השאלה הנכונה"]] as const) {
      const [, answer, wrong] = question(c, needle, lang);
      expect(answer).toBe("Did you see the film?");
      expect(wrong).not.toContain("You did see the film?");
    }
  });

  it("past simple: “I watched TV when the phone was ringing all the time.” (grammatical) is no longer a wrong option", async () => {
    const c = await load("lang-en-past-simple");
    for (const pair of c.a.q ?? []) for (const [, , wrong] of pair) expect(wrong).not.toContain("I watched TV when the phone was ringing all the time.");
    const [, answer, wrong] = c.a.q![0]![0];
    expect(answer).toBe("I was watching TV when the phone rang.");
    expect(wrong).toContain("I were watching TV when the phone rang.");
  });

  it("past simple: ago is explained without claiming that for goes only with the present perfect", async () => {
    const c = await load("lang-en-past-simple");
    const [, answer, , en] = question(c, "five years ___");
    expect(answer).toBe("ago");
    expect(en).not.toMatch(/for are used with the present perfect/);
    expect(en).toMatch(/counts back from now/);
  });

  it("modals: the new questions cover obligation, permission, possibility, past ability, past guesses and future ability", async () => {
    const c = await load("lang-en-modals");
    expect(question(c, "It's the law")[1]).toBe("must");
    expect(question(c, "asks for permission")[1]).toBe("Can I sit here?");
    expect(question(c, "Take an umbrella")[1]).toBe("might");
    expect(question(c, "When I was five")[1]).toBe("could");
    expect(question(c, "left it on the bus")[1]).toBe("might have");
    expect(question(c, "about the future")[1]).toBe("I will be able to drive next year.");
    // the umbrella question says "I'm not sure", so no certain modal may be its answer and should (expected) is not offered
    expect(question(c, "Take an umbrella")[2]).not.toContain("should");
  });
});
