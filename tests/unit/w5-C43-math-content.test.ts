import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, C43: seven maths topics (coordinates, measuring spread, decimals, derivatives, division, equations, exponential
 * change) are held to the Plus and Pro collection's bar, even coordinates, decimals and equations, which belong to the
 * original library and had two or three questions per level with explanations as short as "Parallel lines have the same
 * slope: 2.": every level has 8+ items, 4+ of them questions, numbers or orderings, every answer is explained in 40+
 * characters (a numeric one is worked out in its explanation), and the right answer is the longest option in at most 40 %
 * of the questions in each language. The arithmetic is checked by machine: every "What is …?" is evaluated, and every
 * "Solve: …" is checked by putting the answer back into the equation (and no wrong option may solve it too).
 */

const IDS = [
  "math-coordinates", "math-data-spread", "math-decimals", "math-derivatives", "math-division", "math-equations", "math-exponential",
] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** A tiny evaluator for the arithmetic the questions use: + − × ÷ /, brackets, decimals, 1,000 separators, x or y, "4x", "3(x − 2)". */
function evaluate(expr: string, vars: Record<string, number> = {}): number {
  const src = expr.replace(/(?<=\d),(?=\d{3}(?!\d))/g, "").replace(/\s+/g, "");
  let at = 0;
  const peek = () => src[at];
  const atom = (): number => {
    const c = peek();
    if (c === "−" || c === "-") { at++; return -atom(); }
    if (c === "(") { at++; const v = sum(); if (src[at++] !== ")") throw new Error(`no ) in ${expr}`); return v; }
    const num = /^\d+(?:\.\d+)?/.exec(src.slice(at));
    if (num) { at += num[0].length; return Number(num[0]); }
    if (c && c in vars) { at++; return vars[c]!; }
    throw new Error(`cannot read "${src.slice(at)}" in ${expr}`);
  };
  // a factor written straight after a number or a bracket is a product: "4x", "2(x + 1)", "(x + 2)(x − 3)"
  const factor = (): number => {
    let v = atom();
    while (peek() === "(" || (peek() !== undefined && peek()! in vars)) v *= atom();
    return v;
  };
  const product = (): number => {
    let v = factor();
    for (let c = peek(); c === "×" || c === "÷" || c === "/" || c === "*"; c = peek()) { at++; const r = factor(); v = c === "×" || c === "*" ? v * r : v / r; }
    return v;
  };
  function sum(): number {
    let v = product();
    for (let c = peek(); c === "+" || c === "−" || c === "-"; c = peek()) { at++; const r = product(); v = c === "+" ? v + r : v - r; }
    return v;
  }
  const v = sum();
  if (at !== src.length) throw new Error(`left over "${src.slice(at)}" in ${expr}`);
  return v;
}
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
/** Does the value solve "lhs = rhs" for the letter? */
const solves = (equation: string, letter: string, value: number) => {
  const [lhs, rhs] = equation.split("=");
  return close(evaluate(lhs!, { [letter]: value }), evaluate(rhs!, { [letter]: value }));
};

