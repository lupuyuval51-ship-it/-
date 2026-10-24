import { describe, expect, it } from "vitest";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";
import { mathRuns } from "@/lib/i18n/bidi";

/**
 * Wave 5, C44: seven maths topics (algebraic expressions, fractions, functions, Hebrew letter numerals, maths history,
 * inequalities, integrals).
 *
 * - A comparison sign (< > ≤ ≥) or a blank box (☐) in a Hebrew line must sit inside a maths run, which the game draws left
 *   to right (`MathText`, `src/lib/i18n/bidi.ts`). A sign on its own in a right-to-left line is mirrored by the bidi
 *   algorithm: the inequalities topic used to say "הסימן > : המספר משמאל גדול יותר" (drawn with "<"), name the terms
 *   "לפחות (≥)" and "לכל היותר (≤)" (drawn with the other sign) and ask "0.5 ☐ 0.25" (drawn "0.25 ☐ 0.5", so a learner
 *   reading it left to right, as in a textbook, picked the wrong sign).
 * - Every "Solve: …" inequality is checked by machine against its answer and wrong options, and every "Simplify / Expand /
 *   Factorise" in the expressions topic by evaluating both sides at several points.
 * - The right answer is strictly the longest option in at most 40 % of the choice questions of each topic and language.
 */

const IDS = [
  "math-expressions", "math-fractions", "math-functions", "math-hebrew-numerals", "math-history-of-maths", "math-inequalities", "math-integrals",
] as const;
const LEVELS = ["b", "i", "a"] as const;
const HEBREW = /\p{Script=Hebrew}/u;

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
    for (const [, h] of lv.q ?? []) out.push(h[0], h[1], ...h[2], h[3], ...(h[4] ? [h[4]] : []));
    for (const [, , h] of lv.n ?? []) out.push(h[0], h[2], ...(h[3] ? [h[3]] : []));
    for (const [, h] of lv.s ?? []) out.push(...h);
  }
  return out;
}

