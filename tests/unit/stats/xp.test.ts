import { describe, expect, it } from "vitest";
import type { XpEvent } from "@/lib/types";
import { XP_RULES, totalXp, xpEventId, xpEventsForSession, xpForCompletedSession } from "@/engine/xp";

describe("xpForCompletedSession", () => {
  it("applies every rule from the spec", () => {
    const b = xpForCompletedSession({
      actualMinutes: 100,
      plannedMinutes: 90,
      exercisesCompleted: 8,
      exercisesCount: 10,
      resultsLogged: 4,
      newPersonalBests: 1,
      challengeCompleted: true,
    });
    expect(b.minutes).toBe(90); // 1 XP per active minute, capped at the planned duration
    expect(b.results).toBe(4 * XP_RULES.perLoggedResult); // 20
    expect(b.personalBests).toBe(XP_RULES.perPersonalBest); // 25
    expect(b.completion).toBe(XP_RULES.completionBonus); // 15 (8/10 = 80 %)
    expect(b.challenge).toBe(XP_RULES.challengeBonus); // 20
    expect(b.total).toBe(90 + 20 + 25 + 15 + 20);
  });

  it("gives no completion bonus below 80 % and no challenge bonus without a challenge", () => {
    const b = xpForCompletedSession({ actualMinutes: 45, plannedMinutes: 90, exercisesCompleted: 7, exercisesCount: 10, resultsLogged: 0, newPersonalBests: 0, challengeCompleted: false });
    expect(b.minutes).toBe(45);
    expect(b.completion).toBe(0);
    expect(b.challenge).toBe(0);
    expect(b.total).toBe(45);
  });

  it("never returns negative XP for garbage input", () => {
    const b = xpForCompletedSession({ actualMinutes: -10, plannedMinutes: Number.NaN, exercisesCompleted: -1, exercisesCount: 0, resultsLogged: -3, newPersonalBests: -1, challengeCompleted: false });
    expect(b.total).toBe(0);
  });
});

describe("xpEventsForSession / totalXp", () => {
  const at = "2026-09-01T10:00:00.000Z";
  const breakdown = xpForCompletedSession({ actualMinutes: 90, plannedMinutes: 90, exercisesCompleted: 10, exercisesCount: 10, resultsLogged: 3, newPersonalBests: 2, challengeCompleted: false });

  it("produces one event per reason with deterministic ids", () => {
    const events = xpEventsForSession({
      sessionId: "s1",
      at,
      breakdown,
      newPersonalBestKeys: ["longest_throw_m", "backhand_accuracy"],
      completedChallenges: [{ id: "wk-sessions-3:W2026-08-30", xp: 60 }],
      unlockedAchievements: [{ id: "first_session", xp: 30 }],
    });
    const byReason = Object.fromEntries(events.map((e) => [e.id, e]));
    expect(byReason[xpEventId("s1", "session")].amount).toBe(90 + 15);
    expect(byReason[xpEventId("s1", "exercise_result")].amount).toBe(15);
    expect(byReason[xpEventId("s1", "personal_best", "longest_throw_m")].amount).toBe(25);
    expect(byReason[xpEventId("s1", "personal_best", "backhand_accuracy")].amount).toBe(25);
    expect(byReason[xpEventId("s1", "challenge", "wk-sessions-3:W2026-08-30")].amount).toBe(60);
    expect(byReason[xpEventId("s1", "achievement", "first_session")].amount).toBe(30);
    expect(events.every((e) => e.at === at && e.updatedAt === at)).toBe(true);
    // The session-derived events add up to the breakdown; challenge/achievement XP comes on top.
    const sessionOnly = events.filter((e) => e.reason !== "challenge" && e.reason !== "achievement");
    expect(totalXp(sessionOnly)).toBe(breakdown.total);
    expect(totalXp(events)).toBe(breakdown.total + 60 + 30);
  });

  it("re-finalising the same session yields identical ids so XP is never duplicated by upsert", () => {
    const a = xpEventsForSession({ sessionId: "s1", at, breakdown, newPersonalBestKeys: ["catch_streak"] });
    const b = xpEventsForSession({ sessionId: "s1", at, breakdown, newPersonalBestKeys: ["catch_streak"] });
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
    const merged = Object.values(Object.fromEntries([...a, ...b].map((e) => [e.id, e])));
    expect(totalXp(merged)).toBe(totalXp(a));
  });

  it("ignores soft-deleted and non-numeric events", () => {
    const events: XpEvent[] = [
      { id: "1", amount: 50, reason: "session", at, updatedAt: at },
      { id: "2", amount: 30, reason: "challenge", at, updatedAt: at, deletedAt: at },
      { id: "3", amount: Number.NaN, reason: "achievement", at, updatedAt: at },
    ];
    expect(totalXp(events)).toBe(50);
    expect(totalXp([])).toBe(0);
  });
});
