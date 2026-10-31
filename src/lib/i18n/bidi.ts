/**
 * Maths inside a Hebrew (right-to-left) line. The Unicode bidi algorithm keeps each number left-to-right, but the signs
 * between numbers take the direction of the line, so in Hebrew "1/3 = x/9" is drawn as "x/9 = 1/3", "1 ÷ 1/5 = 5" as
 * "5 = 1/5 ÷ 1", a mixed number "2 1/4" as "1/4 2", and a blank "?/9" as "9/?". Israeli textbooks write all of these
 * left-to-right, so the renderer shows every such expression as one isolated left-to-right run (`<bdi dir="ltr">`).
 *
 * The content itself stays plain text (bidi control characters are rejected by the spec validator); this only decides
 * how it is drawn. Lists ("0.42, 0.43") and arrows stay separate runs, so they keep the reading order of the line.
 */
const HEBREW = /\p{Script=Hebrew}/u;

// a number: 1,200 · 3.47 · 3/4 · 25% · 0.333… · 115° · ½ · a mixed number 2 1/4 · a blank x/9, 7/x
const NUM = String.raw`(?:\d+ (?:\d+|x)\/\d+|\d+(?:[.,]\d+)*(?:\/(?:\d+(?:,\d{3})*|x))?(?:…|%|°)?|x\/\d+|[½¼¾⅓⅔])`;
// π in radians: π, 2π, π/6, 5π/6
const PI = String.raw`(?:\d*π(?:\/\d+)?)`;
// exponents written as superscripts: 2², 10⁻⁴, 2ⁿ, 4ˣ, 1.06ᵗ
const SUP = String.raw`[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿⁱˣʸᵗ]*`;
// a sign in front of a number ("-30", "−2", "−√2") belongs to it, unless a letter is glued to it: "ל-0" is the prefix ל ("to") and 0
const SIGN = String.raw`(?:(?<![\p{L}\p{N}])[−-](?=[\d√π]))?`;
// a variable: x, or a Greek letter ("σ = 10", "2θ")
const VAR = String.raw`(?:x(?![A-Za-z])|\p{Script=Greek}(?!\p{L}))`;
// an operand: a number (or a root of one), optionally written straight into a variable ("3x", "3x3", "2σ"), π, a variable, the
// "…" of a sum ("1 + 2 + … + 9") or a box for a blank; with superscript exponents
const OPERAND = String.raw`(?:${SIGN}√?(?:${PI}|${NUM}(?:${VAR}\d*)?)|x\d*|${VAR}|…|☐)${SUP}`;
// between two operands: a maths sign or a comparison ("12 > 10", "1 == 1", "7 // 2", "n * 2" in a code lesson), a hyphen with a
// space on each side ("5 - 3"; a hyphen glued to a word is not one), or a colon with no space ("15:40", "3:4"; "0.333…: " ends a clause)
const OP = String.raw`(?:\s*(?:[=!<>]=|\/\/|[×÷−+=≈/<>≤≥*·])\s*|\s+[-☐]\s+|:(?=\d))`;
// a bracket: "(2 + 3)", a point or a vector "(2, −3)", a root "√(21 × 8)", raised to a power "(√4)³"
const PAREN = String.raw`√?\(\s*${OPERAND}(?:(?:${OP}|,\s*)${OPERAND})*\s*\)${SUP}`;
// an absolute value: "|−5|"
const ABS = String.raw`\|${OPERAND}(?:${OP}${OPERAND})*\|`;
const GROUP = String.raw`(?:${OPERAND}|${PAREN}|${ABS})`;
// a bracket written straight after a factor is a product too: "2(x + 1)", "(x + 2)(x − 3)"
const RUN = new RegExp(String.raw`${GROUP}(?:${OP}${GROUP}|(?=√?\()${PAREN})*`, "gu");

export interface TextPart { text: string; math: boolean }

/** A line that is nothing but arithmetic ("4/8", "2/3 = 4/6", "3 > 2"; "1 1/4 m" is not): numbers, x, spaces and maths signs. */
export const isArithmetic = (text: string): boolean => /\d/.test(text) && /^[\s\d.,/%…×÷−+=≈<>≤≥()x-]*$/.test(text);

/*
 * Latin letters with maths or code: "3x + 2y = 16", "a + 2b", "=SUM(A1:A3)", "C1", "IPv6", "3D", "C++", "log₂ 10", "sin 2 ≈ 0.91".
 * The number runs above would cut them apart ("C1" drawn "1C", "16 = 3x + 2y" mirrored), so each such piece of the line is one
 * run of its own: the stretch between two Hebrew words, cut at list and sentence breaks (", " ". " "? ", and ": " after a number)
 * outside brackets and at a right-to-left arrow (←), never at "; " or at ": " after code (one line of code: "def add(a, b): return
 * a + b"), without the punctuation around it. A piece of plain words ("JPEG", "Shift, Enter") is left to the bidi algorithm.
 */
