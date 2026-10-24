import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C1: eight arts topics (comics, dance, detective stories, drawing, fairy tales, film history, film, graphic
 * design) are held to the Plus and Pro collection's bar, even the five that belong to the original library: every level
 * has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained in 40+ characters, and the right
 * answer is the longest option in at most 40 % of the questions in each language (a child who always picks the longest
 * option must not win). Drawing and film had two questions at the beginner level and gave the answer away by its length
 * in 70–87 % of their questions.
 */

const IDS = [
  "arts-comics", "arts-dance", "arts-detective-stories", "arts-drawing",
  "arts-fairy-tales", "arts-film-history", "arts-film", "arts-graphic-design",
] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

describe("arts topics (C1)", () => {
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
      for (const [en, he] of c[l].s ?? []) expect(en.length, `${id}/${l}: ${en[0]}`).toBe(he.length);
    }
  });
});
