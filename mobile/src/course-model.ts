import { DIFFICULTIES, type Difficulty } from "@/lib/game/spec/constants";
import type { Course } from "@/lib/game/topics/courses";
import { storageErrorCode, type GameSummaryRow } from "@/lib/offline/store";

/**
 * Pure model of a course on the phone (no React, no storage globals, so it is unit-tested in node): which chapters the
 * learner has finished and at which levels, which one to resume, and which chapter comes next. Progress is read from the
 * games on the phone (a chapter game is a topic-library game whose topic is the chapter), so nothing extra is stored and a
 * restored backup brings the progress with it.
 */

/** A game on the phone that belongs to a chapter. */
export interface ChapterGame {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  done: boolean;
  inProgress: boolean;
  lastPlayedAt: number;
}

export interface ChapterProgress {
  topicId: string;
  /** 1-based. */
  number: number;
  /** The levels finished at least once, in level order. */
  levelsDone: Difficulty[];
  /** The most recently played unfinished game of this chapter. */
  resume: string | null;
  /** The level to play next: the first one not finished yet, or null when all three are. */
  nextLevel: Difficulty | null;
}

export interface CourseProgress {
  chapters: ChapterProgress[];
  /** Chapters finished at any level. */
  done: number;
  /** The first chapter not finished yet, or null when every chapter is. */
  next: ChapterProgress | null;
}

/** The slice of `OfflineStore` this needs (a real store satisfies it). */
export interface CourseSource {
  listGames(): GameSummaryRow[];
  getGame(id: string): { spec: { meta: { difficulty?: string; generator?: { kind?: string; templateId?: string } } } } | null;
}

const isDifficulty = (d: unknown): d is Difficulty => (DIFFICULTIES as readonly unknown[]).includes(d);

/**
 * The chapter games among the phone's games. A game that cannot be read is skipped, never fatal. `rows` are the library rows
 * when the screen has just read them (they are not read again); the store's rows carry each game's level and topic, so no spec
 * is parsed for them either. Only a row without them (an older source) is looked up with `getGame`.
 */
export function chapterGames(src: CourseSource, chapterIds: readonly string[], rows?: readonly GameSummaryRow[]): ChapterGame[] {
  const wanted = new Set(chapterIds);
  return (rows ?? src.listGames()).flatMap((g): ChapterGame[] => {
    try {
      const fromRow = g.difficulty !== undefined;
      const meta = fromRow ? undefined : src.getGame(g.id)?.spec.meta;
      const kind = fromRow ? g.generatorKind : meta?.generator?.kind;
      const topicId = kind === "catalog" ? (fromRow ? g.templateId : meta?.generator?.templateId) : undefined;
      const difficulty = fromRow ? g.difficulty : meta?.difficulty;
      if (!topicId || !wanted.has(topicId) || !isDifficulty(difficulty)) return [];
      return [{ id: g.id, topicId, difficulty, done: g.bestScore > 0 || g.bestStars > 0, inProgress: g.inProgress, lastPlayedAt: g.lastPlayedAt ?? g.createdAt }];
    } catch {
      return [];
    }
  });
}

export function courseProgress(course: Pick<Course, "chapters">, games: readonly ChapterGame[]): CourseProgress {
  const chapters = course.chapters.map((topicId, i): ChapterProgress => {
    const mine = games.filter((g) => g.topicId === topicId);
    const levelsDone = DIFFICULTIES.filter((d) => mine.some((g) => g.done && g.difficulty === d));
    const open = mine.filter((g) => g.inProgress).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)[0];
    return { topicId, number: i + 1, levelsDone, resume: open?.id ?? null, nextLevel: DIFFICULTIES.find((d) => !levelsDone.includes(d)) ?? null };
  });
  return { chapters, done: chapters.filter((c) => c.levelsDone.length > 0).length, next: chapters.find((c) => c.levelsDone.length === 0) ?? null };
}

/**
 * Why a chapter could not be started: the phone has no room to save it (the learner must delete a game, trying again alone would
 * fail the same way) or anything else (trying again is the right advice). Works for an `OfflineError` and for the failure the
 * offline transport turns it into, like every other storage message.
 */
export const chapterFailure = (err: unknown): "full" | "generic" => (storageErrorCode(err) === "STORAGE_FULL" ? "full" : "generic");

/** Never throws: an unreadable library shows the course as not started rather than breaking the screen. */
export function loadCourseProgress(src: CourseSource, course: Course, rows?: readonly GameSummaryRow[]): CourseProgress {
  try {
    return courseProgress(course, chapterGames(src, course.chapters, rows));
  } catch {
    return courseProgress(course, []);
  }
}
