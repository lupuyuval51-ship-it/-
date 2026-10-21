/**
 * Turn the learner's own text into structured knowledge: term → meaning pairs, ordered steps, facts with numbers,
 * plain statements and keywords. Purely extractive and deterministic: nothing is invented, every question that is
 * later built from this points back at a sentence the learner wrote.
 */
import { clip, isStop, sanitizeMaterial, splitSentences, wordsOf } from "./text";

export interface Definition {
  term: string;
  meaning: string;
  /** The sentence or line this came from (used as the explanation). */
  source: string;
  /** From a vocabulary list ("hola = hello"): the meaning is a word or two, so it is asked as a translation. */
  short?: boolean;
}

export interface Fact {
  source: string;
  /** The sentence with the number replaced by "___". */
  blanked: string;
  value: number;
  decimals: number;
  isYear: boolean;
  /** The number exactly as the learner wrote it ("1,200", "6650", "2.5"). */
  numText: string;
  /** Where the number sits in `source` (so it can be swapped for another number from the material). */
  numAt: number;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  /** Set when the answer is just a number (optionally with a unit), so it can be asked as a numeric challenge. */
  value?: number;
  decimals: number;
  /** A multiple-choice question of the learner's quiz: its other options (the best wrong options there are: the learner chose them). */
  wrong?: string[];
}

export interface Keyword {
  text: string;
  lower: string;
  count: number;
  /** Seen capitalised in the middle of a sentence (a name, a place, a technical term). */
  proper: boolean;
}

export interface Knowledge {
  title?: string;
  definitions: Definition[];
  /** Each group is one ordered list of 3–6 steps. */
  steps: string[][];
  /** What each group of steps is about, from the line that introduces the list ("How a for loop runs:"), when there is one. */
  stepTitles: (string | undefined)[];
  /** Question → answer pairs the learner already wrote ("Q: … / A: …", or a question line followed by its answer). */
  qa: QuestionAnswer[];
  facts: Fact[];
  /** Plain statements that are neither definitions nor facts. */
  sentences: string[];
  /** Every prose sentence without a number (including "X is Y" definitions): the pool for fill-the-gap and true/false. */
  prose: string[];
  /** Single words and capitalised names of several words ("United States"), most useful as gaps and as wrong options. */
  keywords: Keyword[];
  /** Every sentence, in reading order (for summaries). */
  all: string[];
}

const BULLET = /^[-*•–—·▪●○]\s+/;
const NUMBERED = /^(?:step|שלב)?\s*(\d{1,2})\s*[.):]\s+(.{3,})$/iu;
const NOT_A_TERM = /^(?:note|notes|example|examples|tip|remember|summary|question|answer|q|a|שים לב|הערה|דוגמה|דוגמאות|למשל|תזכורת|סיכום|שאלה|תשובה)$/iu;

const QA_Q = /^(?:q|question|ש|שאלה)\s*[.:)]\s*(.{5,})$/iu;
const QA_A = /^(?:a|answer|ת|תשובה)\s*[.:)]\s*(.{1,})$/iu;
const INLINE_QA = /^(.{8,200}?[?？؟])\s+([^?？؟]{1,60})$/u;
/** A lettered option of a multiple-choice question ("A) Venus", "b. Mercury", "ב. כוכב חמה") and the line that names the right letter ("Answer: B", "תשובה: ב"). */
const MC_OPTION = /^\(?([A-Fa-f]|[א-ו])\s*[.)]\s+(.+)$/u;
const MC_ANSWER = /^(?:answer|ans|correct answer|תשובה|התשובה הנכונה|תשובה נכונה)\s*[.:)\-–]\s*\(?([A-Fa-f]|[א-ו])\)?(?![\p{L}\p{N}])/iu;
const letterIndex = (letter: string) => (/[A-Fa-f]/.test(letter) ? letter.toLowerCase().charCodeAt(0) - 97 : "אבגדהו".indexOf(letter));
const TABLE_SEPARATOR = /^\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*\|?$/u;
const NUMBER_ONLY = /^([-−]?\d{1,3}(?:,\d{3})+|[-−]?\d+)(?:\.(\d+))?\s*(?:[%°]|\p{L}{1,12}\.?)?$/u;
const DEF_PIPE = /^\|?\s*([^|]{1,60}?)\s*\|\s*([^|]{3,}?)\s*(?:\|.*)?$/u;

