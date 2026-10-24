import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 4, C13: seven topics (spreadsheets, the history of video games, VR and AR, word processing, bonds, break-even,
 * budgeting). The two from the original library, "Spreadsheets" and "Budgeting and saving", had only two questions per
 * level, explanations as short as "50 − 10 = 40 ₪." and, in Spreadsheets, a Hebrew question with `>=` (mirrored in a
 * right-to-left line). They now meet the Plus and Pro collection's bar, with wrong options that voice real mistakes
 * (adding before multiplying, the average or the count taken for the sum, only the row of a reference shifting, a
 * reference without dollar signs, budgeting with the salary before tax). Hebrew prompts, explanations and steps start with
 * a Hebrew word, so `dir="auto"` lays them out right to left (a prompt such as "A1 = 4, … מה יציג" was drawn left to
 * right). The spreadsheet answers are checked by evaluating the formulas, and the number answers by calculating them.
 */

const IDS = ["cs-spreadsheets", "cs-video-game-history", "cs-vr-ar", "cs-word-processing", "econ-bonds", "econ-break-even", "econ-budgeting"] as const;
const ORIGINAL = ["cs-spreadsheets", "econ-budgeting"] as const;
const LEVELS = ["b", "i", "a"] as const;
type Level = (typeof LEVELS)[number];
const HEBREW = /\p{Script=Hebrew}/u;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

function question(c: TopicContent, l: Level, start: string) {
  const pair = (c[l].q ?? []).find(([en]) => en[0].startsWith(start));
  if (!pair) throw new Error(`no question "${start}" at ${l}`);
  return pair;
}

function numberItem(c: TopicContent, l: Level, text: string) {
  const item = (c[l].n ?? []).find(([, en]) => en[0].includes(text));
  if (!item) throw new Error(`no number item "${text}" at ${l}`);
  return item;
}

/** The first letter that sets the direction of a `dir="auto"` line: "R" for Hebrew, "L" for any other script. */
function firstStrong(s: string): "R" | "L" | undefined {
  for (const ch of s) {
    if (HEBREW.test(ch)) return "R";
    if (/\p{L}/u.test(ch)) return "L";
  }
  return undefined;
}

// ── a tiny spreadsheet: enough to check the answer keys of the formula questions ──

const colIndex = (letters: string) => [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const colName = (n: number): string => (n > 26 ? colName(Math.floor((n - 1) / 26)) : "") + String.fromCharCode(65 + ((n - 1) % 26));

/** A formula copied `rows` down and `cols` across: relative parts of each reference move, parts after a $ stay. */
function copyFormula(formula: string, rows: number, cols: number): string {
  return formula.replace(/(\$?)([A-Z]+)(\$?)(\d+)/g, (_, dc: string, c: string, dr: string, r: string) =>
    `${dc}${dc ? c : colName(colIndex(c) + cols)}${dr}${dr ? r : Number(r) + rows}`);
}

function cellsOf(range: string): string[] {
  const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
  if (!m) throw new Error(`not a range: ${range}`);
  const out: string[] = [];
  for (let c = colIndex(m[1]!); c <= colIndex(m[3]!); c++) for (let r = Number(m[2]); r <= Number(m[4]); r++) out.push(`${colName(c)}${r}`);
  return out;
}

/** Evaluates =SUM(range), =AVERAGE(range), =IF(cond,"a","b") and arithmetic over cell references (JavaScript precedence = the spreadsheet's). */
function evaluate(formula: string, cells: Record<string, number>): number | string {
  const body = formula.replace(/^=/, "");
  const iff = /^IF\((.+)=(.+),"([^"]*)","([^"]*)"\)$/.exec(body);
  if (iff) return evaluate(`=${iff[1]}`, cells) === evaluate(`=${iff[2]}`, cells) ? iff[3]! : iff[4]!;
  const expr = body
    .replace(/SUM\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, r: string) => String(cellsOf(r).reduce((s, x) => s + (cells[x] ?? 0), 0)))
    .replace(/AVERAGE\(([A-Z]+\d+:[A-Z]+\d+)\)/g, (_, r: string) => String(cellsOf(r).reduce((s, x) => s + (cells[x] ?? 0), 0) / cellsOf(r).length))
    .replace(/\$?([A-Z]+)\$?(\d+)/g, (_, c: string, r: string) => String(cells[`${c}${r}`] ?? 0));
  if (!/^[\d+\-*/(). ]+$/.test(expr)) throw new Error(`cannot evaluate ${formula}`);
  return Function(`"use strict"; return (${expr});`)() as number;
}

