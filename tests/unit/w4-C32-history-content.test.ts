import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C32: seven history topics (inventions, the founding of Israel, kibbutzim and moshavim, the history of medicine,
 * Mesopotamia, the Middle Ages and the Mongol Empire) are held to the Plus and Pro collection's bar, also the five that
 * belong to the original library. Before this wave Mesopotamia gave the answer away by its length in 89 % of its English
 * questions, inventions and the Middle Ages in 83 % and medicine in 75 %; inventions, the founding of Israel and the Middle
 * Ages had only two questions per level. Now every level has 8+ items, 4+ of them questions, numbers or orderings, every
 * answer is explained in 40+ characters, the right answer is the longest option in at most 40 % of the questions per
 * language, and no Hebrew text has "<" or ">". The number facts the questions state are checked by calculating them.
 */

const IDS = [
  "history-inventions", "history-israel-independence", "history-kibbutz", "history-medicine",
  "history-mesopotamia", "history-middle-ages", "history-mongol-empire",
] as const;
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

/** The [en, he] question whose English text starts with `start`. */
function question(c: TopicContent, l: (typeof LEVELS)[number], start: string) {
  const q = (c[l].q ?? []).find(([en]) => en[0].startsWith(start));
  if (!q) throw new Error(`no question "${start}" at ${l}`);
  return q;
}

describe("history topics (C32)", () => {
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

  it.each(IDS)("%s: both languages offer the same number of wrong options, none repeats the answer, and no Hebrew text uses < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
      for (const [q, answer, wrong] of [en, he]) {
        expect(wrong, `${id}/${l}: ${q}`).not.toContain(answer);
        expect(new Set(wrong).size, `${id}/${l}: ${q}`).toBe(wrong.length);
      }
    }
    for (const s of hebrewTexts(c)) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
  });

  it("the number facts are right", async () => {
    const inventions = await load("history-inventions");
    expect(numberAnswer(inventions, "b", "in 1783 and the Wright brothers")).toBe(1903 - 1783);
    expect(numberAnswer(inventions, "a", "invented in 1947")).toBe(1947 - 1928);

    const israel = await load("history-israel-independence");
    expect(numberAnswer(israel, "b", "met in 1897")).toBe(1948 - 1897);
    expect(numberAnswer(israel, "a", "members sit in the Knesset")).toBe(120);

    const mesopotamia = await load("history-mesopotamia");
    // 1750 BCE to 2000 CE: there is no year 0, so 3749 is accepted too (tolerance 1)
    const hammurabi = (mesopotamia.b.n ?? []).find(([, en]) => en[0].includes("before the year 2000"));
    expect(hammurabi?.[0]).toBe(1750 + 2000);
    expect(hammurabi?.[3]).toBe(1);
    expect(numberAnswer(mesopotamia, "a", "around 2300 BCE")).toBe(2300 - 1750);

    const middle = await load("history-middle-ages");
    expect(numberAnswer(middle, "b", "about the year 500")).toBe(1500 - 500);
    expect(numberAnswer(middle, "i", "sealed in 1215")).toBe(1347 - 1215);
    expect(numberAnswer(middle, "a", "set out in 1096")).toBe(1453 - 1096);

    const medicine = await load("history-medicine");
    expect(numberAnswer(medicine, "a", "in 1796, and the disease was declared wiped out in 1980")).toBe(1980 - 1796);

    const kibbutz = await load("history-kibbutz");
    expect(numberAnswer(kibbutz, "b", "founded in 1910")).toBe(1921 - 1910);

    const mongols = await load("history-mongol-empire");
    expect(numberAnswer(mongols, "b", "proclaimed khan in 1206")).toBe(1227 - 1206);
    expect(numberAnswer(mongols, "a", "lost China in 1368")).toBe(1368 - 1206);
  });

  it("the most plausible distractor is a real misconception, and the explanation answers it", async () => {
    // The warm-up and the automatic hint use the third shown option, so the misconception comes first.
    const meso = await load("history-mesopotamia");
    const tablets = question(meso, "i", "What did many of the earliest cuneiform tablets record");
    expect(tablets[0][2][0]).toMatch(/Gilgamesh/);
    expect(tablets[0][3]).toMatch(/written down only centuries later/);
    expect(tablets[1][3]).toMatch(/נכתבו רק מאות שנים אחר כך/);
    const classes = question(meso, "a", "Many punishments in Hammurabi's laws");
    expect(classes[0][2][0]).toMatch(/^Nothing: the same punishment/);
    expect(classes[1][2][0]).toMatch(/^בשום דבר/);

    const middle = await load("history-middle-ages");
    const plague = question(middle, "i", "What was the Black Death");
    expect(plague[0][2][0]).toMatch(/England and France/);
    expect(plague[0][3]).toMatch(/Hundred Years' War/);
    expect(plague[1][3]).toMatch(/מלחמת מאה השנים/);

    const inventions = await load("history-inventions");
    const drip = question(inventions, "a", "Why is drip irrigation");
    expect(drip[0][2][0]).toMatch(/sprays water/);
    expect(drip[0][3]).toMatch(/sprinkler/);
    const patent = question(inventions, "i", "Why do inventors apply for patents");
    expect(patent[0][2][0]).toMatch(/secret forever/);
    expect(patent[0][3]).toMatch(/patent is public/);

    const medicine = await load("history-medicine");
    const lister = question(medicine, "i", "In the 1860s the British surgeon Joseph Lister");
    expect(lister[0][2][0]).toMatch(/painless/);
    expect(lister[0][3]).toMatch(/anaesthetics were what took away the pain/);
    const cold = question(medicine, "a", "Why do doctors not give antibiotics");
    expect(cold[0][2][0]).toMatch(/bacteria/);
    expect(cold[0][3]).toMatch(/not on viruses/);
  });
});
