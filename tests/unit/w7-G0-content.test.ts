import { describe, expect, it } from "vitest";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 7, G0: four chapters of the fractions course and five computing topics no longer show the answer to a choice
 * question somewhere else in the same level. A game shows most items of a level together, so a term's example, an
 * ordering step or a number prompt must not spell out a short answer: "Mixed number … such as 2 1/4" sat next to
 * "Write 9/4 as a mixed number", "Repeating decimal … like 0.333… for 1/3" next to "What is 1/3 as a decimal?", the
 * browser term listed Firefox for "Which of these is a web browser?", the operating-system term listed Android, "Undo …
 * usually with Ctrl+Z" and "Redo … often with Ctrl+Y" sat next to the questions whose answers are those shortcuts, and
 * the copy-and-paste ordering named Ctrl+C next to "What does Ctrl+C do?". Some term meanings also restated their
 * question (binary search "in a sorted list", latitude "north or south of the equator", a folder that groups files "so
 * they are easy to find", an update that "closes security holes", a driver for "a printer", clock bias "solved together
 * with the position"). The examples and meanings were reworded and the number prompts that echoed an answer got new
 * numbers; the new numbers are checked by calculating them.
 */

const IDS = [
  "course-fractions-1", "course-fractions-4", "course-fractions-6", "course-fractions-8",
  "cs-algorithms", "cs-browsers", "cs-gps", "cs-keyboard-skills", "cs-operating-systems",
] as const;
const LEVELS = ["b", "i", "a"] as const;
type Level = (typeof LEVELS)[number];

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The meanings [en, he] of the term whose English name is `name`. */
function meaning(c: TopicContent, l: Level, name: string): [string, string] {
  const t = (c[l].t ?? []).find((x) => x[0] === name);
  if (!t) throw new Error(`no term "${name}" at ${l}`);
  return [t[1], t[3]];
}

/** The number item whose English prompt contains `text`. */
function numberItem(c: TopicContent, l: Level, text: string) {
  const item = (c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!item) throw new Error(`no number item "${text}" at ${l}`);
  return item;
}

/** What a learner sees next to the questions of a level in one language: term meanings, number prompts and hints, ordering titles and steps. */
function sideTexts(lv: LevelContent, lang: 0 | 1): string[] {
  const out: string[] = [];
  for (const t of lv.t ?? []) out.push(lang ? t[3] : t[1]);
  for (const n of lv.n ?? []) {
    const x = lang ? n[2] : n[1];
    out.push(x[0], ...(x[3] ? [x[3]] : []));
  }
  for (const s of lv.s ?? []) out.push(...s[lang]);
  return out;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The answer as a word of its own (a Hebrew one-letter prefix allowed), not part of a longer number or fraction. */
const shownIn = (answer: string, text: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}/.])(?:[ובלמהשכ]־?)?${esc(answer)}(?![\\p{L}\\p{N}/]|\\.\\d)`, "iu").test(text);

describe("wave 7, G0: no short answer is shown elsewhere in its level", () => {
  it.each(IDS)("%s: 8+ items per level, 4+ of them questions, numbers or orderings, the same shape in both languages", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const asked = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect(asked + (lv.t?.length ?? 0), `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(asked, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      for (const [en, he] of lv.q ?? []) expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
      for (const [en, he] of lv.s ?? []) expect(he.length, `${id}/${l}: ${en[0]}`).toBe(en.length);
    }
  });

  it.each(IDS)("%s: no term meaning, number prompt or ordering step spells out a short non-numeric answer of its level", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const lang of [0, 1] as const) {
        const side = sideTexts(c[l], lang);
        for (const q of c[l].q ?? []) {
          const [prompt, answer] = q[lang];
          // Short answers only (a word form, a name, a fraction); a bare whole number also turns up as an operand elsewhere.
          if (answer.trim().split(/\s+/).length > 2 || /^\d+$/.test(answer.trim())) continue;
          for (const s of side) expect(shownIn(answer, s), `${id}/${l}: "${answer}" (${prompt}) in "${s}"`).toBe(false);
        }
      }
    }
  });

  it("the course chapters' term examples no longer show an answer", async () => {
    const [en1, he1] = meaning(await load("course-fractions-1"), "a", "Mixed number");
    for (const s of [en1, he1]) expect(s).not.toContain("2 1/4");
    expect(en1).toContain("1 1/2");
    expect(he1).toContain("1 1/2");

    const c4 = await load("course-fractions-4");
    for (const s of meaning(c4, "i", "Mixed number")) expect(s).not.toContain("3/4");
    const [enCm, heCm] = meaning(c4, "a", "Common multiple");
    // The example is a real common multiple of 3 and 4, and no longer the answer of the "6 and 8" number item (24).
    expect(enCm).toContain("like 12 for 3 and 4");
    expect(heCm).toContain("כמו 12 עבור 3 ו־4");
    expect(12 % 3 + (12 % 4)).toBe(0);
    for (const s of [enCm, heCm]) expect(s).not.toContain("24");

    const [en8, he8] = meaning(await load("course-fractions-8"), "a", "Repeating decimal");
    for (const s of [en8, he8]) expect(s).not.toContain("0.333");
    expect(en8).toContain("0.666… for 2/3");
    expect(he8).toContain("0.666… עבור 2/3");
    // 2/3 = 0.666…: the digit 6 repeats for ever.
    expect(Math.floor((2 / 3) * 1000)).toBe(666);
    expect(Math.floor((2 / 3) * 1e6) % 1000).toBe(666);
  });

  it("the course chapters' new number prompts are right and no longer echo an answer", async () => {
    const c4 = await load("course-fractions-4");
    // 2/5 + 1/3 = 6/15 + 5/15 = 11/15.
    const add = numberItem(c4, "i", "2/5 + 1/3 = x/15");
    expect(add[0]).toBe(2 * 3 + 1 * 5);
    expect(add[2][0]).toBe("2/5 + 1/3 = x/15. מהו המונה?");
    // Mia: 2/3 km + 1/2 km = 4/6 + 3/6 = 7/6 km, that is 7 sixths.
    const mia = numberItem(c4, "i", "Mia walked");
    expect(mia[0]).toBe((2 * 6) / 3 + (1 * 6) / 2);
    expect(mia[1][0]).toContain("2/3 km");
    expect(mia[2][0]).toContain("שישיות");
    // 3 1/2 − 1 5/6 = 21/6 − 11/6 = 10/6 = 1 4/6.
    const sub = numberItem(c4, "i", "3 1/2 − 1 5/6 = 1 x/6");
    expect(sub[0]).toBe(21 - 11 - 6);
    expect(sub[2][0]).toBe("3 1/2 − 1 5/6 = 1 x/6. מהו x?");
    for (const n of c4.i.n ?? []) for (const s of [n[1][0], n[2][0]]) {
      expect(s, s).not.toMatch(/(?<![\d/])3\/4(?![\d/])/);
      expect(s, s).not.toMatch(/(?<![\d/])1\/4(?![\d/])/);
    }

    const c6 = await load("course-fractions-6");
    // 6 ÷ 3/5 = 6 × 5/3 = 10; the answer of "4/5 ÷ 2" (2/5) is no longer in the prompt.
    const pieces = numberItem(c6, "i", "pieces of 3/5 fit into 6");
    expect(pieces[0]).toBe((6 * 5) / 3);
    expect(pieces[2][0]).toBe("כמה חלקים של 3/5 נכנסים ב־6?");
    for (const n of c6.i.n ?? []) for (const s of [n[1][0], n[2][0]]) expect(s).not.toContain("2/5");
  });

  it("the computing topics' terms and orderings no longer name or restate an answer", async () => {
    const alg = await load("cs-algorithms");
    const [enBs, heBs] = meaning(alg, "i", "Binary search");
    expect(enBs).not.toMatch(/sorted/i);
    expect(heBs).not.toContain("ממוינת");

    const br = await load("cs-browsers");
    for (const s of meaning(br, "b", "Web browser")) {
      expect(s).not.toContain("Firefox");
      expect(s).toContain("Chrome");
    }
    for (const s of meaning(br, "i", "URL")) expect(s).not.toContain("example.com");

    const gps = await load("cs-gps");
    const [enLat, heLat] = meaning(gps, "b", "Latitude");
    expect(enLat).not.toMatch(/equator/i);
    expect(heLat).not.toContain("המשווה");
    // The North Pole number item (90°) must not be answered by the meaning either.
    for (const s of [enLat, heLat]) expect(s).not.toContain("90");
    const [enCb, heCb] = meaning(gps, "a", "Clock bias");
    expect(enCb).not.toContain("position");
    expect(heCb).not.toContain("המיקום");

    const keys = await load("cs-keyboard-skills");
    for (const s of meaning(keys, "i", "Undo")) expect(s).not.toContain("Ctrl+Z");
    for (const s of meaning(keys, "a", "Redo")) expect(s).not.toContain("Ctrl+Y");
    for (const [en, he] of keys.b.s ?? []) for (const s of [...en, ...he]) expect(s).not.toMatch(/Ctrl\+[CV]/);

    const os = await load("cs-operating-systems");
    for (const s of meaning(os, "b", "Operating system")) {
      expect(s).not.toContain("Android");
      expect(s).toContain("iOS");
    }
    const [enF, heF] = meaning(os, "b", "Folder");
    expect(enF).not.toContain("easy to find");
    expect(heF).not.toContain("קל למצוא");
    const [enU, heU] = meaning(os, "i", "Update");
    expect(enU).not.toMatch(/security|fix/i);
    expect(heU).not.toMatch(/אבטחה|מתקנת/);
    const [enD, heD] = meaning(os, "a", "Driver");
    expect(enD).not.toMatch(/printer|small program/i);
    expect(heD).not.toContain("מדפסת");
    const [enM, heM] = meaning(os, "a", "Multitasking");
    expect(enM).not.toMatch(/processor/i);
    expect(heM).not.toContain("המעבד");
  });
});
