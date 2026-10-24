import { describe, expect, it } from "vitest";
import type { GameSummaryRow } from "@/lib/offline/store";
import { chapterGames } from "../../mobile/src/course-model";

const row = (over: Partial<GameSummaryRow>): GameSummaryRow => ({
  id: "g1", title: "Chapter 1", subject: "Fractions", createdAt: 1, generatorKind: "catalog", environment: "forest", bestScore: 0, bestStars: 0, maxScore: 100,
  inProgress: false, percent: 0, lastSessionId: "s1", lastPlayedAt: 5, difficulty: "beginner", templateId: "course-fractions-1", ...over,
});
const src = { listGames: () => [], getGame: () => null };

describe("course: a chapter played to the end is done", () => {
  it("even when it scored nothing (every answer revealed)", () => {
    expect(chapterGames(src, ["course-fractions-1"], [row({ completed: true, bestScore: 0, bestStars: 0 })])[0]!.done).toBe(true);
  });
  it("a chapter only started is not done", () => {
    expect(chapterGames(src, ["course-fractions-1"], [row({ completed: false, inProgress: true })])[0]!.done).toBe(false);
  });
  it("a row from an older source without the flag falls back to its score", () => {
    expect(chapterGames(src, ["course-fractions-1"], [row({ bestScore: 40, bestStars: 1 })])[0]!.done).toBe(true);
    expect(chapterGames(src, ["course-fractions-1"], [row({})])[0]!.done).toBe(false);
  });
});
