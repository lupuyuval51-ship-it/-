import { describe, expect, it } from "vitest";
import { mathRuns } from "@/lib/i18n/bidi";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";
import functions from "@/lib/game/topics/content/prog-functions";
import git from "@/lib/game/topics/content/prog-git";
import htmlCss from "@/lib/game/topics/content/prog-html-css";
import javascript from "@/lib/game/topics/content/prog-javascript";
import lists from "@/lib/game/topics/content/prog-lists";
import loops from "@/lib/game/topics/content/prog-loops";
import oop from "@/lib/game/topics/content/prog-oop";
import python from "@/lib/game/topics/content/prog-python";
import randomness from "@/lib/game/topics/content/prog-randomness";
import scratch from "@/lib/game/topics/content/prog-scratch";

/**
 * Wave 5, S4: the programming track (functions, Git, HTML and CSS, JavaScript, lists, loops, objects, Python, random numbers
 * and Scratch) held to the collection's bar (scripts/check-topics.ts). Seven of the ten were original-library topics with
 * two or three questions a level, and the right answer was the longest option in up to 78 % of Git's questions. Every number
 * and every fact that a new item rests on is recomputed here (the JavaScript items by running the very expressions), so a
 * typo in an answer key fails the test. Hebrew texts keep each piece of code in one piece (the bidi runs cut a statement at
 * ": ", "; " and ", " and a list literal inside a Hebrew sentence is drawn backwards), and have no < or >.
 */
const TOPICS: Record<string, TopicContent> = {
  "prog-functions": functions,
  "prog-git": git,
  "prog-html-css": htmlCss,
  "prog-javascript": javascript,
  "prog-lists": lists,
  "prog-loops": loops,
  "prog-oop": oop,
  "prog-python": python,
  "prog-randomness": randomness,
  "prog-scratch": scratch,
};
const LEVELS = ["b", "i", "a"] as const;

/** Every text of a level, by language (terms, questions with their options and explanations, numbers, orderings). */
function texts(lv: LevelContent): { en: string[]; he: string[] } {
  const en: string[] = [], he: string[] = [];
  for (const [a, b, c, d] of lv.t ?? []) { en.push(a, b); he.push(c, d); }
  for (const [e, h] of lv.q ?? []) {
    en.push(e[0], e[1], ...e[2], e[3], ...(e[4] ? [e[4]] : []));
    he.push(h[0], h[1], ...h[2], h[3], ...(h[4] ? [h[4]] : []));
  }
  for (const [, e, h] of lv.n ?? []) {
    en.push(e[0], e[1], e[2], ...(e[3] ? [e[3]] : []));
    he.push(h[0], h[1], h[2], ...(h[3] ? [h[3]] : []));
  }
  for (const [e, h] of lv.s ?? []) { en.push(...e); he.push(...h); }
  return { en, he };
}

const balanced = (s: string) => ["[]", "()", "{}"].every(([o, c]) => s.split(o!).length === s.split(c!).length);

/**
 * What the bidi runs of a Hebrew line get wrong about code: a run of code with a bracket left open (a list literal or a block
 * cut at ", " or "; "), or a run followed by a bare ":" or ";" that the renderer draws in front of it instead of behind.
 */
function codeCutIn(line: string): string[] {
  const parts = mathRuns(line);
  const problems: string[] = [];
  parts.forEach((p, i) => {
    if (!p.math || !/[A-Za-z]/.test(p.text)) return;
    if (!balanced(p.text)) problems.push(`open bracket in the run "${p.text}"`);
    const next = parts[i + 1];
    if (next && !next.math && /^[;:]\s*$/.test(next.text)) problems.push(`"${p.text}" is followed by a bare "${next.text.trim()}"`);
    if (!next && /[;:]$/.test(line)) problems.push(`"${p.text}" ends the line with a ${line.slice(-1)}`);
  });
  return problems;
}