const STRETCH = /[^\p{Script=Hebrew}]+/gu;
const BREAK = /[,.?!:]\s+|\s*←\s*/gu;
const MATHS_OR_CODE = /\d|[=+×÷−*/^≈<>≤≥()[\]·°⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/u;
const count = (s: string, c: string) => s.split(c).length - 1;

/** A line of code keeps the ";" or ":" it ends with ("const total = 10;", "class Puppy(Dog):"), or the bidi algorithm draws it in front. */
const keepsEnd = (piece: string) => /;$/u.test(piece) || /^(?:def|class|for|while|if|elif|else|try|except|with)\b.*:$/u.test(piece);

/** A piece without the spaces, punctuation and unpaired brackets or quotes around it. */
function trimPiece(text: string, from: number, to: number, afterHebrew: boolean): [number, number] {
  let a = from, b = to;
  for (let changed = true; changed && a < b;) {
    changed = false;
    const piece = text.slice(a, b), first = text[a]!, lastChar = text[b - 1]!;
    // "ל-A4": a hyphen glued to the Hebrew word before is a prefix, not a minus
    if (/[\s,;:.?!)\]]/u.test(first) || (first === "-" && a === from && afterHebrew) || (first === "(" && count(piece, "(") > count(piece, ")")) || (/["']/u.test(first) && count(piece, first) % 2 === 1)) { a++; changed = true; continue; }
    if ((/[\s,;:.?!([-]/u.test(lastChar) && !keepsEnd(piece)) || (lastChar === ")" && count(piece, ")") > count(piece, "(")) || (lastChar === "]" && count(piece, "]") > count(piece, "[")) || (/["']/u.test(lastChar) && count(piece, lastChar) % 2 === 1)) { b--; changed = true; }
  }
  return [a, b];
}

function latinPieces(text: string): [number, number][] {
  const out: [number, number][] = [];
  for (const m of text.matchAll(STRETCH)) {
    const start = m.index!, afterHebrew = start > 0;
    let at = 0;
    const take = (from: number, to: number) => {
      const [a, b] = trimPiece(text, start + from, start + to, afterHebrew && from === 0);
      const piece = text.slice(a, b);
      // a spreadsheet formula ("=4+6+10") keeps its "=" in front even without a letter, and code that adds strings ('"3" + "4"') is one piece
      if ((/[A-Za-z]/.test(piece) && MATHS_OR_CODE.test(piece)) || /^=\S/u.test(piece) || (/["']/u.test(piece) && /\d/.test(piece) && /[=+*]/u.test(piece))) out.push([a, b]);
    };
    for (const cut of m[0].matchAll(BREAK)) {
      // a comma inside brackets is not a list: "P(2, 6)", "(x, y)", "(on Monday, on 5 May)"
      const before = m[0].slice(0, cut.index!);
      if (count(before, "(") > count(before, ")") || count(before, "[") > count(before, "]") || count(before, "{") > count(before, "}")) continue;
      // ": " after code ("def add(a, b): return a + b", "elif: …") is part of the line; after a number ("2: 3x = 12") it ends a clause
      if (cut[0].startsWith(":") && /[A-Za-z]/.test(m[0].slice(at, cut.index!))) continue;
      take(at, cut.index!);
      at = cut.index! + cut[0].length;
    }
    take(at, m[0].length);
  }
  return out;
}

/** The parts of a line: maths runs (containing at least one digit) and the text between them. Non-Hebrew text is one part (maths when it is all arithmetic). */
export function mathRuns(text: string): TextPart[] {
  // a bare expression (an answer option, a line of its own) is drawn left to right whatever the direction around it
  if (!HEBREW.test(text)) return [{ text, math: isArithmetic(text) }];
  const runs = latinPieces(text);
  const latin = runs.slice();
  for (const m of text.matchAll(RUN)) {
    const start = m.index!, end = start + m[0].length;
    if (/\d/.test(m[0]) && !latin.some(([a, b]) => start < b && end > a)) runs.push([start, end]);
  }
  runs.sort((x, y) => x[0] - y[0]);
  const parts: TextPart[] = [];
  let at = 0;
  for (const [start, end] of runs) {
    if (start > at) parts.push({ text: text.slice(at, start), math: false });
    parts.push({ text: text.slice(start, end), math: true });
    at = end;
  }
  if (at < text.length) parts.push({ text: text.slice(at), math: false });
  return parts.length ? parts : [{ text, math: false }];
}

/** A "<" or ">" that a right-to-left line would draw mirrored: one in Hebrew prose. Inside a maths run ("x > 7") it is drawn left to right. */
export const mirroredSign = (text: string): boolean => HEBREW.test(text) && mathRuns(text).some((p) => !p.math && /[<>]/.test(p.text));
