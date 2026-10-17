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

// a number: 1,200 · 3.47 · 3/4 · 25% · 0.333… · a mixed number 2 1/4 · a blank x/9, 7/x
const NUM = String.raw`(?:\d+ (?:\d+|x)\/\d+|\d+(?:[.,]\d+)*(?:\/(?:\d+|x))?(?:…|%)?|x\/\d+)`;
const OPERAND = String.raw`(?:${NUM}|x)`;
const GROUP = String.raw`(?:${OPERAND}|\(\s*${OPERAND}(?:\s*[×÷−+=≈/]\s*${OPERAND})*\s*\))`;
const RUN = new RegExp(String.raw`${GROUP}(?:\s*[×÷−+=≈/]\s*${GROUP})*`, "gu");

export interface TextPart { text: string; math: boolean }

/** The parts of a line: maths runs (containing at least one digit) and the text between them. Non-Hebrew text is one part. */
export function mathRuns(text: string): TextPart[] {
  if (!HEBREW.test(text)) return [{ text, math: false }];
  const parts: TextPart[] = [];
  let at = 0;
  for (const m of text.matchAll(RUN)) {
    const run = m[0];
    if (!/\d/.test(run)) continue;
    const start = m.index!;
    if (start > at) parts.push({ text: text.slice(at, start), math: false });
    parts.push({ text: run, math: true });
    at = start + run.length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), math: false });
  return parts.length ? parts : [{ text, math: false }];
}
