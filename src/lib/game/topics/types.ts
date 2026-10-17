/**
 * The topic library: curated, fact-checked knowledge per topic and level, written natively in English and Hebrew.
 * Content is DATA (no functions, nothing executable); `build.ts` turns one topic at one level into a game.
 *
 * Compact tuples keep the 200 topic modules small (each one is its own lazily loaded chunk):
 *
 *  - `t` terms:     [enTerm, enMeaning, heTerm, heMeaning] — the meaning never names its own term.
 *  - `q` questions: [en, he], each [question, answer, wrongOptions, explanation, hint?]. List the most plausible wrong
 *                   option first and the easiest to rule out last (the automatic hint rules out the last one).
 *  - `n` numbers:   [answer, en, he, tolerance?], each language [question, unit ("" for none), explanation, hint?].
 *  - `s` orderings: [en, he], each [title, ...steps in the right order] (3–6 steps).
 *
 * A course chapter (`courses.ts`) also has `l`, a short lesson the game shows before its questions.
 */
import type { Difficulty, Environment } from "../spec/constants";

export type Term = readonly [enTerm: string, enMeaning: string, heTerm: string, heMeaning: string];
export type QText = readonly [question: string, answer: string, wrong: readonly string[], explanation: string, hint?: string];
export type Question = readonly [en: QText, he: QText];
export type NText = readonly [question: string, unit: string, explanation: string, hint?: string];
export type NumberItem = readonly [answer: number, en: NText, he: NText, tolerance?: number];
export type Ordering = readonly [en: readonly string[], he: readonly string[]];

export interface LevelContent {
  t?: readonly Term[];
  q?: readonly Question[];
  n?: readonly NumberItem[];
  s?: readonly Ordering[];
}

/**
 * A lesson in one language: what the learner reads before the first question (each text is one board in the game, so
 * at most 420 characters): one or two paragraphs that explain, a worked example, and a hands-on task to try away from
 * the screen. Plain text; nothing in it is graded.
 */
export interface LessonText {
  title: string;
  text: readonly string[];
  example: string;
  task: string;
}

/** One topic's content: every level exists (the catalogue test enforces it). */
export interface TopicContent {
  b: LevelContent;
  i: LevelContent;
  a: LevelContent;
  /** The lesson of a course chapter, the same at every level. */
  l?: { en: LessonText; he: LessonText };
}

export const LEVEL_KEY: Record<Difficulty, "b" | "i" | "a"> = { beginner: "b", intermediate: "i", advanced: "a" };

export const TOPIC_CATEGORIES = ["math", "science", "history", "geography", "languages", "computing", "economy", "health", "arts", "thinking"] as const;
export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

/** A catalogue row: what the picker shows. Small on purpose; the content itself is loaded only when the topic is picked. */
export interface TopicEntry {
  id: string;
  cat: TopicCategory;
  /** [title, one-line description] */
  en: readonly [string, string];
  he: readonly [string, string];
  /** Suggested ages [from, to]. */
  ages: readonly [number, number];
  /** World override (otherwise the category decides). */
  env?: Environment;
  /** Set on the chapters of a course (`courses.ts`): the course id. Chapters are free and taught in order. */
  course?: string;
}
