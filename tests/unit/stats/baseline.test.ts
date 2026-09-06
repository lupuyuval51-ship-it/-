import { describe, expect, it } from "vitest";
import { BASELINE_PROTOCOL, baselineSteps, baselineToGoalHints, summarizeBaseline } from "@/engine/baseline";
import { EXERCISE_MANIFEST } from "@/content/manifest";
import { makeResult, ratio } from "../fixtures/statsFixtures";

describe("BASELINE_PROTOCOL", () => {
  it("references the required drills, the role challenge and the confidence ratings", () => {
    const common = BASELINE_PROTOCOL.commonSteps.map((s) => s.exerciseId);
    expect(common).toEqual(["bh-short-gate", "fh-short-gate", "th-target-points", "th-distance-max", "ct-catch-streak", "mv-short-sprints", "mv-cone-cod"]);
    expect(BASELINE_PROTOCOL.roleChallengeExerciseIds.handler).toBe("ch-role-handler");
    expect(BASELINE_PROTOCOL.roleChallengeExerciseIds.allround).toBe("ch-role-hybrid");
    expect(BASELINE_PROTOCOL.confidenceStep.confidenceKeys).toEqual(["backhand", "forehand", "hammer", "deep", "short"]);
    const manifestIds = new Set(EXERCISE_MANIFEST.map((e) => e.id));
    for (const id of BASELINE_PROTOCOL.exerciseIds) expect(manifestIds.has(id), id).toBe(true);
    const steps = baselineSteps("wing");
    expect(steps.map((s) => s.kind)).toEqual(["exercise", "exercise", "exercise", "exercise", "exercise", "exercise", "exercise", "role_challenge", "confidence"]);
    expect(steps[7].exerciseId).toBe("ch-role-wing");
    expect(steps[7].metricKey).toBe("wing_challenge_score");
    expect(BASELINE_PROTOCOL.totalMinutes("wing")).toBe(steps.reduce((sum, s) => sum + s.minutes, 0));
  });
});

describe("summarizeBaseline", () => {
  it("uses the spec wording when the backhand is steadier than the forehand", () => {
    const summary = summarizeBaseline({ backhand_accuracy: 80, forehand_accuracy: 50, longest_throw_m: 35, sprint_time_s: 3.6 }, { forehand: 2, backhand: 4 }, "handler");
    expect(summary.he).toContain("ה-Backhand שלך כרגע יציב יותר מה-Forehand");
    expect(summary.he).toContain("80%");
    expect(summary.he).toContain("50%");
    expect(summary.en).toContain("backhand is currently steadier than your forehand");
    expect(summary.he).toContain("35 מ׳");
    expect(summary.he).toContain("3.6");
    expect(summary.he).toContain("ביטחון נמוך יותר ב-Forehand");
    expect(summary.text).toBe(summary.he);
    expect(summarizeBaseline({ backhand_accuracy: 80, forehand_accuracy: 50 }, {}, "handler", "en").text).toBe(summarizeBaseline({ backhand_accuracy: 80, forehand_accuracy: 50 }, {}, "handler", "en").en);
    // Never judgemental.
    expect(summary.he).not.toMatch(/חלש|גרוע|כישלון/);
    expect(summary.en).not.toMatch(/weak|bad|poor|fail/i);
  });

  it("mentions only measured values and handles the reverse and equal cases", () => {
    const fhBetter = summarizeBaseline({ backhand_accuracy: 40, forehand_accuracy: 70 }, {}, "cutter");
    expect(fhBetter.he).toContain("ה-Forehand שלך כרגע יציב יותר מה-Backhand");
    const similar = summarizeBaseline({ backhand_accuracy: 65, forehand_accuracy: 70 }, {}, "cutter");
    expect(similar.he).toContain("ברמה דומה");
    expect(similar.he).not.toContain("מ׳"); // no distance measured → not mentioned
    const empty = summarizeBaseline({}, {}, "wing");
    expect(empty.lines).toHaveLength(1);
    expect(empty.he).toContain("עדיין אין מדידות");
  });

  it("accepts raw ExerciseResults and includes the role challenge score", () => {
    const results = [ratio("backhand_accuracy", 7, 10), ratio("forehand_accuracy", 7, 10), makeResult({ key: "wing_challenge_score", score: 58 })];
    const summary = summarizeBaseline(results, {}, "wing");
    expect(summary.he).toContain("70%");
    expect(summary.he).toContain("ציון אתגר כנף: 58");
  });
});

describe("baselineToGoalHints", () => {
  it("flags the forehand as weak when it trails the backhand by 15+ points", () => {
    const hints = baselineToGoalHints({ results: { backhand_accuracy: 80, forehand_accuracy: 50 }, confidence: {}, role: "handler" });
    expect(hints.weakSkills).toEqual(["forehand"]);
    expect(hints.primaryGoal).toBe("forehand");
    expect(hints.secondaryGoal).toBe("accuracy");
  });

  it("uses absolute thresholds, confidence ratings and role defaults", () => {
    const hints = baselineToGoalHints({ results: { backhand_accuracy: 55, forehand_accuracy: 58, catch_streak: 6, sprint_time_s: 4.4, longest_throw_m: 20 }, confidence: { hammer: 1 }, role: "runner" });
    expect(hints.weakSkills).toEqual(expect.arrayContaining(["backhand", "forehand", "catching", "speed"]));
    expect(hints.weakSkills.length).toBeLessThanOrEqual(4);
    expect(hints.primaryGoal).toBe("forehand");
    const none = baselineToGoalHints({ results: {}, confidence: {}, role: "defender" });
    expect(none.weakSkills).toEqual([]);
    expect(none.primaryGoal).toBe("defense");
    expect(none.secondaryGoal).toBe("agility");
  });
});
