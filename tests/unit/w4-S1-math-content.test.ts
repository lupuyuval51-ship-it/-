import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, S1: ten maths topics (place value, powers and roots, primes and factors, probability, properties of operations,
 * Pythagoras, ratio, Roman numerals, sequences, sets and Venn diagrams). The seven that belong to the original library had
 * two questions per level; all ten are now held to the Plus and Pro collection's bar: 8+ items per level, every answer
 * explained in 40+ characters, the right answer the longest option in at most 40 % of the questions per language, and no
 * < or > in Hebrew. Every numeric answer is also worked out here independently of the content, so a wrong key cannot slip in.
 */

const IDS = [
  "math-place-value", "math-powers-roots", "math-primes-factors", "math-probability", "math-properties-of-operations",
  "math-pythagoras", "math-ratio", "math-roman-numerals", "math-sequences", "math-sets-venn",
] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The distinct numbers written in a text (Hebrew may say "a power of ten" with the digits 10 where English spells it out, so repeats do not count). */
const numbersIn = (s: string) => [...new Set((s.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]$/, "")))].sort();

describe("maths topics (S1)", () => {
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

  it.each(IDS)("%s: every answer is explained in 40+ characters, and a numeric answer is worked out", async (id) => {
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
      expect(longest / all, `${id} ${lang ? "he" : "en"}: ${longest} of ${all}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: options carry the same numbers in English and Hebrew, with the same number of wrong options", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      expect(he[2].length, `${id}/${l}: ${en[0]}`).toBe(en[2].length);
      expect(numbersIn(en[1]), `${id}/${l}: ${en[1]} / ${he[1]}`).toEqual(numbersIn(he[1]));
      en[2].forEach((w, i) => expect(numbersIn(w), `${id}/${l}: ${w} / ${he[2][i]}`).toEqual(numbersIn(he[2][i]!)));
    }
  });

  it.each(IDS)("%s: Hebrew has no < or > and no right-pointing arrow (a right-to-left line draws it backwards)", async (id) => {
    const c = await load(id);
    const he: string[] = [];
    for (const l of LEVELS) {
      const lv = c[l];
      for (const [, , term, meaning] of lv.t ?? []) he.push(term, meaning);
      for (const [, [q, a, w, e, h]] of lv.q ?? []) he.push(q, a, ...w, e, ...(h ? [h] : []));
      for (const [, , [q, u, e, h]] of lv.n ?? []) he.push(q, u, e, ...(h ? [h] : []));
      for (const [, steps] of lv.s ?? []) he.push(...steps);
    }
    for (const s of he) {
      expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
      expect(s.includes("→"), `${id}: ${s}`).toBe(false);
    }
  });

  it.each(IDS)("%s: no question is asked twice, options are distinct, and orderings have the same steps in both languages", async (id) => {
    const c = await load(id);
    for (const lang of [0, 1] as const) {
      const prompts = LEVELS.flatMap((l) => [...(c[l].q ?? []).map((p) => p[lang][0]), ...(c[l].n ?? []).map((n) => n[lang + 1 as 1 | 2][0])])
        .map((p) => p.toLowerCase().replace(/\s+/g, " ").replace(/[.?!:,;״"“”]+/g, "").trim());
      expect(new Set(prompts).size, `${id} ${lang ? "he" : "en"}`).toBe(prompts.length);
    }
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, answer, wrong] of pair) {
        const keys = [answer, ...wrong].map((o) => o.trim().toLowerCase().replace(/\s+/g, " "));
        expect(new Set(keys).size, `${id}/${l}: ${q}`).toBe(keys.length);
      }
      for (const [en, he] of c[l].s ?? []) {
        expect(en.length).toBe(he.length);
        expect(en.length - 1).toBeGreaterThanOrEqual(3);
        expect(en.length - 1).toBeLessThanOrEqual(6);
      }
    }
  });

  it.each(IDS)("%s: a hint never contains the right answer", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, answer, , , hint] of pair) if (hint && answer.length >= 3) expect(hint.includes(answer), `${id}/${l}: ${q}`).toBe(false);
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , , hint] of [en, he]) if (hint) expect(hint.includes(String(answer)), `${id}/${l}: ${q}`).toBe(false);
    }
  });
});

// ───────────────────────────── the numbers, worked out independently ─────────────────────────────

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const divisors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const isPrime = (n: number) => n > 1 && divisors(n).length === 2;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const decode = (r: string) => [...r].reduce((t, ch, i) => t + (ROMAN[ch]! < (ROMAN[r[i + 1] ?? ""] ?? 0) ? -ROMAN[ch]! : ROMAN[ch]!), 0);

/** The English question of every numeric item (and a few choice items) with the answer computed from scratch. */
const EXPECTED: Record<string, number> = {
  "If 7 × 5 = 35, what is 5 × 7?": 5 * 7,
  "What is 72 + 0?": 72,
  "What is 37 + 48 + 63?": 37 + 48 + 63,
  "What is 2 × 63 × 50?": 2 * 63 * 50,
  "What is 23 × 8?": 23 * 8,
  "What is 5 × 37 + 5 × 63?": 5 * 37 + 5 * 63,
  "What number comes right after 399?": 399 + 1,
  "A stadium has 48,700 seats. Round that to the nearest thousand.": Math.round(48700 / 1000) * 1000,
  "How many zeros does the number one billion have?": String(10 ** 9).length - 1,
  "How many 7s are multiplied together in 7⁴?": 4,
  "What is 4³?": 4 ** 3,
  "What is √169?": Math.sqrt(169),
  "What is the value of 2⁻³ × 2⁵?": 2 ** -3 * 2 ** 5,
  "How many factors does 20 have?": divisors(20).length,
  "What is the 5th multiple of 7?": 5 * 7,
  "How many prime numbers are there between 1 and 100?": range(1, 100).filter(isPrime).length,
  "What is the sum of all the prime numbers below 10?": sum(range(1, 9).filter(isPrime)),
  "How many factors does 36 have?": divisors(36).length,
  "What is the greatest common divisor of 36 and 60?": gcd(36, 60),
  "What is the least common multiple of 12 and 18?": lcm(12, 18),
  "How many different outcomes are there when you roll one normal die?": 6,
  "How many different outcomes are there when you flip a coin and roll a die?": 2 * 6,
  "A fair die is rolled 60 times. How many sixes would you expect on average?": 60 / 6,
  "What is the expected value (average) of one roll of a fair die?": sum(range(1, 6)) / 6,
  "A coin was flipped 50 times and landed on heads 20 times. What is the relative frequency of heads, as a decimal?": 20 / 50,
  "A fair spinner has the numbers 1, 2, 3 and 4 on equal parts. What is the expected value (average) of a spin?": sum(range(1, 4)) / 4,
  "What is the square root of 49?": Math.sqrt(49),
  "What is the square of 12?": 12 ** 2,
  "A right triangle has hypotenuse 13 and one leg 5. How long is the other leg?": Math.sqrt(13 ** 2 - 5 ** 2),
  "A rectangle is 16 cm wide and 12 cm high. How long is its diagonal?": Math.hypot(16, 12),
  "A box measures 2 × 3 × 6. How long is its space diagonal?": Math.hypot(2, 3, 6),
  "What is the area of a right triangle with hypotenuse 13 and one leg 5?": (5 * Math.sqrt(13 ** 2 - 5 ** 2)) / 2,
  "A pack has 2 pens for every 3 pencils. There are 12 pencils. How many pens are there?": (12 / 3) * 2,
  "A car travels at 60 km per hour. How far does it go in 2.5 hours?": 60 * 2.5,
  "Noa types 120 words in 4 minutes at a steady speed. How many words does she type in 10 minutes?": (120 / 4) * 10,
  "Two numbers are in the ratio 3 : 7 and their sum is 50. What is the larger number?": (50 / (3 + 7)) * 7,
  "A model car is 18 cm long. The scale is 1 : 25. How long is the real car, in metres?": (18 * 25) / 100,
  "Count by 4s: 4, 8, 12, 16, … What is the 6th number in the list?": 6 * 4,
  "The sequence 5, 8, 11, 14, … continues. What is the 7th term?": 5 + 6 * 3,
  "What is 1 + 3 + 5 + 7 + 9?": 1 + 3 + 5 + 7 + 9,
  "The nth term of a sequence is n² + 1. What is the 6th term?": 6 ** 2 + 1,
  "What is 1 + 2 + 3 + … + 20?": sum(range(1, 20)),
  "How many elements does the set {red, blue, green, yellow} have?": new Set(["red", "blue", "green", "yellow"]).size,
  "12 children have a dog, 8 have a cat and 3 have both. How many children have a dog but no cat?": 12 - 3,
  "In a group of 30 students, 18 study French, 15 study Spanish and 7 study both. How many study neither?": 30 - (18 + 15 - 7),
  "A = {1, 2, 3, 4, 5, 6} and B = {4, 5, 6, 7, 8}. How many elements are in A ∪ B?": new Set([1, 2, 3, 4, 5, 6, 4, 5, 6, 7, 8]).size,
  "Using n(A ∪ B) = n(A) + n(B) − n(A ∩ B): n(A) = 20, n(B) = 15 and n(A ∪ B) = 28. What is n(A ∩ B)?": 20 + 15 - 28,
  "How many subsets does the set {1, 2, 3} have, counting the empty set and the set itself?": 2 ** 3,
};

describe("maths topics (S1): numeric answers are right", () => {
  it("every numeric item of the ten topics is checked, and its key matches the independent result", async () => {
    const seen = new Set<string>();
    for (const id of IDS) {
      const c = await load(id);
      for (const l of LEVELS) for (const [answer, en] of c[l].n ?? []) {
        if (id === "math-roman-numerals" && /^Which number is [IVXLCDM]+\?$/.test(en[0])) {
          expect(answer, `${id}: ${en[0]}`).toBe(decode(/is ([IVXLCDM]+)\?/.exec(en[0])![1]!));
          continue;
        }
        if (en[0].startsWith("What is the largest number you can write in standard Roman numerals")) { expect(answer).toBe(3999); continue; }
        expect(EXPECTED[en[0]], `no independent check for: ${en[0]}`).toBeDefined();
        expect(answer, `${id}/${l}: ${en[0]}`).toBeCloseTo(EXPECTED[en[0]]!, 9);
        seen.add(en[0]);
      }
    }
    expect([...seen].sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it("Roman numeral questions: the number matches the numeral in every choice question and year", async () => {
    const c = await load("math-roman-numerals");
    for (const l of LEVELS) for (const [en] of c[l].q ?? []) {
      const [question, answer] = en;
      const m = /^Which (?:number|year) is ([IVXLCDM]+)\?$/.exec(question);
      if (m) expect(Number(answer.replace(/,/g, "")), question).toBe(decode(m[1]!));
    }
    expect(decode("MCMXLVIII")).toBe(1948);
  });

  it("choice answers worked out from scratch", async () => {
    const find = async (id: string, text: string) => {
      const c = await load(id);
      for (const l of LEVELS) for (const [en] of c[l].q ?? []) if (en[0] === text) return en;
      throw new Error(`${id}: no question "${text}"`);
    };
    // primes, factors and multiples
    expect(isPrime(13)).toBe(true);
    expect((await find("math-primes-factors", "Which of these numbers is composite?"))[1]).toBe("57");
    expect(isPrime(57)).toBe(false);
    for (const wrong of [53, 59, 61]) expect(isPrime(wrong)).toBe(true);
    expect((await find("math-primes-factors", "Which number divides by 6?"))[1]).toBe("78");
    expect([78, 64, 93, 85].map((n) => n % 6 === 0)).toEqual([true, false, false, false]);
    expect((await find("math-primes-factors", "What is the least common multiple of 4 and 10?"))[1]).toBe(String(lcm(4, 10)));
    expect((await find("math-primes-factors", "Which pair of numbers is co-prime?"))[1]).toBe("9 and 16");
    expect([[9, 16], [6, 9], [8, 12], [10, 15]].map(([a, b]) => gcd(a!, b!))).toEqual([1, 3, 4, 5]);
    expect(isPrime(91)).toBe(false);
    expect(7 * 13).toBe(91);
    expect(2 ** 3 * 3).toBe(24);
    // powers and roots
    expect((await find("math-powers-roots", "What is 2³ + 3²?"))[1]).toBe(String(2 ** 3 + 3 ** 2));
    expect((await find("math-powers-roots", "What is √(9 + 16)?"))[1]).toBe(String(Math.sqrt(9 + 16)));
    expect((await find("math-powers-roots", "What is 10⁴?"))[1]).toBe("10,000");
    expect(2 ** 5).toBeGreaterThan(5 ** 2);
    expect((2 ** 3) ** 2).toBe(2 ** 6);
    expect(2 ** 3 * 3 ** 3).toBe(6 ** 3);
    expect(10 ** -3).toBeCloseTo(0.001, 12);
    // probability
    expect(12 / (12 + 18)).toBeCloseTo(2 / 5, 12);
    expect((3 / 5) * (3 / 5)).toBeCloseTo(9 / 25, 12);
    expect((3 / 5) * (2 / 4)).toBeCloseTo(3 / 10, 12);
    expect(1 - 1 / 4).toBe(3 / 4);
    expect(2 / 8).toBe(1 / 4);
    // Pythagoras
    expect(5 ** 2 + 12 ** 2).toBe(13 ** 2);
    expect(5 ** 2 + 12 ** 2).not.toBe(14 ** 2);
    expect(8 ** 2 + 15 ** 2).toBe(17 ** 2);
    expect(7 ** 2 + 24 ** 2).toBe(25 ** 2);
    expect(Math.hypot(4 - -2, 9 - 1)).toBe(10);
    expect(Math.sqrt(5 ** 2 - 3 ** 2)).toBe(4);
    // ratio and sequences
    expect(gcd(12, 18)).toBe(6);
    expect((45 / 3) * 5).toBe(75);
    expect((300 / 12) * 20).toBe(500);
    expect((36 / (4 + 5)) * 5).toBe(20);
    expect((6 * 10) / 4).toBe(15);
    expect([21 / 3, 15 / 2]).toEqual([7, 7.5]);
    expect(3 * 15 + 2).toBe(47);
    expect(5 * 10 - 2).toBe(48);
    expect([3, 6, 12, 24, 48, 96, 192].find((t) => t > 100)).toBe(192);
    expect(11 + 5).toBe(16); // 1, 2, 4, 7, 11: the gaps are 1, 2, 3, 4, so the next gap is 5
    expect(2 + 9 * 3).toBe(29); // the 10th term of 2, 5, 8, 11, …
    expect([1, 2, 3, 4].map((n) => 5 * n + 2)).toEqual([7, 12, 17, 22]); // 7, 12, 17, 22, … is 5n + 2
  });
});
