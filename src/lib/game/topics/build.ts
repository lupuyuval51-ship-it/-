/**
 * Topic library → game. Deterministic and model-free: the player picks a curated topic and a level, and the game is
 * composed from that topic's fact-checked content for that level only (beginner = core terms and simple facts,
 * intermediate = relationships, examples and numbers, advanced = reasoning and multi-step items). While playing, the
 * game adapts further: two misses in a row serve an easier two-option version, a streak serves a harder version with
 * more options. The raw spec still goes through `validateGameSpec`, the feature-tier clamp and the phone fit.
 *
 * Honest provenance: the result is labelled "Topic library (not AI)"; nothing here is presented as AI output.
 */
import { SPEC_LIMITS, type Environment, type SubjectCategory, type TimeOfDay } from "../spec/constants";
import { challengeStation, choice, loreStation, match, npc, numeric, sequence, translator, type Lang, type Tr } from "../builders";
import { clip, distinctStart, startHintText } from "../material/text";
import { hashSeed, mulberry32 } from "../util/prng";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { LEVEL_KEY, type LevelContent, type QText, type Term, type TopicCategory, type TopicContent, type TopicEntry } from "./types";

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Level = 1 | 2 | 3;

export class TopicError extends Error {
  constructor(public readonly code: "UNKNOWN_TOPIC" | "TOO_LITTLE", message: string) {
    super(message);
    this.name = "TopicError";
  }
}

// ───────────────────────────── world flavour ─────────────────────────────

const SPEC_CATEGORY: Record<TopicCategory, SubjectCategory> = {
  math: "math", science: "science", history: "history", geography: "other", languages: "language",
  computing: "programming", economy: "other", health: "science", arts: "other", thinking: "other",
};

const ENV_BY_CATEGORY: Record<TopicCategory, Environment> = {
  math: "castle", science: "laboratory", history: "desert-ruins", geography: "sky-islands", languages: "forest",
  computing: "neon-city", economy: "neon-city", health: "laboratory", arts: "castle", thinking: "sky-islands",
};

interface Flavour { station: [string, string]; guide: [string, string]; color: string; shape: "robot" | "human" | "creature" | "orb"; place: [string, string]; time: TimeOfDay; gem: "gem" | "data-core" | "star" | "leaf" | "coin" }

const FLAVOUR: Record<Environment, Flavour> = {
  "neon-city": { station: ["Terminal", "מסוף"], guide: ["Byte", "בייט"], color: "#22e6ff", shape: "robot", place: ["Knowledge Plaza", "כיכר הידע"], time: "night", gem: "data-core" },
  forest: { station: ["Signpost", "שלט דרך"], guide: ["Sol", "סול"], color: "#ffc63d", shape: "human", place: ["Knowledge Clearing", "קרחת הידע"], time: "day", gem: "leaf" },
  "space-station": { station: ["Console", "לוח בקרה"], guide: ["Nova", "נובה"], color: "#a3ff4f", shape: "orb", place: ["Knowledge Deck", "סיפון הידע"], time: "night", gem: "star" },
  "desert-ruins": { station: ["Tablet", "לוח אבן"], guide: ["Nefer", "נפר"], color: "#f59e0b", shape: "human", place: ["Hall of Ages", "אולם הדורות"], time: "day", gem: "coin" },
  "ocean-floor": { station: ["Shell", "צדף"], guide: ["Coral", "קורל"], color: "#ff7b9c", shape: "creature", place: ["Knowledge Reef", "שונית הידע"], time: "day", gem: "gem" },
  laboratory: { station: ["Console", "לוח בקרה"], guide: ["Dr. Spark", "ד״ר ניצוץ"], color: "#2fd98a", shape: "human", place: ["Discovery Lab", "מעבדת הגילויים"], time: "day", gem: "gem" },
  castle: { station: ["Rune", "רונה"], guide: ["Count Sage", "הרוזן החכם"], color: "#f2c14e", shape: "human", place: ["Hall of Knowledge", "אולם הידע"], time: "dusk", gem: "coin" },
  "sky-islands": { station: ["Cloud marker", "סמן ענן"], guide: ["Zephyr", "זפיר"], color: "#ff7ab6", shape: "creature", place: ["Island of Ideas", "אי הרעיונות"], time: "day", gem: "star" },
};

// ───────────────────────────── helpers ─────────────────────────────

const sameKey = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, " ").trim();
const NUMBERISH = /^[-−\d.,/\s%]+$/;

