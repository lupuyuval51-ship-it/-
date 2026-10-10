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
}

export interface Fact {
  source: string;
  /** The sentence with the number replaced by "___". */
  blanked: string;
  value: number;
  decimals: number;
  isYear: boolean;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  /** Set when the answer is just a number (optionally with a unit), so it can be asked as a numeric challenge. */
  value?: number;
  decimals: number;
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
  /** Question → answer pairs the learner already wrote ("Q: … / A: …", or a question line followed by its answer). */
  qa: QuestionAnswer[];
  facts: Fact[];
  /** Plain statements that are neither definitions nor facts. */
  sentences: string[];
  /** Every prose sentence without a number (including "X is Y" definitions): the pool for fill-the-gap and true/false. */
  prose: string[];
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
const TABLE_SEPARATOR = /^\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*\|?$/u;
const NUMBER_ONLY = /^([-−]?\d{1,3}(?:,\d{3})+|[-−]?\d+)(?:\.(\d+))?\s*(?:[%°]|\p{L}{1,12}\.?)?$/u;
const DEF_PIPE = /^\|?\s*([^|]{1,60}?)\s*\|\s*([^|]{3,}?)\s*(?:\|.*)?$/u;

const DEF_COLON = /^(.{2,60}?)\s*[:：]\s+(.{8,})$/u;
const DEF_DASH = /^(.{2,60}?)\s+[-–—]\s+(.{8,})$/u;
const DEF_EQUALS = /^(.{2,60}?)\s*=\s*(.{3,})$/u;
const DEF_IS_EN = /^(?:(?:an?|the)\s+)?(\p{Lu}[^,.;:()]{1,40}?)\s+(?:is|are|means|refers to)\s+(?:an?\s+|the\s+)?(.{12,})$/iu;
const DEF_IS_HE = /^([^\s,.;:()]+(?:\s[^\s,.;:()]+){0,3})\s+(?:הוא|היא|הם|הן|פירושו|פירושה|נקרא|נקראת|נקראים|נקראות)\s+(.{10,})$/u;

const NUMBER = /(?<![\p{L}\p{N}.,/:]|\d[-–])(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?![\p{L}\p{N}/:]|[-–]\d)/u;

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

function asFact(sentence: string): Fact | null {
  const s = sentence.trim();
  const m = NUMBER.exec(s);
  if (!m) return null;
  const whole = m[1]!.replace(/,/g, "");
  const value = Number(m[2] ? `${whole}.${m[2]}` : whole);
  if (!Number.isFinite(value) || Math.abs(value) > 1e12) return null;
  const blanked = `${s.slice(0, m.index)}___${s.slice(m.index + m[0].length)}`;
  if (blanked.length < 25 || blanked.length > 230 || wordCount(blanked) < 5) return null;
  // a second number makes the blank ambiguous ("between 5 and 10"): keep only sentences with exactly one
  if (NUMBER.test(blanked.replace("___", ""))) return null;
  return { source: s, blanked, value, decimals: m[2]?.length ?? 0, isYear: Number.isInteger(value) && value >= 1000 && value <= 2100 };
}

export function parseMaterial(raw: string): Knowledge {
  const text = sanitizeMaterial(raw)
    .replace(/\*\*(.+?)\*\*|__(.+?)__/gu, (_m, a: string | undefined, b: string | undefined) => a ?? b ?? "") // markdown bold
    .replace(/`([^`\n]+)`/gu, "$1");
  const lines = text.split("\n");
  const consumed = new Set<number>();
  let title: string | undefined;

  // 0) markdown headings are section titles (the first one names the material); table separators and header rows are skipped
  lines.forEach((l, i) => {
    const h = /^#{1,6}\s+(.+)$/u.exec(l);
    if (h) {
      title ??= trimEnd(h[1]!);
      consumed.add(i);
    } else if (TABLE_SEPARATOR.test(l) && l.includes("-")) {
      consumed.add(i);
      if (i > 0 && lines[i - 1]!.includes("|")) consumed.add(i - 1);
    }
  });

  // 0b) questions the learner already wrote, with their answers
  const qa: QuestionAnswer[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (consumed.has(i) || !lines[i]) continue;
    const line = lines[i]!.replace(BULLET, "");
    let nextIdx = -1;
    for (let k = i + 1; k < lines.length; k++) if (lines[k]) { nextIdx = k; break; }
    const next = nextIdx > 0 && !consumed.has(nextIdx) ? lines[nextIdx]!.replace(BULLET, "") : "";
    const q = QA_Q.exec(line);
    const a = next ? QA_A.exec(next) : null;
    if (q && a) {
      const pair = asQa(q[1]!, a[1]!);
      if (pair) qa.push(pair);
      consumed.add(i).add(nextIdx);
      continue;
    }
    const inline = INLINE_QA.exec(line);
    if (inline && !NUMBERED.test(line)) {
      const pair = asQa(inline[1]!, inline[2]!);
      if (pair) {
        qa.push(pair);
        consumed.add(i);
        continue;
      }
    }
    // a line that is only a question, followed by a short line that answers it
    if (/[?？؟]$/u.test(line) && line.length <= 200 && next && !/[?？؟]$/u.test(next) && next.length <= 120 && !NUMBERED.test(next) && !QA_Q.test(next) && !asDefinition(next) && !/^#/.test(next)) {
      const pair = asQa(line, next);
      if (pair) {
        qa.push(pair);
        consumed.add(i).add(nextIdx);
      }
    }
  }

  // 1) numbered lists → ordered steps
  const steps: string[][] = [];
  for (let i = 0; i < lines.length; ) {
    const group: { n: number; text: string; idx: number }[] = [];
    let j = i;
    while (j < lines.length) {
      const m = NUMBERED.exec(lines[j]!.replace(BULLET, ""));
      if (!m) break;
      group.push({ n: Number(m[1]), text: trimEnd(m[2]!), idx: j });
      j++;
    }
    if (group.length >= 3) {
      for (let k = 0; k < group.length; k += 6) {
        const chunk = group.slice(k, k + 6);
        if (chunk.length >= 3) steps.push(chunk.map((g) => clip(g.text, 170)));
      }
      group.forEach((g) => consumed.add(g.idx));
      i = j;
    } else i = Math.max(j, i + 1);
  }

  // 2) the rest: title, definitions, facts, statements
  const definitions: Definition[] = [];
  const facts: Fact[] = [];
  const sentences: string[] = [];
  const prose: string[] = [];
  const all: string[] = [];
  const firstContent = lines.findIndex((l, i) => l && !consumed.has(i));
  lines.forEach((rawLine, i) => {
    if (!rawLine || consumed.has(i)) return;
    const line = rawLine.replace(BULLET, "");
    if (i === firstContent && title === undefined && line.length <= 70 && !/[.!?:：]$/.test(line) && lines.some((l, k) => k > i && l && !consumed.has(k)) && wordCount(line) <= 9) {
      title = line;
      return;
    }
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
    return list.filter((x) => (seen.has(key(x)) ? false : (seen.add(key(x)), true)));
  };

  // 3) keywords
  const stats = new Map<string, Keyword>();
  for (const s of splitSentences(text)) {
    wordsOf(s).forEach((w, idx) => {
      const lower = w.text.toLowerCase();
      const min = /\p{Script=Hebrew}/u.test(w.text) ? 3 : 4;
      if (w.text.length < min || isStop(lower) || /^\d+$/.test(w.text)) return;
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
    qa: uniq(qa, (x) => x.question.toLowerCase()),
    facts: uniq(facts, (f) => f.blanked),
    sentences: uniq(sentences, (s) => s),
    prose: uniq(prose, (s) => s),
    keywords: [...stats.values()],
    all: uniq(all, (s) => s),
  };
}
