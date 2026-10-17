import { DIFFICULTIES, type Difficulty } from "@/lib/game/spec/constants";
import type { Course } from "@/lib/game/topics/courses";
import type { GameSummaryRow } from "@/lib/offline/store";

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

/** The chapter games among the phone's games. A game that cannot be read is skipped, never fatal. */
export function chapterGames(src: CourseSource, chapterIds: readonly string[]): ChapterGame[] {
  const wanted = new Set(chapterIds);
  return src.listGames().flatMap((g): ChapterGame[] => {
    try {
      const meta = src.getGame(g.id)?.spec.meta;
      const topicId = meta?.generator?.kind === "catalog" ? meta.generator.templateId : undefined;
      if (!topicId || !wanted.has(topicId) || !isDifficulty(meta?.difficulty)) return [];
      return [{ id: g.id, topicId, difficulty: meta.difficulty, done: g.bestScore > 0 || g.bestStars > 0, inProgress: g.inProgress, lastPlayedAt: g.lastPlayedAt ?? g.createdAt }];
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

/** Never throws: an unreadable library shows the course as not started rather than breaking the screen. */
export function loadCourseProgress(src: CourseSource, course: Course): CourseProgress {
  try {
    return courseProgress(course, chapterGames(src, course.chapters));
  } catch {
    return courseProgress(course, []);
  }
}
