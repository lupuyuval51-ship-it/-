/**
 * Build challenges from parsed knowledge. Six kinds, all extractive: every question, option and explanation is made of
 * the learner's own words (plus a few neutral scaffolding phrases in English or Hebrew), so nothing can be "wrong
 * facts" that the learner did not provide. The output is raw spec JSON that still goes through full validation.
 */
import { choice, match, numeric, sequence, translator, type Lang } from "../demo/builders";
import type { Definition, Fact, Keyword, Knowledge } from "./parse";
import { clip, shuffled, wordsOf } from "./text";

type Raw = Record<string, unknown>;
type Level = 1 | 2 | 3;
export type ChallengeKind = "qa" | "match" | "term" | "define" | "cloze" | "steps" | "number" | "truefalse";
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
  /** Titles of the concepts covered, in order (used for lore and the conclusion). */
  concepts: string[];
}

const OBJECTIVE_TEXT = (t: ReturnType<typeof translator>): Record<Objective, string> => ({
  questions: t("Answer the questions from your notes", "לענות על השאלות מהפתקים שלכם"),
  terms: t("Know the key terms of the topic", "להכיר את המושגים המרכזיים בנושא"),
  facts: t("Recall the key numbers and facts", "לזכור את המספרים והעובדות החשובים"),
  steps: t("Follow the process in the right order", "לפעול לפי התהליך בסדר הנכון"),
  ideas: t("Understand how the ideas fit together", "להבין איך הרעיונות מתחברים"),
});

const hasHebrew = (s: string) => /\p{Script=Hebrew}/u.test(s);

/** A rough stem, so "הצמח", "בצמח" and "צמחים" are recognised as the same word when picking wrong options. */
const stem = (w: string) => {
  const lower = w.toLowerCase();
  if (!hasHebrew(lower)) return lower.replace(/(?:ing|ed|es|s)$/, "");
  const noPrefix = lower.replace(/^[והבכלמש]{1,2}(?=\p{L}{3,})/u, "");
  return noPrefix.replace(/(?:ים|ות)$/u, "");
};
const sameWord = (a: string, b: string) => {
  const x = stem(a), y = stem(b);
  return x === y || (x.length >= 3 && y.includes(x)) || (y.length >= 3 && x.includes(y));
};

// ───────────────────────────── candidates ─────────────────────────────

function matchCandidates(defs: Definition[], t: ReturnType<typeof translator>): Candidate[] {
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
    if (group.length < 3) continue;
    out.push({
      kind: "match", objective: "terms", level: group.length > 4 ? 2 : 1, keys: group.map((d) => d.term.toLowerCase()),
      make: (id, level, objectiveId) => match({
        id, level, objectiveId,
        title: t("Match the terms", "התאימו את המושגים"),
        concept: clip(group.map((d) => d.term).join(", "), 60),
        prompt: t("Match each term to its description from your material.", "התאימו כל מושג להסבר שלו מתוך החומר שלכם."),
        pairs: group.map((d) => [clip(d.term, 90), clip(d.meaning, 140)] as [string, string]),
        hint: t("Start with the pair you are most sure about.", "התחילו מהזוג שאתם הכי בטוחים בו."),
        explanation: clip(group.map((d) => `${d.term}: ${d.meaning}`).join(" · "), 600),
      }),
    });
  }
  return out;
}

function termCandidates(defs: Definition[], keywords: Keyword[], rnd: () => number, t: ReturnType<typeof translator>): Candidate[] {
  const usable = defs.filter((d) => d.term.length <= 80 && d.meaning.length >= 8);
  if (usable.length < 2) return [];
  const out: Candidate[] = [];
  for (const d of usable) {
    // wrong options: the other terms first; with only a few terms, other notable words of the material fill in
    const otherTerms = shuffled(usable.filter((o) => o.term.toLowerCase() !== d.term.toLowerCase()), rnd)
      .sort((a, b) => Math.abs(wordsOf(a.term).length - wordsOf(d.term).length) - Math.abs(wordsOf(b.term).length - wordsOf(d.term).length))
      .map((o) => ({ text: o.term, why: t(`“${clip(o.term, 60)}” is described differently: ${clip(o.meaning, 120)}`, `״${clip(o.term, 60)}״ מוגדר אחרת: ${clip(o.meaning, 120)}`) }));
    const inMeaning = wordsOf(d.meaning).map((w) => w.text);
    const fillers = otherTerms.length >= 3 ? [] : keywords
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
        concept: clip(d.meaning, 60),
        prompt: t(`Which term matches this description from your material?\n“${clip(d.meaning, 300)}”`, `איזה מושג מתאים להסבר הזה מתוך החומר שלכם?\n״${clip(d.meaning, 300)}״`),
        hint: t(`It starts with “${first}”.`, `זה מתחיל באות ״${first}״.`),
        explanation: clip(d.source, 600),
      }),
    });
  }
  return out;
}

