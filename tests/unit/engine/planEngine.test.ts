import { describe, expect, it } from "vitest";
import type { BaselineTest, PlannedSession, Profile } from "@/lib/types";
import { addDaysKey, daysBetween, parseDateKey } from "@/lib/dates";
import { MANIFEST_EXERCISES } from "../fixtures/manifestExercises";
import { validateWorkout } from "@/engine/workoutEngine";
import {
  DELOAD_FACTOR, WEEKLY_CHALLENGE_IDS, adaptPlanForRoleChange, baselineWeakSkills, chooseTrainingDays, generatePlan, loadFactors,
  loadToInputs, markRestDay, postponeSession, rescheduleSession, suggestRestDay, templateFor,
} from "@/engine/planEngine";

const NOW = "2026-09-06T08:00:00.000Z";
const START = "2026-09-06";
const CATALOG = MANIFEST_EXERCISES;

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    name: "Test",
    ageGroup: "adult",
    hand: "right",
    level: "intermediate",
    yearsPlaying: "1to3",
    playContext: "training",
    ultimateExperience: true,
    primaryRole: "handler",
    secondaryRole: "cutter",
    roleIntent: "current",
    goals: [
      { goal: "accuracy", priority: 1 },
      { goal: "forehand", priority: 2 },
    ],
    sessionsPerWeek: 3,
    trainingDays: [0, 2, 4],
    preferredTime: "18:30",
    durationMinutes: 90,
    reminders: true,
    includeFitness: true,
    participants: "pair",
    equipment: ["cones", "discs"],
    fieldSize: "medium",
    wind: "light",
    onboardingCompleted: true,
    roleHistory: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function plan(overrides: Partial<Profile> = {}, weeksCount: 4 | 5 | 6 | 7 | 8 = 6, extra: Partial<Parameters<typeof generatePlan>[0]> = {}) {
  return generatePlan({ profile: profile(overrides), weeksCount, startDate: START, seed: "plan-seed", catalog: CATALOG, now: NOW, ...extra });
}

