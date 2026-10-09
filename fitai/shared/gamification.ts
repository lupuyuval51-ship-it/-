/**
 * Progression rules shared by server (authoritative awarding) and client (display).
 * Design principle: reward consistency and gradual improvement — never excessive
 * training volume, extra sessions beyond a healthy weekly target, or eating less.
 */
import { addDays, diffDays } from './dates';

/** XP rules. Every award is idempotent per (user, source_type, source_key) on the server. */
export const XP_RULES = {
  /** Base XP for a completed workout that meets the minimum-effort bar below. */
  workoutCompleted: 50,
  /** Extra XP per completed set, capped so marathon sessions are not rewarded. */
  perCompletedSet: 2,
  perSessionSetXpCap: 30,
  /** Minimum to count as a workout for XP (prevents tap-through farming). */
  minWorkoutSeconds: 10 * 60,
  minCompletedSets: 3,
  /** At most this many XP-earning workouts per calendar day. */
  maxRewardedWorkoutsPerDay: 1,
  /** Workouts beyond weeklyGoal + this buffer in the same week earn no XP (rest matters). */
  extraWorkoutsPerWeekRewarded: 1,
  personalRecord: 15,
  maxRewardedPrsPerSession: 3,
  /** Logging at least `foodLogMinMeals` different meals on a day. */
  foodLoggedDay: 10,
  foodLogMinMeals: 2,
  /** Food XP is awarded for today and this many previous days only (no back-fill farming). */
  foodRewardWindowDays: 2,
  /** Reaching ≥ 90% of the protein target on a logged day (never rewards eating less). */
  proteinTargetDay: 10,
  proteinTargetThreshold: 0.9,
  /** Body-weight logging is rewarded at most once per week to avoid obsessive weighing. */
  bodyWeightWeekly: 5,
  /** Completing the weekly workout goal. */
  weeklyGoalMet: 100,
} as const;

/** Cumulative XP needed to reach `level` (level 1 = 0 XP; triangular curve ×100). */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return (100 * (n - 1) * n) / 2;
}

export interface LevelInfo {
  level: number;
  totalXp: number;
  levelStartXp: number;
  nextLevelXp: number;
  /** 0..1 progress within the current level. */
  progress: number;
}

export function levelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return { level, totalXp: xp, levelStartXp, nextLevelXp, progress: (xp - levelStartXp) / (nextLevelXp - levelStartXp) };
}

export type AchievementCategory = 'workouts' | 'consistency' | 'strength' | 'nutrition' | 'habits';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  /** Numeric threshold for progress display. */
  target: number;
  /** Emoji icon (decorative; labels come from i18n `achievements.<id>.title/description`). */
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_workout', category: 'workouts', target: 1, icon: '🏁' },
  { id: 'workouts_5', category: 'workouts', target: 5, icon: '💪' },
  { id: 'workouts_25', category: 'workouts', target: 25, icon: '🏋️' },
  { id: 'workouts_100', category: 'workouts', target: 100, icon: '🏆' },
  { id: 'weekly_goal_1', category: 'consistency', target: 1, icon: '📅' },
  { id: 'streak_4_weeks', category: 'consistency', target: 4, icon: '🔥' },
  { id: 'streak_12_weeks', category: 'consistency', target: 12, icon: '⭐' },
  { id: 'first_pr', category: 'strength', target: 1, icon: '📈' },
  { id: 'prs_10', category: 'strength', target: 10, icon: '🚀' },
  { id: 'first_food_log', category: 'nutrition', target: 1, icon: '🥗' },
  { id: 'food_log_7_days', category: 'nutrition', target: 7, icon: '📝' },
  { id: 'protein_target_7_days', category: 'nutrition', target: 7, icon: '🥚' },
  { id: 'body_weight_4_weeks', category: 'habits', target: 4, icon: '⚖️' },
  { id: 'coach_first_question', category: 'habits', target: 1, icon: '💬' },
];

/** `xp_events.source_type` values (labels: `achievements.xpSources.<type>`). */
export const XP_SOURCES = ['workout', 'personal_record', 'weekly_goal', 'food_day', 'protein_day', 'body_weight'] as const;
export type XpSource = (typeof XP_SOURCES)[number];

/**
 * A completed workout counts toward XP, the weekly goal and streaks only when it meets the
 * minimum-effort bar (prevents tap-through farming; short sessions are still recorded).
 */
export function isQualifyingWorkout(durationSeconds: number | null | undefined, completedSets: number): boolean {
  return (durationSeconds ?? 0) >= XP_RULES.minWorkoutSeconds && completedSets >= XP_RULES.minCompletedSets;
}

/** Workouts per week the user aims for: explicit goal, else planned training days, else 3. */
export function weeklyGoalFor(weeklyWorkoutGoal: number | null | undefined, daysPerWeek: number | null | undefined): number {
  const goal = weeklyWorkoutGoal ?? daysPerWeek ?? 3;
  return Math.min(7, Math.max(1, Math.round(goal)));
}

export interface WeeklyStreak {
  /** Consecutive goal-met weeks ending with the current week (if already met) or last week. */
  currentWeeks: number;
  longestWeeks: number;
}

/**
 * Weekly-goal streaks from qualifying-workout counts per week (keys are week-start dates
 * `YYYY-MM-DD`, using the same week-start convention as `currentWeekStart`).
 */
export function computeWeeklyStreak(weekCounts: ReadonlyMap<string, number>, goal: number, currentWeekStart: string): WeeklyStreak {
  const met = new Set<string>();
  for (const [week, count] of weekCounts) if (count >= goal && week <= currentWeekStart) met.add(week);
  let currentWeeks = 0;
  let week = met.has(currentWeekStart) ? currentWeekStart : addDays(currentWeekStart, -7);
  while (met.has(week)) {
    currentWeeks++;
    week = addDays(week, -7);
  }
  let longestWeeks = 0;
  let run = 0;
  let prev: string | null = null;
  for (const w of Array.from(met).sort()) {
    run = prev && diffDays(w, prev) === 7 ? run + 1 : 1;
    longestWeeks = Math.max(longestWeeks, run);
    prev = w;
  }
  return { currentWeeks, longestWeeks: Math.max(longestWeeks, currentWeeks) };
}
