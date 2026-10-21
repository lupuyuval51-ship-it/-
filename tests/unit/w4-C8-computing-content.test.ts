import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "@/lib/game/spec/constants";
import { playThrough } from "@/lib/game/world/flow";
import { generateOffline } from "@/lib/offline/generate";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C8: seven computing topics (browsers, cloud computing, computational thinking, the history of computers,
 * contactless tech, copyright, cryptography) are held to the Plus and Pro collection's bar, also the four that belong to
 * the original library. Before: cryptography had two questions per level and nothing else, cloud computing gave the answer
 * away by its length in 11 of 12 questions (computational thinking 9 of 15, the history of computers 7 of 11), and the
 * ENIAC weight item was explained in a bare sum. The ciphers the questions ask about are worked out here, so a typo in an
 * answer key (or a wrong option that is really right) fails the test.
 */

const IDS = ["cs-browsers", "cs-cloud-computing", "cs-computational-thinking", "cs-computing-history", "cs-contactless", "cs-copyright", "cs-cryptography"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

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

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const HEBREW = "אבגדהוזחטיכלמנסעפצקרשת";
const caesar = (word: string, shift: number) => [...word].map((ch) => LATIN[(LATIN.indexOf(ch) + shift + 26 * 4) % 26]).join("");
const atbash = (word: string, abc: string) => [...word].map((ch) => abc[abc.length - 1 - abc.indexOf(ch)]).join("");

describe("computing topics (C8)", () => {
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

  it("every Caesar and Atbash puzzle has the answer the cipher really gives, and no wrong option gives it too", async () => {
    const c = await load("cs-cryptography");
    let checked = 0;
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        const [q, answer, wrong] = en;
        let expected: string | undefined;
        const enc = /(?:Caesar cipher with a shift of|Caesar shift of) (\d+), what does ([A-Z]+) become/.exec(q);
        const dec = /sends you ([A-Z]+), made with a Caesar cipher with a shift of (\d+)/.exec(q);
        const atb = /Atbash[\s\S]*What does it turn ([A-Z]+) into/.exec(q);
        if (enc) expected = caesar(enc[2]!, Number(enc[1]));
        if (dec) expected = caesar(dec[1]!, -Number(dec[2]));
        if (atb) expected = atbash(atb[1]!, LATIN);
        if (!expected) continue;
        checked++;
        expect(answer, q).toBe(expected);
        expect(wrong, q).not.toContain(expected);
        if (atb) {
          // the Hebrew version swaps Hebrew letters: א ↔ ת, ב ↔ ש, …
          const heWord = /את האותיות (\S+)\?/.exec(he[0])![1]!;
          expect(he[1], he[0]).toBe(atbash(heWord, HEBREW));
          expect(he[2], he[0]).not.toContain(atbash(heWord, HEBREW));
        } else {
          expect(he[1], he[0]).toBe(answer); // the same Latin letters in both languages
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4);
    // the beginner number item: B (2nd letter) moved 4 places is F, the 6th (ו, the 6th Hebrew letter, in Hebrew)
    expect(c.b.n![0]![0]).toBe(LATIN.indexOf(caesar("B", 4)) + 1);
    expect(HEBREW.indexOf("ב") + 1 + 4).toBe(HEBREW.indexOf("ו") + 1);
  });

  it("the number facts in the questions add up", async () => {
    const crypto = await load("cs-cryptography");
    const bits = crypto.a.q!.find(([[q]]) => q.includes("10-bit key"))!;
    expect(bits[0][1]).toBe((2 ** 10).toLocaleString("en-US"));
    const [keys, , , tol] = crypto.a.n![0]!;
    expect(Math.abs(2 ** 16 / 1000 - keys)).toBeLessThanOrEqual(tol ?? 0);
    expect(crypto.i.n![0]![0]).toBe(LATIN.indexOf("H") - LATIN.indexOf("E"));

    const history = await load("cs-computing-history");
    expect(history.a.n![0]![0]).toBeCloseTo(27_000 / 0.2);
    expect(history.i.n![0]![0]).toBe(1000 * 2 ** 5);

    const cloud = await load("cs-cloud-computing");
    expect(cloud.a.n![0]![0]).toBeCloseTo(8760 * 0.001);

    const contactless = await load("cs-contactless");
    const [wave, , , waveTol] = contactless.a.n![0]!;
    expect(Math.abs(300_000_000 / 13_560_000 - wave)).toBeLessThanOrEqual(waveTol ?? 0);
  });

  it("states the facts precisely: Enigma was first broken in Poland, and induction powers card tags", async () => {
    const crypto = await load("cs-cryptography");
    const enigma = crypto.i.t!.find(([en]) => en === "Enigma")!;
    expect(enigma[1]).toMatch(/Polish/);
    expect(enigma[3]).toMatch(/פולנים/);
    // passive UHF tags (the same topic's advanced level) are powered by radio waves on a dipole, not by a coil
    const contactless = await load("cs-contactless");
    const induction = contactless.i.q!.find(([[, answer]]) => answer.includes("magnetic field"))!;
    expect(induction[0][0]).toMatch(/card/);
    expect(induction[1][0]).toMatch(/כרטיס/);
  });

  it("cryptography builds a full, finishable two-area game at every level in both languages", async () => {
    const c = await load("cs-cryptography");
    for (const difficulty of DIFFICULTIES) for (const lang of ["en", "he"] as const) {
      const req = { mode: "FULL", subject: "x", learningGoal: "x", difficulty, gameType: "adventure", contentLanguage: lang, topicId: "cs-cryptography" } as const;
      const spec = generateOffline(req, new Date(0), "A", c).spec;
      expect(spec.areas.length, `${difficulty}/${lang}`).toBe(2);
      expect(playThrough(spec).finished, `${difficulty}/${lang}`).toBe(true);
    }
  });
});
