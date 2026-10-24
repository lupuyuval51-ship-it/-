import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, Question, TopicContent } from "@/lib/game/topics/types";
import unitCircle from "@/lib/game/topics/content/math-unit-circle";
import units from "@/lib/game/topics/content/math-units";
import vectors from "@/lib/game/topics/content/math-vectors";
import volume from "@/lib/game/topics/content/math-volume";
import wordProblems from "@/lib/game/topics/content/math-word-problems";
import codeStyle from "@/lib/game/topics/content/prog-code-style";
import conditions from "@/lib/game/topics/content/prog-conditions";
import debugging from "@/lib/game/topics/content/prog-debugging";
import dictionaries from "@/lib/game/topics/content/prog-dictionaries";
import events from "@/lib/game/topics/content/prog-events";

/**
 * Ten topics (maths: unit circle, units, vectors, volume, word problems; programming: code style, conditions,
 * debugging, dictionaries, events) held to the collection's quality bar (scripts/check-topics.ts). The five original
 * topics among them were thin (two or three questions per level, one with the right answer the longest option in 70 %
 * of its questions): they now have 8+ items and 4+ questions, numbers or orderings at every level, explanations of 40+
 * characters, and an answer that is the longest option in at most 40 % of the questions in each language.
 *
 * The arithmetic and the programs the new items talk about are recomputed here, so a wrong number in the content (or in
 * the answer key) fails: unit conversions, volumes, areas and densities in JavaScript; the Python traces by the same
 * loops written in JavaScript.
 */
const TOPICS: Record<string, TopicContent> = {
  "math-unit-circle": unitCircle,
  "math-units": units,
  "math-vectors": vectors,
  "math-volume": volume,
  "math-word-problems": wordProblems,
  "prog-code-style": codeStyle,
  "prog-conditions": conditions,
  "prog-debugging": debugging,
  "prog-dictionaries": dictionaries,
  "prog-events": events,
};
const LEVELS = ["b", "i", "a"] as const;
const levels = (c: TopicContent): [string, LevelContent][] => LEVELS.map((l) => [l, c[l]]);

const questions = (c: TopicContent): Question[] => LEVELS.flatMap((l) => c[l].q ?? []);
const numbers = (c: TopicContent): NumberItem[] => LEVELS.flatMap((l) => c[l].n ?? []);

/** The Hebrew strings of a level: terms, questions, numbers and orderings. */
const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).flatMap((t) => [t[2], t[3]]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : [])]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2], ...(he[3] ? [he[3]] : [])]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];

/** The question of the topic whose English text starts with `start` (it must be unique), as [en, he]. */
function question(id: string, start: string): Question {
  const found = questions(TOPICS[id]!).filter(([en]) => en[0].startsWith(start));
  expect(found.length, `${id}: "${start}"`).toBe(1);
  return found[0]!;
}
function number(id: string, start: string): NumberItem {
  const found = numbers(TOPICS[id]!).filter(([, en]) => en[0].startsWith(start));
  expect(found.length, `${id}: "${start}"`).toBe(1);
  return found[0]!;
}

