import { describe, expect, it } from "vitest";
import { COURSES } from "@/lib/game/topics/courses";
import type { GameSummaryRow } from "@/lib/offline/store";
import { chapterGames, courseProgress, loadCourseProgress, type ChapterGame, type CourseSource } from "../../mobile/src/course-model";

const course = COURSES[0]!;
const [c1, c2, c3] = course.chapters as [string, string, string];

const game = (over: Partial<ChapterGame>): ChapterGame => ({ id: "g", topicId: c1, difficulty: "beginner", done: false, inProgress: false, lastPlayedAt: 0, ...over });

describe("course progress (phone)", () => {
  it("nothing played: no chapter done, chapter 1 is next at the beginner level", () => {
    const p = courseProgress(course, []);
    expect(p.done).toBe(0);
    expect(p.next).toMatchObject({ topicId: c1, number: 1, levelsDone: [], resume: null, nextLevel: "beginner" });
    expect(p.chapters).toHaveLength(course.chapters.length);
  });

  it("a finished chapter counts once, at the levels finished, and the next unfinished chapter is suggested", () => {
    const p = courseProgress(course, [
      game({ id: "a", difficulty: "beginner", done: true }),
      game({ id: "b", difficulty: "advanced", done: true }),
      game({ id: "c", difficulty: "beginner", done: true }), // played twice: still one level
      game({ id: "d", topicId: c3, difficulty: "intermediate", done: true }),
    ]);
    expect(p.done).toBe(2);
    expect(p.chapters[0]).toMatchObject({ levelsDone: ["beginner", "advanced"], nextLevel: "intermediate" });
    expect(p.chapters[2]).toMatchObject({ levelsDone: ["intermediate"], nextLevel: "beginner" });
    // chapter 2 was skipped: it is the one suggested
    expect(p.next?.topicId).toBe(c2);
  });

  it("resumes the most recently played unfinished game of a chapter", () => {
    const p = courseProgress(course, [
      game({ id: "old", topicId: c2, inProgress: true, lastPlayedAt: 10 }),
      game({ id: "new", topicId: c2, inProgress: true, lastPlayedAt: 20 }),
      game({ id: "done", topicId: c2, done: true, lastPlayedAt: 30 }),
    ]);
    expect(p.chapters[1]!.resume).toBe("new");
  });

  it("every level of every chapter finished: the course is complete", () => {
    const all = course.chapters.flatMap((topicId) => (["beginner", "intermediate", "advanced"] as const).map((difficulty) => game({ id: `${topicId}-${difficulty}`, topicId, difficulty, done: true })));
    const p = courseProgress(course, all);
    expect(p.done).toBe(course.chapters.length);
    expect(p.next).toBeNull();
    expect(p.chapters.every((c) => c.nextLevel === null)).toBe(true);
  });
});

describe("reading chapter games from the phone's library", () => {
  const row = (id: string, over: Partial<GameSummaryRow> = {}): GameSummaryRow => ({
    id, title: id, subject: id, createdAt: 1, generatorKind: "catalog", environment: "castle", bestScore: 0, bestStars: 0, maxScore: 100,
    inProgress: false, percent: 0, lastSessionId: null, lastPlayedAt: null, ...over,
  });
  const metas: Record<string, { difficulty?: string; generator?: { kind?: string; templateId?: string } }> = {
    chapter: { difficulty: "beginner", generator: { kind: "catalog", templateId: c1 } },
    other: { difficulty: "beginner", generator: { kind: "catalog", templateId: "math-fractions" } },
    notes: { difficulty: "beginner", generator: { kind: "engine" } },
    // an AI or demo game that happens to carry a chapter id is not a chapter game
    fake: { difficulty: "beginner", generator: { kind: "ai", templateId: c1 } },
    odd: { difficulty: "expert", generator: { kind: "catalog", templateId: c1 } },
  };
  const src: CourseSource = {
    listGames: () => [row("chapter", { bestScore: 40, lastPlayedAt: 5 }), row("other"), row("notes"), row("fake"), row("odd"), row("broken")],
    getGame: (id) => {
      if (id === "broken") throw new Error("damaged");
      return metas[id] ? { spec: { meta: metas[id]! } } : null;
    },
  };

  it("keeps only topic-library games of the course's chapters, and skips anything unreadable", () => {
    expect(chapterGames(src, course.chapters)).toEqual([{ id: "chapter", topicId: c1, difficulty: "beginner", done: true, inProgress: false, lastPlayedAt: 5 }]);
    expect(loadCourseProgress(src, course).done).toBe(1);
  });

  it("an unreadable library shows the course as not started instead of failing", () => {
    const p = loadCourseProgress({ listGames: () => { throw new Error("full"); }, getGame: () => null }, course);
    expect(p.done).toBe(0);
    expect(p.next?.number).toBe(1);
  });
});
