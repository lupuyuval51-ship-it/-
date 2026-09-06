import { describe, expect, it } from "vitest";
import { compareToPrevious, computeStats, timeSeries } from "@/engine/stats";
import { dateKey, day, iso, makePlanned, makeSession, ratio } from "../fixtures/statsFixtures";

// 2026-09-06 is a Sunday, so the week of Wed 2026-09-09 runs 09-06 … 09-12.
const NOW = day(2026, 9, 9);

describe("computeStats", () => {
  it("returns a fully empty snapshot without inventing anything", () => {
    const s = computeStats({ completedSessions: [], exerciseResults: [], personalBests: [], now: NOW });
    expect(s.hasData).toBe(false);
    expect(s.sessions).toBe(0);
    expect(s.totalMinutes).toBe(0);
    expect(s.totalThrows).toBe(0);
    expect(s.accuracyPct).toBeUndefined();
    expect(s.backhandAccuracy).toBeUndefined();
    expect(s.longestThrowM).toBeUndefined();
    expect(s.bestSprintTimeS).toBeUndefined();
    expect(s.lastSession).toBeUndefined();
    expect(s.currentStreak).toBe(0);
    expect(s.weakSkills).toEqual([]);
    expect(s.strongSkills).toEqual([]);
    expect(s.xpTotal).toBe(0);
    expect(s.level.level).toBe(1);
  });

  it("computes weighted accuracy (Σ successes / Σ attempts), not a mean of percentages", () => {
    const session = makeSession({ id: "s1", on: day(2026, 9, 7) });
    const results = [ratio("backhand_accuracy", 9, 10, { sessionId: "s1" }), ratio("backhand_accuracy", 10, 40, { sessionId: "s1" }), ratio("forehand_accuracy", 5, 10, { sessionId: "s1" })];
    const s = computeStats({ completedSessions: [session], exerciseResults: results, personalBests: [], now: NOW });
    expect(s.backhandAccuracy).toBe(38); // 19/50, not (90+25)/2
    expect(s.backhandAttempts).toBe(50);
    expect(s.forehandAccuracy).toBe(50);
    expect(s.accuracyPct).toBe(40); // 24/60 across all throw-accuracy keys
    expect(s.accuracyAttempts).toBe(60);
    expect(s.hammerAccuracy).toBeUndefined();
    expect(s.bySkill.backhand?.attempts).toBe(50);
    expect(s.bySkill.backhand?.accuracyPct).toBe(38);
    expect(s.bySkill.backhand?.sessions).toBe(1);
  });

  it("buckets sessions into this week and this month", () => {
    const sessions = [
      makeSession({ id: "a", on: day(2026, 9, 7), actualMinutes: 90, throws: 50, catches: 20 }), // this week, this month
      makeSession({ id: "b", on: day(2026, 9, 2), actualMinutes: 60, throws: 40, catches: 10 }), // last week, this month
      makeSession({ id: "c", on: day(2026, 8, 20), actualMinutes: 100, throws: 70, catches: 30, role: "cutter" }), // last month
    ];
    const planned = [
      makePlanned({ date: dateKey(2026, 9, 8) }),
      makePlanned({ date: dateKey(2026, 9, 11) }),
      makePlanned({ date: dateKey(2026, 9, 11), status: "cancelled" }),
      makePlanned({ date: dateKey(2026, 9, 15) }),
    ];
    const s = computeStats({ completedSessions: sessions, exerciseResults: [], personalBests: [], plannedSessions: planned, now: NOW });
    expect(s.sessions).toBe(3);
    expect(s.totalMinutes).toBe(250);
    expect(s.totalHours).toBe(4.2);
    expect(s.totalThrows).toBe(160);
    expect(s.totalCatches).toBe(60);
    expect(s.sessionsThisWeek).toBe(1);
    expect(s.minutesThisWeek).toBe(90);
    expect(s.sessionsThisMonth).toBe(2);
    expect(s.minutesThisMonth).toBe(150);
    expect(s.plannedThisWeek).toBe(2);
    expect(s.byRole.handler).toEqual({ sessions: 2, minutes: 150 });
    expect(s.byRole.cutter).toEqual({ sessions: 1, minutes: 100 });
    expect(s.lastSession?.id).toBe("a");
    expect(s.longestSessionMinutes).toBe(100);
  });

  it("takes bests from results and stored PBs (direction-aware)", () => {
    const session = makeSession({ id: "s1", on: day(2026, 9, 7) });
    const results = [
      { ...ratio("throw_accuracy", 8, 10, { sessionId: "s1" }) },
      { ...ratio("throw_accuracy", 8, 10, { sessionId: "s1", key: "longest_throw_m", metricType: "distance_m", distanceMeters: 38, successes: undefined, attempts: undefined, accuracyPct: undefined }) },
    ];
    const pbs = [
      { id: "longest_throw_m" as const, key: "longest_throw_m" as const, value: 44, metricType: "distance_m" as const, sessionId: "old", achievedAt: iso(2026, 8, 1), updatedAt: iso(2026, 8, 1), deletedAt: null },
      { id: "sprint_time_s" as const, key: "sprint_time_s" as const, value: 3.3, metricType: "time_s" as const, sessionId: "old", achievedAt: iso(2026, 8, 1), updatedAt: iso(2026, 8, 1), deletedAt: null },
    ];
    const s = computeStats({ completedSessions: [session], exerciseResults: results, personalBests: pbs, now: NOW });
    expect(s.longestThrowM).toBe(44);
    expect(s.bestSprintTimeS).toBe(3.3);
    expect(s.bestCodTimeS).toBeUndefined();
  });

  it("flags weak and strong skills only with enough attempts", () => {
    const session = makeSession({ id: "s1", on: day(2026, 9, 7), skillsTrained: [] });
    const results = [
      ratio("backhand_accuracy", 18, 20, { sessionId: "s1" }), // 90 % → strong
      ratio("forehand_accuracy", 9, 20, { sessionId: "s1" }), // 45 % → weak
      ratio("hammer_accuracy", 2, 5, { sessionId: "s1" }), // too few attempts → ignored
    ];
    const s = computeStats({ completedSessions: [session], exerciseResults: results, personalBests: [], now: NOW });
    expect(s.strongSkills).toContain("backhand");
    expect(s.weakSkills).toContain("forehand");
    expect(s.weakSkills).not.toContain("hammer");
    expect(s.strongSkills).not.toContain("hammer");
  });

  it("trend compares the last 3 sessions with the 3 before them", () => {
    const sessions = Array.from({ length: 6 }, (_, i) => makeSession({ id: `s${i}`, on: day(2026, 8, 20 + i) }));
    const results = sessions.map((s, i) => ratio("forehand_accuracy", i < 3 ? 5 : 8, 10, { sessionId: s.id, recordedAt: s.completedAt }));
    const s = computeStats({ completedSessions: sessions, exerciseResults: results, personalBests: [], now: NOW });
    expect(s.bySkill.forehand?.trend).toBe(30);
  });

  it("uses XP events for the total when given, otherwise the sessions' xpEarned", () => {
    const sessions = [makeSession({ on: day(2026, 9, 7), xpEarned: 120 })];
    const fromSessions = computeStats({ completedSessions: sessions, exerciseResults: [], personalBests: [], now: NOW });
    expect(fromSessions.xpTotal).toBe(120);
    const fromEvents = computeStats({ completedSessions: sessions, exerciseResults: [], personalBests: [], now: NOW, xpEvents: [{ id: "x", amount: 250, reason: "session", at: iso(2026, 9, 7), updatedAt: iso(2026, 9, 7) }] });
    expect(fromEvents.xpTotal).toBe(250);
    expect(fromEvents.level.level).toBe(2);
  });
});

