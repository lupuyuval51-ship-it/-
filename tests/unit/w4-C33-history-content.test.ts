import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C33: seven history topics (the history of numbers, the Olympics, the Ottoman and Persian empires, the
 * Phoenicians, pirates, prehistory) are held to the Plus and Pro collection's bar, prehistory too although it belongs to
 * the original library: every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained
 * in 40+ characters, and the right answer is the longest option in at most 40 % of the questions in each language.
 * Prehistory had three beginner questions and gave the answer away by its length in 58 % of its questions.
 * The sums written in the explanations are checked (a − b = c, in both languages), and so are the Roman numerals of the
 * history of numbers: the right option has the asked value, no wrong option has it, and "MCMLXV is 1965" is true.
 */

const IDS = [
  "history-numbers", "history-olympics", "history-ottoman-empire", "history-persian-empire",
  "history-phoenicians", "history-pirates", "history-prehistory",
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

const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
const SIDE = String.raw`${NUM}(?:\s*[−×÷+]\s*${NUM})*`;
const CHAIN = new RegExp(String.raw`${SIDE}(?:\s*=\s*${SIDE})+`, "g");
const toNumber = (s: string) => Number(s.replace(/,(?=\d{3}(?!\d))/g, "").replace(/,+$/, ""));

/** Evaluates "3 × 100 + 2 × 10 + 4" with × and ÷ before + and −. */
function evaluate(side: string): number {
  const tokens = side.match(new RegExp(`${NUM}|[−×÷+]`, "g")) ?? [];
  const terms: number[] = [];
  let sign = 1, term = toNumber(tokens[0]!);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]!, value = toNumber(tokens[i + 1]!);
    if (op === "×") term *= value;
    else if (op === "÷") term /= value;
    else { terms.push(sign * term); sign = op === "−" ? -1 : 1; term = value; }
  }
  terms.push(sign * term);
  return terms.reduce((a, b) => a + b, 0);
}

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const romanValue = (s: string) => [...s].reduce((sum, ch, i) => {
  const v = ROMAN[ch]!, next = ROMAN[s[i + 1] ?? ""] ?? 0;
  return sum + (v < next ? -v : v);
}, 0);

describe("history topics (C33)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters, and a numeric answer is in its explanation", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect(explanation.includes(String(answer)) || explanation.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${q}`).toBe(true);
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

  it.each(IDS)("%s: the same number of wrong options in English and Hebrew, and no < or > in Hebrew", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
        for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      }
      for (const [, , he] of c[l].n ?? []) for (const s of [he[0], he[2]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
    }
  });

  it.each(IDS)("%s: every sum written in an explanation is right", async (id) => {
    const c = await load(id);
    for (const text of explanations(c)) {
      for (const chain of text.match(CHAIN) ?? []) {
        const values = chain.split("=").map((side) => evaluate(side.trim()));
        for (const v of values) expect(v, `${id}: "${chain}" in "${text}"`).toBeCloseTo(values[0]!, 6);
      }
    }
  });

  it("the sum checker itself catches a wrong sum and reads thousands with commas", () => {
    const sums = (s: string) => (s.match(CHAIN) ?? []).map((chain) => chain.split("=").map((side) => evaluate(side.trim())));
    expect(sums("12,000 − 5,200 = 6,800 years.")).toEqual([[6800, 6800]]);
    expect(sums("3 × 100 + 2 × 10 + 4 × 1 = 300 + 20 + 4 = 324.")).toEqual([[324, 324, 324]]);
    expect(sums("24 ÷ 4 = 6, so")).toEqual([[6, 6]]);
    expect(sums("60 × 1.852 = 111.12, so")).toEqual([[111.12, 111.12]]);
    expect(sums("1917 − 1516 = 410 years")[0]).toEqual([401, 410]);
  });

  it("history of numbers: Roman numeral options and statements are right", async () => {
    const c = await load("history-numbers");
    let checked = 0;
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        const [q, answer, wrong, explanation] = en;
        if (!/^[IVXLCDM]+$/.test(answer)) continue;
        const asked = Number(q.match(/\d+/)?.[0]);
        expect(romanValue(answer), q).toBe(asked);
        for (const w of wrong) expect(romanValue(w), `${q}: ${w}`).not.toBe(asked);
        expect(he[1]).toBe(answer);
        expect([...he[2]].sort()).toEqual([...wrong].sort());
        for (const [, numeral, value] of explanation.matchAll(/\b([IVXLCDM]{2,}) (?:is|means \d+ − \d+ =) (\d+)/g)) expect(romanValue(numeral!), `${numeral} in ${q}`).toBe(Number(value));
        checked++;
      }
      for (const [answer, en] of c[l].n ?? []) {
        const numeral = en[0].match(/\b([IVXLCDM]{2,})\b/)?.[1];
        if (numeral) { expect(romanValue(numeral), en[0]).toBe(answer); checked++; }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });

  it("prehistory: the beginner level has a flint question and a time-order of the first human skills", async () => {
    const c = await load("history-prehistory");
    const flint = (c.b.q ?? []).find(([en]) => en[1] === "Flint");
    expect(flint?.[1][1]).toBe("אבן צור");
    const order = c.b.s?.[0];
    expect(order?.[0].slice(1)).toEqual(["People chip the first stone tools", "People learn to control fire", "People paint animals on cave walls", "People start to farm and live in villages"]);
    expect(order?.[1].length).toBe(order?.[0].length);
  });
});
