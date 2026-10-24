import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C34: seven history topics (the Renaissance, the Scientific Revolution, the Silk Road, the space race, Tel Aviv,
 * timelines, the Vikings) are held to the Plus and Pro collection's bar, the three of the original library too: every
 * level has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained in 40+ characters, and the
 * right answer is the longest option in at most 40 % of the questions in each language. Before this wave the Vikings
 * gave the answer away by its length in 79 % of their questions, the space race in 67 % and the Renaissance in 67 %
 * (English); the Renaissance and the space race had only two questions per level. The sums written in the explanations
 * are checked in both languages, and no item gives away the answer of a choice question of the same level.
 */

const IDS = [
  "history-renaissance", "history-scientific-revolution", "history-silk-road", "history-space-race",
  "history-tel-aviv", "history-timelines", "history-vikings",
] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** A written sum such as "1066 − 793 = 273", "44 + 14 − 1 = 57" or "4 × 4 × 4 = 64": every side of the chain is evaluated. */
const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
const SIDE = String.raw`${NUM}(?:\s*[−×÷+]\s*${NUM})*`;
const CHAIN = new RegExp(String.raw`${SIDE}(?:\s*=\s*${SIDE})+`, "g");
const toNumber = (s: string) => Number(s.replace(/,(?=\d{3}(?!\d))/g, "").replace(/,+$/, ""));

/** Evaluates "44 + 14 − 1" or "4 × 4 × 4", with × and ÷ before + and −. */
function evaluate(side: string): number {
  const tokens = side.match(new RegExp(`${NUM}|[−×÷+]`, "g")) ?? [];
  const terms: number[] = [];
  let sign = 1, term = toNumber(tokens[0]!);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]!, value = toNumber(tokens[i + 1]!);
    if (op === "×") term *= value;
    else if (op === "÷") term /= value;
    else { terms.push(sign * term); sign = op === "−" ? -1 : 1; term = value; }
  }
  terms.push(sign * term);
  return terms.reduce((a, b) => a + b, 0);
}

/** The words of an answer that carry meaning: "The Earth" is one word ("Earth"), "את כדור הארץ" two. */
const contentWords = (answer: string) => answer.split(/\s+/).filter((w) => !["the", "a", "an", "את"].includes(w.toLowerCase()));

