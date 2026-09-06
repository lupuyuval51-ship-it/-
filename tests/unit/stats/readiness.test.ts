import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/types";
import { MIN_COMPONENTS_WITH_DATA, ROLE_COMPONENTS, computeReadiness, normalizeMetric, readinessScores, recentMeasurement } from "@/engine/readiness";
import { iso, makeResult, ratio } from "../fixtures/statsFixtures";

describe("computeReadiness", () => {
  it("returns null scores for every role when nothing is measured", () => {
    const map = computeReadiness({ results: [], completedSessions: [], personalBests: [] });
    for (const role of [...ROLES, "overall"] as const) {
      expect(map[role].score).toBeNull();
      expect(map[role].explanation.he.length).toBeGreaterThan(0);
    }
    expect(map.handler.components).toHaveLength(ROLE_COMPONENTS.handler.length);
    expect(map.handler.components.every((c) => !c.hasData && c.value === undefined && c.normalized === undefined)).toBe(true);
    expect(readinessScores(map)).toEqual({});
  });

  it("stays null with a single measured component and becomes numeric with two", () => {
    expect(MIN_COMPONENTS_WITH_DATA).toBe(2);
    const one = computeReadiness({ results: [ratio("backhand_accuracy", 8, 10)], completedSessions: [], personalBests: [] });
    expect(one.handler.score).toBeNull();
    expect(one.handler.components.find((c) => c.key === "backhand_accuracy")?.hasData).toBe(true);
    expect(one.handler.explanation.he).toContain("1");

    const two = computeReadiness({ results: [ratio("backhand_accuracy", 8, 10), ratio("forehand_accuracy", 6, 10)], completedSessions: [], personalBests: [] });
    // Equal weights for the two throws → (80 + 60) / 2.
    expect(two.handler.score).toBe(70);
    expect(two.wing.score).toBeNull();
    expect(two.hybrid.score).toBe(70); // average of the roles that have a score
    expect(two.allround.score).toBe(70);
    expect(two.overall.score).toBe(70);
    expect(readinessScores(two)).toEqual({ handler: 70, hybrid: 70, allround: 70 });
  });

  it("normalises times linearly (sprint 2.8 s → 100, 5.0 s → 0) and scales the allowance for kids", () => {
    expect(normalizeMetric("sprint_time_s", 2.8)).toBe(100);
    expect(normalizeMetric("sprint_time_s", 5.0)).toBe(0);
    expect(normalizeMetric("sprint_time_s", 3.9)).toBe(50);
    expect(normalizeMetric("cod_time_s", 4.2)).toBe(100);
    expect(normalizeMetric("cod_time_s", 7.5)).toBe(0);
    expect(normalizeMetric("sprint_time_s", 2.0)).toBe(100); // clamped
    // Kids get +25 % time allowance: 3.5 s is 100 for a kid.
    expect(normalizeMetric("sprint_time_s", 3.5, { ageGroup: "kid", level: "intermediate" })).toBe(100);
    expect(normalizeMetric("sprint_time_s", 3.5, { ageGroup: "adult", level: "intermediate" })).toBeLessThan(100);
    // Percentages and scores pass through.
    expect(normalizeMetric("catch_moving_pct", 73)).toBe(73);
    expect(normalizeMetric("mirror_score", 88)).toBe(88);
    expect(normalizeMetric("repeat_sprint_drop_pct", 0)).toBe(100);
  });

  it("uses a recency-weighted mean of the last 5 measurements", () => {
    const results = [1, 2, 3, 4, 5, 6, 7].map((i) => makeResult({ key: "sprint_time_s", timeSeconds: i, recordedAt: iso(2026, 8, i) }));
    const m = recentMeasurement(results, "sprint_time_s");
    expect(m?.samples).toBe(5);
    // last five are 3..7, weights 5..1 for the newest → (7·5 + 6·4 + 5·3 + 4·2 + 3·1) / 15 = 85 / 15 = 5.67
    expect(m?.value).toBeCloseTo(5.67, 2);
    expect(recentMeasurement(results, "cod_time_s")).toBeUndefined();
  });

  it("weights components and reports the values used", () => {
    const results = [makeResult({ key: "sprint_time_s", timeSeconds: 2.8 }), makeResult({ key: "cod_time_s", timeSeconds: 7.5 }), ratio("catch_moving_pct", 5, 10)];
    const map = computeReadiness({ results, completedSessions: [], personalBests: [], profile: { level: "intermediate", ageGroup: "adult" } });
    const runner = map.runner;
    const sprint = runner.components.find((c) => c.key === "sprint_time_s")!;
    const cod = runner.components.find((c) => c.key === "cod_time_s")!;
    const moving = runner.components.find((c) => c.key === "catch_moving_pct")!;
    expect(sprint.normalized).toBe(100);
    expect(cod.normalized).toBe(0);
    expect(moving.normalized).toBe(50);
    // (100·0.3 + 50·0.25 + 0·0.25) / 0.8 = 53.125 → 53
    expect(runner.score).toBe(53);
    expect(runner.components.find((c) => c.key === "repeat_sprint_drop_pct")?.hasData).toBe(false);
  });
});