describe("computing and economy topics (C13)", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
  });

  it.each(ORIGINAL)("%s (original library) meets the collection's bar: 8+ items, 4+ questions, explanations of 40+", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
      for (const pair of lv.q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [, en, he] of lv.n ?? []) for (const [q, , explanation] of [en, he]) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
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

  it.each(IDS)("%s: Hebrew never uses < or >, and every Hebrew sentence starts with a Hebrew word (dir=auto reads it right to left)", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const sentences: string[] = [];
      const options: string[] = [];
      for (const t of lv.t ?? []) sentences.push(t[3]);
      for (const [, he] of lv.q ?? []) { sentences.push(he[0], he[3], ...(he[4] ? [he[4]] : [])); options.push(he[1], ...he[2]); }
      for (const [, , he] of lv.n ?? []) sentences.push(he[0], he[2], ...(he[3] ? [he[3]] : []));
      for (const [, he] of lv.s ?? []) sentences.push(...he);
      for (const s of [...sentences, ...options]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      // (a step that is only a rating, "AAA", has no Hebrew word to start with)
      for (const s of sentences) if (HEBREW.test(s)) expect(firstStrong(s), `${id}/${l}: ${s}`).toBe("R");
      // an option that is mostly Hebrew words starts with one too ("Paint או תוכנת ציור אחרת" was drawn as "… Paint")
      for (const s of options) {
        const he = (s.match(/\p{Script=Hebrew}/gu) ?? []).length, latin = (s.match(/[A-Za-z]/g) ?? []).length;
        if (he > latin) expect(firstStrong(s), `${id}/${l}: ${s}`).toBe("R");
      }
    }
  });

  it("the spreadsheet answer keys are what the formulas give, in both languages", async () => {
    const c = await load("cs-spreadsheets");
    const sum = question(c, "i", "A1 = 4, A2 = 6, A3 = 10");
    expect(sum[0][1]).toBe(String(evaluate("=SUM(A1:A3)", { A1: 4, A2: 6, A3: 10 })));
    expect(sum[0][2]).toContain((evaluate("=AVERAGE(A1:A3)", { A1: 4, A2: 6, A3: 10 }) as number).toFixed(2));
    const order = question(c, "i", "B1 holds 3 and B2 holds 5");
    expect(order[0][1]).toBe(String(evaluate("=B1*B2+1", { B1: 3, B2: 5 })));
    expect(order[0][2]).toContain(String(evaluate("=B1*(B2+1)", { B1: 3, B2: 5 })));
    const iff = question(c, "a", "A1 holds 4 and B1 holds 5");
    expect(iff[0][1]).toBe(evaluate('=IF(A1+B1=10,"Yes","No")', { A1: 4, B1: 5 }));
    const down = question(c, "a", "C1 contains =A1*B1");
    expect(down[0][1]).toBe(copyFormula("=A1*B1", 1, 0));
    const across = question(c, "a", "B1 contains =A1+1");
    expect(across[0][1]).toBe(copyFormula("=A1+1", 0, 1));
    const fixed = question(c, "a", "D1 holds the price of one ticket");
    expect(fixed[0][1]).toBe(copyFormula("=A2*$D$1", 1, 0));
    for (const pair of [sum, order, iff, down, across, fixed]) expect(pair[1][1], pair[0][0]).toBe(pair[0][1]);
    // the cell just below B2, and how many cells a block holds
    expect(question(c, "b", "Which cell is just below B2?")[0][1]).toBe(copyFormula("B2", 1, 0));
    expect(numberItem(c, "b", "columns A to E and rows 1 to 10")[0]).toBe(cellsOf("A1:E10").length);
    expect(numberItem(c, "i", "range A1:C4")[0]).toBe(cellsOf("A1:C4").length);
    expect(numberItem(c, "a", "pie chart")[0]).toBe(200 / 4);
  });

  it("the budgeting answers are what the calculation gives", async () => {
    const c = await load("econ-budgeting");
    expect(numberItem(c, "b", "20 ₪ a week")[0]).toBe(100 / 20);
    expect(numberItem(c, "b", "a ball that costs 60 ₪")[0]).toBe(60 - 15);
    expect(numberItem(c, "i", "babysitting")[0]).toBe(400 - 250);
    expect(numberItem(c, "i", "a bike that costs 1,200 ₪")[0]).toBe(1200 / 150);
    expect(numberItem(c, "a", "goes to wants")[0]).toBe(0.3 * 4000);
    expect(numberItem(c, "a", "in a year")[0]).toBe(12 * ((10 * 5000) / 100));
    const net = question(c, "a", "Your salary is 8,000 ₪ before tax");
    expect(net[0][1]).toMatch(/^6,500 ₪/);
    expect(net[0][2].some((w) => w.startsWith(`${((8000 + 6500) / 2).toLocaleString("en-US")} ₪, halfway`))).toBe(true);
    expect(net[0][3]).toContain(`${(8000 - 6500).toLocaleString("en-US")} ₪`);
    // "150 ה־₪" is not Hebrew; the shekels are named
    expect(question(c, "a", "You spend Saturday working")[1][2]).toContain("150 השקלים שהרווחתם");
  });

  it("the spreadsheet question no longer compares with >= and its Hebrew prompts name the cells in Hebrew", async () => {
    const c = await load("cs-spreadsheets");
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      expect(en[0], en[0]).not.toMatch(/[<>]/);
      expect(firstStrong(he[0]), he[0]).toBe("R");
    }
  });
});