describe("history topics (C34)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters, and a numeric answer is in its explanation", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect(explanation.includes(String(answer)) || explanation.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${q}`).toBe(true);
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
      expect(longest / all, `${id} ${lang ? "he" : "en"}: ${longest} of ${all}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: the same number of wrong options in English and Hebrew, and no < or > in Hebrew", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
        for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      }
      for (const [, , he] of c[l].n ?? []) for (const s of [he[0], he[2]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      for (const [, he] of c[l].s ?? []) for (const s of he) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
    }
  });

  it.each(IDS)("%s: every sum written in an explanation is right, in both languages", async (id) => {
    const c = await load(id);
    let checked = 0;
    for (const l of LEVELS) {
      const texts = [...(c[l].q ?? []).flatMap((pair) => pair.map((q) => q[3])), ...(c[l].n ?? []).flatMap(([, en, he]) => [en[2], he[2]])];
      for (const text of texts) for (const chain of text.match(CHAIN) ?? []) {
        const values = chain.split("=").map((side) => evaluate(side.trim()));
        for (const v of values) expect(v, `${id}/${l}: "${chain}" in "${text}"`).toBeCloseTo(values[0]!, 6);
        checked++;
      }
    }
    if (id === "history-vikings" || id === "history-renaissance" || id === "history-space-race") expect(checked).toBeGreaterThanOrEqual(4);
  });

  it.each(IDS)("%s: no item spells out the answer of a choice question of the same level", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      for (const lang of [0, 1] as const) {
        const prompts = [...(lv.q ?? []).map((p) => p[lang][0]), ...(lv.n ?? []).map((n) => n[lang + 1 as 1 | 2][0]), ...(lv.s ?? []).flatMap((o) => o[lang].slice(1))];
        for (const pair of lv.q ?? []) {
          const [q, answer] = pair[lang];
          if (contentWords(answer).length < 2 || /^[\d\s,.−–-]+$/.test(answer)) continue;
          for (const p of prompts) if (p !== q) expect(p.toLowerCase().includes(answer.toLowerCase()), `${id}/${l}: "${answer}" in "${p}"`).toBe(false);
        }
      }
    }
  });

  it("the space race: the Moon-walk question offers Apollo 11's crew, and a rocket is ״רקטה״ in Hebrew", async () => {
    const c = await load("history-space-race");
    const moon = (c.b.q ?? []).find(([en]) => en[1] === "Neil Armstrong")!;
    expect(moon[0][2]).toEqual(expect.arrayContaining(["Buzz Aldrin", "Michael Collins"]));
    expect(moon[1][2]).toEqual(expect.arrayContaining(["באז אולדרין", "מייקל קולינס"]));
    const rocket = (c.b.t ?? []).find(([en]) => en === "Rocket")!;
    expect(rocket[2]).toBe("רקטה");
    expect(c.a.n?.[0]?.[0]).toBe(Math.round(11.2 * 60));
  });

  it("the Renaissance: the new time order follows the real years, and Leonardo's age matches his dates", async () => {
    const c = await load("history-renaissance");
    const order = c.i.s?.[0];
    // Brunelleschi's dome (1436), the Mona Lisa begun (1503), the Sistine ceiling finished (1512), Luther (1517), Copernicus (1543);
    // no step names the printing press, which is the answer of a question of the same level
    expect(order?.[0].slice(1)).toEqual([
      "Brunelleschi finishes the great dome of Florence Cathedral", "Leonardo da Vinci begins painting the Mona Lisa",
      "Michelangelo finishes painting the Sistine Chapel ceiling", "Martin Luther starts the Reformation",
      "Copernicus publishes his model with the sun at the centre",
    ]);
    expect(order?.[1].length).toBe(order?.[0].length);
    expect(c.b.n?.[0]?.[0]).toBe(1519 - 1452);
    // the numeric item of the advanced level must not tell why Galileo was tried (that is the level's own question)
    for (const [, en, he] of c.a.n ?? []) {
      expect(en[0]).not.toMatch(/defend/i);
      expect(he[0]).not.toMatch(/הגן/);
    }
  });

  it("the sum checker reads chained sums whole and catches a wrong one", () => {
    const sums = (s: string) => (s.match(CHAIN) ?? []).map((chain) => chain.split("=").map((side) => evaluate(side.trim())));
    expect(sums("4 × 4 × 4 = 64, and")).toEqual([[64, 64]]);
    expect(sums("44 + 14 − 1 = 57 years.")).toEqual([[57, 57]]);
    expect(sums("11.2 × 60 = 672 km.")).toEqual([[672, 672]]);
    expect(sums("1066 − 793 = 237 years")[0]).toEqual([273, 237]);
  });

  it("the beginner orderings of Tel Aviv and the Scientific Revolution no longer answer their level's questions", async () => {
    const telAviv = await load("history-tel-aviv");
    for (const [en, he] of telAviv.b.s ?? []) {
      expect(en.join(" ")).not.toMatch(/Dizengoff/);
      expect(he.join(" ")).not.toMatch(/דיזנגוף/);
    }
    // the Earth-to-Sun ordering (Ptolemy, Copernicus, Galileo's moons of Jupiter, Newton's gravity) named the answers of four
    // beginner questions, and an ordering comes early in a game (the builder rotates name, q, n, define, s, q, …): it is now
    // an intermediate ordering, and the scientific method is the beginner one
    const science = await load("history-scientific-revolution");
    for (const [en, he] of science.b.s ?? []) {
      expect(en.join(" ")).not.toMatch(/Earth|Copernicus|Jupiter|Newton/);
      expect(he.join(" ")).not.toMatch(/כדור הארץ|קופרניקוס|צדק|ניוטון/);
    }
    expect(science.b.s?.[0]?.[0][0]).toBe("The steps of the scientific method, in order");
    expect(science.i.s?.map(([en]) => en[0])).toEqual(["From an Earth-centred to a Sun-centred universe, in order"]);
    expect(science.b.q?.[0]?.[0][0]).not.toMatch(/not the Earth/);
  });

  it("the Vikings: the navigation question's first distractor is the anachronistic compass and charts", async () => {
    const c = await load("history-vikings");
    const nav = (c.i.q ?? []).find(([en]) => en[0].startsWith("How did Vikings find their way"))!;
    expect(nav[0][2][0]).toMatch(/compass/);
    expect(nav[1][2][0]).toMatch(/מצפן/);
    expect(nav[0][3]).toMatch(/compass reached Europe only after the Viking Age/);
  });
});