const DEF_COLON = /^(.{2,60}?)\s*[:：]\s+(.{8,})$/u;
const DEF_DASH = /^(.{2,60}?)\s+[-–—]\s+(.{8,})$/u;
const DEF_EQUALS = /^(.{2,60}?)\s*=\s*(.{3,})$/u;
const DEF_IS_EN = /^(?:(?:an?|the)\s+)?(\p{Lu}[^,.;:()]{1,40}?)\s+(?:is|are|means|refers to)\s+(?:an?\s+|the\s+)?(.{12,})$/iu;
const DEF_IS_HE = /^([^\s,.;:()]+(?:\s[^\s,.;:()]+){0,3})\s+(?:הוא|היא|הם|הן|פירושו|פירושה|נקרא|נקראת|נקראים|נקראות)\s+(.{10,})$/u;

// a minus sign counts only when it stands alone before the number ("fell to -30 degrees"), never as a hyphen ("ב-1991", "pages 3-5")
const NUMBER = /(?<![\p{L}\p{N}.,/:]|\d[-–])((?<=^|[\s(])[-−])?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?![\p{L}\p{N}/:]|[-–]\d)/u;
const VOCAB = /^(.{1,40}?)(?:\s+[=–—-]\s+|\s*[=:：]\s+|\s+\|\s+)(.{1,40})$/u;
const LEAD_IN = /[:：]$/u;
/** A first line such as "שאלות לחזרה – גוף האדם" or "Chapter 3 - Cells" names the notes: it is their title, not a term and its meaning. */
const TITLE_TERM = /^(?:שאלות(?: לחזרה)?|חזרה|סיכום|פרק|יחידה|נושא|מבחן|בוחן|review(?: questions)?|revision|summary|chapter|unit|topic|quiz|test|questions|(?:study )?notes)(?=$|[\s\d:：–—-])/iu;
/** …or ends with a phrase that names notes ("Ecosystems – key ideas", "התא – מושגים מרכזיים"). */
const TITLE_TAIL = /[–—:-]\s*(?:(?:the )?(?:key|main|big) (?:ideas|points|terms|facts|concepts)|summary|overview|notes|review|revision|basics|introduction|glossary|vocabulary|definitions|key terms|מושגים(?: מרכזיים| עיקריים)?|רעיונות (?:מרכזיים|עיקריים)|עיקרי הדברים|סיכום|הגדרות|מבוא|חזרה|נקודות (?:מרכזיות|עיקריות))\s*$/iu;
/** Compare sentences without caring about case, spacing or punctuation. */
const sameKey = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, " ").trim();