/** Titles rotate with the challenge number so a whole game does not repeat one heading. */
const TERM_TITLES: [string, string][] = [["Name the term", "איך קוראים לזה?"], ["Which concept is this?", "איזה מושג זה?"], ["Find the concept", "מצאו את המושג"]];
const DEFINE_TITLES: [string, string][] = [["What does it mean?", "מה זה אומר?"], ["Pick the right meaning", "בחרו את ההסבר הנכון"], ["Explain the term", "הסבירו את המושג"]];
function pick(titles: [string, string][], id: string, t: ReturnType<typeof translator>): string {
  const n = Number(id.replace(/\D+/g, "")) || 0;
  const [en, he] = titles[n % titles.length]!;
  return t(en, he);
}

/** The reverse of "term": the term is shown and the learner picks its meaning from the other meanings in the material. */
function defineCandidates(defs: Definition[], rnd: () => number, t: ReturnType<typeof translator>): Candidate[] {
  const usable = defs.filter((d) => d.term.length <= 60 && d.meaning.length >= 8 && d.meaning.length <= 160);
  if (usable.length < 3) return [];
  const out: Candidate[] = [];
  for (const d of usable) {
    const wrong = shuffled(usable.filter((o) => o.term.toLowerCase() !== d.term.toLowerCase() && o.meaning.toLowerCase() !== d.meaning.toLowerCase()), rnd).slice(0, 3);
    if (wrong.length < 2) continue;
    const correctAt = Math.floor(rnd() * (wrong.length + 1));
    const options = wrong.map((w) => [clip(w.meaning, 200), t(`That describes “${clip(w.term, 60)}”, not this term.`, `זה מתאר את ״${clip(w.term, 60)}״ ולא את המושג הזה.`)] as [string, string]);
    options.splice(correctAt, 0, [clip(d.meaning, 200), t("Yes — that is how your material describes it.", "נכון — כך החומר שלכם מתאר זאת.")]);
    const firstWord = d.meaning.trim().split(/\s+/)[0] ?? "";
    out.push({
      kind: "define", objective: "terms", level: 2, keys: [d.term.toLowerCase()],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: pick(DEFINE_TITLES, id, t),
        concept: clip(d.term, 60),
        prompt: t(`According to your material, what is “${clip(d.term, 80)}”?`, `לפי החומר שלכם, מהו ״${clip(d.term, 80)}״?`),
        hint: t(`The right description starts with “${firstWord}”.`, `ההסבר הנכון מתחיל במילה ״${firstWord}״.`),
        explanation: clip(d.source, 600),
      }),
    });
  }
  return out;
}

interface ClozePlan {
  sentence: string;
  target: Keyword;
  start: number;
  end: number;
}

/** The most informative word of a sentence (a name, a repeated term), or null when none stands out. */
function pickTarget(sentence: string, keywords: Map<string, Keyword>): ClozePlan | null {
  let best: { score: number; w: { text: string; start: number; end: number }; k: Keyword } | null = null;
  const words = wordsOf(sentence);
  const times = new Map<string, number>();
  for (const w of words) times.set(w.text.toLowerCase(), (times.get(w.text.toLowerCase()) ?? 0) + 1);
  words.forEach((w, idx) => {
    const k = keywords.get(w.text.toLowerCase());
    // a word that appears twice in the sentence would still be visible after blanking one of them
    if (!k || idx === 0 || (times.get(k.lower) ?? 0) > 1) return;
    const score = (k.proper ? 3 : 0) + Math.min(2, k.count - 1) + Math.min(2, w.text.length / 6);
    if (!best || score > best.score) best = { score, w, k };
  });
  const b = best as { score: number; w: { text: string; start: number; end: number }; k: Keyword } | null;
  return b ? { sentence, target: { ...b.k, text: b.w.text }, start: b.w.start, end: b.w.end } : null;
}

