/**
 * Build challenges from parsed knowledge. Eleven kinds, all extractive: every question, option and explanation is made of
 * the learner's own words (plus a few neutral scaffolding phrases in English or Hebrew), so nothing can be "wrong
 * facts" that the learner did not provide. The only invented text is a wrong *number* next to a number fact when the notes
 * hold too few others, and it is always labelled as not the number of the material. The output is raw spec JSON that
 * still goes through full validation.
 */
import { choice, match, numeric, sequence, translator, type Lang } from "../demo/builders";
import { properPhrases, type Definition, type Fact, type Keyword, type Knowledge, type QuestionAnswer } from "./parse";
import { clip, isStop, shuffled, wordsOf, type Word } from "./text";

type Raw = Record<string, unknown>;
type Level = 1 | 2 | 3;
type Tr = ReturnType<typeof translator>;
export type ChallengeKind = "qa" | "match" | "term" | "define" | "cloze" | "steps" | "number" | "truefalse" | "factpick" | "statement" | "odd" | "timeline";
type Objective = "questions" | "terms" | "facts" | "steps" | "ideas";

interface Candidate {
  kind: ChallengeKind;
  objective: Objective;
  level: Level;
  /** Source keys: the same sentence is not used twice while other material is still unused. */
  keys: string[];
  make(id: string, level: Level, objectiveId: string): Raw;
}

export interface GenerateOptions {
  lang: Lang;
  rnd: () => number;
  /** Upper bound on the number of challenges. */
  max: number;
  /** Prefix for challenge/objective ids (extensions use their own so they never clash). */
  idPrefix?: string;
  /** Also build easier two-option versions of multiple-choice questions (served after two misses in a row). */
  variants?: boolean;
}

export interface Generated {
  /** One per station. */
  challenges: Raw[];
  /** Easier versions, referenced through `easierId`; never placed on a station. */
  variants: Raw[];
  objectives: { id: string; text: string }[];
  counts: Record<ChallengeKind, number>;
  /** The kind of each challenge, in the same order as `challenges` (diagnostics and tests). */
  kinds: ChallengeKind[];
  /** Titles of the concepts covered, in order (used for lore and the conclusion). */
  concepts: string[];
}

const OBJECTIVE_TEXT = (t: Tr): Record<Objective, string> => ({
  questions: t("Answer the questions from your notes", "לענות על השאלות מהפתקים שלכם"),
  terms: t("Know the key terms of the topic", "להכיר את המושגים המרכזיים בנושא"),
  facts: t("Recall the key numbers and facts", "לזכור את המספרים והעובדות החשובים"),
  steps: t("Follow the process in the right order", "לפעול לפי התהליך בסדר הנכון"),
  ideas: t("Understand how the ideas fit together", "להבין איך הרעיונות מתחברים"),
});

const hasHebrew = (s: string) => /\p{Script=Hebrew}/u.test(s);
const sameKey = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, " ").trim();

/** A rough stem, so "הצמח", "בצמח" and "צמחים" are recognised as the same word when picking wrong options. */
const stemMemo = new Map<string, string>();
const stem = (w: string) => {
  const hit = stemMemo.get(w);
  if (hit !== undefined) return hit;
  const lower = w.toLowerCase();
  const out = !hasHebrew(lower) ? lower.replace(/(?:ing|ed|es|s)$/, "") : lower.replace(/^[והבכלמש]{1,2}(?=\p{L}{3,})/u, "").replace(/(?:ים|ות)$/u, "");
  if (stemMemo.size > 20_000) stemMemo.clear();
  stemMemo.set(w, out);
  return out;
};
const sameWord = (a: string, b: string) => {
  const x = stem(a), y = stem(b);
  return x === y || (x.length >= 3 && y.includes(x)) || (y.length >= 3 && x.includes(y));
};

/** A Hebrew clitic prefix (ו/ה/ב/כ/ל/מ/ש, up to two) that is really attached: the rest must itself be a word of the material. */
function hebrewPrefix(w: string, known: ReadonlySet<string>): string {
  const lower = w.toLowerCase();
  if (!hasHebrew(lower)) return "";
  for (const n of [2, 1]) {
    const p = lower.slice(0, n);
    if (p.length === n && /^[והבכלמש]+$/u.test(p) && lower.length - n >= 3 && known.has(lower.slice(n))) return w.slice(0, n);
  }
  return "";
}

/** Give a replacement word the same Hebrew prefix as the word it replaces ("בעלה" → "במים"), so the form never gives the answer away. */
export function formLike(target: string, replacement: string, known: ReadonlySet<string>): string {
  if (!hasHebrew(target) || !hasHebrew(replacement)) return replacement;
  const tp = hebrewPrefix(target, known);
  const rp = hebrewPrefix(replacement, known);
  let base = rp ? replacement.slice(rp.length) : replacement;
  // the replacement's own article would be doubled by the target's prefix ("של" + "ה" + "הנילוס")
  if (tp && !rp && /^ה\p{L}{4,}/u.test(replacement)) base = replacement.slice(1);
  return `${tp}${base}`;
}

/** Content words of a text as comparable stems (stop words and very short words dropped). */
function contentStems(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const w of wordsOf(text)) {
    const min = hasHebrew(w.text) ? 3 : 4;
    const st = stem(w.text);
    if (w.text.length < min || isStop(w.text) || isStop(st) || /^\d+$/.test(w.text)) continue;
    const prev = out.get(st);
    if (prev === undefined || w.text.length < prev.length) out.set(st, w.text);
  }
  return out;
}

/** Do all the content words of `phrase` appear (in any form) in `text`? */
function mentions(text: string, phrase: string): boolean {
  const need = [...contentStems(phrase).values()];
  if (need.length === 0) return false;
  const have = wordsOf(text);
  return need.every((n) => have.some((h) => sameWord(h.text, n)));
}

/** Share of the content words of `a` that `b` also has (0..1). */
function overlap(a: string, b: string): number {
  const x = [...contentStems(a).keys()], y = new Set(contentStems(b).keys());
  return x.length ? x.filter((s) => y.has(s)).length / x.length : 0;
}

/** A word of `correct` that none of `others` uses: the best hint for telling the right option apart. */
function distinctiveWord(correct: string, others: string[]): string | undefined {
  const used = new Set(others.flatMap((o) => [...contentStems(o).keys()]));
  return [...contentStems(correct)].filter(([st]) => !used.has(st)).map(([, surface]) => surface).sort((a, b) => b.length - a.length || a.localeCompare(b))[0];
}

/** Hide the term inside its own description ("Water: … glasses of water …"), or null when too little would be left to read. */
function maskTerm(meaning: string, term: string): string | null {
  const need = [...contentStems(term).values()];
  if (need.length === 0) return meaning;
  const ws = wordsOf(meaning);
  const hits = ws.filter((w) => need.some((n) => sameWord(w.text, n)));
  // a name of several words is only given away by the whole name
  if (hits.length === 0 || (need.length > 1 && !need.every((n) => ws.some((w) => sameWord(w.text, n))))) return meaning;
  let out = meaning;
  for (const w of [...hits].reverse()) out = `${out.slice(0, w.start)}___${out.slice(w.end)}`;
  out = out.replace(/(?:___\s*){2,}/g, "___ ").replace(/\s+/g, " ").trim();
  return contentStems(out.replace(/___/g, " ")).size >= 2 ? out : null;
}

// ───────────────────────────── sentence context ─────────────────────────────

/**
 * Which words stand next to which in the notes. A wrong word that has been seen after the same word as the right one
 * ("for the ___") reads as a real alternative; one that never has is easy to rule out by grammar alone.
 */
interface Context {
  before: Map<string, Set<string>>;
  after: Map<string, Set<string>>;
  /** The first sentence in which each word or name occurs (to tell the learner where a wrong option comes from). */
  home: Map<string, string>;
}

