import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C2: eight arts topics (homes around the world, instruments, Israeli song, literature, making books, masks,
 * music basics, musicals) are held to the Plus and Pro collection's bar, also the three that belong to the original
 * library (instruments, literature, music basics), which had two questions per level and gave the answer away by its
 * length in most of them: every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is
 * explained in 40+ characters, and the right answer is the longest option in at most 40 % of the questions per language.
 * In those three topics an English right answer also never repeats a lower-case word of its own question that no wrong
 * option shares ("…makes sound by vibrating strings?" → "Strings…" handed the answer over).
 */

const IDS = [
  "arts-homes-world", "arts-instruments", "arts-israeli-song", "arts-literature",
  "arts-making-books", "arts-masks", "arts-music-basics", "arts-musicals",
] as const;
const REWRITTEN = ["arts-instruments", "arts-literature", "arts-music-basics"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Words of 5+ letters; with `lowerOnly`, only the ones written in lower case (a name in a title is not a give-away). */
const words = (s: string, lowerOnly = false) =>
  new Set((s.match(/\p{L}+/gu) ?? []).filter((w) => w.length >= 5 && (!lowerOnly || w === w.toLowerCase())).map((w) => w.toLowerCase()));

describe("arts topics (C2)", () => {
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

  it.each(REWRITTEN)("%s: no English right answer echoes a word of its question that no wrong option has", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [[q, answer, wrong]] of c[l].q ?? []) {
        const asked = words(q, true);
        const offered = new Set(wrong.flatMap((w) => [...words(w)]));
        const echoed = [...words(answer)].filter((w) => asked.has(w) && !offered.has(w));
        expect(echoed, `${id}/${l}: ${q} → ${answer}`).toEqual([]);
      }
    }
  });

  it.each(IDS)("%s: options never repeat, both languages offer the same number, Hebrew has no < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(en[2].length, `${id}/${l}: ${en[0]}`).toBe(he[2].length);
        for (const [q, answer, wrong] of [en, he]) {
          const keys = [answer, ...wrong].map((o) => o.trim().toLowerCase());
          expect(new Set(keys).size, `${id}/${l}: ${q}`).toBe(keys.length);
        }
        for (const s of [he[0], he[1], ...he[2], he[3]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const t of c[l].t ?? []) for (const s of [t[2], t[3]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      for (const [en, he] of c[l].s ?? []) expect(en.length, `${id}/${l}: ${en[0]}`).toBe(he.length);
    }
  });

  it("the Hebrew blurb question no longer names the back cover in its answer", async () => {
    const c = await load("arts-making-books");
    const pair = (c.b.q ?? []).find(([en]) => en[1] === "The blurb");
    expect(pair).toBeDefined();
    expect(pair![1][0]).toContain("הכריכה האחורית");
    expect(pair![1][1]).not.toMatch(/גב|אחורי/);
  });
});