function distractorsFor(plan: ClozePlan, pool: Keyword[], rnd: () => number, n = 3): Keyword[] {
  const inSentence = new Set(wordsOf(plan.sentence).map((w) => w.text.toLowerCase()));
  const t = plan.target;
  const last = (w: string) => w.slice(-1).toLowerCase();
  const fits = pool
    .filter((k) => k.lower !== t.lower && !inSentence.has(k.lower) && !sameWord(k.text, t.text) && !wordsOf(plan.sentence).some((w) => sameWord(k.text, w.text)))
    .filter((k) => hasHebrew(k.text) === hasHebrew(t.text));
  // The best wrong options look like the right one: same kind of word (name vs common word), similar length and
  // ending (plural, -ing, -ed…), and topical (used more than once in the material).
  const score = (k: Keyword) => (k.proper === t.proper ? 0 : 10) + (last(k.text) === last(t.text) ? 0 : 3) + Math.abs(k.text.length - t.text.length) * 0.7 - Math.min(k.count, 3) * 0.8;
  const ranked = fits.sort((a, b) => score(a) - score(b) || a.lower.localeCompare(b.lower));
  return shuffled(ranked.slice(0, n + 3), rnd).slice(0, n).concat(ranked.slice(n + 3, n + 3)).slice(0, n);
}

function clozeCandidates(sentences: string[], keywords: Keyword[], rnd: () => number, t: ReturnType<typeof translator>): Candidate[] {
  const map = new Map(keywords.map((k) => [k.lower, k]));
  const out: Candidate[] = [];
  const usedTargets = new Set<string>();
  for (const s of sentences) {
    const plan = pickTarget(s, map);
    if (!plan || usedTargets.has(plan.target.lower)) continue;
    const distractors = distractorsFor(plan, keywords, rnd);
    if (distractors.length < 3) continue;
    usedTargets.add(plan.target.lower);
    const blanked = `${s.slice(0, plan.start)}_____${s.slice(plan.end)}`;
    const correctAt = Math.floor(rnd() * 4);
    const options = distractors.map((d) => [d.text, t(`“${d.text}” does not fit here — re-read the sentence in your material.`, `״${d.text}״ לא מתאים כאן — קראו שוב את המשפט בחומר שלכם.`)] as [string, string]);
    options.splice(correctAt, 0, [plan.target.text, t("Yes — that is how your material puts it.", "נכון — כך החומר שלכם מנסח זאת.")]);
    out.push({
      kind: "cloze", objective: "ideas", level: 2, keys: [s],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: t("Fill the gap", "השלימו את החסר"),
        concept: t("main ideas", "רעיונות מרכזיים"),
        prompt: t(`Which word completes this sentence from your material?\n“${blanked}”`, `איזו מילה משלימה את המשפט הזה מתוך החומר שלכם?\n״${blanked}״`),
        hint: t(`The missing word has ${plan.target.text.length} letters.`, `במילה החסרה יש ${plan.target.text.length} אותיות.`),
        explanation: clip(s, 600),
      }),
    });
  }
  return out;
}

