import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from "@/content/achievements";
import { achievementProgress, evaluateAchievements } from "@/engine/achievements";
import { computeStats } from "@/engine/stats";
import { day, iso, makeResult, makeSession, ratio } from "../fixtures/statsFixtures";

const NOW = iso(2026, 9, 9);

describe("ACHIEVEMENTS content", () => {
  it("defines every id from the spec with localized text and a lucide icon name", () => {
    const ids = [
      "first_session", "throws_100", "throws_500", "throws_1000", "sessions_10", "sessions_50", "hours_10", "hours_50", "streak_7",
      "accuracy_master", "backhand_master", "forehand_master", "wing_challenge", "runner_challenge", "defender_challenge",
      "handler_challenge", "cutter_challenge", "distance_pb", "catches_100",
    ];
    for (const id of ids) {
      const a = ACHIEVEMENT_MAP[id];
      expect(a, id).toBeDefined();
      expect(a.title.he.length).toBeGreaterThan(0);
      expect(a.title.en.length).toBeGreaterThan(0);
      expect(a.description.he.length).toBeGreaterThan(0);
      expect(a.icon).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(a.xp).toBeGreaterThan(0);
    }
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    const master = ACHIEVEMENT_MAP.accuracy_master.condition;
    expect(master).toEqual({ kind: "accuracy", key: "throw_accuracy", pct: 80, minAttempts: 100 });
  });
});

describe("evaluateAchievements", () => {
  it("unlocks first_session after the first completed session, only once", () => {
    const session = makeSession({ id: "s1", on: day(2026, 9, 7), throws: 40 });
    const stats = computeStats({ completedSessions: [session], exerciseResults: [], personalBests: [], now: day(2026, 9, 9) });
    const fresh = evaluateAchievements(stats, [], [], NOW, "s1");
    expect(fresh.map((a) => a.id)).toEqual(["first_session"]);
    expect(fresh[0]).toMatchObject({ id: "first_session", unlockedAt: NOW, sessionId: "s1" });

    const again = evaluateAchievements(stats, [], fresh, NOW, "s1");
    expect(again).toEqual([]);
  });

  it("unlocks throws_100 once the recorded throws reach 100 and catches_100 for catches", () => {
    const below = computeStats({ completedSessions: [makeSession({ on: day(2026, 9, 7), throws: 99, catches: 10 })], exerciseResults: [], personalBests: [], now: day(2026, 9, 9) });
    expect(evaluateAchievements(below, [], [], NOW).map((a) => a.id)).toEqual(["first_session"]);

    const sessions = [makeSession({ on: day(2026, 9, 6), throws: 60, catches: 50 }), makeSession({ on: day(2026, 9, 7), throws: 40, catches: 50 })];
    const reached = computeStats({ completedSessions: sessions, exerciseResults: [], personalBests: [], now: day(2026, 9, 9) });
    const ids = evaluateAchievements(reached, [], [], NOW).map((a) => a.id).sort();
    expect(ids).toEqual(["catches_100", "first_session", "throws_100"]);
    expect(ids).not.toContain("throws_500");
    expect(achievementProgress(ACHIEVEMENT_MAP.throws_500, reached, []).pct).toBe(20);
  });

  it("accuracy_master needs 80 % over at least 100 attempts (weighted)", () => {
    const session = makeSession({ id: "s1", on: day(2026, 9, 7) });
    const fewAttempts = [ratio("throw_accuracy", 45, 50, { sessionId: "s1" })];
    const s1 = computeStats({ completedSessions: [session], exerciseResults: fewAttempts, personalBests: [], now: day(2026, 9, 9) });
    expect(evaluateAchievements(s1, fewAttempts, [], NOW).map((a) => a.id)).not.toContain("accuracy_master");

    const enough = [ratio("throw_accuracy", 45, 50, { sessionId: "s1" }), ratio("backhand_accuracy", 40, 50, { sessionId: "s1" })];
    const s2 = computeStats({ completedSessions: [session], exerciseResults: enough, personalBests: [], now: day(2026, 9, 9) });
    const ids = evaluateAchievements(s2, enough, [], NOW).map((a) => a.id);
    expect(ids).toContain("accuracy_master"); // 85/100 = 85 %
    expect(ids).not.toContain("backhand_master"); // only 50 backhand attempts
  });

  it("role challenge and distance PB come from recorded results only", () => {
    const session = makeSession({ id: "s1", on: day(2026, 9, 7) });
    const results = [
      makeResult({ key: "handler_challenge_score", score: 64, sessionId: "s1" }),
      makeResult({ key: "longest_throw_m", distanceMeters: 40, sessionId: "s1", recordedAt: iso(2026, 9, 7, 10) }),
    ];
    const stats = computeStats({ completedSessions: [session], exerciseResults: results, personalBests: [], now: day(2026, 9, 9) });
    const ids = evaluateAchievements(stats, results, [], NOW).map((a) => a.id);
    expect(ids).toContain("handler_challenge");
    expect(ids).not.toContain("wing_challenge");
    expect(ids).not.toContain("distance_pb"); // a first measurement is a baseline, not an improvement

    const improved = [...results, makeResult({ key: "longest_throw_m", distanceMeters: 44, sessionId: "s1", recordedAt: iso(2026, 9, 7, 11) })];
    expect(evaluateAchievements(stats, improved, [], NOW).map((a) => a.id)).toContain("distance_pb");
  });
});
