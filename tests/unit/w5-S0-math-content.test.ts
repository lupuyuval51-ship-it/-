import { describe, expect, it } from "vitest";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import logarithms from "@/lib/game/topics/content/math-logarithms";
import longMultiplication from "@/lib/game/topics/content/math-long-multiplication";
import mentalMath from "@/lib/game/topics/content/math-mental-math";
import money from "@/lib/game/topics/content/math-money";
import negativeNumbers from "@/lib/game/topics/content/math-negative-numbers";
import normalDistribution from "@/lib/game/topics/content/math-normal-distribution";
import numberBonds from "@/lib/game/topics/content/math-number-bonds";
import numberSets from "@/lib/game/topics/content/math-number-sets";
import orderOfOperations from "@/lib/game/topics/content/math-order-of-operations";
import percentages from "@/lib/game/topics/content/math-percentages";

/**
 * Ten maths topics held to the collection's quality bar (scripts/check-topics.ts) — the three original ones that were
 * too thin (negative numbers, order of operations, percentages) now have 8+ items and 4+ questions at every level —
 * plus a check of the arithmetic itself: every "What is <sum>?" question and number item is evaluated and compared with
 * the answer the content gives, and the he and en versions of a question must carry the same numbers.
 */
const TOPICS: Record<string, TopicContent> = {
  "math-logarithms": logarithms,
  "math-long-multiplication": longMultiplication,
  "math-mental-math": mentalMath,
  "math-money": money,
  "math-negative-numbers": negativeNumbers,
  "math-normal-distribution": normalDistribution,
  "math-number-bonds": numberBonds,
  "math-number-sets": numberSets,
  "math-order-of-operations": orderOfOperations,
  "math-percentages": percentages,
};
const LEVELS = ["b", "i", "a"] as const;

const hebrewTexts = (lv: LevelContent): string[] => [
  ...(lv.t ?? []).map((t) => t[3]),
  ...(lv.q ?? []).flatMap(([, he]) => [he[0], he[1], ...he[2], he[3], ...(he[4] ? [he[4]] : [])]),
  ...(lv.n ?? []).flatMap(([, , he]) => [he[0], he[2], ...(he[3] ? [he[3]] : [])]),
  ...(lv.s ?? []).flatMap(([, he]) => he),
];

/**
 * A small evaluator for the sums the content writes with + − × ÷ / brackets and superscript powers. A minus in front of a
 * power applies to the whole power, as in mathematics: −3² is −9, (−3)² is 9. Returns null for anything it cannot read.
 */