function trueFalseCandidates(sentences: string[], keywords: Keyword[], rnd: () => number, t: ReturnType<typeof translator>): Candidate[] {
  const map = new Map(keywords.map((k) => [k.lower, k]));
  const out: Candidate[] = [];
  let n = 0;
  for (const s of sentences) {
    const plan = pickTarget(s, map);
    if (!plan) continue;
    const swap = distractorsFor(plan, keywords, rnd, 1)[0];
    const makeFalse = n++ % 2 === 1 && Boolean(swap);
    const statement = makeFalse ? `${s.slice(0, plan.start)}${swap!.text}${s.slice(plan.end)}` : s;
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

function stepCandidates(groups: string[][], t: ReturnType<typeof translator>): Candidate[] {
  return groups.map((items, g) => {
    const first = items[0]!.split(/\s+/).slice(0, 4).join(" ");
    return {
      kind: "steps" as const, objective: "steps" as const, level: (items.length >= 5 ? 3 : 2) as Level, keys: [`steps-${g}`],
      make: (id: string, level: Level, objectiveId: string) => sequence({
        id, level, objectiveId, items,
        title: t("Put the steps in order", "סדרו את השלבים"),
        concept: t("order of the steps", "סדר השלבים"),
        prompt: t("Put these steps from your material in the right order.", "סדרו את השלבים האלה מתוך החומר שלכם בסדר הנכון."),
        hint: t(`The first step starts with “${first}…”.`, `השלב הראשון מתחיל ב״${first}…״.`),
        explanation: clip(items.map((x, i) => `${i + 1}. ${x}`).join("  "), 600),
      }),
    };
  });
}

function numberCandidates(facts: Fact[], t: ReturnType<typeof translator>): Candidate[] {
  return facts.map((f) => {
    const digits = String(Math.trunc(Math.abs(f.value))).length;
    return {
      kind: "number" as const, objective: "facts" as const, level: 2 as Level, keys: [f.source],
      make: (id: string, level: Level, objectiveId: string) => numeric({
        id, level, objectiveId, answer: f.value,
        tolerance: f.decimals > 0 ? 0.5 * 10 ** -f.decimals : 0,
        mistakes: !f.isYear && f.value !== 0 && Number.isFinite(f.value * 10) ? [[f.value * 10, t("That is ten times too big — check the size of the number in your material.", "זה גדול פי עשרה — בדקו את גודל המספר בחומר שלכם.")]] : [],
        title: t("Find the number", "מצאו את המספר"),
        concept: clip(f.blanked.replace("___", "…"), 60),
        prompt: t(`Which number is missing from this sentence in your material?\n“${f.blanked}”`, `איזה מספר חסר במשפט הזה מתוך החומר שלכם?\n״${f.blanked}״`),
        hint: f.decimals > 0 ? t(`It has ${f.decimals} decimal place${f.decimals === 1 ? "" : "s"}.`, `יש בו ${f.decimals} ספרות אחרי הנקודה.`) : t(`It is a ${digits}-digit number.`, `זה מספר בן ${digits} ספרות.`),
        explanation: clip(f.source, 600),
      }),
    };
  });
}

function qaCandidates(k: Knowledge, rnd: () => number, t: ReturnType<typeof translator>): Candidate[] {
  const out: Candidate[] = [];
  const words = (s: string) => wordsOf(s).length;
  for (const qa of k.qa) {
    const question = clip(qa.question, 560);
    if (qa.value !== undefined) {
      const unit = qa.answer.replace(/^[-−]?[\d,]+(?:\.\d+)?\s*/u, "").trim();
      out.push({
        kind: "qa", objective: "questions", level: 2, keys: [qa.question.toLowerCase()],
        make: (id, level, objectiveId) => numeric({
          id, level, objectiveId, answer: qa.value!, tolerance: qa.decimals > 0 ? 0.5 * 10 ** -qa.decimals : 0,
          ...(unit && unit.length <= 12 ? { unit } : {}),
          title: t("Answer the question", "ענו על השאלה"), concept: clip(qa.question, 60), prompt: question,
          hint: t("The answer is a number — look for it in your notes.", "התשובה היא מספר — חפשו אותו בפתקים שלכם."),
          explanation: clip(`${qa.question} ${qa.answer}`, 600),
        }),
      });
      continue;
    }
    // wrong options: other answers of the same shape first, then terms or meanings from the notes
    const short = words(qa.answer) <= 4;
    const pool = [
      ...k.qa.filter((o) => o !== qa && o.value === undefined).map((o) => o.answer),
      ...(short ? k.definitions.map((d) => d.term) : k.definitions.map((d) => d.meaning)),
    ].filter((x, i, arr) => x.toLowerCase() !== qa.answer.toLowerCase() && arr.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i && x.length <= 200);
    const ranked = pool.sort((a, b) => Math.abs(words(a) - words(qa.answer)) - Math.abs(words(b) - words(qa.answer)) || a.localeCompare(b));
    const distractors = shuffled(ranked.slice(0, 5), rnd).slice(0, 3);
    if (distractors.length < 2) continue;
    const correctAt = Math.floor(rnd() * (distractors.length + 1));
    const options = distractors.map((d) => [clip(d, 200), t("That answers a different question in your notes.", "זו תשובה לשאלה אחרת בפתקים שלכם.")] as [string, string]);
    options.splice(correctAt, 0, [clip(qa.answer, 200), t("Yes — that is the answer in your notes.", "נכון — זו התשובה בפתקים שלכם.")]);
    out.push({
      kind: "qa", objective: "questions", level: 1, keys: [qa.question.toLowerCase()],
      make: (id, level, objectiveId) => choice({
        id, level, objectiveId, options, correct: correctAt,
        title: t("Answer the question", "ענו על השאלה"), concept: clip(qa.question, 60), prompt: question,
        hint: t(`The answer starts with “${qa.answer.charAt(0)}”.`, `התשובה מתחילה ב״${qa.answer.charAt(0)}״.`),
        explanation: clip(`${qa.question} ${qa.answer}`, 600),
      }),
    });
  }
  return out;
}

// ───────────────────────────── selection ─────────────────────────────

const ROUND_ROBIN: ChallengeKind[] = ["qa", "steps", "match", "number", "term", "define", "cloze"];

export function generateChallenges(k: Knowledge, opts: GenerateOptions): Generated {
  const t = translator(opts.lang);
  const { rnd } = opts;
  const prefix = opts.idPrefix ?? "";

  // Fill-the-gap and true/false draw on prose sentences only (never on "term: meaning" lines, which read badly with a gap).
  const statements = k.prose;
  const pools: Record<ChallengeKind, Candidate[]> = {
    qa: qaCandidates(k, rnd, t),
    steps: stepCandidates(k.steps, t),
    match: matchCandidates(k.definitions, t),
    number: numberCandidates(k.facts, t),
    term: termCandidates(k.definitions, k.keywords, rnd, t),
    define: defineCandidates(k.definitions, rnd, t),
    cloze: clozeCandidates(statements, k.keywords, rnd, t),
    truefalse: trueFalseCandidates(statements, k.keywords, rnd, t),
  };

  const chosen: Candidate[] = [];
  const usedKeys = new Set<string>();
  // Pass 1 uses only unused source material; pass 2 relaxes that so short materials still make a game.
  for (const strict of [true, false]) {
    let progressed = true;
    while (chosen.length < opts.max && progressed) {
      progressed = false;
      for (const kind of ROUND_ROBIN) {
        if (chosen.length >= opts.max) break;
        const i = pools[kind].findIndex((c) => !strict || c.keys.every((key) => !usedKeys.has(key)));
        if (i < 0) continue;
        const [c] = pools[kind].splice(i, 1);
        c!.keys.forEach((key) => usedKeys.add(key));
        chosen.push(c!);
        progressed = true;
      }
    }
    if (chosen.length >= opts.max) break;
  }
  // True/false is the weakest kind (a swapped word is a thin "wrong" statement), so it only fills a game that is still small.
  const floor = Math.min(opts.max, 4);
  for (const c of pools.truefalse) {
    if (chosen.length >= floor) break;
    chosen.push(c);
  }

  // Variety first: never two of the same kind in a row while another kind is still available.
  const byKind = new Map<ChallengeKind, Candidate[]>();
  for (const c of chosen) byKind.set(c.kind, [...(byKind.get(c.kind) ?? []), c]);
  const ordered: Candidate[] = [];
  let prev: ChallengeKind | null = null;
  while (ordered.length < chosen.length) {
    const next = [...byKind.entries()].filter(([kind, list]) => list.length > 0 && kind !== prev).sort((a, b) => b[1].length - a[1].length)[0] ?? [...byKind.entries()].find(([, list]) => list.length > 0)!;
    ordered.push(next[1].shift()!);
    prev = next[0];
  }
  const objText = OBJECTIVE_TEXT(t);
  const used = new Set<Objective>();
  const counts: Record<ChallengeKind, number> = { qa: 0, match: 0, term: 0, define: 0, cloze: 0, steps: 0, number: 0, truefalse: 0 };
  const challenges = ordered.map((c, i) => {
    used.add(c.objective);
    counts[c.kind]++;
    const level: Level = ordered.length >= 6 ? ((i < ordered.length / 3 ? 1 : i < (2 * ordered.length) / 3 ? 2 : 3) as Level) : c.level;
    return c.make(`${prefix}c-${i + 1}`, Math.max(level, c.kind === "steps" ? 2 : 1) as Level, `${prefix}o-${c.objective}`);
  });
  const variants: Raw[] = [];
  if (opts.variants) {
    for (const c of challenges) {
      const options = c.options as { id: string; text: string; feedback: string }[] | undefined;
      if (c.type !== "choice" || !options || options.length < 3 || variants.length >= 6) continue;
      const correct = options.find((o) => o.id === c.correctOptionId)!;
      const wrong = options.find((o) => o.id !== c.correctOptionId)!;
      const easyId = `${String(c.id)}-easy`;
      c.easierId = easyId;
      variants.push({
        ...c, id: easyId, level: 1, easierId: undefined,
        title: clip(`${String(c.title)} ${t("(easier)", "(קל יותר)")}`, 80),
        options: options.indexOf(correct) < options.indexOf(wrong) ? [correct, wrong] : [wrong, correct],
      });
    }
  }
  const objectives = (["questions", "terms", "facts", "steps", "ideas"] as Objective[]).filter((o) => used.has(o)).map((o) => ({ id: `${prefix}o-${o}`, text: objText[o] }));
  const concepts = challenges.map((c) => String((c as { concept: string }).concept));
  return { challenges, variants, objectives, counts, concepts };
}
