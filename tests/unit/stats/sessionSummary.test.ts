import { describe, expect, it } from "vitest";
import type { XpEvent } from "@/lib/types";
import { XP_RULES } from "@/engine/xp";
import { catchesOfResult, finalizeSession, sessionRoleMetrics, throwsOfResult } from "@/engine/sessionSummary";
import { MANIFEST_EXERCISES } from "../fixtures/manifestExercises";
import { day, iso, makeActiveSession, makePhase, makeProfile, makeResult, makeSession, makeWorkout, ratio, workoutExerciseFrom } from "../fixtures/statsFixtures";

const NOW = iso(2026, 9, 9, 19);
const STARTED = iso(2026, 9, 9, 17);

function buildWorkout() {
  const warmup = makePhase("warmup", [workoutExerciseFrom("wu-easy-throws", 12)]);
  const throwing = makePhase("throwing", [workoutExerciseFrom("bh-short-gate", 10), workoutExerciseFrom("fh-short-gate", 10), workoutExerciseFrom("th-distance-max", 10)]);
  const movement = makePhase("movement", [workoutExerciseFrom("mv-short-sprints", 15)]);
  const cooldown = makePhase("cooldown", [workoutExerciseFrom("cd-stretch", 5)]);
  return makeWorkout([warmup, throwing, movement, cooldown], { totalDurationMinutes: 90 });
}