describe("timeSeries", () => {
  const sessions = [
    makeSession({ id: "a", on: day(2026, 9, 8), actualMinutes: 90, throws: 50 }),
    makeSession({ id: "b", on: day(2026, 9, 3), actualMinutes: 60, throws: 40 }),
    makeSession({ id: "c", on: day(2026, 7, 20), actualMinutes: 100, throws: 70, role: "cutter" }),
  ];
  const results = [ratio("backhand_accuracy", 8, 10, { sessionId: "a", recordedAt: iso(2026, 9, 8) }), ratio("backhand_accuracy", 4, 10, { sessionId: "b", recordedAt: iso(2026, 9, 3) })];
  const input = { completedSessions: sessions, exerciseResults: results };

  it("week range: 7 daily buckets ending today, counts default to 0 and accuracy to null", () => {
    const series = timeSeries(input, { metric: "sessions", range: "week", now: NOW });
    expect(series).toHaveLength(7);
    expect(series[0].date).toBe(dateKey(2026, 9, 3));
    expect(series[6].date).toBe(dateKey(2026, 9, 9));
    expect(series.map((p) => p.value)).toEqual([1, 0, 0, 0, 0, 1, 0]);
    expect(series[0].label).toBe("3/9");

    const acc = timeSeries(input, { metric: "backhand", range: "week", now: NOW });
    expect(acc.map((p) => p.value)).toEqual([40, null, null, null, null, 80, null]);
    const minutes = timeSeries(input, { metric: "minutes", range: "week", now: NOW });
    expect(minutes[5].value).toBe(90);
  });

  it("month range: 30 daily buckets", () => {
    const series = timeSeries(input, { metric: "throws", range: "month", now: NOW });
    expect(series).toHaveLength(30);
    expect(series[29].date).toBe(dateKey(2026, 9, 9));
    expect(series.reduce((sum, p) => sum + (p.value ?? 0), 0)).toBe(90);
  });

  it("3months range: 13 weekly buckets starting on Sundays", () => {
    const series = timeSeries(input, { metric: "sessions", range: "3months", now: NOW });
    expect(series).toHaveLength(13);
    expect(series[12].date).toBe(dateKey(2026, 9, 6));
    expect(series.every((p) => new Date(`${p.date}T12:00:00`).getDay() === 0)).toBe(true);
    // The two September sessions land in two different weeks; the July one is inside the 13-week window too.
    expect(series[12].value).toBe(1);
    expect(series[11].value).toBe(1);
    expect(series.reduce((sum, p) => sum + (p.value ?? 0), 0)).toBe(3);
  });

  it("all range: weekly buckets from the first session's week", () => {
    const series = timeSeries(input, { metric: "sessions", range: "all", now: NOW });
    expect(series[0].date).toBe(dateKey(2026, 7, 19)); // Sunday of the week of 2026-07-20
    expect(series[series.length - 1].date).toBe(dateKey(2026, 9, 6));
    expect(series.reduce((sum, p) => sum + (p.value ?? 0), 0)).toBe(3);
    expect(timeSeries({ completedSessions: [], exerciseResults: [] }, { metric: "sessions", range: "all", now: NOW })).toEqual([]);
  });

  it("filters by role", () => {
    const series = timeSeries(input, { metric: "sessions", range: "all", role: "cutter", now: NOW });
    expect(series.reduce((sum, p) => sum + (p.value ?? 0), 0)).toBe(1);
  });
});