/** What stands directly before and after the words [from..to] of a sentence: a word, a punctuation mark, or the sentence edge. */
function edges(sentence: string, ws: Word[], from: number, to: number): [string, string] {
  const gap = (a: number, b: number) => /[,;:()—–]/.exec(sentence.slice(a, b))?.[0];
  const prev = from > 0 ? gap(ws[from - 1]!.end, ws[from]!.start) ?? ws[from - 1]!.text.toLowerCase() : "^";
  const next = to < ws.length - 1 ? gap(ws[to]!.end, ws[to + 1]!.start) ?? ws[to + 1]!.text.toLowerCase() : "$";
  return [prev, next];
}

function buildContext(sentences: string[]): Context {
  const ctx: Context = { before: new Map(), after: new Map(), home: new Map() };
  const add = (m: Map<string, Set<string>>, k: string, v: string) => (m.get(k)?.add(v) ?? m.set(k, new Set([v])));
  for (const s of sentences) {
    const ws = wordsOf(s);
    ws.forEach((w, i) => {
      const [p, n] = edges(s, ws, i, i);
      const lower = w.text.toLowerCase();
      add(ctx.before, lower, p);
      add(ctx.after, lower, n);
      if (!ctx.home.has(lower)) ctx.home.set(lower, s);
    });
    for (const p of properPhrases(s)) if (!ctx.home.has(p.text.toLowerCase())) ctx.home.set(p.text.toLowerCase(), s);
  }
  return ctx;
}

/** A coarse word class from its ending, so a plural noun is not offered in place of a past-tense verb. */
function shapeOf(text: string): string {
  const w = (wordsOf(text).pop()?.text ?? text).toLowerCase();
  if (hasHebrew(w)) return /(?:ים|ות)$/u.test(w) ? "pl" : /ה$/u.test(w) ? "f" : "base";
  if (/ing$/.test(w)) return "ing";
  if (/ed$/.test(w)) return "ed";
  if (/ly$/.test(w)) return "ly";
  if (/(?:tion|sion|ment|ness|ity|ance|ence|ism)$/.test(w)) return "abstract";
  if (/(?:ous|ful|ive|al|ic|able|ible)$/.test(w)) return "adj";
  return /[^s]s$/.test(w) ? "s" : "base";
}

// ───────────────────────────── gaps in sentences ─────────────────────────────

interface ClozePlan {
  sentence: string;
  target: Keyword;
  start: number;
  end: number;
  /** What stands before and after the gap. */
  prev: string;
  next: string;
}

/** The most informative word or name of a sentence (a name, a repeated term), or null when none stands out. */
function pickTarget(sentence: string, keywords: Map<string, Keyword>): ClozePlan | null {
  const ws = wordsOf(sentence);
  const phrases = properPhrases(sentence);
  type Span = { text: string; start: number; end: number; first: number; last: number };
  const spans: Span[] = [];
  for (let i = 0; i < ws.length; i++) {
    const ph = phrases.find((p) => p.start === ws[i]!.start);
    if (ph) {
      const last = ws.findIndex((w) => w.end === ph.end);
      spans.push({ text: ph.text, start: ph.start, end: ph.end, first: i, last });
      i = last;
    } else spans.push({ text: ws[i]!.text, start: ws[i]!.start, end: ws[i]!.end, first: i, last: i });
  }
  const lowerSentence = sentence.toLowerCase();
  let best: { score: number; span: Span; k: Keyword } | null = null;
  for (const span of spans) {
    const k = keywords.get(span.text.toLowerCase());
    // the first word of a sentence is capitalised anyway, and says little
    if (!k || span.first === 0) continue;
    // the word (or a form of it) must not stay visible elsewhere in the sentence
    const parts = wordsOf(span.text);
    const rest = ws.filter((w) => w.end <= span.start || w.start >= span.end);
    if (lowerSentence.split(k.lower).length > 2 || rest.some((w) => parts.some((p) => sameWord(w.text, p.text)))) continue;
    const score = (k.proper ? 3 : 0) + Math.min(2, k.count - 1) + Math.min(2, span.text.length / 6) + (parts.length > 1 ? 1.5 : 0);
    if (!best || score > best.score) best = { score, span, k };
  }
  if (!best) return null;
  const [prev, next] = edges(sentence, ws, best.span.first, best.span.last);
  return { sentence, target: { ...best.k, text: best.span.text }, start: best.span.start, end: best.span.end, prev, next };
}

function distractorsFor(plan: ClozePlan, pool: Keyword[], ctx: Context, rnd: () => number, n = 3): Keyword[] {
  const t = plan.target;
  const sentenceWords = wordsOf(plan.sentence);
  const last = (w: string) => w.slice(-1).toLowerCase();
  const fits = pool
    .filter((k) => k.lower !== t.lower && hasHebrew(k.text) === hasHebrew(t.text))
    .filter((k) => !wordsOf(k.text).some((kw) => sentenceWords.some((sw) => sameWord(kw.text, sw.text)) || wordsOf(t.text).some((tw) => sameWord(kw.text, tw.text))));
  // The best wrong options look like the right one: same kind of word (name vs common word), a word that has stood in the
  // same place in the notes ("for the ___"), a similar ending (plural, -ing, -ed…), similar length, and topical (used more than once).
  // Hebrew: a definite article (ה־) or a relative "ש־" is a grammatical tell, so the wrong words should share it with the right one.
  const heShape = (w: string) => (hasHebrew(w) ? (/^[והבכלמש](?=\p{L}{4,})/u.exec(w)?.[0] ?? "") : "");
  const fit = (k: Keyword) => {
    const ws = wordsOf(k.text);
    return Number(ctx.before.get(ws[0]?.text.toLowerCase() ?? "")?.has(plan.prev) ?? false) + Number(ctx.after.get(ws[ws.length - 1]?.text.toLowerCase() ?? "")?.has(plan.next) ?? false);
  };
  const score = (k: Keyword) => (k.proper === t.proper ? 0 : 10) + (shapeOf(k.text) === shapeOf(t.text) ? 0 : 4) + (last(k.text) === last(t.text) ? 0 : 1) + (heShape(k.text) === heShape(t.text) ? 0 : 6)
    + (wordsOf(k.text).length === wordsOf(t.text).length ? 0 : 4) + Math.abs(k.text.length - t.text.length) * 0.7 - Math.min(k.count, 3) * 0.8 - fit(k) * 4;
  const ranked = fits.sort((a, b) => score(a) - score(b) || a.lower.localeCompare(b.lower));
  return shuffled(ranked.slice(0, n + 3), rnd).slice(0, n);
}

/** Wrong options of a gap, each told where the learner has seen that word instead. */
function whyNot(word: string, original: string, ctx: Context, t: Tr): string {
  const home = ctx.home.get(original.toLowerCase());
  return home
    ? t(`“${word}” does not fit here. It comes from another sentence of yours: “${clip(home, 110)}”`, `״${word}״ לא מתאים כאן. הוא לקוח ממשפט אחר שלכם: ״${clip(home, 110)}״`)
    : t(`“${word}” does not fit here — re-read the sentence in your material.`, `״${word}״ לא מתאים כאן — קראו שוב את המשפט בחומר שלכם.`);
}