/** A small evaluator: numbers, the letters a b n x, + − × · /, brackets, ² and ³, a factor written straight after another ("3x", "2(x + 1)"). */
function evaluate(expr: string, vars: Record<string, number>): number {
  const src = expr.replace(/\s+/g, "");
  let at = 0;
  const peek = () => src[at];
  const power = (v: number): number => {
    while (peek() === "²" || peek() === "³") v = peek() === "²" ? (at++, v * v) : (at++, v * v * v);
    return v;
  };
  const atom = (): number => {
    const c = peek();
    if (c === "−" || c === "-") { at++; return -factor(); }
    if (c === "(") { at++; const v = sum(); if (src[at++] !== ")") throw new Error(`no ) in ${expr}`); return power(v); }
    const num = /^\d+(?:\.\d+)?/.exec(src.slice(at));
    if (num) { at += num[0].length; return power(Number(num[0])); }
    if (c && c in vars) { at++; return power(vars[c]!); }
    throw new Error(`cannot read "${src.slice(at)}" in ${expr}`);
  };
  const factor = (): number => {
    let v = atom();
    while (peek() === "(" || (peek() !== undefined && peek()! in vars)) v *= atom();
    return v;
  };
  const product = (): number => {
    let v = factor();
    for (let c = peek(); c === "×" || c === "·" || c === "/"; c = peek()) { at++; const r = factor(); v = c === "/" ? v / r : v * r; }
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

const COMPARE = /\s*(≤|≥|<|>|=)\s*/;
/** Whether an inequality such as "x + 4 > 10" or "x ≤ 3" (or an equation "x = 6") holds for this x. */
function holds(inequality: string, x: number): boolean {
  const [left, op, right] = inequality.split(COMPARE);
  const l = evaluate(left!, { x }), r = evaluate(right!, { x });
  return op === "<" ? l < r : op === ">" ? l > r : op === "≤" ? l <= r : op === "≥" ? l >= r : Math.abs(l - r) < 1e-9;
}
const SAMPLES = Array.from({ length: 81 }, (_, i) => -10 + i / 4);

describe("w5-C44 maths topics", () => {
  it("every comparison sign or blank box in a Hebrew line is drawn inside a left-to-right maths run", async () => {
    for (const id of IDS) {
      for (const s of hebrewTexts(await load(id))) {
        if (!HEBREW.test(s)) continue;
        const loose = mathRuns(s).filter((p) => !p.math && /[<>≤≥☐]/u.test(p.text));
        expect(loose, `${id}: "${s}"`).toEqual([]);
      }
    }
  });

  it("the inequality terms are named in words in Hebrew and show their sign in an example", async () => {
    const c = await load("math-inequalities");
    const he = new Map(c.i.t!.map((t) => [t[2], t[3]]));
    expect(he.get("לפחות")).toContain("x ≥ 12");
    expect(he.get("לכל היותר")).toContain("x ≤ 12");
  });

  it("every Solve: inequality has the right answer, and no wrong option has the same solutions", async () => {
    const c = await load("math-inequalities");
    let checked = 0;
    for (const l of LEVELS) for (const [[q, answer, wrong]] of c[l].q ?? []) {
      const m = /^Solve: (.+)$/.exec(q);
      if (!m) continue;
      checked++;
      for (const x of SAMPLES) expect(holds(answer, x), `${q} → ${answer} at x = ${x}`).toBe(holds(m[1]!, x));
      for (const w of wrong) expect(SAMPLES.some((x) => holds(w, x) !== holds(m[1]!, x)), `${q}: ${w}`).toBe(true);
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  });

  it("the counting questions about inequalities are right", async () => {
    const c = await load("math-inequalities");
    const count = c.a.q!.find(([[q]]) => q.startsWith("How many whole numbers satisfy 2 < x ≤ 5"))!;
    expect(Number(count[0][1])).toBe([0, 1, 2, 3, 4, 5, 6, 7].filter((x) => holds("2 < x", x) && holds("x ≤ 5", x)).length);
    const smallest = c.i.n!.find(([, [q]]) => q.includes("3x > 10"))!;
    expect(smallest[0]).toBe([0, 1, 2, 3, 4, 5, 6].find((x) => holds("3x > 10", x)));
  });

  it("every Simplify / Expand / Factorise has an equal answer and wrong options that are not equal", async () => {
    const c = await load("math-expressions");
    const points = [{ a: 2, b: 7, x: 3 }, { a: -1, b: 4, x: -2 }, { a: 5, b: -3, x: 0.5 }, { a: 0.5, b: 2, x: 11 }];
    let checked = 0;
    for (const l of LEVELS) for (const [[q, answer, wrong]] of c[l].q ?? []) {
      const m = /^(?:Simplify|Expand|Factorise): (.+)$/.exec(q);
      if (!m) continue;
      checked++;
      for (const p of points) expect(evaluate(answer, p), `${q} → ${answer}`).toBeCloseTo(evaluate(m[1]!, p), 9);
      for (const w of wrong) expect(points.some((p) => Math.abs(evaluate(w, p) - evaluate(m[1]!, p)) > 1e-9), `${q}: ${w}`).toBe(true);
    }
    expect(checked).toBeGreaterThanOrEqual(6);
  });

  it("the substitution questions of the expressions and functions topics are worked out right", async () => {
    const exprs = await load("math-expressions"), fns = await load("math-functions");
    const answerOf = (c: TopicContent, l: (typeof LEVELS)[number], start: string) => c[l].n!.find(([, [q]]) => q.startsWith(start))![0];
    expect(answerOf(exprs, "b", "If n = 6")).toBe(evaluate("2n + 1", { n: 6 }));
    expect(answerOf(exprs, "i", "If x = 5")).toBe(evaluate("4x − 3", { x: 5 }));
    expect(answerOf(fns, "b", "A machine takes away 4")).toBe(evaluate("9 + 4", {}));
    expect(answerOf(fns, "i", "A line has gradient 2")).toBe(evaluate("2x + 1", { x: 5 }));
    expect(answerOf(fns, "a", "For f(x) = x² − 3x")).toBe(evaluate("x² − 3x", { x: 5 }));
    const machine = fns.b.q!.find(([[q]]) => q.startsWith("A machine multiplies by 3 and then adds 1"))!;
    expect(Number(machine[0][1])).toBe(evaluate("4 × 3 + 1", {}));
  });

  it("the right answer is the longest option in at most 40 % of the choice questions of each topic and language", async () => {
    for (const id of IDS) {
      const c = await load(id);
      const longest = [0, 0], all = [0, 0];
      for (const l of LEVELS) for (const pair of c[l].q ?? []) pair.forEach(([, answer, wrong], lang) => {
        all[lang]!++;
        if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
      });
      for (const lang of [0, 1]) expect(longest[lang]! / Math.max(1, all[lang]!), `${id} ${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.4);
    }
  });
});