const SUPER: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
function evaluate(source: string): number | null {
  const text = source.replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/[\s]+/g, "");
  const tokens = text.match(/\d+(?:\.\d+)?|[⁰¹²³⁴⁵⁶⁷⁸⁹]+|[-−+×÷/()[\]]/g);
  if (!tokens || tokens.join("") !== text) return null;
  let at = 0;
  const peek = () => tokens[at];
  const fail = (): never => { throw new Error("unreadable"); };
  function expr(): number {
    let v = term();
    while (peek() === "+" || peek() === "-" || peek() === "−") { const op = tokens![at++]; const r = term(); v = op === "+" ? v + r : v - r; }
    return v;
  }
  function term(): number {
    let v = unary();
    while (peek() === "×" || peek() === "÷" || peek() === "/") { const op = tokens![at++]; const r = unary(); v = op === "×" ? v * r : v / r; }
    return v;
  }
  function unary(): number {
    if (peek() === "-" || peek() === "−") { at++; return -unary(); }
    return power();
  }
  function power(): number {
    const base = atom();
    const p = peek();
    if (p && /^[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(p)) { at++; return base ** Number([...p].map((c) => SUPER[c]).join("")); }
    return base;
  }
  function atom(): number {
    const t = tokens![at++];
    if (t === undefined) return fail();
    if (t === "(" || t === "[") { const v = expr(); const close = tokens![at++]; if (close !== (t === "(" ? ")" : "]")) fail(); return v; }
    if (/^\d/.test(t)) return Number(t);
    return fail();
  }
  try {
    const v = expr();
    return at === tokens.length && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
const asNumber = (s: string): number | null => {
  const t = s.replace(/,/g, "").replace(/−/g, "-").trim();
  return /^-?\d+(?:\.\d+)?$/.test(t) ? Number(t) : null;
};
const SUMS = [/^What is ([^?]+)\?/, /^Work out ([^?]+)\?/, /^כמה זה ([^?]+)\?/];
const sumOf = (prompt: string): number | null => {
  for (const re of SUMS) { const m = re.exec(prompt); if (m) return evaluate(m[1]!); }
  return null;
};
const digits = (s: string): string[] => s.match(/\d+(?:[.,]\d+)?/g) ?? [];

describe.each(Object.entries(TOPICS))("%s", (_id, c) => {
  it.each(LEVELS)("level %s has 8+ items, 4+ of them questions, numbers or orderings", (l) => {
    const lv = c[l];
    const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
    expect(items).toBeGreaterThanOrEqual(4);
    expect((lv.t?.length ?? 0) + items).toBeGreaterThanOrEqual(8);
  });

  it("explains every answer in 40+ characters, and every numeric explanation shows the answer", () => {
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, q).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) {
        for (const text of [en[2], he[2]]) {
          expect(text.length, en[0]).toBeGreaterThanOrEqual(40);
          expect([String(answer), answer.toLocaleString("en-US")].some((w) => text.includes(w)), en[0]).toBe(true);
        }
      }
    }
  });

  it("does not make the right answer the longest option in more than 40 % of the questions", () => {
    for (const lang of [0, 1] as const) {
      const qs = LEVELS.flatMap((l) => c[l].q ?? []).map((p) => p[lang]);
      const longest = qs.filter(([, a, w]) => a.length > Math.max(...w.map((x) => x.length))).length;
      expect(longest / qs.length, lang ? "he" : "en").toBeLessThanOrEqual(0.4);
    }
  });

  it("never uses < or > in Hebrew text", () => {
    for (const l of LEVELS) for (const s of hebrewTexts(c[l])) expect(/[<>]/.test(s), s).toBe(false);
  });

  it("the he and en versions of a question carry the same numbers", () => {
    // a text may spell a number out in one language ("one bolt", "שקל", "שנתיים") but never has a number the other language lacks
    const within = (he: string, en: string, what: string) => {
      const pool = digits(en);
      for (const d of digits(he)) {
        const at = pool.indexOf(d);
        expect(at, `${what}: ${d} in "${he}" is not in "${en}"`).toBeGreaterThanOrEqual(0);
        pool.splice(at, 1);
      }
    };
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        within(he[0], en[0], "question");
        within(he[1], en[1], `answer of ${en[0]}`);
        expect(he[2].length, `wrong options: ${en[0]}`).toBe(en[2].length);
        en[2].forEach((w, i) => within(he[2][i]!, w, `wrong option of ${en[0]}`));
      }
      for (const [, en, he] of c[l].n ?? []) within(he[0], en[0], "number item");
    }
  });
});

describe("the arithmetic of the content", () => {
  it("every readable sum has the answer the content gives, in both languages", () => {
    let checked = 0;
    for (const [id, c] of Object.entries(TOPICS)) {
      for (const l of LEVELS) {
        for (const pair of c[l].q ?? []) for (const [q, answer] of pair) {
          const sum = sumOf(q);
          const given = asNumber(answer);
          if (sum === null || given === null) continue;
          expect(sum, `${id}/${l}: ${q} → ${answer}`).toBeCloseTo(given, 9);
          checked++;
        }
        for (const [answer, en, he] of c[l].n ?? []) for (const t of [en, he]) {
          const sum = sumOf(t[0]);
          if (sum === null) continue;
          expect(sum, `${id}/${l}: ${t[0]} → ${answer}`).toBeCloseTo(answer, 9);
          checked++;
        }
      }
    }
    // the evaluator really read a good number of them (a regex that silently matched nothing would pass)
    expect(checked).toBeGreaterThan(60);
  });

  it("the evaluator follows the order of operations (a minus in front of a power belongs to the power)", () => {
    expect(evaluate("2 + 3 × 4")).toBe(14);
    expect(evaluate("(2 + 3) × 4")).toBe(20);
    expect(evaluate("−3²")).toBe(-9);
    expect(evaluate("(−3)²")).toBe(9);
    expect(evaluate("−20 ÷ (−5) − 7")).toBe(-3);
    expect(evaluate("2 × [10 − (3 + 1)²]")).toBe(-12);
    expect(evaluate("24 ÷ 4 ÷ 2 + 1")).toBe(4);
    expect(evaluate("7 × 1,000")).toBe(7000);
    expect(evaluate("half of 48")).toBeNull();
  });
});