describe("the ten topics hold the collection's bar", () => {
  for (const [id, c] of Object.entries(TOPICS)) {
    it(`${id}: 8+ items and 4+ questions, numbers or orderings at every level, every answer explained in 40+ characters`, () => {
      for (const [l, lv] of levels(c)) {
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
        expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
        for (const pair of lv.q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        for (const [, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      }
    });

    it(`${id}: the right answer is the longest option in at most 40 % of the questions, in each language`, () => {
      for (const lang of [0, 1] as const) {
        const all = questions(c).length;
        const longest = questions(c).filter((pair) => {
          const [, answer, wrong] = pair[lang];
          return answer.length > Math.max(...wrong.map((w) => w.length));
        }).length;
        expect(longest / all, `${id} ${lang ? "he" : "en"}: ${longest} of ${all}`).toBeLessThanOrEqual(0.4);
      }
    });
  }

  it("Hebrew never uses < or > (a right-to-left line draws them mirrored); only prog-conditions keeps them, in lines of code", () => {
    for (const [id, c] of Object.entries(TOPICS)) {
      if (id === "prog-conditions") continue;
      for (const [l, lv] of levels(c)) for (const s of hebrewTexts(lv)) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
    }
    // prog-conditions is about comparison operators, so its code lines have to show them. They sit between two operands inside a
    // line of code (drawn left to right by MathText, src/lib/i18n/bidi.ts); a comparison sign or "!=" written bare in Hebrew
    // prose ("ב־>= וב־<=", "ו־!= פירושו") would be drawn mirrored or reversed, so it is never written that way.
    const before = /[A-Za-z0-9)\]"']\s?$/u, after = /^\s?[A-Za-z0-9("'[]/u;
    const bare = (text: string) => [...text.matchAll(/[<>]=?|!=/g)].some((m) => !before.test(text.slice(0, m.index!)) || !after.test(text.slice(m.index! + m[0].length)));
    // (an answer option with no Hebrew letter in it, such as "!=", is drawn as a left-to-right expression of its own)
    for (const [l, lv] of levels(conditions)) for (const s of hebrewTexts(lv).filter((x) => /\p{Script=Hebrew}/u.test(x))) expect(bare(s), `prog-conditions/${l}: ${s}`).toBe(false);
  });
});

describe("the numbers the new items give are right", () => {
  it("math-units: conversions, areas, speeds and densities", () => {
    expect(number("math-units", "A ribbon is 3 m")[0]).toBe(3 * 100);
    expect(number("math-units", "How many milligrams are in 2 grams")[0]).toBe(2 * 1000);
    expect(number("math-units", "How many millimetres are in 4.5 cm")[0]).toBe(4.5 * 10);
    expect(number("math-units", "A cyclist rides at 5 m/s")[0]).toBe((5 * 3600) / 1000);
    expect(number("math-units", "A metal cube with edges of 5 cm")[0]).toBe(5 ** 3 * 8);
    expect(question("math-units", "Convert 3,400 g")[0][1]).toBe(`${3400 / 1000} kg`);
    expect(question("math-units", "A bottle holds 1.5 litres")[0][1]).toBe("1,500 ml");
    expect(question("math-units", "A rug is 2 m by 3 m")[0][1]).toBe(`${(2 * 3 * 100 * 100).toLocaleString("en-US")} cm²`);
    expect(question("math-units", "How many litres are in 1 cubic metre")[0][1]).toBe(`${(10 ** 3).toLocaleString("en-US")} litres`);
    expect(question("math-units", "Convert 72 km/h")[0][1]).toBe(`${(72 * 1000) / 3600} m/s`);
    // 1.2 km really is longer than 1,150 m, and 150 cm is the longest of 1,200 mm, 1 m, 90 cm and 150 cm
    expect(1.2 * 1000).toBeGreaterThan(1150);
    expect(Math.max(1200 / 10, 100, 90, 150)).toBe(150);
    expect(question("math-units", "Which length is the longest")[0][1]).toBe("150 cm");
    // the masses of the ordering are listed from the lightest to the heaviest
    const grams = [500, 0.8 * 1000, 1200, 2 * 1000];
    expect(grams).toEqual([...grams].sort((a, b) => a - b));
  });

  it("math-volume: volumes, litres, surface areas", () => {
    expect(number("math-volume", "What is the volume of a cube with edges of 2 cm")[0]).toBe(2 ** 3);
    expect(number("math-volume", "A box has a volume of 120 cm³")[0]).toBe(120 / (6 * 5));
    expect(number("math-volume", "Water is poured into an empty box")[0]).toBe(20 * 10 * 5);
    expect(number("math-volume", "A cube has a surface area of 54 cm²")[0]).toBe(Math.sqrt(54 / 6));
    expect(question("math-volume", "A box is 3 cubes long")[0][1]).toBe(String(3 * 3 * 2));
    expect(question("math-volume", "A tank measures 50 cm")[0][1]).toBe(`${(50 * 40 * 30) / 1000} litres`);
    expect(question("math-volume", "A cuboid has a base area of 20 cm²")[0][1]).toBe(`${20 * 4} cm³`);
    expect(question("math-volume", "A cylinder has a radius of 3 cm")[0][1]).toBe(`${3 ** 2 * 4}π cm³`);
    expect(question("math-volume", "A cone has a volume of 30 cm³")[0][1]).toBe(`${3 * 30} cm³`);
    const [l, w, h] = [4, 3, 2];
    expect(question("math-volume", "What is the surface area of a cuboid")[0][1]).toBe(`${2 * (l * w + l * h + w * h)} cm²`);
    // a wrong option of the cylinder question is the curved side 2πrh, which is not the volume
    expect(2 * 3 * 4).not.toBe(3 ** 2 * 4);
  });

  it("prog-debugging: the traces are what the Python code gives", () => {
    let x = 5;
    x = x + 1;
    x = x + 1;
    expect(number("prog-debugging", "In Python 3, after  x = 5")[0]).toBe(x);
    let total = 0;
    for (const n of [2, 4, 6]) total = total + n;
    expect(number("prog-debugging", "In Python 3, the program runs  total = 0  and then  for n in [2, 4, 6]")[0]).toBe(total);
    let y = 2;
    for (let i = 0; i < 3; i++) y = y * 2;
    expect(number("prog-debugging", "Trace it")[0]).toBe(y);
    let squares = 0;
    for (let i = 1; i < 4; i++) squares = squares + i * i;
    expect(number("prog-debugging", "In Python 3, the program runs  total = 0  and then  for i in range(1, 4)")[0]).toBe(squares);
    // the off-by-one question: range(1, 5) misses 5, the overwrite question ends with the last number
    let off = 0;
    for (let i = 1; i < 5; i++) off += i;
    expect(off).toBe(10);
    let over = 0;
    for (const n of [1, 2, 3]) over = n;
    expect(over).toBe(3);
  });

  it("prog-conditions and prog-dictionaries: the counts", () => {
    const x: number = 7;
    const equalsSeven = [x === 7, x !== 7, x === 8].filter(Boolean).length;
    expect(number("prog-conditions", "x = 7. How many of these three conditions")[0]).toBe(equalsSeven);
    let rows = 0;
    for (const a of [false, true]) for (const b of [false, true]) if (a || b) rows++;
    expect(number("prog-conditions", "A truth table for the inputs A and B")[0]).toBe(rows);
    expect(number("prog-conditions", "How many rows does a truth table for four")[0]).toBe(2 ** 4);
    let hi = 0;
    for (let i = 0; i < 4; i++) if (i === 1 || i === 3) hi++;
    expect(number("prog-conditions", "In Python 3, how many times is hi printed")[0]).toBe(hi);

    const d = new Map<string, number>([["a", 1], ["b", 2]]);
    d.set("c", 3);
    d.set("a", 10);
    expect(number("prog-dictionaries", "In Python 3, the program runs  d = {")[0]).toBe(d.size);
    expect(number("prog-dictionaries", "A Python 3 dictionary has 5 keys")[0]).toBe(5 + 1 - 2);
    expect(number("prog-dictionaries", "In Python 3,  scores = {")[0]).toBe(75);
  });

  it("the condition rewritten by De Morgan's law is really the same, and the one written with and for a weekend never holds", () => {
    for (const a of [0, 1, 2]) for (const b of [0, 1, 2]) {
      expect(!(a === 1 || b === 2)).toBe(a !== 1 && b !== 2);
    }
    const both = (day: string, first: string, second: string) => day === first && day === second;
    for (const day of ["Mon", "Sat", "Sun"]) expect(both(day, "Sat", "Sun")).toBe(false);
    // True or False and False: and binds tighter than or
    expect(true || (false && false)).toBe(true);
    expect((true || false) && false).toBe(false);
  });
});

describe("the new orderings and distractors", () => {
  it("every ordering has distinct steps, and the steps of he and en are as many", () => {
    for (const [id, c] of Object.entries(TOPICS)) {
      for (const [l, lv] of levels(c)) for (const [en, he] of lv.s ?? []) {
        expect(en.length, `${id}/${l}: ${en[0]}`).toBe(he.length);
        expect(new Set(en).size, `${id}/${l}: ${en[0]}`).toBe(en.length);
      }
    }
  });

  it("prog-debugging: no question is the same once capital letters and quotes are ignored (print and Print are two questions)", () => {
    const keys = questions(debugging).map(([en]) => en[0].toLowerCase().replace(/[.?!:,;"“”]+/g, "").replace(/\s+/g, " ").trim());
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("the unit-circle ordering lists the quadrants in the order the angles grow", () => {
    const quadrants = unitCircle.b.s![0]![0].slice(1);
    expect(quadrants.map((q) => Number(/from (\d+)°/.exec(q)![1]))).toEqual([0, 90, 180, 270]);
  });
});
