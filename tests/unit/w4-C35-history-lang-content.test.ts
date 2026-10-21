import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C35: seven topics (the two world wars, the history of writing, Zionism, English adverbs, articles and plurals,
 * the body and health) are held to the Plus and Pro collection's bar, the history of writing and English articles and
 * plurals too although they belong to the original library: every level has 8+ items, 4+ of them questions, numbers or
 * orderings, every answer is explained in 40+ characters, and the right answer is the longest option in at most 40 % of
 * the questions in each language. Both had only two questions per level, and the history of writing gave the answer
 * away by its length in 67 % of them (with wrong options such as "Antarctica" and "They were found on the Moon").
 * The sums written in the explanations are checked (a − b = c, in both languages), and so are a few fixed facts.
 */

const IDS = [
  "history-world-war-1", "history-world-war-2", "history-writing", "history-zionism",
  "lang-en-adverbs", "lang-en-articles-plurals", "lang-en-body-health",
] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Every text a learner reads as an explanation: choice explanations and numeric explanations, in both languages. */
function explanations(c: TopicContent): string[] {
  const out: string[] = [];
  for (const l of LEVELS) {
    for (const pair of c[l].q ?? []) for (const [, , , explanation] of pair) out.push(explanation);
    for (const [, en, he] of c[l].n ?? []) out.push(en[2], he[2]);
  }
  return out;
}

/** Every Hebrew text of a topic: terms, questions, options, explanations, number items and orderings. */
function hebrewTexts(c: TopicContent): string[] {
  const out: string[] = [];
  for (const l of LEVELS) {
    for (const [, , heTerm, heMeaning] of c[l].t ?? []) out.push(heTerm, heMeaning);
    for (const [, he] of c[l].q ?? []) out.push(he[0], he[1], ...he[2], he[3]);
    for (const [, , he] of c[l].n ?? []) out.push(he[0], he[1], he[2]);
    for (const [, he] of c[l].s ?? []) out.push(...he);
  }
  return out;
}

const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
const SUM = new RegExp(String.raw`(${NUM})\s*([−+×])\s*(${NUM})\s*=\s*(${NUM})`, "g");
const toNumber = (s: string) => Number(s.replace(/,/g, ""));

describe("wave 4 C35: seven history and English topics at the collection's bar", () => {
  it.each(IDS)("%s is listed and every level has 8+ items, 4+ of them questions, numbers or orderings", async (id) => {
    expect(findTopic(id)).toBeDefined();
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const asked = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect(asked, `${id} ${l}`).toBeGreaterThanOrEqual(4);
      expect(asked + (lv.t?.length ?? 0), `${id} ${l}`).toBeGreaterThanOrEqual(8);
    }
  });

  it.each(IDS)("%s explains every answer in 40+ characters and keeps < and > out of Hebrew", async (id) => {
    const c = await load(id);
    for (const e of explanations(c)) expect(e.length, e).toBeGreaterThanOrEqual(40);
    for (const he of hebrewTexts(c)) expect(he, he).not.toMatch(/[<>]/);
  });

  it.each(IDS)("%s: the right answer is the longest option in at most 40 %% of the questions, in each language", async (id) => {
    const c = await load(id);
    const longest = [0, 0], all = [0, 0];
    for (const l of LEVELS) for (const pair of c[l].q ?? []) pair.forEach(([, answer, wrong], lang) => {
      all[lang]!++;
      if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
      expect(wrong, answer).not.toContain(answer);
      expect(new Set(wrong).size, answer).toBe(wrong.length);
    });
    for (const lang of [0, 1]) expect(longest[lang]! / all[lang]!, `${id} ${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.4);
  });

  it.each(IDS)("%s: every sum written in an explanation is right", async (id) => {
    const c = await load(id);
    for (const e of explanations(c)) for (const [whole, a, op, b, result] of e.matchAll(SUM)) {
      const x = toNumber(a!), y = toNumber(b!);
      const value = op === "−" ? x - y : op === "+" ? x + y : x * y;
      expect(value, whole).toBe(toNumber(result!));
    }
  });

  it("the history of writing: the Hebrew counts and the order of the scripts are right", async () => {
    const c = await load("history-writing");
    const [count] = c.b.q!.find(([en]) => en[0].startsWith("How many letters are in the Hebrew alphabet"))!;
    expect(count[1]).toBe("22");
    expect(count[2]).toContain("27"); // 22 letters + 5 final forms: a real mix-up, not a random number
    const [finals, , he] = c.b.n![0]!;
    expect(finals).toBe(5);
    expect(he[2]).toContain("ך ם ן ף ץ");
    // about 3200 BCE, 1050 BCE, 800 BCE, 3rd century BCE to 1st century CE, 8th to 10th centuries CE
    const KEYS = ["Cuneiform", "Phoenicians", "Greeks", "Dead Sea Scrolls", "niqqud"];
    const steps = c.i.s![0]![0].slice(1);
    expect(steps.map((s) => KEYS.findIndex((k) => s.includes(k)))).toEqual([0, 1, 2, 3, 4]);
  });

  it("English articles and plurals: the counting questions match their word lists", async () => {
    const c = await load("lang-en-articles-plurals");
    const VOWEL_SOUND = new Set(["hour", "apple", "honest"]);
    const [an, en] = c.a.n![0]!;
    const words = en[0].split(": ")[1]!.replace("?", "").split(", ");
    expect(an).toBe(words.filter((w) => VOWEL_SOUND.has(w)).length);
    const UNCOUNTABLE = new Set(["water", "rice", "information"]);
    const [uncountable, en2] = c.i.n![0]!;
    expect(uncountable).toBe(en2[0].split(": ")[1]!.replace("?", "").split(", ").filter((w) => UNCOUNTABLE.has(w)).length);
  });

  it("fixed facts: the Bulge was Germany's last big attack in the west, and Gallipoli is not read as Egypt", async () => {
    const ww2 = await load("history-world-war-2");
    const [en, he] = ww2.a.s![0]!;
    expect(en[1]).toContain("in the west"); // Operation Spring Awakening in Hungary, March 1945, came after it
    expect(he[1]).toContain("במערב");
    const ww1 = await load("history-world-war-1");
    const gallipoli = ww1.i.q!.find(([q]) => q[0].includes("Gallipoli"))!;
    expect(gallipoli[1][1]).toContain("הדרדנלים");
    expect(gallipoli[1][1]).not.toContain("המצרים"); // without niqqud it reads as "Egypt"
  });
});