function clozeCandidates(sentences: string[], keywords: Keyword[], ctx: Context, rnd: () => number, t: Tr): Candidate[] {
  const map = new Map(keywords.map((k) => [k.lower, k]));
  const known = new Set(map.keys());
  const out: Candidate[] = [];
  const usedTargets = new Set<string>();
  for (const s of sentences) {
    const plan = pickTarget(s, map);
    if (!plan || usedTargets.has(plan.target.lower)) continue;
    const distractors = distractorsFor(plan, keywords, ctx, rnd);
    if (distractors.length < 3) continue;
    const forms = distractors.map((d) => formLike(plan.target.text, d.text, known));
    if (new Set([plan.target.text.toLowerCase(), ...forms.map((f) => f.toLowerCase())]).size < 4) continue;
    usedTargets.add(plan.target.lower);
    const blanked = `${s.slice(0, plan.start)}_____${s.slice(plan.end)}`;
    const correctAt = Math.floor(rnd() * 4);
    const options = forms.map((d, i) => [d, whyNot(d, distractors[i]!.text, ctx, t)] as [string, string]);
    options.splice(correctAt, 0, [plan.target.text, t("Yes — that is how your material puts it.", "נכון — כך החומר שלכם מנסח זאת.")]);
    const letters = plan.target.text.replace(/\s/g, "").length;
    const first = plan.target.text.charAt(0);
    out.push({
      kind: "cloze", objective: "ideas", level: 2, keys: [s],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: t("Fill the gap", "השלימו את החסר"),
        concept: t("main ideas", "רעיונות מרכזיים"),
        prompt: t(`Which ${plan.target.text.includes(" ") ? "name" : "word"} completes this sentence from your material?\n“${blanked}”`, `${plan.target.text.includes(" ") ? "איזה שם משלים" : "איזו מילה משלימה"} את המשפט הזה מתוך החומר שלכם?\n״${blanked}״`),
        hint: plan.target.text.includes(" ")
          ? t(`The missing name has ${letters} letters and starts with “${first}”.`, `בשם החסר יש ${letters} אותיות והוא מתחיל באות ״${first}״.`)
          : t(`The missing word has ${letters} letters and starts with “${first}”.`, `במילה החסרה יש ${letters} אותיות והיא מתחילה באות ״${first}״.`),
        explanation: clip(s, 600),
      }),
    });
  }
  return out;
}

function trueFalseCandidates(sentences: string[], keywords: Keyword[], ctx: Context, truths: Set<string>, rnd: () => number, t: Tr): Candidate[] {
  const map = new Map(keywords.map((k) => [k.lower, k]));
  const known = new Set(map.keys());
  const out: Candidate[] = [];
  let n = 0;
  for (const s of sentences) {
    const plan = pickTarget(s, map);
    if (!plan) continue;
    const swap = distractorsFor(plan, keywords, ctx, rnd, 1)[0];
    const falseText = swap ? `${s.slice(0, plan.start)}${formLike(plan.target.text, swap.text, known)}${s.slice(plan.end)}` : "";
    // a "false" statement that the notes also contain somewhere is not false
    const makeFalse = n++ % 2 === 1 && Boolean(swap) && !truths.has(sameKey(falseText));
    const statement = makeFalse ? falseText : s;
    const options: [string, string][] = [
      [t("True", "נכון"), makeFalse ? t(`That statement was changed. Your material says: “${clip(s, 200)}”`, `המשפט שונה. החומר שלכם אומר: ״${clip(s, 200)}״`) : t("Yes — that is exactly what your material says.", "נכון — זה בדיוק מה שהחומר שלכם אומר.")],
      [t("False", "לא נכון"), makeFalse ? t(`Right — it was changed. Your material says: “${clip(s, 200)}”`, `נכון — המשפט שונה. החומר שלכם אומר: ״${clip(s, 200)}״`) : t("It is true — your material says exactly that.", "זה נכון — החומר שלכם אומר בדיוק את זה.")],
    ];
    out.push({
      kind: "truefalse", objective: "ideas", level: 1, keys: [s],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: makeFalse ? 1 : 0,
        title: t("True or false?", "נכון או לא נכון?"),
        concept: t("main ideas", "רעיונות מרכזיים"),
        prompt: t(`According to your material, is this statement correct?\n“${statement}”`, `לפי החומר שלכם, האם המשפט הזה נכון?\n״${statement}״`),
        hint: t("Check each important word against your material — one may have been swapped.", "בדקו כל מילה חשובה מול החומר שלכם — ייתכן שאחת מהן הוחלפה."),
        explanation: clip(s, 600),
      }),
    });
  }
  return out;
}

// ───────────────────────────── terms and meanings ─────────────────────────────

/** Titles rotate with the challenge number so a whole game does not repeat one heading. */
const TERM_TITLES: [string, string][] = [["Name the term", "איך קוראים לזה?"], ["Which concept is this?", "איזה מושג זה?"], ["Find the concept", "מצאו את המושג"]];
const DEFINE_TITLES: [string, string][] = [["What does it mean?", "מה זה אומר?"], ["Pick the right meaning", "בחרו את ההסבר הנכון"], ["Explain the term", "הסבירו את המושג"]];
const FACTPICK_TITLES: [string, string][] = [["Which number fits?", "איזה מספר מתאים?"], ["Pick the number", "בחרו את המספר"], ["Complete the fact", "השלימו את העובדה"]];
const STATEMENT_TITLES: [string, string][] = [["Which statement is correct?", "איזה משפט נכון?"], ["Spot the true statement", "זהו את המשפט הנכון"], ["Only one matches your notes", "רק אחד תואם לפתקים"]];
function pick(titles: [string, string][], id: string, t: Tr): string {
  const n = Number(id.replace(/\D+/g, "")) || 0;
  const [en, he] = titles[n % titles.length]!;
  return t(en, he);
}

function matchCandidates(defs: Definition[], t: Tr): Candidate[] {
  const usable = defs.filter((d) => d.term.length <= 90 && d.meaning.length >= 3);
  if (usable.length < 3) return [];
  const sizes: number[] = [];
  let left = usable.length;
  while (left > 0) {
    const n = left <= 5 ? left : left === 6 ? 3 : 4;
    sizes.push(n);
    left -= n;
  }
  if (sizes.length > 1 && sizes[sizes.length - 1]! < 3) {
    const last = sizes.pop()!;
    sizes[sizes.length - 1]! += last;
  }
  const out: Candidate[] = [];
  let at = 0;
  for (const n of sizes) {
    const group = usable.slice(at, at + n);
    at += n;
    // two pairs with the same right-hand side cannot be told apart
    if (group.length < 3 || new Set(group.map((d) => sameKey(d.meaning))).size < group.length) continue;
    out.push({
      kind: "match", objective: "terms", level: group.length > 4 ? 2 : 1, keys: group.map((d) => d.term.toLowerCase()),
      make: (id, level, objectiveId) => match({
        id, level, objectiveId,
        title: t("Match the terms", "התאימו את המושגים"),
        concept: clip(group.map((d) => d.term).join(", "), 60),
        prompt: group.every((d) => d.short) ? t("Match each entry of your list to the one that goes with it.", "התאימו כל פריט ברשימה שלכם לזה שמתאים לו.") : t("Match each term to its description from your material.", "התאימו כל מושג להסבר שלו מתוך החומר שלכם."),
        pairs: group.map((d) => [clip(d.term, 90), clip(d.meaning, 140)] as [string, string]),
        hint: t("Start with the pair you are most sure about.", "התחילו מהזוג שאתם הכי בטוחים בו."),
        explanation: clip(group.map((d) => `${d.term}: ${d.meaning}`).join(" · "), 600),
      }),
    });
  }
  return out;
}

