import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LessonText, TopicContent } from "@/lib/game/topics/types";
import { mathRuns } from "@/lib/i18n/bidi";

/**
 * Wave 4, C5: three civics topics and the first four chapters of the fractions course.
 *
 * - "The United Nations" (original library) had two questions per level and a one-line explanation of its answer: it is
 *   now held to the Plus and Pro collection's bar (8+ items per level, 4+ of them questions, numbers or orderings,
 *   explanations of 40+ characters, the right answer the longest option in at most 40 % of the questions per language).
 * - Course lessons write a blank as x, never "?" (in a right-to-left line "1/2 + 1/4 = ?" is drawn "? = 1/2 + 1/4"), and a
 *   Latin x in a Hebrew lesson is always part of a maths run (chapter 4's example read "כמהו x?" for "how much is missing?").
 */

const CIVICS = ["civics-israel-symbols", "civics-local-government", "civics-united-nations"] as const;
const CHAPTERS = ["course-fractions-1", "course-fractions-2", "course-fractions-3", "course-fractions-4"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

const lessonTexts = (l: LessonText) => [l.title, ...l.text, l.example, l.task];

/** Every text of a topic in one language: lesson, terms, questions, numbers and orderings. */
function allTexts(c: TopicContent, lang: "en" | "he"): string[] {
  const k = lang === "en" ? 0 : 1;
  return [
    ...(c.l ? lessonTexts(c.l[lang]) : []),
    ...LEVELS.flatMap((l) => [
      ...(c[l].t ?? []).flatMap((x) => (lang === "en" ? [x[0], x[1]] : [x[2], x[3]])),
      ...(c[l].q ?? []).flatMap((p) => { const [q, a, w, e, h] = p[k]; return [q, a, ...w, e, h ?? ""]; }),
      ...(c[l].n ?? []).flatMap((n) => { const [q, u, e, h] = n[k + 1 as 1 | 2]; return [q, u, e, h ?? ""]; }),
      ...(c[l].s ?? []).flatMap((s) => s[k]),
    ]),
  ];
}

describe("civics topics (C5)", () => {
  it.each(CIVICS)("%s: 8+ items per level, 4+ of them questions, numbers or orderings", async (id) => {
    expect(findTopic(id), id).toBeTruthy();
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(CIVICS)("%s: every answer is explained in 40+ characters, numbers name their answer, in both languages", async (id) => {
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

  it.each(CIVICS)("%s: the right answer is the longest option in at most 40 % of the questions, per language", async (id) => {
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

  it("the United Nations: the Security Council numbers agree with each other (15 seats = 5 permanent + 10 elected)", async () => {
    const c = await load("civics-united-nations");
    const elected = c.i.n!.find(([, en]) => /elected for a limited time/.test(en[0]))!;
    expect(elected[0]).toBe(10);
    const against = c.a.n!.find(([, en]) => /voted against/.test(en[0]))!;
    expect(against[0]).toBe(15 - 9);
    // the time order is real: 1918, 1939, 1945, 1949, 2011 (the League of Nations left the ordering: it answered a question of the level)
    const [en, he] = c.i.s![0]!;
    expect(en.slice(1)).toEqual(["The First World War ends", "The Second World War begins", "The United Nations is founded", "Israel becomes a member of the UN", "South Sudan joins the UN"]);
    expect(he.length).toBe(en.length);
  });
});

describe("fractions course chapters 1–4 (C5)", () => {
  it.each(CHAPTERS)("%s: a blank is written as x, never as ? after or before a maths sign", async (id) => {
    const c = await load(id);
    for (const lang of ["en", "he"] as const) {
      for (const s of allTexts(c, lang)) expect(/[=+−×÷]\s*\?|\?\s*[=+−×÷/]/.test(s), `${id}/${lang}: ${s}`).toBe(false);
    }
  });

  it.each(CHAPTERS)("%s: in the Hebrew lesson every Latin x is part of a maths run, drawn left to right", async (id) => {
    const c = await load(id);
    for (const s of lessonTexts(c.l!.he)) {
      const outside = mathRuns(s).filter((p) => !p.math).map((p) => p.text).join(" ");
      expect(/[A-Za-z]/.test(outside), `${id}: ${s}`).toBe(false);
    }
  });

  it("chapter 4's worked example asks how much is missing, in both languages", async () => {
    const c = await load("course-fractions-4");
    expect(c.l!.en.example).toContain("How much is missing?");
    expect(c.l!.he.example).toContain("כמה חסר?");
    expect(c.l!.he.task).toContain("1/2 + 1/4 = x");
    expect(mathRuns(c.l!.he.task).some((p) => p.math && p.text === "1/2 + 1/4 = x")).toBe(true);
  });
});
