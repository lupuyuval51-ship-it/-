import { describe, expect, it } from "vitest";
import type { PersonalBest } from "@/lib/types";
import { PB_KEYS, RATIO_MIN_ATTEMPTS, sessionBestValues, updatePersonalBests, weightedRatio } from "@/engine/personalBests";
import { makeResult, ratio } from "../fixtures/statsFixtures";

const NOW = "2026-09-01T10:00:00.000Z";
const SESSION = { id: "s_new", actualMinutes: 90, throws: 80 };

function pb(key: PersonalBest["key"], value: number, metricType: PersonalBest["metricType"]): PersonalBest {
  return { id: key, key, value, metricType, sessionId: "s_old", achievedAt: "2026-08-01T10:00:00.000Z", updatedAt: "2026-08-01T10:00:00.000Z", deletedAt: null };
}

describe("PB_KEYS", () => {
  it("covers the keys required by the spec with the right direction", () => {
    expect(PB_KEYS.longest_throw_m?.direction).toBe("higher");
    expect(PB_KEYS.throw_accuracy?.direction).toBe("higher");
    expect(PB_KEYS.backhand_accuracy?.direction).toBe("higher");
    expect(PB_KEYS.forehand_accuracy?.direction).toBe("higher");
    expect(PB_KEYS.hammer_accuracy?.direction).toBe("higher");
    expect(PB_KEYS.catch_streak?.direction).toBe("higher");
    expect(PB_KEYS.throw_count?.direction).toBe("higher");
    expect(PB_KEYS.sprint_time_s?.direction).toBe("lower");
    expect(PB_KEYS.cod_time_s?.direction).toBe("lower");
    expect(PB_KEYS.t_drill_time_s?.direction).toBe("lower");
    expect(PB_KEYS.course_time_s?.direction).toBe("lower");
    for (const role of ["wing", "runner", "defender", "handler", "cutter", "hybrid"]) {
      expect(PB_KEYS[`${role}_challenge_score` as keyof typeof PB_KEYS]?.direction).toBe("higher");
    }
    expect(PB_KEYS.catch_pct).toBeUndefined();
  });
});