function termCandidates(defs: Definition[], keywords: Keyword[], rnd: () => number, t: Tr): Candidate[] {
  const usable = defs.filter((d) => d.term.length <= 80 && d.meaning.length >= (d.short ? 2 : 8));
  if (usable.length < 2) return [];
  const out: Candidate[] = [];
  for (const d of usable) {
    // the description is what the learner reads; if the term is written inside it, it is hidden there
    const shown = maskTerm(d.meaning, d.term);
    if (shown === null) continue;
    // two terms that share a word with each other or with the description ("Loop" / "For loop" / "a loop that…") cannot be told apart
    const dWords = [...contentStems(d.term).values()];
    const clash = (o: Definition) => [...contentStems(o.term).values()].some((w) => dWords.some((x) => sameWord(w, x))) || mentions(d.meaning, o.term);
    const clean = usable.filter((o) => o.term.toLowerCase() !== d.term.toLowerCase() && !clash(o));
    // wrong options: the other terms first; with only a few terms, other notable words of the material fill in
    const otherTerms = shuffled(clean, rnd)
      .sort((a, b) => Math.abs(wordsOf(a.term).length - wordsOf(d.term).length) - Math.abs(wordsOf(b.term).length - wordsOf(d.term).length))
      .map((o) => ({ text: o.term, why: t(`“${clip(o.term, 60)}” is described differently: ${clip(o.meaning, 120)}`, `״${clip(o.term, 60)}״ מוגדר אחרת: ${clip(o.meaning, 120)}`) }));
    const inMeaning = wordsOf(d.meaning).map((w) => w.text);
    const fillers = otherTerms.length >= 3 || d.short ? [] : keywords
      .filter((k) => k.text.length >= 4 && hasHebrew(k.text) === hasHebrew(d.term) && !sameWord(k.text, d.term) && !inMeaning.some((w) => sameWord(w, k.text)) && !otherTerms.some((o) => sameWord(o.text, k.text)))
      .sort((a, b) => Number(b.proper) - Number(a.proper) || b.count - a.count || Math.abs(a.text.length - d.term.length) - Math.abs(b.text.length - d.term.length) || a.lower.localeCompare(b.lower))
      .slice(0, 3 - otherTerms.length)
      // a stand-alone option reads better without a leading Hebrew "and" (ו־)
      .map((k) => k.text.replace(/^ו(?=\p{L}{3,})/u, ""))
      .map((w) => ({ text: w, why: t(`“${w}” appears in your notes, but not with this description.`, `״${w}״ מופיע בפתקים שלכם, אבל לא עם ההסבר הזה.`) }));
    const wrong = [...otherTerms.slice(0, 3), ...fillers].slice(0, 3);
    if (wrong.length < 2) continue;
    const correctAt = Math.floor(rnd() * (wrong.length + 1));
    const options = wrong.map((w) => [clip(w.text, 200), w.why] as [string, string]);
    options.splice(correctAt, 0, [clip(d.term, 200), t("Yes — that is how your material describes it.", "נכון — כך החומר שלכם מתאר זאת.")]);
    const first = d.term.trim().charAt(0);
    out.push({
      kind: "term", objective: "terms", level: 1, keys: [d.term.toLowerCase()],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: pick(TERM_TITLES, id, t),
        // the concept tag is shown in the challenge panel, so it describes the question and never names the answer
        concept: clip(shown, 60),
        prompt: d.short
          ? t(`Which entry of your list goes with “${clip(shown, 100)}”?`, `איזה פריט ברשימה שלכם מתאים ל״${clip(shown, 100)}״?`)
          : t(`Which term matches this description from your material?\n“${clip(shown, 300)}”`, `איזה מושג מתאים להסבר הזה מתוך החומר שלכם?\n״${clip(shown, 300)}״`),
        hint: t(`It starts with “${first}”.`, `זה מתחיל באות ״${first}״.`),
        explanation: clip(d.source, 600),
      }),
    });
  }
  return out;
}

/** The reverse of "term": the term is shown and the learner picks its meaning from the other meanings in the material. */
function defineCandidates(defs: Definition[], rnd: () => number, t: Tr): Candidate[] {
  const usable = defs.filter((d) => d.term.length <= 60 && d.meaning.length >= (d.short ? 2 : 8) && d.meaning.length <= 160);
  if (usable.length < 3) return [];
  const out: Candidate[] = [];
  for (const d of usable) {
    // a meaning that spells out its own term would give the answer away by its words alone
    if (!d.short && mentions(d.meaning, d.term)) continue;
    const pool = usable.filter((o) => o.term.toLowerCase() !== d.term.toLowerCase() && sameKey(o.meaning) !== sameKey(d.meaning)
      // a wrong meaning that talks about the asked term is a second right answer ("Loop" → "a loop that runs…")
      && !mentions(o.meaning, d.term) && (o.short || overlap(o.meaning, d.meaning) <= 0.7));
    const wrong = shuffled(pool, rnd)
      // similar-looking meanings make the better wrong options
      .sort((a, b) => Math.abs(a.meaning.length - d.meaning.length) - Math.abs(b.meaning.length - d.meaning.length)).slice(0, 5);
    const picked = shuffled(wrong, rnd).slice(0, 3);
    if (picked.length < 2) continue;
    const correctAt = Math.floor(rnd() * (picked.length + 1));
    const options = picked.map((w) => [clip(w.meaning, 200), t(`That describes “${clip(w.term, 60)}”, not this term.`, `זה מתאר את ״${clip(w.term, 60)}״ ולא את המושג הזה.`)] as [string, string]);
    options.splice(correctAt, 0, [clip(d.meaning, 200), t("Yes — that is how your material describes it.", "נכון — כך החומר שלכם מתאר זאת.")]);
    const key = distinctiveWord(d.meaning, picked.map((w) => w.meaning));
    const firstWord = d.meaning.trim().split(/\s+/)[0] ?? "";
    out.push({
      kind: "define", objective: "terms", level: 2, keys: [d.term.toLowerCase()],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: pick(DEFINE_TITLES, id, t),
        concept: clip(d.term, 60),
        prompt: d.short
          ? t(`In your list, what goes with “${clip(d.term, 80)}”?`, `ברשימה שלכם, מה מתאים ל״${clip(d.term, 80)}״?`)
          : t(`According to your material, what is “${clip(d.term, 80)}”?`, `לפי החומר שלכם, מהו ״${clip(d.term, 80)}״?`),
        hint: key && !d.short
          ? t(`The right description mentions “${key}”.`, `ההסבר הנכון מזכיר את ״${key}״.`)
          : t(`The right one starts with “${firstWord.charAt(0)}”.`, `התשובה הנכונה מתחילה באות ״${firstWord.charAt(0)}״.`),
        explanation: clip(d.source, 600),
      }),
    });
  }
  return out;
}