describe("scheduling helpers", () => {
  it("loadFactors progress by 0.05 with a deload every 4th week and on the last week", () => {
    expect(loadFactors(6)).toEqual([1, 1.05, 1.1, DELOAD_FACTOR, 1.15, DELOAD_FACTOR]);
    expect(loadFactors(4)).toEqual([1, 1.05, 1.1, DELOAD_FACTOR]);
    expect(loadFactors(8)).toEqual([1, 1.05, 1.1, DELOAD_FACTOR, 1.15, 1.2, 1.25, DELOAD_FACTOR]);
    expect(loadToInputs(DELOAD_FACTOR).intensity).toBe("low");
    expect(loadToInputs(1).intensity).toBe("medium");
    expect(loadToInputs(1.2).intensity).toBe("high");
  });

  it("chooses training days from the profile and spreads extra days with a gap", () => {
    expect(chooseTrainingDays([0, 2, 4], 3)).toEqual([0, 2, 4]);
    expect(chooseTrainingDays([0, 2, 4, 5], 2)).toEqual([0, 4]);
    const spread = chooseTrainingDays([1], 3);
    expect(spread).toHaveLength(3);
    expect(spread).toContain(1);
    for (let i = 1; i < spread.length; i++) expect(spread[i] - spread[i - 1]).toBeGreaterThanOrEqual(2);
    expect(chooseTrainingDays([], 2)).toHaveLength(2);
    expect(chooseTrainingDays([3], 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(suggestRestDay([0, 2, 4])).toBe(5);
    expect(suggestRestDay([])).toBe(6);
  });

  it("rotates templates: technique → movement_role → game_challenge (→ mixed for 4+)", () => {
    expect([0, 1, 2].map((i) => templateFor(i, 3))).toEqual(["technique", "movement_role", "game_challenge"]);
    expect([0, 1, 2, 3, 4].map((i) => templateFor(i, 5))).toEqual(["technique", "movement_role", "game_challenge", "mixed", "technique"]);
    expect(templateFor(3, 3)).toBe("technique");
  });

  it("derives weak skills from a baseline", () => {
    const weak = baselineWeakSkills({ results: { backhand_accuracy: 80, forehand_accuracy: 50, catch_streak: 5 }, confidence: { hammer: 1 } });
    expect(weak[0]).toBe("forehand");
    expect(weak).toContain("catching");
    expect(weak).toContain("hammer");
    expect(baselineWeakSkills({ results: {}, confidence: {} })).toEqual([]);
  });
});

describe("generatePlan", () => {
  it("creates weeksCount weeks × sessionsPerWeek sessions with unique dates and valid workouts", () => {
    const { plan: p, weeks, sessions, workouts } = plan();
    expect(weeks).toHaveLength(6);
    expect(sessions).toHaveLength(18);
    expect(workouts).toHaveLength(18);
    expect(p.weeksCount).toBe(6);
    expect(p.sessionsPerWeek).toBe(3);
    expect(p.role).toBe("handler");
    expect(p.secondaryRole).toBe("cutter");
    expect(p.status).toBe("active");
    expect(p.source).toBe("engine");
    expect(p.weekIds).toEqual(weeks.map((w) => w.id));
    expect(p.startDate).toBe(START);
    expect(p.title.he).toContain("6 שבועות");

    const dates = sessions.map((s) => s.date);
    expect(new Set(dates).size).toBe(dates.length);
    const workoutIds = new Set(workouts.map((w) => w.id));
    expect(workoutIds.size).toBe(workouts.length);

    for (const s of sessions) {
      const week = weeks[s.weekIndex];
      expect(week.id).toBe(s.weekId);
      expect(week.sessionIds).toContain(s.id);
      const offset = daysBetween(week.startDate, s.date);
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThanOrEqual(6);
      expect([0, 2, 4]).toContain(s.dayOfWeek);
      expect(parseDateKey(s.date).getDay()).toBe(s.dayOfWeek);
      expect(s.time).toBe("18:30");
      expect(s.durationMinutes).toBe(90);
      expect(s.status).toBe("planned");
      expect(s.planId).toBe(p.id);
      expect(s.role).toBe("handler");
      expect(workoutIds.has(s.workoutId)).toBe(true);
      expect(s.goals.length).toBeGreaterThan(0);
    }

    for (const w of workouts) {
      const v = validateWorkout(w, { participants: "pair", equipment: ["cones", "discs"], expectedDuration: 90, catalog: CATALOG });
      expect(v.errors, w.id).toEqual([]);
      expect(w.totalDurationMinutes).toBe(90);
      expect(w.targetRole).toBe("handler");
    }
  });

  it("applies progressive overload with deload weeks without changing minutes", () => {
    const { weeks, sessions, workouts } = plan();
    expect(weeks.map((w) => w.loadFactor)).toEqual([1, 1.05, 1.1, DELOAD_FACTOR, 1.15, DELOAD_FACTOR]);
    for (const w of weeks) {
      expect(w.startDate).toBe(addDaysKey(START, w.index * 7));
      expect(w.totalMinutes).toBe(270);
      expect(w.restDay).toBe(5);
      expect(WEEKLY_CHALLENGE_IDS).toContain(w.challengeId);
      expect(w.focusSkills.length).toBeGreaterThan(0);
      expect(w.theme.he.length).toBeGreaterThan(0);
      expect(w.goal.en.length).toBeGreaterThan(0);
    }
    expect(weeks[3].challengeId).toBe("wk-sessions-3");
    expect(weeks[5].challengeId).toBe("wk-90min");
    const deloadSessions = sessions.filter((s) => s.weekIndex === 3);
    for (const s of deloadSessions) expect(s.intensity).toBe("low");
    const byId = new Map(workouts.map((w) => [w.id, w]));
    for (const s of sessions) expect(byId.get(s.workoutId)!.totalDurationMinutes).toBe(90);
    const heavy = sessions.find((s) => s.weekIndex === 4)!;
    expect(byId.get(heavy.workoutId)!.intensity).toBe("high");
  });

  it("rotates session templates inside every week and adds mixed for 4+ sessions", () => {
    const { sessions } = plan();
    for (let i = 0; i < 6; i++) {
      const week = sessions.filter((s) => s.weekIndex === i).sort((a, b) => a.date.localeCompare(b.date));
      expect(week.map((s) => s.templateType)).toEqual(["technique", "movement_role", "game_challenge"]);
    }
    const four = plan({ sessionsPerWeek: 4, trainingDays: [0, 1, 3, 5] }, 4);
    expect(four.sessions).toHaveLength(16);
    const templates = four.sessions.filter((s) => s.weekIndex === 0).map((s) => s.templateType);
    expect(templates).toContain("mixed");
  });

  it("spreads sessions when the profile has fewer training days than sessions", () => {
    const { sessions } = plan({ sessionsPerWeek: 3, trainingDays: [1] }, 4);
    expect(sessions).toHaveLength(12);
    for (let i = 0; i < 4; i++) {
      const week = sessions.filter((s) => s.weekIndex === i).sort((a, b) => a.date.localeCompare(b.date));
      expect(week).toHaveLength(3);
      expect(new Set(week.map((s) => s.date)).size).toBe(3);
      for (let j = 1; j < week.length; j++) expect(daysBetween(week[j - 1].date, week[j].date)).toBeGreaterThanOrEqual(2);
      expect(week.some((s) => s.dayOfWeek === 1)).toBe(true);
    }
  });

  it("puts a weak forehand (baseline) in the primary goal of weeks 1–2", () => {
    const baseline: BaselineTest = {
      id: "b1",
      takenAt: NOW,
      results: { backhand_accuracy: 80, forehand_accuracy: 45 },
      confidence: { backhand: 4, forehand: 2 },
      role: "handler",
      participants: "pair",
      summary: { he: "", en: "" },
      updatedAt: NOW,
    };
    const { weeks, sessions, workouts } = plan({ goals: [{ goal: "accuracy", priority: 1 }] }, 4, { baseline });
    const byId = new Map(workouts.map((w) => [w.id, w]));
    for (const s of sessions.filter((x) => x.weekIndex <= 1)) {
      expect(s.goals).toContain("forehand");
      expect(byId.get(s.workoutId)!.tags).toContain("forehand");
    }
    expect(weeks[0].focusSkills).toContain("forehand");
    expect(weeks[0].challengeId).toBe("wk-forehand-50");

    const fromStats = plan({}, 4, { stats: { weakSkills: ["catching"], strongSkills: ["backhand"] } });
    expect(fromStats.weeks[0].challengeId).toBe("wk-catch-streak-20");
    expect(fromStats.sessions[0].goals).toContain("catching");
  });

  it("weights the role phase by ROLE_FOCUS for other roles and all-round players", () => {
    for (const role of ["wing", "runner", "defender", "cutter", "hybrid", "allround"] as const) {
      const { plan: p, sessions, workouts } = plan({ primaryRole: role, secondaryRole: undefined }, 4);
      expect(p.role).toBe(role);
      expect(p.secondaryRole).toBeUndefined();
      for (const s of sessions) expect(s.role).toBe(role);
      for (const w of workouts) {
        expect(w.targetRole).toBe(role);
        expect(validateWorkout(w, { expectedDuration: 90 }).ok).toBe(true);
      }
    }
  });

  it("is deterministic for the same seed", () => {
    const a = plan();
    const b = plan();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const c = generatePlan({ profile: profile(), weeksCount: 6, startDate: START, seed: "other", catalog: CATALOG, now: NOW });
    expect(c.plan.id).not.toBe(a.plan.id);
  });

  it("supports every duration and 4–8 weeks", () => {
    for (const weeksCount of [4, 5, 7, 8] as const) {
      for (const durationMinutes of [105, 120] as const) {
        const { weeks, sessions, workouts } = plan({ durationMinutes, sessionsPerWeek: 2, trainingDays: [1, 4] }, weeksCount);
        expect(weeks).toHaveLength(weeksCount);
        expect(sessions).toHaveLength(weeksCount * 2);
        expect(weeks[weeksCount - 1].loadFactor).toBe(DELOAD_FACTOR);
        for (const w of workouts) expect(w.totalDurationMinutes).toBe(durationMinutes);
      }
    }
  });
});

describe("adaptPlanForRoleChange", () => {
  it("keeps completed sessions and regenerates future ones with the new role", () => {
    const current = plan();
    const completedIds = new Set(current.sessions.filter((s) => s.weekIndex === 0).map((s) => s.id));
    const withCompleted = {
      ...current,
      sessions: current.sessions.map((s) => (completedIds.has(s.id) ? { ...s, status: "completed" as const, completedSessionId: `cs_${s.id}` } : s)),
    };
    const later = "2026-09-14T08:00:00.000Z";
    const adapted = adaptPlanForRoleChange(withCompleted, profile({ primaryRole: "cutter", secondaryRole: "handler" }), { catalog: CATALOG, now: later, seed: "adapt" });

    expect(adapted.plan.role).toBe("cutter");
    expect(adapted.plan.secondaryRole).toBe("handler");
    expect(adapted.plan.adaptationNotes).toHaveLength(1);
    expect(adapted.plan.adaptationNotes[0].at).toBe(later);
    expect(adapted.explanation.he).toContain("Cutter");
    expect(adapted.explanation.en).toContain("Cutter");
    expect(adapted.sessions).toHaveLength(18);
    expect(adapted.weeks).toHaveLength(6);

    const byId = new Map(adapted.workouts.map((w) => [w.id, w]));
    const oldById = new Map(current.workouts.map((w) => [w.id, w]));
    for (const s of adapted.sessions) {
      const original = withCompleted.sessions.find((x) => x.id === s.id)!;
      if (completedIds.has(s.id)) {
        expect(s).toEqual(original);
        expect(s.role).toBe("handler");
        expect(byId.get(s.workoutId)).toEqual(oldById.get(s.workoutId));
      } else {
        expect(s.role).toBe("cutter");
        expect(s.status).toBe("planned");
        expect(s.date).toBe(original.date);
        expect(s.time).toBe(original.time);
        expect(s.templateType).toBe(original.templateType);
        expect(s.workoutId).not.toBe(original.workoutId);
        expect(s.updatedAt).toBe(later);
        const w = byId.get(s.workoutId)!;
        expect(w.targetRole).toBe("cutter");
        expect(w.secondaryRole).toBe("handler");
        expect(validateWorkout(w, { participants: "pair", equipment: ["cones", "discs"], expectedDuration: 90 }).ok).toBe(true);
      }
    }
    expect(adapted.workouts).toHaveLength(18);
    for (const id of adapted.removedWorkoutIds) expect(byId.has(id)).toBe(false);
    expect(adapted.removedWorkoutIds).toHaveLength(15);
    expect(adapted.weeks[0]).toEqual(current.weeks[0]);
    expect(adapted.weeks[1].updatedAt).toBe(later);
  });
});

describe("session helpers", () => {
  const base: PlannedSession = {
    id: "s1",
    planId: "p",
    weekId: "w",
    weekIndex: 0,
    dayOfWeek: 0,
    date: START,
    time: "18:30",
    durationMinutes: 90,
    workoutId: "wk",
    title: { he: "אימון", en: "Session" },
    role: "handler",
    intensity: "medium",
    goals: ["accuracy"],
    templateType: "technique",
    status: "planned",
    updatedAt: NOW,
  };

  it("rescheduleSession moves date/time and re-plans a postponed session", () => {
    const moved = rescheduleSession({ ...base, status: "postponed" }, "2026-09-09", "07:00", NOW);
    expect(moved.date).toBe("2026-09-09");
    expect(moved.time).toBe("07:00");
    expect(moved.dayOfWeek).toBe(3);
    expect(moved.status).toBe("planned");
    expect(base.date).toBe(START);
    expect(rescheduleSession(base, "2026-09-10").time).toBe("18:30");
  });

  it("postponeSession moves to the next free day", () => {
    const others: PlannedSession[] = [
      { ...base, id: "s2", date: "2026-09-07" },
      { ...base, id: "s3", date: "2026-09-08" },
      { ...base, id: "s4", date: "2026-09-09", status: "cancelled" },
    ];
    const moved = postponeSession(base, others, NOW);
    expect(moved.date).toBe("2026-09-09");
    expect(moved.status).toBe("postponed");
    expect(moved.dayOfWeek).toBe(3);
    expect(postponeSession(base).date).toBe("2026-09-07");
  });

  it("markRestDay cancels the sessions of that date and keeps the others untouched", () => {
    const sessions: PlannedSession[] = [base, { ...base, id: "s2", date: "2026-09-08" }];
    const out = markRestDay(sessions, START, NOW);
    expect(out[0].restDay).toBe(true);
    expect(out[0].status).toBe("cancelled");
    expect(out[1]).toBe(sessions[1]);
    expect(sessions[0].status).toBe("planned");
  });
});