const CAP_WORD = /^\p{Lu}[\p{L}\p{N}'’-]*$/u;

export interface Phrase {
  text: string;
  start: number;
  end: number;
}

/** Runs of capitalised words ("United States", "Great Barrier Reef", "World War II"): a name that is swapped or blanked as a whole. */
export function properPhrases(sentence: string): Phrase[] {
  const ws = wordsOf(sentence);
  const ok = (i: number) => CAP_WORD.test(ws[i]!.text) && !isStop(ws[i]!.text);
  const out: Phrase[] = [];
  for (let i = 0; i < ws.length; i++) {
    if (!ok(i)) continue;
    let j = i;
    while (j + 1 < ws.length && ok(j + 1) && sentence.slice(ws[j]!.end, ws[j + 1]!.start).trim() === "") j++;
    if (j > i) out.push({ text: sentence.slice(ws[i]!.start, ws[j]!.end), start: ws[i]!.start, end: ws[j]!.end });
    i = j;
  }
  return out;
}

const trimEnd = (s: string) => s.replace(/["”’»\s]+$/u, "").replace(/[.!?…。؟]+$/u, "").trim();
const wordCount = (s: string) => wordsOf(s).length;

function looksLikeTerm(term: string): boolean {
  const t = term.trim();
  if (!t || NOT_A_TERM.test(t)) return false;
  const n = wordCount(t);
  if (n === 0 || n > 5) return false;
  if (/^[\d\s.,]+$/.test(t)) return false;
  if (/[.!?]$/.test(t)) return false;
  return !wordsOf(t).every((w) => isStop(w.text));
}

function asDefinition(line: string): Definition | null {
  for (const re of [DEF_PIPE, DEF_COLON, DEF_DASH, DEF_EQUALS]) {
    if (re === DEF_PIPE && !line.includes("|")) continue;
    const m = re.exec(line);
    if (m && looksLikeTerm(m[1]!)) {
      const meaning = trimEnd(m[2]!);
      if (wordCount(meaning) >= 1 && meaning.length >= 3) {
        const term = trimEnd(m[1]!);
        return { term, meaning, source: re === DEF_PIPE ? `${term}: ${meaning}` : trimEnd(line) };
      }
    }
  }
  return null;
}

function asProseDefinition(sentence: string): Definition | null {
  const s = trimEnd(sentence);
  for (const re of [DEF_IS_EN, DEF_IS_HE]) {
    const m = re.exec(s);
    if (m && looksLikeTerm(m[1]!)) {
      const meaning = trimEnd(m[2]!);
      if (meaning.length >= 10 && wordCount(meaning) >= 3) return { term: m[1]!.trim(), meaning, source: sentence.trim() };
    }
  }
  return null;
}

/** "hola = hello", "apple - תפוח": a short pair on its own line. Only trusted as a run of lines (see parseMaterial). */
/** The separator of a "word = meaning" line ("=", "–", ":", "|"…), or null when the line is not one. */
function vocabSep(line: string): string | null {
  const m = VOCAB.exec(line);
  return m ? line.slice(m[1]!.length, line.length - m[2]!.length).trim() : null;
}

function asVocab(line: string): Definition | null {
  if (/[.!?…。؟]$/u.test(line)) return null;
  const m = VOCAB.exec(line);
  if (!m) return null;
  const term = m[1]!.trim(), meaning = m[2]!.trim();
  if (!/\p{L}/u.test(term) || !/\p{L}/u.test(meaning) || term.toLowerCase() === meaning.toLowerCase()) return null;
  if (wordCount(term) > 4 || wordCount(meaning) > 5 || NOT_A_TERM.test(term)) return null;
  return { term, meaning, source: `${term} = ${meaning}`, ...(meaning.length < 8 ? { short: true } : {}) };
}

function asQa(question: string, answer: string): QuestionAnswer | null {
  const q = question.trim(), a = trimEnd(answer);
  if (q.length < 8 || q.length > 300 || !a || a.length > 140) return null;
  const n = NUMBER_ONLY.exec(a);
  if (n) {
    const value = Number(`${n[1]!.replace(/,/g, "").replace("−", "-")}${n[2] ? `.${n[2]}` : ""}`);
    if (Number.isFinite(value) && Math.abs(value) < 1e12) return { question: q, answer: a, value, decimals: n[2]?.length ?? 0 };
  }
  return { question: q, answer: a, decimals: 0 };
}

function asFact(sentence: string, tableRow = false): Fact | null {
  const s = sentence.trim();
  const m = NUMBER.exec(s);
  if (!m) return null;
  const whole = m[2]!.replace(/,/g, "");
  const magnitude = Number(m[3] ? `${whole}.${m[3]}` : whole);
  const value = m[1] ? -magnitude : magnitude;
  if (!Number.isFinite(value) || Math.abs(value) > 1e12) return null;
  const blanked = `${s.slice(0, m.index)}___${s.slice(m.index + m[0].length)}`;
  // a table row is short by nature ("Mars – Moons: ___"); a sentence that short is usually not a fact worth asking about
  if (tableRow ? blanked.length < 8 : blanked.length < 25 || blanked.length > 230 || wordCount(blanked) < 5) return null;
  // a second number makes the blank ambiguous ("between 5 and 10"): keep only sentences with exactly one
  if (NUMBER.test(blanked.replace("___", ""))) return null;
  return { source: s, blanked, value, decimals: m[3]?.length ?? 0, isYear: Number.isInteger(value) && value >= 1000 && value <= 2100, numText: m[0], numAt: m.index };
}

/**
 * The lettered options (A, B, C…) that follow the question at line `at`, in order from A, and the right one when an
 * "Answer: B" line follows them. Null when the lines after the question are not such a list (at least two options).
 */
function multipleChoiceAfter(lines: string[], consumed: Set<number>, at: number): { used: number[]; right?: string; options: string[] } | null {
  const used: number[] = [];
  const options: string[] = [];
  let k = at + 1;
  for (; k < lines.length; k++) {
    if (!lines[k]) continue;
    const m = consumed.has(k) ? null : MC_OPTION.exec(lines[k]!.replace(BULLET, ""));
    if (!m || letterIndex(m[1]!) !== options.length) break;
    options.push(m[2]!);
    used.push(k);
  }
  if (options.length < 2) return null;
  const answer = k < lines.length && !consumed.has(k) ? MC_ANSWER.exec(lines[k]!.replace(BULLET, "")) : null;
  if (answer) used.push(k);
  return { used, right: answer ? options[letterIndex(answer[1]!)] : undefined, options };
}

/** What kind of item of a list a line is (a definition, a fact with a number, an "X is Y" statement), or null when it is plain text. */
function itemShape(line: string): "definition" | "fact" | "statement" | null {
  return asDefinition(line) ? "definition" : asFact(line) ? "fact" : asProseDefinition(line) ? "statement" : null;
}

const cellsOf = (row: string): string[] => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const NUMBER_CELL = /^[-−]?\d[\d,]*(?:\.\d+)?(?:\s*\p{L}{1,8})?$/u;

/**
 * A two-column table whose second column holds numbers ("| Planet | Moons |", "| Mars | 2 |") has no "term: meaning" in it, so it
 * made no question at all. Each such row is rewritten in place as a fact with one number in the learner's own words
 * ("Mars – Moons: 2"), which the number questions below pick up; a row that is not like that is left as it is.
 */
function numberRows(lines: string[], header: number, from: number, rows: Set<number>): void {
  const head = cellsOf(lines[header]!);
  if (head.length !== 2 || !head.every((h) => /\p{L}/u.test(h) && h.length <= 40)) return;
  for (let k = from; k < lines.length && lines[k]!.includes("|"); k++) {
    const cells = cellsOf(lines[k]!);
    if (cells.length !== 2 || !/\p{L}/u.test(cells[0]!) || cells[0]!.length > 60 || !NUMBER_CELL.test(cells[1]!)) continue;
    lines[k] = `${cells[0]} – ${head[1]}: ${cells[1]}`;
    rows.add(k);
  }
}

export function parseMaterial(raw: string): Knowledge {
  const text = sanitizeMaterial(raw)
    .replace(/\*\*(.+?)\*\*|__(.+?)__/gu, (_m, a: string | undefined, b: string | undefined) => a ?? b ?? "") // markdown bold
    .replace(/`([^`\n]+)`/gu, "$1");
  const lines = text.split("\n");
  const consumed = new Set<number>();
  /** Rows of a number table, rewritten as facts (see `numberRows`). */
  const tableRows = new Set<number>();
  let title: string | undefined;

  // 0) markdown headings are section titles (the first one names the material); table separators and header rows are skipped
  lines.forEach((l, i) => {
    const h = /^#{1,6}\s+(.+)$/u.exec(l);
    if (h) {
      title ??= trimEnd(h[1]!);
      consumed.add(i);
    } else if (TABLE_SEPARATOR.test(l) && l.includes("-")) {
      consumed.add(i);
      if (i > 0 && lines[i - 1]!.includes("|")) {
        consumed.add(i - 1);
        numberRows(lines, i - 1, i + 1, tableRows);
      }
    }
  });

  // 0b) questions the learner already wrote, with their answers
  const qa: QuestionAnswer[] = [];
  /** A quiz numbers its questions ("1. Which planet…?"): the number is not part of the question. */
  const unnumbered = (s: string) => NUMBERED.exec(s)?.[2] ?? s;
  // Two or more numbered lines that are questions make the list a quiz, not steps: then "3. What is the largest planet? Jupiter"
  // is a question with its answer (a list of steps where one step happens to hold a question stays a list of steps)
  const quiz = lines.filter((l) => {
    const m = NUMBERED.exec(l.replace(BULLET, ""));
    return m && (INLINE_QA.test(m[2]!) || /[?？؟]$/u.test(m[2]!));
  }).length >= 2;
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i) || !lines[i]) continue;
    const line = lines[i]!.replace(BULLET, "");
    let nextIdx = -1;
    for (let k = i + 1; k < lines.length; k++) if (lines[k]) { nextIdx = k; break; }
    const next = nextIdx > 0 && !consumed.has(nextIdx) ? lines[nextIdx]!.replace(BULLET, "") : "";
    const q = QA_Q.exec(line);
    // a multiple-choice question ("A) Venus / B) Mercury … Answer: B"): the first option is not the answer, so it is asked
    // with the option the quiz names as right, or left out when the quiz does not say which one is right
    const mc = q || /[?？؟]$/u.test(line) ? multipleChoiceAfter(lines, consumed, i) : null; // (a question line)
    if (mc) {
      const pair = mc.right ? asQa(unnumbered(q ? q[1]! : line), mc.right) : null;
      if (pair && pair.value === undefined) {
        const wrong = mc.options.map((o) => trimEnd(o)).filter((o) => o.toLowerCase() !== pair.answer.toLowerCase() && o.length <= 140);
        if (wrong.length >= 2) pair.wrong = wrong;
      }
      if (pair) qa.push(pair);
      consumed.add(i);
      mc.used.forEach((k) => consumed.add(k));
      continue;
    }
    const a = next ? QA_A.exec(next) : null;
    if (q && a) {
      const pair = asQa(q[1]!, a[1]!);
      if (pair) qa.push(pair);
      consumed.add(i).add(nextIdx);
      continue;
    }
    const inline = INLINE_QA.exec(quiz ? unnumbered(line) : line);
    if (inline && (quiz || !NUMBERED.test(line))) {
      const pair = asQa(inline[1]!, inline[2]!);
      if (pair) {
        qa.push(pair);
        consumed.add(i);
        continue;
      }
    }
    // a line that is only a question, followed by a short line that answers it
    if (/[?？؟]$/u.test(line) && line.length <= 200 && next && !/[?？؟]$/u.test(next) && next.length <= 120 && !NUMBERED.test(next) && !QA_Q.test(next) && !asDefinition(next) && !/^#/.test(next)) {
      const pair = asQa(unnumbered(line), next);
      if (pair) {
        qa.push(pair);
        consumed.add(i).add(nextIdx);
      }
    }
  }

  // 1) numbered lists → ordered steps (the line that introduces a list names it: "How a for loop runs:")
  const steps: string[][] = [];
  const stepTitles: (string | undefined)[] = [];
  const firstNonEmpty = lines.findIndex((l) => l);
  for (let i = 0; i < lines.length; ) {
    const group: { n: number; text: string; idx: number }[] = [];
    let j = i;
    while (j < lines.length) {
      // a line already read as a question and its answer (a numbered quiz) is not a step
      const m = consumed.has(j) ? null : NUMBERED.exec(lines[j]!.replace(BULLET, ""));
      if (!m) break;
      group.push({ n: Number(m[1]), text: trimEnd(m[2]!), idx: j });
      j++;
    }
    if (group.length >= 3) {
      let before = i - 1;
      while (before >= 0 && !lines[before]) before--;
      const lead = before >= 0 && !consumed.has(before) ? lines[before]!.replace(BULLET, "") : "";
      const named = lead && lead.length <= 90 && wordCount(lead) <= 12 && !asDefinition(lead) && (LEAD_IN.test(lead) || (!/[.!?…。؟]$/u.test(lead) && wordCount(lead) <= 9)) ? trimEnd(lead.replace(LEAD_IN, "")) : undefined;
      if (named) {
        consumed.add(before);
        if (before === firstNonEmpty) title ??= named;
      }
      // A long list is cut into parts of at most six steps of (nearly) equal size, so no step is ever left out: seven
      // steps make 4 + 3, never 6 + a lone step that would vanish from the game. Every part keeps at least three.
      const parts = Math.ceil(group.length / 6);
      const base = Math.floor(group.length / parts), extra = group.length % parts;
      for (let p = 0, k = 0; p < parts; p++) {
        const chunk = group.slice(k, k + base + (p < extra ? 1 : 0));
        k += chunk.length;
        steps.push(chunk.map((g) => clip(g.text, 170)));
        stepTitles.push(named ? clip(p > 0 ? `${named} (${p + 1})` : named, 90) : undefined);
      }
      group.forEach((g) => consumed.add(g.idx));
      i = j;
    } else i = Math.max(j, i + 1);
  }

  // 1b) runs of short pairs are a vocabulary list ("hola = hello"); a single such line could be anything, so three in a row are needed
  const vocabAt = new Map<number, Definition>();
  for (let i = 0; i < lines.length; ) {
    const run: [number, Definition][] = [];
    for (let j = i; j < lines.length && lines[j] && !consumed.has(j); j++) {
      const v = tableRows.has(j) ? null : asVocab(lines[j]!.replace(BULLET, ""));
      if (!v) break;
      run.push([j, v]);
    }
    // "Spanish words – week 3" above "hola = hello", "gato = cat"…: a first line written with another separator than every line
    // under it is the list's heading, not one of its pairs (it becomes the title below)
    if (run.length >= 4) {
      const seps = run.map(([idx]) => vocabSep(lines[idx]!.replace(BULLET, "")));
      if (seps.slice(1).every((x) => x === seps[1]) && seps[0] !== seps[1]) run.shift();
    }
    if (run.length >= 3) run.forEach(([idx, v]) => vocabAt.set(idx, v));
    i += Math.max(1, run.length);
  }

  // 2) the rest: title, definitions, facts, statements
  const definitions: Definition[] = [];
  const facts: Fact[] = [];
  const sentences: string[] = [];
  const prose: string[] = [];
  const all: string[] = [];
  const firstContent = lines.findIndex((l, i) => l && !consumed.has(i));
  // a short first line that has the same shape as the line after it ("1947 – …" then "1948 – …", "Venus - …" then "Earth - …") is the
  // first item of a list, not its heading: taking it as the title would drop that item from every question
  const startsList = (i: number, line: string) => {
    const next = lines.findIndex((l, k) => k > i && l && !consumed.has(k));
    const shape = itemShape(line);
    return shape !== null && next >= 0 && (vocabAt.has(next) ? shape === "definition" : itemShape(lines[next]!.replace(BULLET, "")) === shape);
  };
  lines.forEach((rawLine, i) => {
    if (!rawLine || consumed.has(i)) return;
    const line = rawLine.replace(BULLET, "");
    // a first line that names the notes ("שאלות לחזרה – …", "Chapter 3 - Cells") heads them even in the shape of "term – meaning", and
    // even when every line after it is a question and answer already taken above
    // …or it is the only line without a bullet above a bulleted list
    const laterBulleted = lines.filter((l, k) => k > i && l && BULLET.test(l)).length;
    const laterContent = lines.filter((l, k) => k > i && l).length;
    const namesNotes = TITLE_TERM.test(line) || TITLE_TAIL.test(line) || (!BULLET.test(rawLine) && laterBulleted >= 3 && laterBulleted === laterContent);
    if (i === firstContent && title === undefined && (!vocabAt.has(i) || namesNotes) && line.length <= 70 && !/[.!?:：]$/.test(line) && (namesNotes || lines.some((l, k) => k > i && l && !consumed.has(k))) && wordCount(line) <= 9
      && (namesNotes || !startsList(i, line))) {
      title = line;
      return;
    }
    // a row of a number table is a fact with one number (see `numberRows`)
    if (tableRows.has(i)) {
      const fact = asFact(line, true);
      if (fact) { facts.push(fact); all.push(line); return; }
    }
    const vocab = vocabAt.get(i);
    if (vocab) {
      definitions.push(vocab);
      all.push(vocab.source);
      return;
    }
    // a line that only introduces a list or a section ("Examples:") is not something to ask about
    if (LEAD_IN.test(line)) return;
    const def = asDefinition(line);
    if (def && def.source.length <= 260) {
      definitions.push(def);
      all.push(def.source);
      return;
    }
    for (const sentence of splitSentences(line)) {
      if (wordCount(sentence) < 4) continue;
      all.push(sentence);
      const fact = asFact(sentence);
      if (fact) {
        facts.push(fact);
        continue;
      }
      const proseDef = asProseDefinition(sentence);
      const usable = sentence.length >= 30 && sentence.length <= 230;
      if (usable) prose.push(sentence);
      if (proseDef) {
        definitions.push(proseDef);
        continue;
      }
      if (usable) sentences.push(sentence);
    }
  });

  const uniq = <T,>(list: T[], key: (t: T) => string) => {
    const seen = new Set<string>();
    return list.filter((x) => (seen.has(sameKey(key(x))) ? false : (seen.add(sameKey(key(x))), true)));
  };

  // 3) keywords: single words, plus names of several capitalised words (counted as one, never as loose fragments)
  const stats = new Map<string, Keyword>();
  const seenSentences = new Set<string>();
  for (const s of splitSentences(text)) {
    // a line pasted ten times is one idea, not ten: repeats must not inflate how "important" its words look
    if (seenSentences.has(sameKey(s))) continue;
    seenSentences.add(sameKey(s));
    const phrases = properPhrases(s);
    for (const p of phrases) {
      const lower = p.text.toLowerCase();
      const k = stats.get(lower) ?? { text: p.text, lower, count: 0, proper: true };
      k.count++;
      stats.set(lower, k);
    }
    wordsOf(s).forEach((w, idx) => {
      if (phrases.some((p) => w.start >= p.start && w.end <= p.end)) return;
      const lower = w.text.toLowerCase();
      const min = /\p{Script=Hebrew}/u.test(w.text) ? 3 : 4;
      // a word with a digit in it ("ב-14", "1948-ב") is a number, not a term: never a gap or a wrong option for a word
      if (w.text.length < min || isStop(lower) || /\p{N}/u.test(w.text)) return;
      const k = stats.get(lower) ?? { text: w.text, lower, count: 0, proper: false };
      k.count++;
      if (idx > 0 && /^\p{Lu}/u.test(w.text)) k.proper = true;
      stats.set(lower, k);
    });
  }

  return {
    title,
    definitions: uniq(definitions, (d) => d.term.toLowerCase()),
    steps,
    stepTitles,
    qa: uniq(qa, (x) => x.question.toLowerCase()),
    facts: uniq(facts, (f) => f.blanked),
    sentences: uniq(sentences, (s) => s),
    prose: uniq(prose, (s) => s),
    // A word that only ever starts a sentence is capitalised by position, not because it is a name: as a wrong option next
    // to a lower-case answer ("Farmers" among "pharaohs") the capital letter would give the answer away. Acronyms stay.
    keywords: [...stats.values()].map((k) => (!k.proper && /^\p{Lu}\p{Ll}/u.test(k.text) ? { ...k, text: k.text.toLowerCase() } : k)),
    all: uniq(all, (s) => s),
  };
}
