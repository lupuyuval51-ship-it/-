import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C11: seven computing topics (keyboard skills, mobile networks, Morse code, mouse and touch, music technology,
 * networks and Wi-Fi, open source) are held to the Plus and Pro collection's bar, also "Networks and Wi-Fi", which belongs
 * to the original library. Before this wave that topic gave the answer away by its length in 12 of its 14 English
 * questions (86 %) and 11 of 14 Hebrew ones (79 %), and most of its wrong options were throwaways ("Changing the
 * wallpaper", "So the screens are brighter"). Its wrong options now voice real misconceptions (a hidden network name
 * is not encryption, a stronger password does not strengthen the signal, a switch and a router swapped, a fake café
 * network with the same name), and the explanations answer them. The number facts the questions state are checked by
 * calculating them.
 */

const IDS = ["cs-keyboard-skills", "cs-mobile-networks", "cs-morse-code", "cs-mouse-touch", "cs-music-tech", "cs-networks", "cs-open-source"] as const;
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

/** The [en, he] pair of the question whose English prompt starts with `start`. */
function question(c: TopicContent, l: (typeof LEVELS)[number], start: string) {
  const pair = (c[l].q ?? []).find(([en]) => en[0].startsWith(start));
  if (!pair) throw new Error(`no question "${start}" at ${l}`);
  return pair;
}

describe("computing topics (C11)", () => {
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
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
        for (const [q, answer, wrong] of [en, he]) {
          const keys = [answer, ...wrong].map((o) => o.trim().toLowerCase());
          expect(new Set(keys).size, `${id}/${l}: ${q}`).toBe(keys.length);
        }
      }
    }
    for (const s of hebrewTexts(c)) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
  });

  it("the number facts are right", async () => {
    const keys = await load("cs-keyboard-skills");
    expect(numberAnswer(keys, "b", "how many fingers rest on the home row")).toBe(4 + 4);
    expect(numberAnswer(keys, "i", "150 words in 5 minutes")).toBe(150 / 5);
    expect(numberAnswer(keys, "a", "600-word story")).toBe(600 / 40);
    expect(numberAnswer(keys, "a", "200 words")).toBe(((200 - 10) / 200) * 100);

    const mobile = await load("cs-mobile-networks");
    // One SMS carries 140 bytes; the GSM 7-bit alphabet packs 160 characters into them.
    expect(numberAnswer(mobile, "i", "one standard SMS")).toBe((140 * 8) / 7);
    expect(numberAnswer(mobile, "a", "160 characters of 7 bits")).toBe(160 * 7);
    expect(160 * 7).toBe(140 * 8);
    expect(numberAnswer(mobile, "a", "30 km")).toBeCloseTo((30 / 300_000) * 1_000);

    const morse = await load("cs-morse-code");
    const S = 1 + 1 + 1 + 1 + 1, O = 3 + 1 + 3 + 1 + 3, letterGap = 3;
    expect(numberAnswer(morse, "a", "three separate letters")).toBe(S + letterGap + O + letterGap + S);
    expect(numberAnswer(morse, "a", "PARIS")).toBe(60_000 / (20 * 50));
    // The dot length in milliseconds is 1,200 ÷ words per minute; a word gap is 7 dots.
    expect(numberAnswer(morse, "a", "12 words per minute")).toBe(7 * (1_200 / 12));

    const mouse = await load("cs-mouse-touch");
    expect(numberAnswer(mouse, "i", "5 steps")).toBe(5 * 3);
    expect(numberAnswer(mouse, "a", "500 milliseconds")).toBe(500 / 1_000);

    const music = await load("cs-music-tech");
    expect(numberAnswer(music, "b", "30 seconds")).toBe((120 / 60) * 30);
    expect(numberAnswer(music, "i", "one octave higher?")).toBe(440 * 2);
    expect(numberAnswer(music, "i", "middle C is note number 60")).toBe(60 + 12);
    expect(numberAnswer(music, "a", "44,100 samples")).toBe(44_100 / 2);
    expect(numberAnswer(music, "a", "3 bars of 4 beats")).toBeCloseTo(3 * 4 * (60 / 90));

    const net = await load("cs-networks");
    expect(numberAnswer(net, "i", "100 megabits")).toBe(100 / 4);
    expect(numberAnswer(net, "a", "4 switches")).toBe(4 * (24 - 1));

    const open = await load("cs-open-source");
    expect(numberAnswer(open, "i", "came out in 2005")).toBe(2005 - 1991);
    expect(numberAnswer(open, "a", "1,200 open bug reports")).toBe(1_200 / 75);
  });

  it("networks: the first wrong option voices a real misconception and the explanation answers it", async () => {
    const net = await load("cs-networks");
    // The first wrong option is shown in every variant; the explanation must say why it is wrong.
    const wpa = question(net, "a", "Why does it matter that a home Wi-Fi network uses WPA2");
    expect(wpa[0][2][0]).toMatch(/hides the network's name/);
    expect(wpa[0][3]).toMatch(/Hiding the network's name is not encryption/);
    expect(wpa[1][3]).toMatch(/הסתרת שם הרשת היא לא הצפנה/);

    const mesh = question(net, "a", "A large house has rooms far from the router");
    expect(mesh[0][2][1]).toMatch(/password/);
    expect(mesh[0][3]).toMatch(/does not make the signal stronger/);
    expect(mesh[1][3]).toMatch(/לא מחזקת את האות/);

    // The switch/router and MAC/IP distractors swap the two roles, so only knowing which is which helps.
    const sw = question(net, "i", "What is the difference between a switch and a router?");
    expect(sw[0][2][0]).toBe("A router links devices in one network; a switch joins it to other networks");
    expect(sw[0][1]).toBe("A switch links devices in one network; a router joins it to other networks");
    const mac = question(net, "a", "What is the difference between a MAC address and an IP address?");
    expect(mac[0][2][0]).toBe(mac[0][1].replace("MAC", "#").replace("IP", "MAC").replace("#", "IP"));

    const cafe = question(net, "a", "You join a café's open Wi-Fi");
    expect(cafe[0][2][0]).toMatch(/café's name/);
    expect(cafe[0][3]).toMatch(/fake network with the same name/);
  });
});