/** "Odd one out": three terms whose descriptions share a word, and one that does not. Built only from the learner's own descriptions. */
function oddCandidates(defs: Definition[], rnd: () => number, t: Tr): Candidate[] {
  const usable = defs.filter((d) => d.term.length <= 50 && d.meaning.length >= 8 && d.meaning.length <= 160);
  if (usable.length < 4) return [];
  const info = usable.map((d) => {
    const meaning = contentStems(d.meaning);
    return { meaning, whole: new Set([...meaning.keys(), ...contentStems(d.term).keys()]) };
  });
  const byStem = new Map<string, number[]>();
  info.forEach((x, i) => x.meaning.forEach((_surface, st) => byStem.set(st, [...(byStem.get(st) ?? []), i])));
  const shared = [...byStem.entries()].filter(([, ix]) => ix.length >= 3 && ix.length < usable.length).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const out: Candidate[] = [];
  const usedOdd = new Set<number>();
  for (const [st, members] of shared) {
    if (out.length >= 6) break;
    const outside = info.map((_x, i) => i).filter((i) => !members.includes(i) && !usedOdd.has(i)
      && !info[i]!.whole.has(st) && ![...info[i]!.whole].some((w) => sameWord(w, st)));
    if (outside.length === 0) continue;
    const odd = shuffled(outside, rnd)[0]!;
    const inGroup = shuffled(members, rnd).slice(0, 3);
    const word = inGroup.map((i) => info[i]!.meaning.get(st)!).sort((a, b) => a.length - b.length || a.localeCompare(b))[0]!;
    const all = [...inGroup, odd];
    if (new Set(all.map((i) => usable[i]!.term.toLowerCase())).size < 4) continue;
    usedOdd.add(odd);
    const correctAt = Math.floor(rnd() * 4);
    const options = inGroup.map((i) => [clip(usable[i]!.term, 200), t(`No — your material describes “${clip(usable[i]!.term, 50)}” with “${word}”: ${clip(usable[i]!.meaning, 120)}`, `לא — החומר שלכם מתאר את ״${clip(usable[i]!.term, 50)}״ עם ״${word}״: ${clip(usable[i]!.meaning, 120)}`)] as [string, string]);
    options.splice(correctAt, 0, [clip(usable[odd]!.term, 200), t(`Yes — “${clip(usable[odd]!.term, 50)}” is described differently: ${clip(usable[odd]!.meaning, 120)}`, `נכון — ״${clip(usable[odd]!.term, 50)}״ מתואר אחרת: ${clip(usable[odd]!.meaning, 120)}`)]);
    out.push({
      kind: "odd", objective: "terms", level: 3, keys: [`odd:${st}`],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: t("Odd one out", "מי לא שייך?"),
        concept: t("how the terms differ", "במה המושגים שונים"),
        prompt: t(`In your material, three of these terms are described with the word “${word}”. Which one is not?`, `בחומר שלכם, שלושה מהמושגים האלה מתוארים עם המילה ״${word}״. איזה מהם לא?`),
        hint: t(`Remember which descriptions mention “${word}”.`, `נסו להיזכר אילו הסברים מזכירים את ״${word}״.`),
        explanation: clip(usable[odd]!.source, 600),
      }),
    });
  }
  return out;
}

// ───────────────────────────── numbers ─────────────────────────────

/** A number written the way the learner wrote theirs (same decimals, same thousands separator). */
function numberLike(n: number, f: Fact): string {
  if (/,/.test(f.numText)) return n.toLocaleString("en-US", { minimumFractionDigits: f.decimals, maximumFractionDigits: f.decimals });
  return f.decimals > 0 ? n.toFixed(f.decimals) : String(Math.round(n));
}

/** Plausible wrong numbers near a fact's number, for when the notes hold too few others of the same kind. Never equal to a number in `taken`. */
function nearNumbers(f: Fact, taken: ReadonlySet<string>, rnd: () => number, count: number): string[] {
  if (count <= 0) return [];
  const v = f.value, mag = Math.abs(v);
  const unit = f.decimals > 0 ? 10 ** -f.decimals : 1;
  const steps = f.isYear ? [1, 2, 3, 5, 10, 20] : mag < 20 ? [1, 2, 3, 4, 5, 6] : [0.1, 0.2, 0.3, 0.5, 1].map((p) => Math.max(unit, Math.round((mag * p) / unit) * unit));
  const out = new Set<string>();
  const seen = new Set<string>([numberLike(v, f), ...taken]);
  for (const step of shuffled(steps.flatMap((s) => [s, -s]), rnd)) {
    const n = v + (f.isYear || mag >= 20 || f.decimals === 0 ? step : step * unit);
    if (!Number.isFinite(n) || (v >= 0 && n < 0) || (f.isYear && (n < 1000 || n > 2100))) continue;
    const text = numberLike(n, f);
    if (seen.has(text)) continue;
    seen.add(text);
    out.add(text);
    if (out.size >= count) break;
  }
  return [...out];
}

/** The same kind of number: a year next to years, a decimal next to decimals, of a similar size. */
const sameKind = (a: Fact, b: Fact) => a.isYear === b.isYear && (a.decimals > 0) === (b.decimals > 0) && Math.abs(Math.log10(Math.abs(a.value) + 1) - Math.log10(Math.abs(b.value) + 1)) <= 1.2;

/** The number as a multiple-choice question: the fact with a gap, and the numbers of the learner's other facts as options. */
function factPickCandidates(facts: Fact[], rnd: () => number, t: Tr): Candidate[] {
  const usable = facts.filter((f) => f.numText.length <= 14);
  const out: Candidate[] = [];
  for (const f of usable) {
    const seen = new Set<string>([f.numText]);
    const pool = usable.filter((o) => o !== f && o.value !== f.value && sameKind(f, o))
      .sort((a, b) => Math.abs(Math.log10(Math.abs(a.value) + 1) - Math.log10(Math.abs(f.value) + 1)) - Math.abs(Math.log10(Math.abs(b.value) + 1) - Math.log10(Math.abs(f.value) + 1)) || a.value - b.value);
    const fromNotes: Fact[] = [];
    for (const o of pool) if (!seen.has(o.numText) && fromNotes.length < 4) { seen.add(o.numText); fromNotes.push(o); }
    const picked = shuffled(fromNotes, rnd).slice(0, 2);
    const invented = nearNumbers(f, new Set(usable.map((o) => o.numText)), rnd, 3 - picked.length);
    const wrong: [string, string][] = [
      ...picked.map((o) => [o.numText, t("That number belongs to a different fact in your material.", "המספר הזה שייך לעובדה אחרת בחומר שלכם.")] as [string, string]),
      ...invented.map((n) => [n, t("Close, but that is not the number your material gives.", "קרוב, אבל זה לא המספר שהחומר שלכם נותן.")] as [string, string]),
    ];
    if (wrong.length < 3) continue;
    const correctAt = Math.floor(rnd() * 4);
    const options = [...shuffled(wrong, rnd)];
    options.splice(correctAt, 0, [f.numText, t("Yes — that is the number in your material.", "נכון — זה המספר בחומר שלכם.")]);
    const digits = f.numText.replace(/\D/g, "").length;
    out.push({
      kind: "factpick", objective: "facts", level: 1, keys: [f.source],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: pick(FACTPICK_TITLES, id, t),
        concept: clip(f.blanked.replace("___", "…"), 60),
        prompt: t(`Which number goes with this fact from your material?\n“${f.blanked}”`, `איזה מספר מתאים לעובדה הזאת מתוך החומר שלכם?\n״${f.blanked}״`),
        hint: f.isYear ? t("It is a year.", "זו שנה.") : t(`It has ${digits} digit${digits === 1 ? "" : "s"}.`, `יש בו ${digits} ספרות.`),
        explanation: clip(f.source, 600),
      }),
    });
  }
  return out;
}

/** Wrong answers that are the right answer to something else in the notes, each telling the learner what. */
function otherNumbers(value: number, candidates: { value: number; source: string }[], t: Tr, tenTimes: boolean): [number, string][] {
  const out: [number, string][] = [];
  const seen = new Set<number>([value]);
  if (tenTimes && value !== 0 && Number.isFinite(value * 10)) {
    out.push([value * 10, t("That is ten times too big — check the size of the number in your material.", "זה גדול פי עשרה — בדקו את גודל המספר בחומר שלכם.")]);
    seen.add(value * 10);
  }
  const near = candidates.filter((c) => !seen.has(c.value)).sort((a, b) => Math.abs(Math.log10(Math.abs(a.value) + 1) - Math.log10(Math.abs(value) + 1)) - Math.abs(Math.log10(Math.abs(b.value) + 1) - Math.log10(Math.abs(value) + 1)) || a.value - b.value);
  for (const c of near) {
    if (out.length >= 3) break;
    if (seen.has(c.value)) continue;
    seen.add(c.value);
    out.push([c.value, t(`That is the number from another place in your notes: “${clip(c.source, 130)}”`, `זה המספר ממקום אחר בפתקים שלכם: ״${clip(c.source, 130)}״`)]);
  }
  return out;
}

