import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C6: course chapters 5–9 ("Fractions, decimals and percentages") and two computing topics (3D printing, AI
 * basics), held to the Plus and Pro collection's bar.
 *
 * - AI basics (original library) had two questions per level with joke distractors ("Only on weekends", "a broken
 *   screen", "People delete the internet") and gave the answer away by its length in 67 % (en) / 83 % (he) of them.
 * - Chapter 6's hands-on task wrote its blank as "?" ("1/2 ÷ 1/4 = ?"): a right-to-left line draws the sign and the
 *   question mark on the wrong side of the expression; a blank is written as x.
 * - Chapter 5 explained a question with "the squared-paper task on the lesson board", but the hands-on task is on its own
 *   board at the end of the game, read after the questions.
 * - 3D printing: in Hebrew the right answer and a wrong one both began with «ממיסה אותו» (the verb means both "melts" and
 *   "dissolves"), so two options read the same.
 */

const CHAPTERS = ["course-fractions-5", "course-fractions-6", "course-fractions-7", "course-fractions-8", "course-fractions-9"] as const;
const IDS = [...CHAPTERS, "cs-3d-printing", "cs-ai-basics"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Every text a learner reads in one language (lesson, questions, options, explanations, hints, numbers, orderings). */
function texts(c: TopicContent, lang: 0 | 1): string[] {
  const out: string[] = [];
  if (c.l) { const l = lang ? c.l.he : c.l.en; out.push(l.title, ...l.text, l.example, l.task); }
  for (const lv of LEVELS) {
    for (const pair of c[lv].q ?? []) { const [q, a, w, e, h] = pair[lang]; out.push(q, a, ...w, e, h ?? ""); }
    for (const item of c[lv].n ?? []) { const [q, u, e, h] = item[lang + 1 as 1 | 2]; out.push(q, u, e, h ?? ""); }
    for (const pair of c[lv].s ?? []) out.push(...pair[lang]);
  }
  return out.filter(Boolean);
}

describe("course chapters 5–9 and computing topics (C6)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters, and a number's explanation shows the number", async (id) => {
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
      expect(all, id).toBeGreaterThanOrEqual(6);
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
      }
      for (const [en, he] of c[l].s ?? []) expect(en.length, `${id}/${l}: ${en[0]}`).toBe(he.length);
    }
    for (const s of texts(c, 1)) expect(s, id).not.toMatch(/[<>]/);
  });

  it("3D printing: in Hebrew no wrong option repeats the verb of the right answer «ממיסה» (melts / dissolves)", async () => {
    const c = await load("cs-3d-printing");
    for (const l of LEVELS) {
      for (const [, he] of c[l].q ?? []) {
        const verb = he[1].split(/\s+/)[0]!;
        if (verb !== "ממיסה") continue;
        for (const w of he[2]) expect(w.startsWith(verb), `${l}: ${w}`).toBe(false);
      }
    }
  });

  it.each(CHAPTERS)("%s: a blank is written as x, never as a question mark, in both languages", async (id) => {
    const c = await load(id);
    const questionMarkBlank = /[=×÷+−/]\s*\?|\?\s*[=×÷+−/]/;
    for (const lang of [0, 1] as const) for (const s of texts(c, lang)) expect(questionMarkBlank.test(s), `${id}: ${s}`).toBe(false);
  });

  it.each(CHAPTERS)("%s: no question points to the hands-on task, which is read only at the end of the game", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(/\btask\b/i.test(`${en[0]} ${en[3]} ${en[4] ?? ""}`), `${id}/${l}: ${en[0]}`).toBe(false);
        expect(/משימ/.test(`${he[0]} ${he[3]} ${he[4] ?? ""}`), `${id}/${l}: ${he[0]}`).toBe(false);
      }
      for (const [, en, he] of c[l].n ?? []) {
        expect(/\btask\b/i.test(`${en[0]} ${en[2]}`), `${id}/${l}: ${en[0]}`).toBe(false);
        expect(/משימ/.test(`${he[0]} ${he[2]}`), `${id}/${l}: ${he[0]}`).toBe(false);
      }
    }
  });

  it("AI basics offers plausible wrong options: none of the old joke distractors is left", async () => {
    const c = await load("cs-ai-basics");
    const jokes = ["Only on weekends", "a broken screen", "People delete the internet", "A bicycle bell", "Because old data is illegal", "רק בסופי שבוע", "מסך שבור", "אנשים מוחקים את האינטרנט"];
    const all = [...texts(c, 0), ...texts(c, 1)];
    for (const j of jokes) expect(all, j).not.toContain(j);
    // every level now also plays something other than a choice question
    for (const l of LEVELS) expect((c[l].n?.length ?? 0) + (c[l].s?.length ?? 0), l).toBeGreaterThanOrEqual(1);
  });
});