describe.each(Object.entries(TOPICS))("%s", (id, c) => {
  it.each(LEVELS)("level %s has 8+ items, 4+ of them questions, numbers or orderings", (l) => {
    const lv = c[l];
    const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
    expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
  });

  it("explains every answer in 40+ characters, and a numeric explanation shows the answer", () => {
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

  it("the right answer is the longest option in at most 40 % of the questions, per language", () => {
    for (const lang of [0, 1] as const) {
      const qs = LEVELS.flatMap((l) => c[l].q ?? []).map((p) => p[lang]);
      const longest = qs.filter(([, a, w]) => a.length > Math.max(...w.map((x) => x.length))).length;
      expect(longest / qs.length, `${id} ${lang ? "he" : "en"}: ${longest}/${qs.length}`).toBeLessThanOrEqual(0.4);
    }
  });

  it("has no control characters or line breaks (a prompt is one line), and Hebrew text never uses < or >", () => {
    for (const l of LEVELS) {
      const { en, he } = texts(c[l]);
      for (const s of [...en, ...he]) expect(/[\u0000-\u001F\u007F‎‏‪-‮⁦-⁩]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      for (const s of he) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
    }
  });

  it("keeps the code of a Hebrew line in one piece (no list literal or statement cut by the bidi runs)", () => {
    const found: string[] = [];
    for (const l of LEVELS) for (const s of texts(c[l]).he) {
      if (/\p{Script=Hebrew}/u.test(s)) for (const p of codeCutIn(s)) found.push(`${id}/${l}: ${p} in "${s}"`);
    }
    expect(found).toEqual([]);
  });

  it("each question has the same number of wrong options in both languages, and no option repeats", () => {
    for (const l of LEVELS) for (const [e, h] of c[l].q ?? []) {
      expect(h[2].length, e[0]).toBe(e[2].length);
      for (const t of [e, h]) {
        const keys = [t[1], ...t[2]].map((o) => o.trim().toLowerCase());
        expect(new Set(keys).size, t[0]).toBe(keys.length);
      }
    }
  });
});

// ───────────────────────── the facts and sums the new items rest on ─────────────────────────

const numberAnswer = (c: TopicContent, level: "b" | "i" | "a", startsWith: string): number => {
  const hit = (c[level].n ?? []).find(([, en]) => en[0].startsWith(startsWith));
  if (!hit) throw new Error(`no numeric item starting with "${startsWith}" at ${level}`);
  return hit[0];
};
/** Python's range(start, stop, step), as a list. */
const pyRange = (start: number, stop: number, step = 1): number[] => {
  const out: number[] = [];
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) out.push(i);
  return out;
};
const answerOf = (c: TopicContent, level: "b" | "i" | "a", startsWith: string): string => {
  const hit = (c[level].q ?? []).find(([en]) => en[0].startsWith(startsWith));
  if (!hit) throw new Error(`no question starting with "${startsWith}" at ${level}`);
  return hit[0][1];
};

describe("the numbers and values are what the code gives", () => {
  it("functions: len, triple, power with a default, and the nested call", () => {
    expect(numberAnswer(functions, "b", "In Python 3, what is  len(")).toBe("hello".length);
    const triple = (n: number) => n * 3;
    expect(numberAnswer(functions, "i", "In Python 3,  def triple")).toBe(triple(4) + 1);
    const power = (base: number, exp = 2) => base ** exp;
    expect(numberAnswer(functions, "a", "In Python 3,  def power")).toBe(power(3) + power(2, 3));
    const sq = (n: number) => n * n;
    expect(numberAnswer(functions, "a", "In Python 3,  def sq")).toBe(sq(sq(2)));
    const fact = (n: number): number => (n === 0 ? 1 : n * fact(n - 1));
    expect(numberAnswer(functions, "a", "In Python 3,  def fact")).toBe(fact(4));
    // the string argument is repeated, not added to
    expect(answerOf(functions, "i", "In Python 3,  def twice")).toBe("ab".repeat(2));
  });

  it("loops: range ends, squares, how often a while loop runs, continue and the even numbers", () => {
    expect(numberAnswer(loops, "b", "In Python 3, what is the last number printed")).toBe(pyRange(1, 4).at(-1));
    expect(answerOf(loops, "i", "In Python 3, what does  for i in range(1, 4): print(i * i)")).toBe(pyRange(1, 4).map((i) => i * i).join(", "));
    let n = 10, runs = 0;
    while (n > 0) { n -= 3; runs++; }
    expect(numberAnswer(loops, "i", "In Python 3, n starts at 10")).toBe(runs);
    expect(answerOf(loops, "a", "In Python 3, a loop  for i in range(5)  runs  if i == 2: continue")).toBe(pyRange(0, 5).filter((i) => i !== 2).join(", "));
    expect(numberAnswer(loops, "a", "In Python 3, count starts at 0")).toBe(pyRange(1, 11).filter((i) => i % 2 === 0).length);
    expect(answerOf(loops, "a", "In Python 3, which numbers does  for i in range(10, 0, -3)")).toBe(pyRange(10, 0, -3).join(", "));
    // "range(1, 11)" really reaches 10, and "range(1, 10)" does not
    expect(pyRange(1, 11).at(-1)).toBe(10);
    expect(pyRange(1, 10).at(-1)).toBe(9);
    expect(pyRange(0, 4)).toHaveLength(4);
  });

  it("lists: insert, in, sort, a slice from the end and the length of an empty list", () => {
    const a = [1, 2, 3];
    a.splice(0, 0, 9);
    expect(answerOf(lists, "i", "In Python 3,  a = [1, 2, 3]  and then  a.insert")).toBe(`[${a.join(", ")}]`);
    expect([1, 2, 3].includes(3)).toBe(true);
    expect(answerOf(lists, "i", "In Python 3, what does  3 in")).toBe("True");
    // list.sort() sorts in place and returns None; sorted() would give the new list
    expect(answerOf(lists, "a", "In Python 3,  a = [3, 1, 2]  and then  b = a.sort()")).toBe("None");
    expect(answerOf(lists, "a", "In Python 3,  a = [1, 2, 3, 4] . What is  a[-2:]")).toBe(`[${[1, 2, 3, 4].slice(-2).join(", ")}]`);
    expect(numberAnswer(lists, "b", "In Python 3, what is  len([])")).toBe([].length);
  });

  it("CSS: the box widths of the two box-sizing models", () => {
    const padding = 10, border = 2, width = 100;
    expect(numberAnswer(htmlCss, "a", "In CSS (with the default box-sizing: content-box)")).toBe(width + 2 * padding + 2 * border);
    expect(numberAnswer(htmlCss, "a", "In CSS, a box has  box-sizing: border-box")).toBe(width - 2 * padding - 2 * border);
  });

  it("objects: the area of a rectangle", () => {
    class Rect { constructor(private w: number, private h: number) {} area() { return this.w * this.h; } }
    expect(numberAnswer(oop, "a", "In Python 3, class Rect")).toBe(new Rect(3, 4).area());
  });

  it("JavaScript: the new item is the real result of the expression", () => {
    // "5" - 2 converts the string to a number; "5" + 2 joins text
    expect(answerOf(javascript, "a", 'What does  console.log("5" - 2)')).toBe(String(Number("5") - 2));
    expect(("5" as string) + 2).toBe("52");
    expect(([10, 20, 30].indexOf(40))).toBe(numberAnswer(javascript, "a", "What does  [10, 20, 30].indexOf(40)"));
    expect(numberAnswer(javascript, "a", "After  const list = [1, 2];")).toBe([1, 2, 3].length);
    expect(numberAnswer(javascript, "i", "function double(n)")).toBe(14);
    expect(String(0.1 + 0.2 === 0.3)).toBe(answerOf(javascript, "a", "What does  console.log(0.1 + 0.2 === 0.3)"));
  });

  it("Python: sqrt gives a float, and 2 ** 3 is 8", () => {
    expect(Math.sqrt(16)).toBe(4);
    expect(numberAnswer(python, "a", "In Python 3, what does  print(2 ** 3)")).toBe(2 ** 3);
    // the ZeroDivisionError example: a division by zero raises, so the except block prints oops and nothing else
    expect(answerOf(python, "a", "In Python 3, the code  print(10 / 0)")).toBe("oops");
    // the input() example: input gives text, so "4" + "4" is "44", not 8
    expect(answerOf(python, "i", "In Python 3, after  n = input")).toBe("4" + "4");
  });
});

describe("Git, HTML and CSS: the new items", () => {
  it("Git: the commands the questions name are the real ones", () => {
    expect(answerOf(git, "b", "Which command turns the current folder into a new Git repository?")).toBe("git init");
    expect(answerOf(git, "i", "Which command shows which files have changed")).toBe("git status");
    expect(answerOf(git, "i", "You join a team and want your own copy")).toBe("git clone");
  });

  it("Git: the working day is ordered pull, branch, commit, push, merge", () => {
    const steps = git.a.s!.find(([en]) => en[0]?.startsWith("A day of work"))![0].slice(1);
    expect(steps.map((s) => s.split(" ")[0])).toEqual(["Pull", "Create", "Make", "Push", "Merge"]);
  });

  it("HTML: the layers of the box model go from the inside out", () => {
    const [en, he] = htmlCss.a.s![0]!;
    expect(en.slice(1)).toEqual(["Content", "Padding", "Border", "Margin"]);
    expect(he.slice(1)).toEqual(["תוכן", "ריפוד", "מסגרת", "שוליים"]);
  });

  it("HTML: the English side keeps the tags in angle brackets, the Hebrew side names them", () => {
    const heading = htmlCss.b.q![0]!;
    expect(heading[0][1]).toBe("<h1>");
    expect(heading[1][1]).toBe("h1");
    const li = htmlCss.b.q!.find(([en]) => en[0].includes("one item of a list"))!;
    expect(li[0][1]).toBe("<li>");
    expect(li[1][1]).toBe("li");
  });
});