describe("finalizeSession", () => {
  const workout = buildWorkout();
  const bh = workout.phases[1].exercises[0];
  const fh = workout.phases[1].exercises[1];
  const dist = workout.phases[1].exercises[2];
  const sprint = workout.phases[2].exercises[0];
  const easy = workout.phases[0].exercises[0];
  const cool = workout.phases[3].exercises[0];

  const results = [
    ratio("backhand_accuracy", 8, 10, { workoutExerciseId: bh.id, exerciseId: bh.exerciseId, phaseType: "throwing", recordedAt: iso(2026, 9, 9, 17) }),
    ratio("forehand_accuracy", 6, 10, { workoutExerciseId: fh.id, exerciseId: fh.exerciseId, phaseType: "throwing", recordedAt: iso(2026, 9, 9, 18) }),
    makeResult({ key: "longest_throw_m", distanceMeters: 41, workoutExerciseId: dist.id, exerciseId: dist.exerciseId, phaseType: "throwing", throws: 3, recordedAt: iso(2026, 9, 9, 18) }),
    makeResult({ key: "sprint_time_s", timeSeconds: 3.4, workoutExerciseId: sprint.id, exerciseId: sprint.exerciseId, phaseType: "movement", recordedAt: iso(2026, 9, 9, 18) }),
  ];

  function run(overrides: Partial<Parameters<typeof finalizeSession>[0]> = {}) {
    const active = makeActiveSession({
      id: "as1",
      workout,
      startedAt: STARTED,
      elapsedSeconds: 5400,
      results,
      // The warm-up throws were done without logging a result; the cool-down too.
      completedExerciseIds: [easy.id, cool.id],
    });
    return finalizeSession(
      { active, difficulty: 3, feeling: 4, note: "  רוח חזקה בסוף  ", previousSessions: [], personalBests: [], unlockedAchievements: [], xpEvents: [], userChallenges: [], profile: makeProfile(), now: NOW, ...overrides },
      { catalog: MANIFEST_EXERCISES },
    );
  }

  it("builds the completed session with minutes, throws, catches and accuracies from recorded data", () => {
    const out = run();
    const c = out.completed;
    expect(c.id).toBe("as1");
    expect(c.workoutId).toBe(workout.id);
    expect(c.role).toBe("handler");
    expect(c.startedAt).toBe(STARTED);
    expect(c.completedAt).toBe(NOW);
    expect(c.plannedMinutes).toBe(90);
    expect(c.actualMinutes).toBe(90); // 5400 s
    expect(c.phasesCount).toBe(4);
    expect(c.exercisesCount).toBe(6);
    expect(c.exercisesCompleted).toBe(6); // 4 with results + 2 marked complete
    // Throws: 10 + 10 + 3 logged, plus the warm-up fallback (10 throws/set × 3 sets from the fixture) = 53.
    expect(c.throws).toBe(53);
    expect(c.catches).toBe(0);
    expect(c.backhandAccuracy).toBe(80);
    expect(c.forehandAccuracy).toBe(60);
    expect(c.accuracyPct).toBe(70); // 14/20
    expect(c.hammerAccuracy).toBeUndefined();
    expect(c.roleMetrics).toEqual({ backhand_accuracy: 80, forehand_accuracy: 60, longest_throw_m: 41, sprint_time_s: 3.4 });
    expect(c.difficulty).toBe(3);
    expect(c.feeling).toBe(4);
    expect(c.note).toBe("רוח חזקה בסוף");
    expect(c.skillsTrained).toEqual(expect.arrayContaining(["backhand", "forehand", "distance", "warmup"]));
    expect(out.results).toHaveLength(4);
    expect(out.results.every((r) => r.sessionId === "as1" && r.workoutId === workout.id && r.updatedAt === NOW)).toBe(true);
    expect(out.results[0].accuracyPct).toBe(80);
  });

  it("records new personal bests and pays XP for them", () => {
    const out = run();
    expect(out.newPersonalBestKeys.sort()).toEqual(["backhand_accuracy", "forehand_accuracy", "longest_throw_m", "sprint_time_s", "throw_count"]);
    expect(out.completed.newPersonalBestKeys).toEqual(out.newPersonalBestKeys);
    expect(out.personalBests.find((p) => p.key === "longest_throw_m")?.value).toBe(41);
    expect(out.personalBests.find((p) => p.key === "throw_count")?.value).toBe(53);

    const reasons = out.xpEvents.map((e) => e.reason);
    expect(reasons).toContain("session");
    expect(reasons).toContain("exercise_result");
    expect(reasons.filter((r) => r === "personal_best")).toHaveLength(5);
    expect(reasons).toContain("achievement"); // first_session
    const sessionEvent = out.xpEvents.find((e) => e.reason === "session")!;
    expect(sessionEvent.amount).toBe(90 + XP_RULES.completionBonus);
    expect(out.xpEvents.find((e) => e.reason === "exercise_result")?.amount).toBe(4 * XP_RULES.perLoggedResult);
    expect(out.xpBreakdown.challenge).toBe(0); // no challenge phase in this workout
    expect(out.xpBreakdown.total).toBe(90 + 15 + 20 + 5 * XP_RULES.perPersonalBest);
    // The weekly distance-PB challenge is completed by this session and pays its own XP (no double bonus).
    expect(out.challengesCompleted.map((c) => c.definitionId)).toEqual(["wk-distance-pb"]);
    const challengeEvent = out.xpEvents.find((e) => e.reason === "challenge")!;
    expect(challengeEvent.refId).toBe("wk-distance-pb:W2026-09-06");
    expect(challengeEvent.amount).toBe(50);
    expect(out.xpEvents.find((e) => e.reason === "achievement")?.amount).toBe(30);
    expect(out.completed.xpEarned).toBe(105 + 20 + 125 + 50 + 30);
    expect(out.completed.xpEarned).toBe(out.xpEvents.reduce((sum, e) => sum + e.amount, 0));
    expect(out.stats.xpTotal).toBe(out.completed.xpEarned);
    expect(out.stats.sessions).toBe(1);
    expect(out.stats.totalThrows).toBe(53);
  });

  it("does not repeat a PB that is not beaten and keeps XP idempotent", () => {
    const existing = [{ id: "longest_throw_m" as const, key: "longest_throw_m" as const, value: 45, metricType: "distance_m" as const, sessionId: "old", achievedAt: iso(2026, 8, 1), updatedAt: iso(2026, 8, 1), deletedAt: null }];
    const out = run({ personalBests: existing });
    expect(out.newPersonalBestKeys).not.toContain("longest_throw_m");
    expect(out.personalBests.find((p) => p.key === "longest_throw_m")?.value).toBe(45);
    const again = run({ personalBests: existing });
    expect(again.xpEvents.map((e) => e.id)).toEqual(out.xpEvents.map((e) => e.id));
  });

  it("unlocks first_session, progresses challenges and compares with the previous session", () => {
    const previous = makeSession({ id: "prev", on: day(2026, 9, 7), throws: 40, backhandAccuracy: 70, forehandAccuracy: 65 });
    const out = run({ previousSessions: [previous] });
    expect(out.newAchievements.map((a) => a.id)).toEqual(["first_session"]);
    expect(out.completed.newAchievementIds).toEqual(["first_session"]);
    expect(out.challengeUpdates.length).toBeGreaterThan(0);
    const weekly = out.challengeUpdates.find((u) => u.definitionId === "wk-sessions-3");
    expect(weekly?.progress).toBe(1);
    const throwsCmp = out.comparison.find((c) => c.key === "throws");
    expect(throwsCmp?.previous).toBe(40);
    expect(throwsCmp?.delta).toBe(13);
    expect(out.comparison.find((c) => c.key === "backhandAccuracy")?.delta).toBe(10);
    expect(out.stats.sessions).toBe(2);
  });

  it("first_session is not unlocked twice and history-wide totals include previous sessions", () => {
    const previous = makeSession({ id: "prev", on: day(2026, 9, 7), throws: 60 });
    const unlocked = [{ id: "first_session", unlockedAt: iso(2026, 9, 7), updatedAt: iso(2026, 9, 7), deletedAt: null }];
    const out = run({ previousSessions: [previous], unlockedAchievements: unlocked });
    expect(out.newAchievements.map((a) => a.id)).toEqual(["throws_100"]); // 60 + 53
  });

  it("recommendation reacts to a low feeling and a forehand gap", () => {
    const low = run({ feeling: 1 });
    expect(low.recommendation.he).toContain("עצימות");
    expect(low.recommendation.en.toLowerCase()).toContain("intensity");
    const gap = run({ feeling: 4, difficulty: 3 });
    expect(gap.recommendation.he).toContain("Forehand");
    expect(gap.recommendation.en).toContain("orehand");
  });

  it("falls back to wall-clock time when no seconds were ticked and never exceeds the plan", () => {
    const active = makeActiveSession({ id: "as2", workout, startedAt: iso(2026, 9, 9, 10), elapsedSeconds: 0, results: [], completedExerciseIds: [] });
    const out = finalizeSession({ active, previousSessions: [], personalBests: [], unlockedAchievements: [], xpEvents: [], userChallenges: [], profile: makeProfile(), now: iso(2026, 9, 9, 13) }, { catalog: MANIFEST_EXERCISES });
    expect(out.completed.actualMinutes).toBe(90); // 3 h wall clock capped at the 90-minute plan
    expect(out.completed.throws).toBe(0);
    expect(out.completed.accuracyPct).toBeUndefined();
    expect(out.completed.exercisesCompleted).toBe(0);
    expect(out.xpBreakdown.completion).toBe(0);
    expect(out.newPersonalBestKeys).toEqual([]);
  });

  it("a completed challenge phase earns the +20 bonus", () => {
    const withChallenge = makeWorkout([...workout.phases, makePhase("challenge", [workoutExerciseFrom("ch-8-of-10", 5)])], { totalDurationMinutes: 95, includesChallenge: true });
    const ch = withChallenge.phases[4].exercises[0];
    const active = makeActiveSession({ id: "as3", workout: withChallenge, startedAt: STARTED, elapsedSeconds: 95 * 60, results: [], completedExerciseIds: [ch.id] });
    const out = finalizeSession({ active, previousSessions: [], personalBests: [], unlockedAchievements: [], xpEvents: [], userChallenges: [], profile: makeProfile(), now: NOW }, { catalog: MANIFEST_EXERCISES });
    expect(out.xpBreakdown.challenge).toBe(XP_RULES.challengeBonus);
    expect(out.xpBreakdown.completion).toBe(0); // 1 of 7 exercises
    expect(out.xpEvents.find((e) => e.reason === "session")?.amount).toBe(95 + XP_RULES.challengeBonus);
  });

  it("keeps earlier XP events in the returned stats total", () => {
    const earlier: XpEvent[] = [{ id: "xp:old:session", amount: 300, reason: "session", refId: "old", at: iso(2026, 9, 7), updatedAt: iso(2026, 9, 7) }];
    const out = run({ xpEvents: earlier, previousSessions: [makeSession({ id: "old", on: day(2026, 9, 7) })] });
    expect(out.stats.xpTotal).toBe(300 + out.completed.xpEarned);
  });
});

