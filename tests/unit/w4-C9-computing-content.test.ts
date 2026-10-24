import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C9: seven computing topics (cybersecurity, data cables, databases, data speeds, digital media, email, game
 * design) are held to the Plus and Pro collection's bar, also the four that belong to the original library. Before this
 * wave cybersecurity gave the answer away by its length in every one of its questions (100 %), game design in 88 %,
 * digital media in 50 to 60 % and databases in 45 %; game design and digital media had only two or three challenges at the
 * beginner level, and four number explanations were a bare sum ("32 × 32 = 1024 pixels."). Now every level has 8+ items,
 * 4+ of them questions, numbers or orderings, every answer is explained in 40+ characters, the right answer is the longest
 * option in at most 40 % of the questions per language, and no Hebrew text has "<" or ">". The number facts the questions
 * state are checked by calculating them.
 */

const IDS = ["cs-cybersecurity", "cs-data-cables", "cs-data-databases", "cs-data-speeds", "cs-digital-media", "cs-email", "cs-game-design"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Every Hebrew string of a topic that the game shows. */
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

/** The answer of the number item whose English question contains `text`. */
function numberAnswer(c: TopicContent, l: (typeof LEVELS)[number], text: string): number {
  const item = (c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!item) throw new Error(`no number item "${text}" at ${l}`);
  return item[0];
}

describe("computing topics (C9)", () => {
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

  it.each(IDS)("%s: both languages offer the same number of wrong options, and no Hebrew text uses < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
    for (const s of hebrewTexts(c)) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
  });

  it("the number facts are right", async () => {
    const cyber = await load("cs-cybersecurity");
    expect(numberAnswer(cyber, "i", "4 digits")).toBe(10 ** 4);
    expect(numberAnswer(cyber, "a", "6-digit PIN")).toBe(1_000_000 / 1_000);

    const cables = await load("cs-data-cables");
    expect(numberAnswer(cables, "b", "500-megabit")).toBe(500 / 100);
    expect(numberAnswer(cables, "i", "6,000 km")).toBeCloseTo((6_000 / 200_000) * 1_000);
    expect(numberAnswer(cables, "a", "36,000 km up")).toBeCloseTo(((2 * 36_000) / 300_000) * 1_000);
    expect(numberAnswer(cables, "a", "20,000 km apart")).toBeCloseTo((20_000 / 200_000) * 1_000);

    const db = await load("cs-data-databases");
    expect(numberAnswer(db, "b", "30 rows")).toBe(30 * 5);
    expect(numberAnswer(db, "i", "greater than 90")).toBe([95, 90, 88].filter((g) => g > 90).length);

    const speeds = await load("cs-data-speeds");
    expect(numberAnswer(speeds, "b", "bits are in one byte")).toBe(8);
    expect(numberAnswer(speeds, "b", "4 GB")).toBe(4_000 / 2);
    expect(numberAnswer(speeds, "i", "600 MB")).toBe(600 / 10);
    expect(numberAnswer(speeds, "i", "5 MB songs")).toBe(1_000 / 5);
    expect(numberAnswer(speeds, "a", "50 MB file at 40 Mbps")).toBe((50 * 8) / 40);
    expect(numberAnswer(speeds, "a", "5 Mbps for 1 hour")).toBe((5 * 3_600) / 8);
    // A "1 TB" drive is 10^12 bytes; shown in units of 1,024^3 bytes it is about 931 GB.
    expect(Math.floor(1e12 / 1024 ** 3)).toBe(931);

    const media = await load("cs-digital-media");
    expect(numberAnswer(media, "i", "32 pixels wide")).toBe(32 * 32);
    expect(numberAnswer(media, "i", "30 frames per second")).toBe(30 * 10);
    expect(numberAnswer(media, "a", "3 bytes per pixel")).toBe((1_000 * 1_000 * 3) / 1_000_000);
    expect(numberAnswer(media, "a", "44,100 samples")).toBe(44_100 * 2);

    const email = await load("cs-email");
    expect(numberAnswer(email, "b", "25 new emails")).toBe(25 - 18);
    expect(numberAnswer(email, "i", "25 MB in total")).toBe(Math.floor(25 / 7));
    expect(numberAnswer(email, "a", "1,200 people")).toBe(Math.round(0.15 * 1_200));

    const design = await load("cs-game-design");
    expect(numberAnswer(design, "a", "45 of 60")).toBe((45 / 60) * 100);
  });

  it("a distractor about a common misconception comes first, where the warm-up keeps it", async () => {
    // The two-option warm-up keeps the first wrong option, so it is the most plausible one, not a joke option.
    const cyber = await load("cs-cybersecurity");
    const ransom = (cyber.i.q ?? []).find(([en]) => en[0].startsWith("Ransomware locked"));
    expect(ransom?.[0][2][0]).toMatch(/shared network folder/);
    const media = await load("cs-digital-media");
    const logo = (media.a.q ?? []).find(([en]) => en[0].startsWith("A company logo"));
    expect(logo?.[0][2][0]).toMatch(/as many pixels as possible/);
  });
});