describe("compareToPrevious", () => {
  it("reports deltas with a direction-aware 'better' flag and handles a missing previous session", () => {
    const current = makeSession({ id: "cur", actualMinutes: 95, throws: 70, accuracyPct: 72, backhandAccuracy: 80, roleMetrics: { sprint_time_s: 3.2, catch_streak: 15 } });
    const previous = makeSession({ id: "prev", actualMinutes: 90, throws: 60, accuracyPct: 65, forehandAccuracy: 50, roleMetrics: { sprint_time_s: 3.4 } });
    const items = compareToPrevious(current, previous);
    const byKey = Object.fromEntries(items.map((i) => [i.key, i]));
    expect(byKey.throws.delta).toBe(10);
    expect(byKey.throws.better).toBe(true);
    expect(byKey.accuracyPct.delta).toBe(7);
    expect(byKey.accuracyPct.better).toBe(true);
    expect(byKey.actualMinutes.delta).toBe(5);
    expect(byKey.actualMinutes.better).toBeUndefined(); // duration has no direction
    expect(byKey.sprint_time_s.delta).toBeCloseTo(-0.2);
    expect(byKey.sprint_time_s.better).toBe(true); // lower is better
    expect(byKey.catch_streak.current).toBe(15);
    expect(byKey.catch_streak.previous).toBeUndefined();
    expect(byKey.catch_streak.delta).toBeUndefined();
    expect(byKey.forehandAccuracy.current).toBeUndefined();
    expect(byKey.forehandAccuracy.previous).toBe(50);
    expect(byKey.hammerAccuracy).toBeUndefined(); // nothing measured either time → not listed

    const alone = compareToPrevious(current);
    expect(alone.every((i) => i.previous === undefined && i.delta === undefined)).toBe(true);
    expect(alone.find((i) => i.key === "throws")?.current).toBe(70);
  });
});