describe("updatePersonalBests", () => {
  it("creates a PB for every measured key when nothing exists yet", () => {
    const results = [makeResult({ key: "longest_throw_m", distanceMeters: 42 }), makeResult({ key: "sprint_time_s", timeSeconds: 3.4 })];
    const out = updatePersonalBests([], results, SESSION, NOW);
    expect(out.newKeys.sort()).toEqual(["longest_throw_m", "sprint_time_s", "throw_count"]);
    const map = Object.fromEntries(out.all.map((p) => [p.key, p]));
    expect(map.longest_throw_m.value).toBe(42);
    expect(map.longest_throw_m.previousValue).toBeUndefined();
    expect(map.sprint_time_s.value).toBe(3.4);
    expect(map.throw_count.value).toBe(80); // most throws in a session comes from the session total
    expect(out.updated.every((p) => p.sessionId === "s_new" && p.achievedAt === NOW && p.id === p.key)).toBe(true);
  });

  it("higher-is-better keys only update when the value is larger", () => {
    const existing = [pb("longest_throw_m", 45, "distance_m")];
    const worse = updatePersonalBests(existing, [makeResult({ key: "longest_throw_m", distanceMeters: 42 })], { ...SESSION, throws: 0 }, NOW);
    expect(worse.newKeys).toEqual([]);
    expect(worse.all.find((p) => p.key === "longest_throw_m")?.value).toBe(45);

    const better = updatePersonalBests(existing, [makeResult({ key: "longest_throw_m", distanceMeters: 47 })], { ...SESSION, throws: 0 }, NOW);
    expect(better.newKeys).toEqual(["longest_throw_m"]);
    const record = better.all.find((p) => p.key === "longest_throw_m")!;
    expect(record.value).toBe(47);
    expect(record.previousValue).toBe(45);
    expect(record.sessionId).toBe("s_new");
  });

  it("lower-is-better keys only update when the value is smaller", () => {
    const existing = [pb("sprint_time_s", 3.2, "time_s")];
    const slower = updatePersonalBests(existing, [makeResult({ key: "sprint_time_s", timeSeconds: 3.4 })], { ...SESSION, throws: 0 }, NOW);
    expect(slower.newKeys).toEqual([]);
    const faster = updatePersonalBests(existing, [makeResult({ key: "sprint_time_s", timeSeconds: 3.05 })], { ...SESSION, throws: 0 }, NOW);
    expect(faster.newKeys).toEqual(["sprint_time_s"]);
    expect(faster.all.find((p) => p.key === "sprint_time_s")?.value).toBe(3.05);
    // Equal values never count as a new best.
    const same = updatePersonalBests(existing, [makeResult({ key: "sprint_time_s", timeSeconds: 3.2 })], { ...SESSION, throws: 0 }, NOW);
    expect(same.newKeys).toEqual([]);
  });

  it("a ratio PB needs at least 10 attempts and is aggregated Σ/Σ inside the session", () => {
    expect(RATIO_MIN_ATTEMPTS).toBe(10);
    const tooFew = updatePersonalBests([], [ratio("backhand_accuracy", 7, 8)], { ...SESSION, throws: 0 }, NOW);
    expect(tooFew.newKeys).toEqual([]);

    // Two drills of 6 attempts each add up to 12 attempts → counts, with the weighted percentage.
    const enough = updatePersonalBests([], [ratio("backhand_accuracy", 6, 6), ratio("backhand_accuracy", 3, 6)], { ...SESSION, throws: 0 }, NOW);
    expect(enough.newKeys).toEqual(["backhand_accuracy"]);
    expect(enough.all[0].value).toBe(75);
    expect(enough.all[0].metricType).toBe("ratio");

    const existing = [pb("backhand_accuracy", 80, "ratio")];
    const lower = updatePersonalBests(existing, [ratio("backhand_accuracy", 7, 10)], { ...SESSION, throws: 0 }, NOW);
    expect(lower.newKeys).toEqual([]);
    const higher = updatePersonalBests(existing, [ratio("backhand_accuracy", 9, 10)], { ...SESSION, throws: 0 }, NOW);
    expect(higher.newKeys).toEqual(["backhand_accuracy"]);
    expect(higher.all[0].value).toBe(90);
    expect(higher.all[0].previousValue).toBe(80);
  });

  it("keeps existing bests for keys not measured this session and skips soft-deleted results", () => {
    const existing = [pb("catch_streak", 18, "streak"), pb("cod_time_s", 5.1, "time_s")];
    const out = updatePersonalBests(existing, [makeResult({ key: "catch_streak", streak: 30, deletedAt: NOW })], { ...SESSION, throws: 0 }, NOW);
    expect(out.newKeys).toEqual([]);
    expect(out.all).toHaveLength(2);
    expect(out.all.find((p) => p.key === "catch_streak")?.value).toBe(18);
  });

  it("ignores keys that are not PB keys", () => {
    const out = updatePersonalBests([], [ratio("catch_pct", 10, 10)], { ...SESSION, throws: 0 }, NOW);
    expect(out.newKeys).toEqual([]);
    expect(out.all).toEqual([]);
  });
});

describe("helpers", () => {
  it("weightedRatio is Σ successes / Σ attempts, never a mean of percentages", () => {
    const w = weightedRatio([ratio("throw_accuracy", 9, 10), ratio("throw_accuracy", 10, 40)]);
    expect(w.attempts).toBe(50);
    expect(w.successes).toBe(19);
    expect(w.pct).toBe(38);
    expect(weightedRatio([]).pct).toBeUndefined();
  });

  it("sessionBestValues takes the best single measurement for non-ratio keys", () => {
    const bests = sessionBestValues([makeResult({ key: "cod_time_s", timeSeconds: 5.4 }), makeResult({ key: "cod_time_s", timeSeconds: 5.1 }), makeResult({ key: "catch_streak", streak: 12 }), makeResult({ key: "catch_streak", streak: 22 })]);
    expect(bests.cod_time_s).toBe(5.1);
    expect(bests.catch_streak).toBe(22);
  });
});