function numberCandidates(facts: Fact[], qa: QuestionAnswer[], t: Tr): Candidate[] {
  const siblings = [...facts.map((f) => ({ value: f.value, source: f.source })), ...qa.filter((q) => q.value !== undefined).map((q) => ({ value: q.value!, source: `${q.question} ${q.answer}` }))];
  return facts.map((f) => {
    const digits = String(Math.trunc(Math.abs(f.value))).length;
    return {
      kind: "number" as const, objective: "facts" as const, level: 2 as Level, keys: [f.source],
      make: (id: string, level: Level, objectiveId: string) => numeric({
        id, level, objectiveId, answer: f.value,
        tolerance: f.decimals > 0 ? 0.5 * 10 ** -f.decimals : 0,
        mistakes: otherNumbers(f.value, siblings.filter((s) => s.source !== f.source), t, !f.isYear),
        title: t("Find the number", "מצאו את המספר"),
        concept: clip(f.blanked.replace("___", "…"), 60),
        prompt: t(`Which number is missing from this sentence in your material?\n“${f.blanked}”`, `איזה מספר חסר במשפט הזה מתוך החומר שלכם?\n״${f.blanked}״`),
        hint: f.decimals > 0 ? t(`It has ${f.decimals} decimal place${f.decimals === 1 ? "" : "s"}.`, `יש בו ${f.decimals} ספרות אחרי הנקודה.`) : t(`It is a ${digits}-digit number.`, `זה מספר בן ${digits} ספרות.`),
        explanation: clip(f.source, 600),
      }),
    };
  });
}

/** Four versions of one sentence: the learner's own, and three with one key word (or number) swapped for another from the notes. */
function statementCandidates(sentences: string[], facts: Fact[], keywords: Keyword[], ctx: Context, truths: Set<string>, rnd: () => number, t: Tr): Candidate[] {
  const map = new Map(keywords.map((k) => [k.lower, k]));
  const known = new Set(map.keys());
  const out: Candidate[] = [];
  const usedTargets = new Set<string>();
  const build = (source: string, wrongTexts: string[], key: string) => {
    // a changed sentence that the notes also contain is not changed
    const unique = wrongTexts.filter((w, i, arr) => w !== source && arr.indexOf(w) === i && !truths.has(sameKey(w)));
    if (unique.length < 3) return;
    const wrong = unique.slice(0, 3);
    const correctAt = Math.floor(rnd() * 4);
    const options = wrong.map((w) => [w, t(`This one was changed. Your material says: “${clip(source, 150)}”`, `המשפט הזה שונה. החומר שלכם אומר: ״${clip(source, 150)}״`)] as [string, string]);
    options.splice(correctAt, 0, [source, t("Yes — that is exactly what your material says.", "נכון — זה בדיוק מה שהחומר שלכם אומר.")]);
    out.push({
      kind: "statement", objective: "ideas", level: 2, keys: [source],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: pick(STATEMENT_TITLES, id, t),
        concept: t("main ideas", "רעיונות מרכזיים"),
        prompt: t("Which of these statements matches your material exactly?", "איזה מהמשפטים האלה תואם בדיוק לחומר שלכם?"),
        hint: t("Three of them have one word or number changed.", "בשלושה מהם הוחלפה מילה או מספר אחד."),
        explanation: clip(source, 600),
      }),
    });
    usedTargets.add(key);
  };
  for (const s of sentences) {
    if (s.length > 170) continue;
    const plan = pickTarget(s, map);
    if (!plan || usedTargets.has(plan.target.lower)) continue;
    const swaps = distractorsFor(plan, keywords, ctx, rnd, 4).map((d) => formLike(plan.target.text, d.text, known));
    build(s, swaps.map((w) => `${s.slice(0, plan.start)}${w}${s.slice(plan.end)}`), plan.target.lower);
  }
  const values = facts.filter((f) => f.numText.length <= 14);
  for (const f of facts) {
    if (f.source.length > 170 || usedTargets.has(`n:${f.source}`)) continue;
    const others = shuffled(values.filter((o) => o.value !== f.value && o.numText !== f.numText && sameKind(f, o)), rnd).map((o) => o.numText).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
    const numbers = [...others, ...nearNumbers(f, new Set(values.map((o) => o.numText)), rnd, 3 - others.length)];
    build(f.source, numbers.map((n) => `${f.source.slice(0, f.numAt)}${n}${f.source.slice(f.numAt + f.numText.length)}`), `n:${f.source}`);
  }
  return out;
}

// ───────────────────────────── steps and questions ─────────────────────────────

function stepCandidates(groups: string[][], titles: (string | undefined)[], t: Tr): Candidate[] {
  return groups.map((items, g) => {
    const first = items[0]!.split(/\s+/).slice(0, 4).join(" ");
    const name = titles[g];
    return {
      kind: "steps" as const, objective: "steps" as const, level: (items.length >= 5 ? 3 : 2) as Level, keys: [`steps-${g}`],
      make: (id: string, level: Level, objectiveId: string) => sequence({
        id, level, objectiveId, items,
        title: t("Put the steps in order", "סדרו את השלבים"),
        concept: name ? clip(name, 60) : t("order of the steps", "סדר השלבים"),
        prompt: name
          ? t(`Put the steps of “${clip(name, 120)}” from your material in the right order.`, `סדרו את השלבים של ״${clip(name, 120)}״ מתוך החומר שלכם בסדר הנכון.`)
          : t("Put these steps from your material in the right order.", "סדרו את השלבים האלה מתוך החומר שלכם בסדר הנכון."),
        hint: t(`The first step starts with “${first}…”.`, `השלב הראשון מתחיל ב״${first}…״.`),
        explanation: clip(items.map((x, i) => `${i + 1}. ${x}`).join("  "), 600),
      }),
    };
  });
}

/**
 * Dated events from the learner's notes, put in order: every sentence that holds exactly one year, with the year hidden.
 * One event per year (two events of the same year cannot be ordered), at most five to a question and two questions to a
 * game; a long list is cut into consecutive stretches of time, so each question is about one period.
 */