describe("maths topics (C43)", () => {
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

  it.each(IDS)("%s: the right answer is the longest option in at most 40 % of the questions, in each language", async (id) => {
    const c = await load(id);
    for (const lang of [0, 1] as const) {
      let all = 0, longest = 0;
      for (const l of LEVELS) for (const pair of c[l].q ?? []) {
        const [, answer, wrong] = pair[lang];
        all++;
        if (answer.length > Math.max(...wrong.map((w) => w.length))) longest++;
      }
      expect(longest / all, `${id} ${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.4);
    }
  });

  it.each(IDS)("%s: options that are maths are the same in English and Hebrew, and no Hebrew text uses < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        // the same maths, or its numbers in a worded Hebrew option ("16" and "פי 16")
        const maths = (s: string) => !/\p{L}/u.test(s.replace(/\b[xy]\b/g, ""));
        const numbers = (s: string) => (s.match(/[\d.,]*\d/g) ?? []).join(" ");
        [en[1], ...en[2]].forEach((o, i) => {
          const h = [he[1], ...he[2]][i]!;
          if (maths(o) && maths(h)) expect(h, `${id}/${l}: ${en[0]}`).toBe(o);
          else if (maths(o)) expect(numbers(h), `${id}/${l}: ${en[0]}: ${o}`).toBe(numbers(o));
        });
        for (const s of [he[0], he[3], ...(he[4] ? [he[4]] : [])]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      }
    }
  });

  it.each(IDS)("%s: every \"What is …?\" is right, and every \"Solve: …\" answer solves its equation while no wrong option does", async (id) => {
    const c = await load(id);
    const WHAT = /^What is ([\d.,\s+−×÷()]+)\?$/;
    const SOLVE = /^Solve: ([^.?]+?=[^.?]+?)(?:\. What is ([xy])\?)?$/;
    let checked = 0;
    for (const l of LEVELS) {
      for (const [en] of c[l].q ?? []) {
        const [q, answer, wrong] = en;
        const what = WHAT.exec(q);
        if (what && /^[\d.,]+$/.test(answer)) {
          checked++;
          expect(close(evaluate(what[1]!), evaluate(answer)), `${id}/${l}: ${q} → ${answer}`).toBe(true);
          for (const w of wrong) if (/^[\d.,]+$/.test(w)) expect(close(evaluate(what[1]!), evaluate(w)), `${id}/${l}: ${q} also ${w}`).toBe(false);
        }
        const solve = SOLVE.exec(q);
        const value = /^([xy]) = (−?[\d.]+)$/.exec(answer);
        if (solve && value) {
          checked++;
          expect(solves(solve[1]!, value[1]!, evaluate(value[2]!)), `${id}/${l}: ${q} → ${answer}`).toBe(true);
          for (const w of wrong) {
            const other = /^([xy]) = (−?[\d.]+)$/.exec(w);
            if (other) expect(solves(solve[1]!, other[1]!, evaluate(other[2]!)), `${id}/${l}: ${q} also ${w}`).toBe(false);
          }
        }
        // "Which equation has the solution x = 3?": exactly one option is solved by it
        const which = /^Which equation has the solution ([xy]) = (−?[\d.]+)\?$/.exec(q);
        if (which) {
          checked++;
          const v = evaluate(which[2]!);
          expect(solves(answer, which[1]!, v), `${id}/${l}: ${answer}`).toBe(true);
          for (const w of wrong) expect(solves(w, which[1]!, v), `${id}/${l}: ${w}`).toBe(false);
        }
      }
      for (const [answer, en] of c[l].n ?? []) {
        const what = WHAT.exec(en[0]);
        if (what) { checked++; expect(close(evaluate(what[1]!), answer), `${id}/${l}: ${en[0]} → ${answer}`).toBe(true); }
        const solve = SOLVE.exec(en[0]);
        if (solve?.[2]) { checked++; expect(solves(solve[1]!, solve[2], answer), `${id}/${l}: ${en[0]} → ${answer}`).toBe(true); }
      }
    }
    if (["math-decimals", "math-division", "math-equations"].includes(id)) expect(checked, id).toBeGreaterThanOrEqual(5);
  });

  it("the evaluator reads the questions' notation", () => {
    expect(evaluate("4,800 ÷ 100")).toBe(48);
    expect(evaluate("3(x − 2)", { x: 11 })).toBe(27);
    expect(evaluate("2(x + 1)", { x: 4 })).toBe(10);
    expect(evaluate("5 − 2x", { x: 2.5 })).toBe(0);
    expect(solves("x ÷ 4 = 3", "x", 12)).toBe(true);
    expect(solves("2x + 1 = 2x + 5", "x", 7)).toBe(false);
  });

  it("decimals: scientific notation puts a number of at least 1 and below 10 in front, in both languages", async () => {
    const c = await load("math-decimals");
    const term = c.a.t!.find((t) => t[0] === "Scientific notation")!;
    expect(term[1]).toMatch(/less than 10/);
    expect(term[3]).toMatch(/קטן מ־10/);
    const q = c.a.q!.find(([en]) => en[0].includes("scientific notation"))!;
    expect(q[0][1]).toBe("3.2 × 10⁶");
    expect(evaluate("3.2 × 1000000")).toBe(evaluate("3,200,000"));
  });
});