function shuffled<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** "3", "-2.5", "1,200", "3/4", "1 1/2" or "40%" as a number (NaN for anything else). */
export function numberValue(text: string): number {
  const s = text.replace(/[,%\s]+$/g, "").replace(/−/g, "-").trim();
  const mixed = /^(-?\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (mixed) return Number(mixed[1]) + Math.sign(Number(mixed[1]) || 1) * (Number(mixed[2]) / Number(mixed[3]));
  const frac = /^(-?\d+)\/(\d+)$/.exec(s);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const plain = s.replace(/,(?=\d{3}\b)/g, "");
  return /^-?\d+(?:\.\d+)?$/.test(plain) ? Number(plain) : NaN;
}

/** Options with the right answer at a seeded position; options that are all numbers stay in ascending order. */
function arrange(right: [string, string], wrong: [string, string][], rnd: () => number): { options: [string, string][]; correct: number } {
  const all = [right, ...wrong];
  if (all.every(([text]) => NUMBERISH.test(text) && !Number.isNaN(numberValue(text)))) {
    const sorted = [...all].sort((a, b) => numberValue(a[0]) - numberValue(b[0]));
    return { options: sorted, correct: sorted.indexOf(right) };
  }
  const at = Math.floor(rnd() * all.length);
  const options = [...wrong];
  options.splice(at, 0, right);
  return { options, correct: at };
}

/**
 * A range that contains the answer without giving it away ("between 40 and 50"). The answer is never one of the bounds
 * (except 0, the natural lower bound of "between 0 and 10"): a round answer such as 90 or 3600 would otherwise always be
 * the lower bound ("between 90 and 100") and the hint would hand it over, so it gets a window three steps wide that is
 * not centred on it either ("between 80 and 110", "between 3400 and 3700").
 */
export function rangeHint(answer: number, t: Tr, unit: string): string {
  const a = Math.abs(answer);
  const digits = a >= 1 ? Math.floor(Math.log10(a)) : 0;
  const step = a < 10 ? (Number.isInteger(answer) ? 10 : 1) : 10 ** (digits >= 2 ? digits - 1 : digits);
  let lo: number, hi: number;
  if (a < 10 && Number.isInteger(answer)) { lo = answer < 0 ? -10 : 0; hi = answer < 0 ? 0 : 10; }
  else if (a % step === 0) {
    const k = a / step;
    const from = (k % 2 ? k - 1 : k - 2) * step; // odd k: one step below it, even k: two (so pairs of round answers share a window)
    [lo, hi] = answer < 0 ? [-(from + 3 * step), -from] : [from, from + 3 * step];
  } else { lo = Math.floor(answer / step) * step; hi = lo + step; }
  const u = unit ? ` ${unit}` : "";
  // "ל-" in front of a negative number would read "ל--20"
  return t(`The answer is between ${lo} and ${hi}${u}.`, hi < 0 ? `התשובה בין ${lo} לבין ${hi}${u}.` : `התשובה בין ${lo} ל-${hi}${u}.`);
}

/** A text as the end of a sentence: a full stop is added unless it already ends with one, or with ?, !, … or the colon of a line of code. */
const asSentence = (s: string): string => (/[.!?…:]\s*$/.test(s) ? s.trimEnd() : `${s}.`);

interface Candidate {
  kind: "q" | "name" | "define" | "n" | "s" | "match";
  objective: "terms" | "apply" | "numbers" | "order";
  make(id: string, level: Level, objectiveId: string): { base: Raw; easier?: Raw; harder?: Raw };
}

const RIGHT_FEEDBACK: [string, string] = ["Correct!", "נכון!"];
const WRONG_FEEDBACK: [string, string] = ["Not this one — think again.", "לא זו התשובה — חשבו שוב."];

/**
 * The two-option warm-up of a choice question: the right option and the wrong option whose text is `keep` (the one
 * easiest to rule out). Found by its text, not its place: options that are all numbers are shown in ascending order,
 * so the place of a wrong option says nothing about which one the content lists last.
 */
function easierOf(base: Raw, keep: string, t: Tr): Raw {
  const options = base.options as { id: string; text: string; feedback: string }[];
  const right = options.find((o) => o.id === base.correctOptionId)!;
  const wrong = options.find((o) => o !== right && o.text === keep) ?? options.find((o) => o !== right)!;
  const kept = options.indexOf(right) < options.indexOf(wrong) ? [right, wrong] : [wrong, right];
  const { hint: _h, easierId: _e, harderId: _x, ...rest } = base;
  return {
    ...rest, id: `${base.id}-easy`, level: 1, title: clip(`${base.title} ${t("(easier)", "(קל יותר)")}`, 80),
    options: kept.map((o, i) => ({ ...o, id: "ab"[i]! })), correctOptionId: "ab"[kept.indexOf(right)]!,
  };
}

// ───────────────────────────── candidates ─────────────────────────────

function questionCandidates(level: LevelContent, lang: Lang, t: Tr, rnd: () => number, concept: string): Candidate[] {
  return (level.q ?? []).map((pair) => {
    const [q, answer, wrongs, explanation, hint] = (lang === "he" ? pair[1] : pair[0]) as QText;
    return {
      kind: "q", objective: "apply",
      make: (id, lvl, objectiveId) => {
        const shown = wrongs.slice(0, 3);
        const { options, correct } = arrange([answer, t(...RIGHT_FEEDBACK)], shown.map((w) => [w, t(...WRONG_FEEDBACK)] as [string, string]), rnd);
        const autoHint = shown.length >= 2 ? t(`You can rule out “${shown[shown.length - 1]}”.`, `אפשר לפסול את ״${shown[shown.length - 1]}״.`) : undefined;
        const base = choice({ id, level: lvl, objectiveId, title: t("Question", "שאלה"), concept, prompt: q, options, correct, hint: hint ?? autoHint, explanation });
        const out: { base: Raw; easier?: Raw; harder?: Raw } = { base };
        if (shown.length >= 2) out.easier = easierOf(base, shown[shown.length - 1]!, t);
        if (wrongs.length >= 4) {
          const more = arrange([answer, t(...RIGHT_FEEDBACK)], wrongs.slice(0, 4).map((w) => [w, t(...WRONG_FEEDBACK)] as [string, string]), rnd);
          out.harder = choice({ id: `${id}-hard`, level: 3, objectiveId, title: t("Question (challenge)", "שאלה (אתגר)"), concept, prompt: q, ...more, hint: hint ?? autoHint, explanation });
        }
        return out;
      },
    };
  });
}

/** Wrong options for a term question: other terms of the same level first, then of the rest of the topic. */
function otherTerms(term: Term, own: readonly Term[], all: readonly Term[], lang: Lang, rnd: () => number): Term[] {
  const key = (x: Term) => sameKey(lang === "he" ? x[2] : x[0]);
  const meaningKey = (x: Term) => sameKey(lang === "he" ? x[3] : x[1]);
  const seen = new Set([key(term)]);
  const seenMeaning = new Set([meaningKey(term)]);
  const out: Term[] = [];
  for (const x of [...shuffled(own, rnd), ...shuffled(all, rnd)]) {
    if (seen.has(key(x)) || seenMeaning.has(meaningKey(x))) continue;
    seen.add(key(x));
    seenMeaning.add(meaningKey(x));
    out.push(x);
  }
  return out;
}

/** Every other term is asked by its description ("name"), the rest by the term ("define"); `swap` exchanges the two halves. */
function termCandidates(level: LevelContent, all: readonly Term[], lang: Lang, t: Tr, rnd: () => number, swap = false): { name: Candidate[]; define: Candidate[] } {
  const own = level.t ?? [];
  const pick = (x: Term): [string, string] => (lang === "he" ? [x[2], x[3]] : [x[0], x[1]]);
  const name: Candidate[] = [];
  const define: Candidate[] = [];
  own.forEach((term, i) => {
    const [word, meaning] = pick(term);
    const others = otherTerms(term, own, all, lang, rnd);
    if (others.length < 2) return;
    if ((i + (swap ? 1 : 0)) % 2 === 0) {
      name.push({
        kind: "name", objective: "terms",
        make: (id, lvl, objectiveId) => {
          const wrong = (n: number) => others.slice(0, n).map((o) => { const [w, m] = pick(o); return [w, t(`“${w}” means: ${asSentence(m)}`, `המושג ״${w}״ פירושו: ${asSentence(m)}`)] as [string, string]; });
          const right: [string, string] = [word, t(...RIGHT_FEEDBACK)];
          const a = arrange(right, wrong(3), rnd);
          const prompt = t(`Which term matches this description?\n“${meaning}”`, `איזה מושג מתאים לתיאור הזה?\n״${meaning}״`);
          // the start of the word only helps when no wrong option starts the same way
          const start = distinctStart(word, a.options.filter((_, i) => i !== a.correct).map((o) => o[0]));
          const hint = start ? startHintText(start, t, "prefix") : t(`It is not “${wrong(1)[0]![0]}”.`, `זה לא ״${wrong(1)[0]![0]}״.`);
          const explanation = clip(asSentence(`${word}: ${meaning}`), 600);
          const base = choice({ id, level: lvl, objectiveId, title: t("Name the term", "איך קוראים לזה?"), concept: t("Key terms", "מושגי מפתח"), prompt, ...a, hint, explanation });
          const out: { base: Raw; easier?: Raw; harder?: Raw } = { base, easier: easierOf(base, pick(others[Math.min(2, others.length - 1)]!)[0], t) };
          if (others.length >= 4) out.harder = choice({ id: `${id}-hard`, level: 3, objectiveId, title: t("Name the term (challenge)", "איך קוראים לזה? (אתגר)"), concept: t("Key terms", "מושגי מפתח"), prompt, ...arrange(right, wrong(4), rnd), explanation });
          return out;
        },
      });
    } else {
      define.push({
        kind: "define", objective: "terms",
        make: (id, lvl, objectiveId) => {
          // Meanings differ a lot in length, and a right answer that is the only long one gives itself away: of the first few
          // candidates, the ones closest in length to the right meaning are shown (the least alike comes last, as the hint).
          const near = others.slice(0, 6).map((o) => pick(o)).sort((x, y) => Math.abs(x[1].length - meaning.length) - Math.abs(y[1].length - meaning.length));
          const wrong = near.slice(0, 3).map(([w, m]) => [m, t(`That describes “${w}”.`, `זה מתאר את ״${w}״.`)] as [string, string]);
          const a = arrange([meaning, t(...RIGHT_FEEDBACK)], wrong, rnd);
          const base = choice({
            id, level: lvl, objectiveId, title: t("What does it mean?", "מה זה אומר?"), concept: clip(word, 60),
            prompt: t(`What does “${word}” mean?`, `מה פירוש ״${word}״?`), ...a,
            hint: t(`It is not: “${clip(wrong[wrong.length - 1]![0], 120)}”.`, `זה לא: ״${clip(wrong[wrong.length - 1]![0], 120)}״.`),
            explanation: clip(asSentence(`${word}: ${meaning}`), 600),
          });
          return { base, easier: easierOf(base, wrong[wrong.length - 1]![0], t) };
        },
      });
    }
  });
  return { name, define };
}

function matchCandidate(terms: readonly Term[], lang: Lang, t: Tr): Candidate | null {
  const usable = terms.filter((x) => (lang === "he" ? x[2] : x[0]).length <= 90 && (lang === "he" ? x[3] : x[1]).length <= 140).slice(0, 5);
  if (usable.length < 3) return null;
  const pairs = usable.map((x) => (lang === "he" ? [x[2], x[3]] : [x[0], x[1]]) as [string, string]);
  return {
    kind: "match", objective: "terms",
    make: (id, lvl, objectiveId) => ({
      base: match({
        id, level: lvl, objectiveId, title: t("Match the terms", "התאימו את המושגים"), concept: t("Key terms", "מושגי מפתח"),
        prompt: t("Match each term to its meaning.", "התאימו כל מושג לפירוש שלו."), pairs,
        hint: t(`One pair to start with: “${pairs[0]![0]}” — ${clip(pairs[0]![1], 120)}`, `זוג אחד להתחלה: ״${pairs[0]![0]}״ — ${clip(pairs[0]![1], 120)}`),
        explanation: clip(pairs.map(([a, b]) => `${a}: ${b}`).join(" · "), 600),
      }),
    }),
  };
}

function numberCandidates(level: LevelContent, lang: Lang, t: Tr, concept: string): Candidate[] {
  return (level.n ?? []).map(([answer, en, he, tolerance]) => {
    const [q, unit, explanation, hint] = lang === "he" ? he : en;
    return {
      kind: "n", objective: "numbers",
      make: (id, lvl, objectiveId) => ({
        base: numeric({
          id, level: lvl, objectiveId, title: t("Work it out", "חשבו"), concept, prompt: q, answer, tolerance: tolerance ?? 0,
          unit: unit || undefined, hint: hint ?? rangeHint(answer, t, unit), explanation,
        }),
      }),
    };
  });
}

/**
 * The prompt of an ordering. Most titles are a name ("The water cycle: put the steps in the right order."); a title that
 * is a whole sentence is not followed by a colon: a question gets the instruction as a sentence of its own, and an
 * instruction ("… Put the events in order.") is the prompt as it is.
 */
export function orderPrompt(title: string, t: Tr): string {
  if (/[.]\s*$/.test(title)) return title.trimEnd();
  if (/[?!…]\s*$/.test(title)) return `${title.trimEnd()} ${t("Put the steps in the right order.", "סדרו את השלבים בסדר הנכון.")}`;
  return t(`${title}: put the steps in the right order.`, `${title}: סדרו את השלבים בסדר הנכון.`);
}

function orderCandidates(level: LevelContent, lang: Lang, t: Tr): Candidate[] {
  return (level.s ?? []).map((pair) => {
    const [title, ...steps] = lang === "he" ? pair[1] : pair[0];
    return {
      kind: "s", objective: "order",
      make: (id, lvl, objectiveId) => {
        const base = sequence({
          id, level: lvl, objectiveId, title: t("Put in order", "סדרו לפי הסדר"), concept: clip(title!, 60),
          prompt: orderPrompt(title!, t), items: steps,
          hint: t(`The first one is “${clip(steps[0]!, 100)}”.`, `הראשון הוא ״${clip(steps[0]!, 100)}״.`),
          explanation: clip(steps.join(" → "), 600),
        });
        const out: { base: Raw; easier?: Raw } = { base };
        if (steps.length >= 4) {
          const items = base.items as { id: string; text: string }[];
          const { hint: _h, ...rest } = base;
          out.easier = { ...rest, id: `${id}-easy`, level: 1, title: clip(`${base.title} ${t("(easier)", "(קל יותר)")}`, 80), items: [0, Math.floor((items.length - 1) / 2), items.length - 1].map((i) => items[i]!) };
        }
        return out;
      },
    };
  });
}

// ───────────────────────────── selection ─────────────────────────────

const ROTATION: Candidate["kind"][] = ["name", "q", "n", "define", "s", "q", "match", "name", "q", "define", "n"];

/** Up to `max` candidates, rotating through the kinds so a game never feels like one long quiz of one kind. */
function select(pools: Record<Candidate["kind"], Candidate[]>, max: number, fast: boolean): Candidate[] {
  const chosen: Candidate[] = [];
  const queue = { ...pools, q: [...pools.q], name: [...pools.name], define: [...pools.define], n: [...pools.n], s: [...pools.s], match: fast ? [] : [...pools.match] };
  let progressed = true;
  while (chosen.length < max && progressed) {
    progressed = false;
    for (const kind of ROTATION) {
      if (chosen.length >= max) break;
      const next = queue[kind].shift();
      if (next) { chosen.push(next); progressed = true; }
    }
  }
  return chosen;
}

// ───────────────────────────── composition ─────────────────────────────

export interface TopicBuild {
  raw: Raw;
  notes: string[];
  stats: { placed: number; variants: number };
}

const OBJECTIVES = (t: Tr, title: string): Record<Candidate["objective"], string> => ({
  terms: t(`Know the key terms of ${title}`, `להכיר את מושגי המפתח של ${title}`),
  apply: t(`Use what you know about ${title} to answer questions`, `להשתמש במה שלמדתם על ${title} כדי לענות על שאלות`),
  numbers: t("Work out the numbers", "לחשב ולמצוא את המספרים"),
  order: t("Put processes and events in the right order", "לסדר תהליכים ואירועים בסדר הנכון"),
});

/** What the last mission asks to read: the hands-on task, the key ideas, or both (the second area of a course chapter has both). */
function endBoardsText(endBoards: string[], taskBoard: Raw | null, t: Tr): string {
  const task = taskBoard !== null && endBoards.includes(String(taskBoard.id));
  if (task && endBoards.length > 1) return t("Read the hands-on task and the key ideas", "קראו את המשימה המעשית ואת הרעיונות המרכזיים");
  return task ? t("Read the hands-on task", "קראו את המשימה המעשית") : t("Read the key ideas", "קראו את הרעיונות המרכזיים");
}

const BASE_LEVEL: Record<GenerationRequest["difficulty"], Level> = { beginner: 1, intermediate: 2, advanced: 3 };

export const topicTitle = (entry: TopicEntry, lang: Lang): string => (lang === "he" ? entry.he[0] : entry.en[0]);

/** How many of these games were built from `topicId` at `difficulty`: the `round` of the next game of that topic. */
export const topicRound = (games: readonly { templateId?: string; difficulty?: string }[], topicId: string, difficulty: string): number =>
  games.filter((g) => g.templateId === topicId && g.difficulty === difficulty).length;

/**
 * `round` is how many games of this topic at this level the learner already has (round 0 is the first game). A level often
 * holds more items than one game shows, so each next game starts each kind of question where the previous one stopped and
 * wraps around once all were shown; a kind shown in full comes in another order, every other game asks the terms the other
 * way round, and the options are drawn again.
 */
export function buildTopicSpec(req: GenerationRequest, entry: TopicEntry, content: TopicContent, round = 0): TopicBuild {
  const lang: Lang = req.contentLanguage === "he" ? "he" : "en";
  const t = translator(lang);
  const full = req.mode === "FULL";
  const levelContent = content[LEVEL_KEY[req.difficulty]];
  const title = topicTitle(entry, lang);
  const description = lang === "he" ? entry.he[1] : entry.en[1];
  const rnd = mulberry32(hashSeed(`${entry.id}|${req.difficulty}|${lang}|${req.mode}${round ? `|${round}` : ""}`));
  const allTerms = [...(content.b.t ?? []), ...(content.i.t ?? []), ...(content.a.t ?? [])];

  // the next game asks the other half of the terms by their description, and the first half by the term
  const terms = termCandidates(levelContent, allTerms, lang, t, rnd, round % 2 === 1);
  const pools: Record<Candidate["kind"], Candidate[]> = {
    q: questionCandidates(levelContent, lang, t, rnd, clip(title, 60)),
    name: terms.name,
    define: terms.define,
    n: numberCandidates(levelContent, lang, t, clip(title, 60)),
    s: orderCandidates(levelContent, lang, t),
    match: [matchCandidate(levelContent.t ?? [], lang, t)].filter((c): c is Candidate => c !== null),
  };
  const max = full ? 10 : 4;
  let picked = select(pools, max, !full);
  if (round > 0) {
    const shown = (kind: Candidate["kind"]) => picked.filter((c) => c.kind === kind).length;
    const turned = (list: Candidate[], by: number) => (list.length ? [...list.slice(by % list.length), ...list.slice(0, by % list.length)] : list);
    // a kind the first game showed in full comes in another order (so another question opens the game, and another closes it)
    const by = (kind: Candidate["kind"], list: Candidate[]) => (shown(kind) < list.length ? round * shown(kind) : round);
    picked = select(Object.fromEntries(Object.entries(pools).map(([kind, list]) => [kind, turned(list, by(kind as Candidate["kind"], list))])) as typeof pools, max, !full);
  }
  if (picked.length < 3) throw new TopicError("TOO_LITTLE", `topic ${entry.id} has too little content at ${req.difficulty}`);

  const base = BASE_LEVEL[req.difficulty];
  const challenges: Raw[] = [];
  const variants: Raw[] = [];
  let easier = 0, harder = 0;
  picked.forEach((c, i) => {
    // the game rises within the chosen level: a gentle start, the level itself, and a harder finish
    const third = i < picked.length / 3 ? -1 : i >= (2 * picked.length) / 3 ? 1 : 0;
    const lvl = Math.min(3, Math.max(1, base + (full ? third : third > 0 ? 1 : 0))) as Level;
    const made = c.make(`c-${i + 1}`, lvl, `o-${c.objective}`);
    if (made.easier && easier < 6) { made.base.easierId = made.easier.id; variants.push(made.easier); easier++; }
    // a harder version is served after a streak of three, so the first three challenges never get one: on them it could
    // not be earned, yet the best score would count it, and a flawless player would miss three stars
    if (made.harder && harder < 3 && i >= 3) { made.base.harderId = made.harder.id; variants.push(made.harder); harder++; }
    challenges.push(made.base);
  });

  const env = entry.env ?? ENV_BY_CATEGORY[entry.cat];
  const f = FLAVOUR[env];
  const twoAreas = full && challenges.length >= 6;
  const groups = twoAreas ? [challenges.slice(0, Math.ceil(challenges.length / 2)), challenges.slice(Math.ceil(challenges.length / 2))] : [challenges];
  const keyIdeas = (levelContent.t ?? allTerms).slice(0, 3).map((x) => (lang === "he" ? `${x[2]} — ${x[3]}` : `${x[0]} — ${x[1]}`));
  const firstFact = keyIdeas[0] ?? description;
  // A course chapter teaches before it asks: its lesson boards stand in the first area and must be read before the
  // questions open; the hands-on task waits at the end. Boards only fill the room the area has left (stations per area).
  const lesson = content.l ? content.l[lang] : null;
  const lessonBoards: Raw[] = lesson
    ? [
        ...lesson.text.slice(0, 2).map((text, i) => loreStation(`s-1-lesson-${i + 1}`, lesson.text.length > 1 ? t(`Lesson · part ${i + 1}`, `השיעור · חלק ${i + 1}`) : t("The lesson", "השיעור"), clip(lesson.title, 70), clip(text, 420))),
        loreStation("s-1-example", t("Worked example", "דוגמה פתורה"), clip(lesson.title, 70), clip(lesson.example, 420)),
      ]
    : [];
  const taskBoard: Raw | null = lesson ? loreStation(`s-${groups.length}-task`, t("Try it yourself", "משימה מעשית"), clip(lesson.title, 70), clip(lesson.task, 420)) : null;

  const areas: Raw[] = [];
  const missions: Raw[] = [];
  let previous: string | undefined;
  groups.forEach((cs, gi) => {
    const index = gi + 1;
    const last = gi === groups.length - 1;
    const stations: Raw[] = cs.map((c, i) => challengeStation(`s-${index}-${i + 1}`, clip(`${t(...f.station)} ${i + 1}`, 40), String(c.id)));
    const room = () => SPEC_LIMITS.stationsPerArea - stations.length;
    const boards = gi === 0 ? lessonBoards.slice(0, Math.max(0, room() - (last && taskBoard ? 1 : 0))) : [];
    stations.unshift(...boards);
    if (last && taskBoard && room() > 0) stations.push(taskBoard);
    if (last && keyIdeas.length && room() > 0 && !(lesson && gi === 0 && boards.length)) stations.push(loreStation(`s-${index}-lore`, t("Key ideas", "רעיונות מרכזיים"), clip(title, 70), clip(keyIdeas.join(" · "), 420)));
    const area: Raw = {
      id: `a-${index}`, name: clip(gi === 0 ? t(...f.place) : `${t(...f.place)} · ${t("part 2", "חלק 2")}`, 60),
      description: clip(t(`Questions about “${title}” at the level you chose.`, `שאלות על ״${title}״ ברמה שבחרתם.`), 260),
      size: "medium", layout: (["plaza", "rooms", "corridor"] as const)[gi % 3], hazardLevel: "none",
      ...(gi === 0 ? { intro: clip(t(`Welcome to the topic library: ${title}. Follow the guide!`, `ברוכים הבאים לספריית הנושאים: ${title}. עקבו אחרי המדריך!`), 260) } : {}),
      stations,
      npcs: [npc(`n-${index}`, t(...f.guide), t("Your guide", "המדריך שלכם"), f.color, f.shape, boards.length
        ? [
            clip(t(`Welcome! Today's chapter: ${title}.`, `ברוכים הבאים! הפרק של היום: ${title}.`), 240),
            t("First read the lesson boards and the worked example. The questions open after that.", "קודם קראו את לוחות השיעור ואת הדוגמה הפתורה. אחר כך ייפתחו השאלות."),
            t("Stuck on a question? Read the lesson again, or ask for a hint — it costs a few points.", "תקועים בשאלה? קראו שוב את השיעור, או בקשו רמז — הוא עולה כמה נקודות."),
          ]
        : [
            clip(t(`Welcome! Today's topic: ${title}.`, `ברוכים הבאים! הנושא של היום: ${title}.`), 240),
            clip(t(`Something to remember: ${firstFact}`, `משהו שכדאי לזכור: ${firstFact}`), 240),
            t("Solve the challenges at the glowing stations. Stuck? Ask for a hint — it costs a few points.", "פתרו את האתגרים בתחנות הזוהרות. תקועים? בקשו רמז — הוא עולה כמה נקודות."),
          ], t("After every answer there is an explanation — read it, it is where the learning happens.", "אחרי כל תשובה יש הסבר — קראו אותו, שם קורה הלימוד."))],
      collectibles: { kind: f.gem, count: Math.min(5, Math.max(2, Math.ceil(cs.length * 0.7))), label: t("Knowledge gems", "אבני ידע") },
      ...(groups[gi + 1] ? { portal: { toAreaId: `a-${index + 1}`, label: t("Path to the next chapter", "הדרך לפרק הבא"), requiresMissionIds: [`m-${index}-2`] } } : {}),
    };
    areas.push(area);
    const ids = cs.map((c) => String(c.id));
    const half = Math.max(1, Math.ceil(ids.length / 2));
    const collect = Math.min(2, (area.collectibles as { count: number }).count);
    const endBoards = stations.filter((s) => s.kind === "lore" && !boards.includes(s)).map((s) => String(s.id));
    const m1 = `m-${index}-1`, m2 = `m-${index}-2`;
    if (boards.length) {
      // the lesson comes first: its mission opens the questions
      missions.push({
        id: `m-${index}-0`, title: t("Learn first", "קודם לומדים"), areaId: area.id, requires: previous ? [previous] : [],
        story: t("Meet your guide, read the lesson and the worked example.", "פגשו את המדריך, קראו את השיעור ואת הדוגמה הפתורה."),
        objectives: [
          { type: "talk", text: t("Talk to your guide", "דברו עם המדריך"), npcId: `n-${index}` },
          { type: "visit", text: t("Read the lesson and the worked example", "קראו את השיעור ואת הדוגמה הפתורה"), stationIds: boards.map((b) => String(b.id)) },
        ],
      });
      previous = `m-${index}-0`;
    }
    missions.push(
      {
        id: m1, title: t("Warm up", "חימום"), areaId: area.id, requires: previous ? [previous] : [],
        story: boards.length
          ? t("Use what the lesson taught you on the first questions.", "השתמשו במה שלמדתם בשיעור כדי לענות על השאלות הראשונות.")
          : t("Meet your guide and answer the first questions.", "פגשו את המדריך וענו על השאלות הראשונות."),
        objectives: [
          ...(boards.length ? [] : [{ type: "talk", text: t("Talk to your guide", "דברו עם המדריך"), npcId: `n-${index}` }]),
          { type: "solve", text: t("Answer the first questions", "ענו על השאלות הראשונות"), challengeIds: ids.slice(0, half).slice(0, 6) },
        ],
      },
      {
        id: m2, title: t("Go deeper", "מעמיקים"), areaId: area.id, requires: [m1],
        story: t("Finish the remaining questions and collect the knowledge gems.", "סיימו את שאר השאלות ואספו את אבני הידע."),
        objectives: [
          ...(ids.length > half ? [{ type: "solve", text: t("Answer the remaining questions", "ענו על שאר השאלות"), challengeIds: ids.slice(half).slice(0, 6) }] : []),
          ...(collect > 0 ? [{ type: "collect", text: t(`Collect ${collect} knowledge gems`, `אספו ${collect} אבני ידע`), count: collect }] : []),
          ...(endBoards.length ? [{ type: "visit", text: endBoardsText(endBoards, taskBoard, t), stationIds: endBoards }] : []),
        ],
      },
    );
    previous = m2;
  });

  const objText = OBJECTIVES(t, title);
  const used = [...new Set(picked.map((c) => c.objective))];
  const placed = challenges.length;
  const LEVEL_NAMES: Record<GenerationRequest["difficulty"], [string, string]> = { beginner: ["beginner", "מתחילים"], intermediate: ["intermediate", "בינוני"], advanced: ["advanced", "מתקדמים"] };
  const levelName = t(...LEVEL_NAMES[req.difficulty]);
  const raw: Raw = {
    schemaVersion: 1,
    meta: {
      title: clip(title, 80),
      tagline: clip(t(`Topic library · ${levelName} level: ${placed} challenges about ${title}.`, `ספריית הנושאים · רמת ${levelName}: ${placed} אתגרים על ${title}.`), 160),
      subject: clip(title, 120), subjectCategory: SPEC_CATEGORY[entry.cat], gameType: req.gameType, difficulty: req.difficulty, language: lang,
      estimatedMinutes: Math.max(4, Math.min(40, placed * 2 + 2)),
    },
    learning: {
      goal: clip(description, 320),
      objectives: used.map((o) => ({ id: `o-${o}`, text: objText[o] })),
      conclusion: clip(t(
        `You worked through ${placed} challenges about “${title}” at the ${levelName} level. Read again the explanations of anything that felt tricky, then try the next level.`,
        `עברתם ${placed} אתגרים על ״${title}״ ברמת ${levelName}. קראו שוב את ההסברים של מה שהיה קשה, ואז נסו את הרמה הבאה.`,
      ), 700),
    },
    theme: { environment: env, timeOfDay: f.time },
    mechanics: [...(twoAreas ? ["collect", "dialogue", "portals", "checkpoints"] : ["collect", "dialogue", "checkpoints"]), ...(variants.length ? ["adaptive_difficulty"] : [])],
    areas, missions, challenges: [...challenges, ...variants],
  };
  const notes = [
    t("Made from the curated topic library — not by AI. The questions were written and fact-checked for this topic and level.", "נבנה מספריית הנושאים המוכנה — לא בבינה מלאכותית. השאלות נכתבו ונבדקו עבור הנושא והרמה האלה."),
  ];
  if (req.contentLanguage !== "he" && req.contentLanguage !== "en") notes.push(`The topic library is written in English and Hebrew, so English was used instead of "${req.contentLanguage}".`);
  if (full && !twoAreas) notes.push(t("This level has enough content for one area.", "ברמה הזאת יש תוכן לאזור אחד."));
  return { raw, notes, stats: { placed, variants: variants.length } };
}

/**
 * The request as the topic library builds it: the subject and goal are the topic's own title and description (in the
 * game's language), whatever the client sent, so a game is never labelled with a subject it is not about.
 */
export function topicRequest(req: GenerationRequest, entry: TopicEntry): GenerationRequest {
  const he = req.contentLanguage === "he";
  return { ...req, subject: clip(he ? entry.he[0] : entry.en[0], 120), learningGoal: clip(he ? entry.he[1] : entry.en[1], 320), material: undefined };
}

/** Provenance stored on every topic-library game ("Topic library (not AI)"); the topic id goes in `templateId`. */
export const TOPIC_PROVIDER = "topic-library";
export const TOPIC_MODEL = "curated-content";