const DATE_CUE = /(?:^|[^\p{L}])(?:in|by|since|until|till|during|around|circa|ca|year|from|after|before|early|late|mid)\.?\s*$|(?:^|\s)(?:c\.|[בלמ]-?|בשנת|בשנה|שנת|שנות|מאז|עד)\s*$/iu;
const NOT_A_DATE = /^\s*(?:years?|months?|days?|hours?|minutes?|people|students|times|metres|meters|km|kg|tons?|units|שנים|שנה|ימים|חודשים|שעות|פעמים|אנשים|תלמידים|מטר|ק״מ|ק"מ)(?![\p{L}])/iu;

/** A number that is a year of an event ("in 1969", "בשנת 1948"), not an amount that happens to look like one ("1500 metres"). */
function isEventYear(f: Fact): boolean {
  if (!f.isYear) return false;
  const before = f.source.slice(Math.max(0, f.numAt - 16), f.numAt);
  const after = f.source.slice(f.numAt + f.numText.length, f.numAt + f.numText.length + 14);
  return !NOT_A_DATE.test(after) && (f.numAt === 0 || DATE_CUE.test(before));
}

function timelineCandidates(facts: Fact[], t: Tr): Candidate[] {
  const byYear = new Map<number, Fact>();
  const seenText = new Set<string>();
  for (const f of facts) {
    if (!isEventYear(f) || byYear.has(f.value) || f.blanked.length > 180 || seenText.has(sameKey(f.blanked))) continue;
    seenText.add(sameKey(f.blanked));
    byYear.set(f.value, f);
  }
  const dated = [...byYear.values()].sort((a, b) => a.value - b.value);
  if (dated.length < 3) return [];
  const groups = Math.min(2, Math.ceil(dated.length / 5));
  const size = Math.min(5, Math.ceil(dated.length / groups));
  return Array.from({ length: groups }, (_, g) => dated.slice(g * size, (g + 1) * size)).filter((events) => events.length >= 3).map((events, g) => {
    const years = events.map((f) => f.numText);
    return {
      kind: "timeline" as const, objective: "facts" as const, level: (events.length >= 5 ? 3 : 2) as Level, keys: [`timeline-${g}`],
      make: (id: string, level: Level, objectiveId: string) => sequence({
        id, level, objectiveId, items: events.map((f) => f.blanked),
        title: t("Put the events in order", "סדרו את האירועים בציר הזמן"),
        concept: t("order of events", "סדר האירועים"),
        prompt: t("Put these events from your material in the order they happened, the earliest first. The years are hidden.", "סדרו את האירועים האלה מתוך החומר שלכם לפי הסדר שבו התרחשו, מהקדום למאוחר. השנים מוסתרות."),
        hint: t(`All of them happened between ${years[0]} and ${years[years.length - 1]}.`, `כולם התרחשו בין ${years[0]} ל-${years[years.length - 1]}.`),
        explanation: (() => {
          const head = `${years.join(" → ")}. `;
          return head + events.map((f) => clip(f.source, Math.floor((560 - head.length) / events.length))).join("  ");
        })(),
      }),
    };
  });
}

const OPPOSITE: Record<string, string> = { yes: "No", no: "Yes", true: "False", false: "True", correct: "Incorrect", incorrect: "Correct", כן: "לא", לא: "כן", נכון: "לא נכון", "לא נכון": "נכון", שגוי: "נכון" };

/** Shape of an answer, for choosing wrong options that look like it (a name next to names, a number next to numbers). */
function answerDistance(a: string, b: string): number {
  const cap = (s: string) => /^\p{Lu}/u.test(s);
  const digit = (s: string) => /\d/.test(s);
  return Math.abs(wordsOf(a).length - wordsOf(b).length) + (cap(a) === cap(b) ? 0 : 2) + (digit(a) === digit(b) ? 0 : 2) + Math.abs(a.length - b.length) / 25 + (hasHebrew(a) === hasHebrew(b) ? 0 : 6);
}

/**
 * The wrong option that is easiest to rule out, for the two-option "easier" version of a question: the one least like the
 * right answer (different words, different shape) and least tied to the question's own words. The hardest distractors
 * stay in the full question. Ties keep the original order.
 */
export function leastPlausible<T extends { text: string }>(correct: { text: string }, wrong: T[], prompt: string): T {
  const closeness = (o: T) => overlap(correct.text, o.text) + overlap(o.text, correct.text) + overlap(prompt, o.text) - Math.min(answerDistance(correct.text, o.text), 6) / 3;
  return wrong.reduce((best, o) => (closeness(o) < closeness(best) ? o : best));
}

function qaCandidates(k: Knowledge, rnd: () => number, t: Tr): Candidate[] {
  const out: Candidate[] = [];
  const numbersElsewhere = (self: QuestionAnswer) => [
    ...k.qa.filter((o) => o !== self && o.value !== undefined).map((o) => ({ value: o.value!, source: `${o.question} ${o.answer}` })),
    ...k.facts.map((f) => ({ value: f.value, source: f.source })),
  ];
  for (const qa of k.qa) {
    const question = clip(qa.question, 560);
    const explanation = clip(`${qa.question} → ${qa.answer}`, 600);
    if (qa.value !== undefined) {
      const unit = qa.answer.replace(/^[-−]?[\d,]+(?:\.\d+)?\s*/u, "").trim();
      out.push({
        kind: "qa", objective: "questions", level: 2, keys: [qa.question.toLowerCase()],
        make: (id, level, objectiveId) => numeric({
          id, level, objectiveId, answer: qa.value!, tolerance: qa.decimals > 0 ? 0.5 * 10 ** -qa.decimals : 0,
          ...(unit && unit.length <= 12 ? { unit } : {}),
          mistakes: otherNumbers(qa.value!, numbersElsewhere(qa), t, true),
          title: t("Answer the question", "ענו על השאלה"), concept: clip(qa.question, 60), prompt: question,
          hint: t("The answer is a number — look for it in your notes.", "התשובה היא מספר — חפשו אותו בפתקים שלכם."),
          explanation,
        }),
      });
      continue;
    }
    // a question whose answer is written in it (or that just repeats its words) cannot be asked with options
    if (mentions(qa.question, qa.answer)) continue;
    const opposite = OPPOSITE[qa.answer.toLowerCase()];
    if (opposite) {
      // yes / no (true / false) answers: the other word is the only sensible wrong option
      const wrongText = /^\p{Ll}/u.test(qa.answer) ? opposite.toLowerCase() : opposite;
      const correctFirst = rnd() < 0.5;
      const options: [string, string][] = [[clip(qa.answer, 200), t("Yes — that is the answer in your notes.", "נכון — זו התשובה בפתקים שלכם.")], [wrongText, t("Your notes answer this question the other way round.", "הפתקים שלכם עונים על השאלה הזאת בכיוון ההפוך.")]];
      out.push({
        kind: "qa", objective: "questions", level: 1, keys: [qa.question.toLowerCase()],
        make: (id, level, objectiveId) => choice({
          id, level, objectiveId, options: correctFirst ? options : [options[1]!, options[0]!], correct: correctFirst ? 0 : 1,
          title: t("Answer the question", "ענו על השאלה"), concept: clip(qa.question, 60), prompt: question,
          hint: t("Think about what your notes say about it.", "חשבו מה הפתקים שלכם אומרים על זה."),
          explanation,
        }),
      });
      continue;
    }
    // wrong options: other answers of the same shape first, then terms or meanings from the notes
    const short = wordsOf(qa.answer).length <= 4;
    const fromQa = k.qa.filter((o) => o !== qa && o.value === undefined && !OPPOSITE[o.answer.toLowerCase()]).map((o) => ({ text: o.answer, about: o.question, rank: 0 }));
    const fromTerms = (short ? k.definitions.map((d) => ({ text: d.term, about: d.source, rank: 3 })) : k.definitions.map((d) => ({ text: d.meaning, about: d.source, rank: 3 })));
    const seen = new Set<string>([sameKey(qa.answer)]);
    const pool = [...fromQa, ...fromTerms].filter((x) => x.text.length <= 200 && !seen.has(sameKey(x.text)) && (seen.add(sameKey(x.text)), true) && !mentions(qa.question, x.text));
    const ranked = pool.sort((a, b) => a.rank + answerDistance(a.text, qa.answer) - (b.rank + answerDistance(b.text, qa.answer)) || a.text.localeCompare(b.text));
    const distractors = shuffled(ranked.slice(0, 5), rnd).slice(0, 3);
    if (distractors.length < 2) continue;
    const correctAt = Math.floor(rnd() * (distractors.length + 1));
    const options = distractors.map((d) => [clip(d.text, 200), d.rank === 0
      ? t(`That is the answer to a different question: “${clip(d.about, 110)}”`, `זו התשובה לשאלה אחרת: ״${clip(d.about, 110)}״`)
      : t("That answers a different question in your notes.", "זו תשובה לשאלה אחרת בפתקים שלכם.")] as [string, string]);
    options.splice(correctAt, 0, [clip(qa.answer, 200), t("Yes — that is the answer in your notes.", "נכון — זו התשובה בפתקים שלכם.")]);
    const key = distinctiveWord(qa.answer, distractors.map((d) => d.text));
    const lead = wordsOf(qa.answer).find((w) => !isStop(w.text))?.text ?? qa.answer;
    out.push({
      kind: "qa", objective: "questions", level: 1, keys: [qa.question.toLowerCase()],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: t("Answer the question", "ענו על השאלה"), concept: clip(qa.question, 60), prompt: question,
        hint: wordsOf(qa.answer).length === 1 || !key
          ? t(`The answer ${wordsOf(qa.answer).length > 1 ? "has a word that " : ""}starts with “${(wordsOf(qa.answer).length > 1 ? lead : qa.answer).charAt(0)}”.`, `${wordsOf(qa.answer).length > 1 ? "בתשובה יש מילה שמתחילה" : "התשובה מתחילה"} באות ״${(wordsOf(qa.answer).length > 1 ? lead : qa.answer).charAt(0)}״.`)
          : t(`The answer includes the word “${key}”.`, `בתשובה מופיעה המילה ״${key}״.`),
        explanation,
      }),
    });
  }
  return out;
}