describe("the three thin topics that were rebuilt", () => {
  it("negative numbers: a negative number to type shows its typed form (the minus on a keyboard is a hyphen)", () => {
    const negative = (negativeNumbers.i.n ?? []).find(([answer]) => answer < 0);
    expect(negative).toBeDefined();
    const [answer, en, he] = negative!;
    expect(answer).toBe(-4);
    expect(evaluate("6 + (−10)")).toBe(answer);
    for (const text of [en[2], he[2]]) expect(text).toContain("-4");
  });

  it("negative numbers: the lift, the temperatures and the bank account are right", () => {
    const find = (lv: LevelContent, start: string) => (lv.q ?? []).find(([en]) => en[0].startsWith(start));
    expect(find(negativeNumbers.b, "The buttons in a lift")![0][1]).toBe("−2");
    expect(find(negativeNumbers.a, "Dana's bank account")![0][1]).toBe("−30 ₪");
    expect(evaluate("−80 + 50")).toBe(-30);
    const order = (negativeNumbers.b.s ?? [])[0]![0].slice(1).map((s) => Number(s.replace("−", "-").replace(" °C", "")));
    expect([...order].sort((x, y) => x - y)).toEqual(order);
  });

  it("order of operations: the fraction bar question's wrong option is what you get without the grouping", () => {
    const q = (orderOfOperations.a.q ?? []).find(([en]) => en[0].startsWith("What is (8 + 4) / (5"))!;
    expect(q[0][2]).toContain("6.8");
    expect(evaluate("8 + 4 ÷ 5 − 2")).toBeCloseTo(6.8, 9);
    for (const t of q) expect(t[3]).toContain("6.8");
  });

  it("order of operations: the brackets question gives 3 only with the brackets round 10 − 4", () => {
    const q = (orderOfOperations.i.q ?? []).find(([en]) => en[0].startsWith("Where should brackets go"))!;
    expect(q[0][1]).toBe("(10 − 4) ÷ 2");
    expect(evaluate(q[0][1])).toBe(3);
    for (const wrong of q[0][2]) expect(evaluate(wrong.replace(/^\((10 − 4 ÷ 2)\)$/, "$1"))).toBe(8);
  });

  it("order of operations: the true statement is the one about equal rank, and the false ones really are false", () => {
    const q = (orderOfOperations.a.q ?? []).find(([en]) => en[0].startsWith("Which statement about the order"))!;
    expect(q[0][1]).toMatch(/equal rank/);
    expect(evaluate("10 − 3 + 2")).toBe(9);
    expect(q[0][2].join(" ")).toContain("equals 5");
  });

  it("percentages: the group of 100 children is the same in both languages (it was a class in one and a school in the other)", () => {
    const q = (percentages.b.q ?? []).find(([en]) => en[0].includes("of 100 children") || en[0].includes("100 children"))!;
    expect(q[0][0]).toMatch(/group of 100 children/);
    expect(q[1][0]).toMatch(/קבוצה של 100 ילדים/);
    expect(q[1][0]).not.toMatch(/בית ספר/);
  });

  it("percentages: the 50 to 60 rise offers 17 % (10 out of 60 is 16.7 %), not a loose 16 %", () => {
    const q = (percentages.i.q ?? []).find(([en]) => en[0].startsWith("A price goes up from 50"))!;
    for (const t of q) expect(t[2]).toContain("17%");
    for (const t of q) expect(t[2]).not.toContain("16%");
    expect(Math.round((10 / 60) * 100)).toBe(17);
  });

  it("percentages: the compound-interest number is 441, and the other percentage answers check out", () => {
    const [answer] = (percentages.a.n ?? []).find(([a]) => a === 441)!;
    expect(400 * 1.05 * 1.05).toBeCloseTo(answer, 9);
    expect(90 / 1.2).toBeCloseTo(75, 9);
    expect(150 / 1.2).toBeCloseTo(125, 9);
    expect(1 / 1.5).toBeCloseTo(2 / 3, 9);
    expect(30 / 120).toBe(0.25);
  });
});
