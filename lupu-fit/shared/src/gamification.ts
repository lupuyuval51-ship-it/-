/** Honest gamification: XP with anti-overtraining caps, triangular levels, idempotent achievements. Pure. */
import type { AchievementId } from './enums.js';

/** Cumulative XP required to REACH level L (L>=1): 100 * L * (L - 1) / 2. */
export function xpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError('level_invalid');
  return (100 * level * (level - 1)) / 2;
}

export function levelFromXp(xp: number): number {
  const safe = Math.max(0, Math.floor(xp));
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * safe) / 100)) / 2));
  while (xpForLevel(level + 1) <= safe) level++;
  while (level > 1 && xpForLevel(level) > safe) level--;
  return level;
}

export interface LevelProgress { level: number; xpIntoLevel: number; xpForNext: number }
export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  return { level, xpIntoLevel: Math.max(0, Math.floor(xp)) - base, xpForNext: xpForLevel(level + 1) - base };
}

export const XP = {
  workout: 50, perSet: 2, perSetCap: 30, pr: 15, prCapPerSession: 3,
  foodDay: 10, proteinDay: 10, weighIn: 5, weeklyGoal: 100,
} as const;

export interface XpAward { sourceType: string; sourceKey: string; amount: number }

/** What counts as a real workout, for workout XP and for the weekly goal alike (an empty "start then finish" is neither). */
export const WORKOUT_BAR = { minMinutes: 10, minSets: 3 } as const;

/** Workout XP: ≥10 min and ≥3 sets, max 1/day, capped at weeklyGoal+1 per week. */
export function workoutXp(i: { date: string; durationMin: number; sets: number; workoutXpAlreadyToday: boolean; workoutXpThisWeek: number; weeklyGoal: number }): XpAward | null {
  if (i.durationMin < WORKOUT_BAR.minMinutes || i.sets < WORKOUT_BAR.minSets || i.workoutXpAlreadyToday) return null;
  if (i.workoutXpThisWeek >= i.weeklyGoal + 1) return null;
  return { sourceType: 'workout', sourceKey: i.date, amount: XP.workout };
}

export function setXp(sessionId: string, setCount: number): XpAward | null {
  const amount = Math.min(Math.max(0, setCount) * XP.perSet, XP.perSetCap);
  return amount > 0 ? { sourceType: 'sets', sourceKey: sessionId, amount } : null;
}

export function prXp(sessionId: string, prCount: number): XpAward | null {
  const n = Math.min(Math.max(0, prCount), XP.prCapPerSession);
  return n > 0 ? { sourceType: 'pr', sourceKey: sessionId, amount: n * XP.pr } : null;
}

const DAY_MS = 86_400_000;
export function dayOffset(todayIso: string, dayIso: string): number {
  return Math.round((Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${dayIso}T00:00:00Z`)) / DAY_MS);
}

/** Day-based rewards pay only for today and the 2 days before it: a back-filled or future-dated entry is logged but earns nothing. */
export const isRewardDay = (todayIso: string, dayIso: string): boolean => { const off = dayOffset(todayIso, dayIso); return off >= 0 && off <= 2; };

/** Food-log day: ≥2 meals, window = today + 2 past days. */
export function foodDayXp(todayIso: string, dayIso: string, mealsLogged: number): XpAward | null {
  if (mealsLogged < 2 || !isRewardDay(todayIso, dayIso)) return null;
  return { sourceType: 'food_day', sourceKey: dayIso, amount: XP.foodDay };
}

/** Protein day: ≥90% of protein target AND ≥80% of kcal target (never rewards undereating); same window as the food day. */
export function proteinDayXp(dayIso: string, i: { proteinG: number; targetProteinG: number; kcal: number; targetKcal: number }, todayIso: string): XpAward | null {
  if (!isRewardDay(todayIso, dayIso)) return null;
  if (i.targetProteinG <= 0 || i.targetKcal <= 0) return null;
  if (i.proteinG < 0.9 * i.targetProteinG || i.kcal < 0.8 * i.targetKcal) return null;
  return { sourceType: 'protein_day', sourceKey: dayIso, amount: XP.proteinDay };
}

/** ISO week key such as 2026-W44. */
export function isoWeekKey(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Weigh-in: once per ISO week, and only for a weigh-in dated in the reward window (a far-future date must not open new weeks). */
export function weighInXp(dateIso: string, alreadyThisWeek: boolean, todayIso: string): XpAward | null {
  return alreadyThisWeek || !isRewardDay(todayIso, dateIso) ? null : { sourceType: 'weigh_in', sourceKey: isoWeekKey(dateIso), amount: XP.weighIn };
}

export function weeklyGoalXp(dateIso: string, workoutsThisWeek: number, weeklyGoal: number): XpAward | null {
  if (weeklyGoal < 1 || workoutsThisWeek < weeklyGoal) return null;
  return { sourceType: 'weekly_goal', sourceKey: isoWeekKey(dateIso), amount: XP.weeklyGoal };
}

/* ------------------------------------------------------------ achievements */

export interface AchievementStats {
  workouts: number; prs: number; consecutiveGoalWeeks: number; weeklyGoalHits: number;
  foodLogDays: number; proteinDays: number; weighIns: number; finishers: number; coachThreads: number;
}

const RULES: Record<AchievementId, (s: AchievementStats) => boolean> = {
  first_workout: (s) => s.workouts >= 1,
  five_workouts: (s) => s.workouts >= 5,
  twenty_five_workouts: (s) => s.workouts >= 25,
  first_pr: (s) => s.prs >= 1,
  five_prs: (s) => s.prs >= 5,
  two_week_streak: (s) => s.consecutiveGoalWeeks >= 2,
  month_streak: (s) => s.consecutiveGoalWeeks >= 4,
  weekly_goal: (s) => s.weeklyGoalHits >= 1,
  first_food_log: (s) => s.foodLogDays >= 1,
  seven_food_days: (s) => s.foodLogDays >= 7,
  protein_week: (s) => s.proteinDays >= 7,
  first_weigh_in: (s) => s.weighIns >= 1,
  first_finisher: (s) => s.finishers >= 1,
  first_coach_chat: (s) => s.coachThreads >= 1,
};

/** Returns only newly unlocked ids (idempotent: already-unlocked ids are never returned twice). */
export function evaluateAchievements(stats: AchievementStats, unlocked: ReadonlySet<AchievementId>): AchievementId[] {
  return (Object.keys(RULES) as AchievementId[]).filter((id) => !unlocked.has(id) && RULES[id](stats));
}
