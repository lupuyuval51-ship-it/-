import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C7: seven computing topics (using AI responsibly, algorithms, animation, app design, barcodes and QR codes,
 * binary numbers, Boolean logic) are held to the Plus and Pro collection's bar, also the five that belong to the original
 * library, which had two or three questions per level, explanations of a few characters ("101 = 1×4 + 0×2 + 1×1 = 5.")
 * and gave the answer away by its length in most of their questions: every level has 8+ items, 4+ of them questions,
 * numbers or orderings, every answer is explained in 40+ characters, the right answer is the longest option in at most
 * 40 % of the questions per language, and no Hebrew text has "<" or ">" (a right-to-left line mirrors them; Boolean logic
 * had "age >= 13" in a Hebrew question). The number facts the questions state are checked by calculating them.
 */

const IDS = ["cs-ai-ethics", "cs-algorithms", "cs-animation", "cs-app-design", "cs-barcodes-qr", "cs-binary", "cs-boolean-logic"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Every Hebrew string of a level that the game shows. */
function hebrewTexts(c: TopicContent): string[] {
  const out: string[] = [];
  for (const l of LEVELS) {
    const lv = c[l];
    for (const t of lv.t ?? []) out.push(t[2], t[3]);
    for (const [, he] of lv.q ?? []) out.push(he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : []));
    for (const [, , he] of lv.n ?? []) out.push(he[0], he[1], he[2], ...(he[3] ? [he[3]] : []));
    for (const [, he] of lv.s ?? []) out.push(...he);
  }
  return out;
}

describe("computing topics (C7)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters, in both languages", async (id) => {
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
      expect(longest / all, `${id} ${lang ? "he" : "en"}: ${longest}/${all}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: no Hebrew text uses < or >", async (id) => {
    for (const s of hebrewTexts(await load(id))) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
  });

  it("binary and hexadecimal conversions give the stated answer", async () => {
    const c = await load("cs-binary");
    let checked = 0;
    for (const l of LEVELS) {
      for (const [[q, answer]] of c[l].q ?? []) {
        const bin = /binary number (\d+) in base 10/.exec(q), hex = /hexadecimal number ([0-9A-F]+) in base 10/.exec(q), to = /How is the number (\d+) written in binary/.exec(q);
        if (bin) { expect(String(parseInt(bin[1]!, 2)), q).toBe(answer); checked++; }
        if (hex) { expect(String(parseInt(hex[1]!, 16)), q).toBe(answer); checked++; }
        if (to) { expect(Number(to[1]).toString(2), q).toBe(answer); checked++; }
      }
      for (const [answer, [q]] of c[l].n ?? []) {
        const bin = /binary number (\d+) in base 10/.exec(q);
        if (bin) { expect(parseInt(bin[1]!, 2), q).toBe(answer); checked++; }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });

  it("the EAN-13 check-digit item adds up, and the swap it describes really slips past the check", async () => {
    const c = await load("cs-barcodes-qr");
    const [answer, [q, , explanation]] = c.i.n!.find(([, [text]]) => text.includes("EAN-13"))!;
    const digits = /For (\d{12})/.exec(q)![1]!.split("").map(Number);
    const total = digits.reduce((sum, d, i) => sum + d * (i % 2 ? 3 : 1), 0);
    expect(q).toContain(`the total is ${total}`);
    expect((total + answer) % 10).toBe(0);
    expect(answer).toBeLessThan(10);
    expect(explanation).toContain(digits.join("") + String(answer));
    // swapping neighbours 3 and 8 changes the weighted total by 2 × 5 = 10, which the check cannot see; digits two places
    // apart share a weight, so swapping them is never caught either: the explanation must not call the first "the one kind"
    expect((3 * 1 + 8 * 3 - (8 * 1 + 3 * 3)) % 10).toBe(0);
    const swap = c.a.q!.find(([[text]]) => text.includes("swapped"))!;
    expect(swap[0][3]).not.toMatch(/the one kind of swap/);
    expect(swap[0][3]).toMatch(/neighbouring digits/);
  });
});