// ───────────────────────────── selection ─────────────────────────────

const ROUND_ROBIN: ChallengeKind[] = ["qa", "steps", "timeline", "match", "number", "term", "define", "cloze", "factpick", "statement", "odd"];

export function generateChallenges(k: Knowledge, opts: GenerateOptions): Generated {
  const t = translator(opts.lang);
  const { rnd } = opts;
  const prefix = opts.idPrefix ?? "";

  // Fill-the-gap and true/false draw on prose sentences only (never on "term: meaning" lines, which read badly with a gap).
  const statements = k.prose;
  const ctx = buildContext(k.all);
  // every sentence of the notes: a "changed" sentence that matches one of them would be true after all
  const truths = new Set(k.all.map(sameKey));
  const pools: Record<ChallengeKind, Candidate[]> = {
    qa: qaCandidates(k, rnd, t),
    steps: stepCandidates(k.steps, k.stepTitles, t),
    timeline: timelineCandidates(k.facts, t),
    match: matchCandidates(k.definitions, t),
    number: numberCandidates(k.facts, k.qa, t),
    term: termCandidates(k.definitions, k.keywords, rnd, t),
    define: defineCandidates(k.definitions, rnd, t),
    cloze: clozeCandidates(statements, k.keywords, ctx, rnd, t),
    truefalse: trueFalseCandidates(statements, k.keywords, ctx, truths, rnd, t),
    factpick: factPickCandidates(k.facts, rnd, t),
    statement: statementCandidates(statements, k.facts, k.keywords, ctx, truths, rnd, t),
    odd: oddCandidates(k.definitions, rnd, t),
  };

  const chosen: Candidate[] = [];
  /** How often each piece of source material is already asked about (a match question counts half: it only pairs the terms up). */
  const uses = new Map<string, number>();
  const room = (c: Candidate, cap: number) => c.keys.every((key) => (uses.get(key) ?? 0) < cap);
  const take = (c: Candidate) => {
    c.keys.forEach((key) => uses.set(key, (uses.get(key) ?? 0) + (c.kind === "match" ? 0.5 : 1)));
    chosen.push(c);
  };
  // Pass 1 uses only unused source material; pass 2 asks about the same sentence or term a second time, in a different
  // way (a number as a gap and as a choice, a term and its reverse) — never a third time while the game has enough in it.
  // Pass 3 only rescues games that would otherwise be too small to play.
  for (const cap of [1, 2, 3, Infinity]) {
    if (cap === 3 && chosen.length >= Math.min(opts.max, 4)) break;
    if (cap === Infinity && chosen.length >= 3) break;
    let progressed = true;
    while (chosen.length < opts.max && progressed) {
      progressed = false;
      for (const kind of ROUND_ROBIN) {
        if (chosen.length >= opts.max) break;
        const i = pools[kind].findIndex((c) => room(c, cap));
        if (i < 0) continue;
        take(pools[kind].splice(i, 1)[0]!);
        progressed = true;
      }
    }
    if (chosen.length >= opts.max) break;
  }
  // True/false is the weakest kind (a swapped word is a thin "wrong" statement), so it only fills a game that is still small.
  const floor = Math.min(opts.max, 4);
  for (const c of pools.truefalse) {
    if (chosen.length >= floor) break;
    if (room(c, 2)) take(c);
  }

  // Easy before hard, and never two of the same kind in a row while another kind is still available.
  const remaining = chosen.map((c, i) => ({ c, i })).sort((a, b) => a.c.level - b.c.level || a.i - b.i).map((x) => x.c);
  const ordered: Candidate[] = [];
  let prev: ChallengeKind | null = null;
  while (remaining.length > 0) {
    const counts = new Map<ChallengeKind, number>();
    for (const c of remaining) counts.set(c.kind, (counts.get(c.kind) ?? 0) + 1);
    // a kind with more than half of what is left has to start now, or it will end up in a row at the end
    const crowded = [...counts].find(([kind, n]) => kind !== prev && n * 2 > remaining.length + 1)?.[0];
    const at = remaining.findIndex((c) => (crowded ? c.kind === crowded : c.kind !== prev));
    const [next] = remaining.splice(at < 0 ? 0 : at, 1);
    ordered.push(next!);
    prev = next!.kind;
  }
  const objText = OBJECTIVE_TEXT(t);
  const used = new Set<Objective>();
  const counts: Record<ChallengeKind, number> = { qa: 0, match: 0, term: 0, define: 0, cloze: 0, steps: 0, number: 0, truefalse: 0, factpick: 0, statement: 0, odd: 0, timeline: 0 };
  const challenges = ordered.map((c, i) => {
    used.add(c.objective);
    counts[c.kind]++;
    const level: Level = ordered.length >= 6 ? ((i < ordered.length / 3 ? 1 : i < (2 * ordered.length) / 3 ? 2 : 3) as Level) : c.level;
    return c.make(`${prefix}c-${i + 1}`, Math.max(level, c.kind === "steps" ? 2 : 1) as Level, `${prefix}o-${c.objective}`);
  });
  const variants: Raw[] = [];
  if (opts.variants) {
    const tooShort = (c: Raw) => c.type !== "choice" || ((c.options as unknown[] | undefined)?.length ?? 0) < 3;
    const orderings = challenges.filter((c) => c.type === "sequence" && ((c.items as unknown[] | undefined)?.length ?? 0) >= 4);
    const choices = challenges.filter((c) => !tooShort(c));
    // As many easier versions as before (the spec has room for 24 challenges, and an extension needs some): up to two of them
    // are for long orderings and the rest for multiple-choice questions.
    const total = Math.min(6, choices.length);
    const forOrderings = Math.min(2, orderings.length, total);
    for (const c of [...orderings.slice(0, forOrderings), ...choices.slice(0, total - forOrderings)]) {
      const easyId = `${String(c.id)}-easy`;
      const title = clip(`${String(c.title)} ${t("(easier)", "(קל יותר)")}`, 80);
      c.easierId = easyId;
      if (c.type === "sequence") {
        // a long list to put in order: the easier version keeps the first, a middle and the last (still in their order)
        const items = c.items as { id: string; text: string }[];
        variants.push({ ...c, id: easyId, level: 1, easierId: undefined, title, items: [0, Math.floor((items.length - 1) / 2), items.length - 1].map((i) => items[i]!) });
        continue;
      }
      const options = c.options as { id: string; text: string; feedback: string }[];
      const correct = options.find((o) => o.id === c.correctOptionId)!;
      const wrong = leastPlausible(correct, options.filter((o) => o.id !== c.correctOptionId), String(c.prompt));
      variants.push({ ...c, id: easyId, level: 1, easierId: undefined, title, options: options.indexOf(correct) < options.indexOf(wrong) ? [correct, wrong] : [wrong, correct] });
    }
  }
  const objectives = (["questions", "terms", "facts", "steps", "ideas"] as Objective[]).filter((o) => used.has(o)).map((o) => ({ id: `${prefix}o-${o}`, text: objText[o] }));
  const concepts = challenges.map((c) => String((c as { concept: string }).concept));
  return { challenges, variants, objectives, counts, kinds: ordered.map((c) => c.kind), concepts };
}