describe("result helpers", () => {
  it("count throws and catches from logged fields, attempts or streaks", () => {
    expect(throwsOfResult(ratio("backhand_accuracy", 7, 10))).toBe(10);
    expect(throwsOfResult(makeResult({ key: "longest_throw_m", distanceMeters: 40, throws: 3 }))).toBe(3);
    expect(throwsOfResult(makeResult({ key: "throw_count", count: 25 }))).toBe(25);
    expect(throwsOfResult(makeResult({ key: "sprint_time_s", timeSeconds: 3 }))).toBe(0);
    expect(catchesOfResult(ratio("catch_pct", 9, 10))).toBe(9);
    expect(catchesOfResult(makeResult({ key: "catch_streak", streak: 17 }))).toBe(17);
    expect(catchesOfResult(makeResult({ key: "catch_count", count: 12 }))).toBe(12);
    expect(catchesOfResult(ratio("backhand_accuracy", 7, 10))).toBe(0);
  });

  it("sessionRoleMetrics aggregates ratios and takes the best of the rest", () => {
    const metrics = sessionRoleMetrics([
      ratio("backhand_accuracy", 5, 10),
      ratio("backhand_accuracy", 10, 10),
      makeResult({ key: "cod_time_s", timeSeconds: 5.5 }),
      makeResult({ key: "cod_time_s", timeSeconds: 5.1 }),
      makeResult({ key: "catch_streak", streak: 9 }),
      makeResult({ key: "catch_streak", streak: 15 }),
    ]);
    expect(metrics).toEqual({ backhand_accuracy: 75, cod_time_s: 5.1, catch_streak: 15 });
  });
});
