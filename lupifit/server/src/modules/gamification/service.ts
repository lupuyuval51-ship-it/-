/**
 * Gamification core: idempotent XP awards, achievement evaluation (from recorded data
 * only), notifications, weekly goal and streaks. All writes are idempotent so hooks can be
 * retried safely.
 */
import type { NotificationKind } from '@shared/constants';
import { addDays, dateRange, startOfWeek } from '@shared/dates';
import { ACHIEVEMENTS, XP_RULES, computeWeeklyStreak, levelInfo, type WeeklyStreak, type XpSource } from '@shared/gamification';
import type { AchievementStatusDTO, GamificationDTO, WeeklyGoalDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { getProfile } from '../profile/repository';
import { loadCompletedWorkouts, qualifyingWeekCounts, totalXp, type UserContext, type WorkoutRecord } from '../progress/data';

// ---------------------------------------------------------------------------- XP

/** Inserts an XP event; returns false when this (source, key) was already recorded. */
export async function insertXp(sql: Sql, userId: string, source: XpSource, key: string, xp: number, meta: Record<string, unknown> = {}): Promise<boolean> {
  const row = await sql.maybeOne(
    `INSERT INTO xp_events (user_id, source_type, source_key, xp, meta, created_at) VALUES ($1, $2, $3, $4, $5, clock_timestamp())
     ON CONFLICT (user_id, source_type, source_key) DO NOTHING RETURNING id`,
    [userId, source, key, Math.max(0, Math.min(1000, Math.round(xp))), JSON.stringify(meta)],
  );
  return row != null;
}

// ---------------------------------------------------------------------------- Notifications

/**
 * Creates a notification; with a dedupe key it is created at most once per user.
 * `clock_timestamp()` keeps a stable newest-first order for several notifications created
 * in one transaction (e.g. achievements, then the level-up).
 */
export async function notify(sql: Sql, userId: string, kind: NotificationKind, data: Record<string, unknown>, dedupeKey: string | null): Promise<boolean> {
  const row = await sql.maybeOne(
    `INSERT INTO notifications (user_id, kind, data, dedupe_key, created_at) VALUES ($1, $2, $3, $4, clock_timestamp())
     ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING RETURNING id`,
    [userId, kind, JSON.stringify(data), dedupeKey],
  );
  return row != null;
}

/** Level-up notification + result when the user's level increased since `beforeXp`. */
export async function checkLevelUp(sql: Sql, userId: string, beforeXp: number): Promise<{ from: number; to: number } | null> {
  const from = levelInfo(beforeXp).level;
  const to = levelInfo(await totalXp(sql, userId)).level;
  if (to <= from) return null;
  await notify(sql, userId, 'level_up', { level: to, from }, `level:${to}`);
  return { from, to };
}

// ---------------------------------------------------------------------------- Weekly goal & streak

export interface WeeklyStatus {
  weeklyGoal: WeeklyGoalDTO;
  streak: WeeklyStreak;
  weekCounts: Map<string, number>;
  /** Weeks (any time) in which the goal was met. */
  weeksMet: number;
}

export function weeklyStatus(ctx: UserContext, workouts: WorkoutRecord[]): WeeklyStatus {
  const weekCounts = qualifyingWeekCounts(workouts, ctx.weekStart);
  const completed = weekCounts.get(ctx.currentWeekStart) ?? 0;
  let weeksMet = 0;
  for (const [week, count] of weekCounts) if (week <= ctx.currentWeekStart && count >= ctx.weeklyGoal) weeksMet++;
  return {
    weeklyGoal: { weekStart: ctx.currentWeekStart, target: ctx.weeklyGoal, completed, met: completed >= ctx.weeklyGoal },
    streak: computeWeeklyStreak(weekCounts, ctx.weeklyGoal, ctx.currentWeekStart),
    weekCounts,
    weeksMet,
  };
}

// ---------------------------------------------------------------------------- Achievements

type Metric = 'workouts' | 'weeksMet' | 'longestStreak' | 'prs' | 'foodDays' | 'proteinDays' | 'bodyWeightWeeks' | 'coachQuestions';

/** Which recorded metric drives each achievement's progress. */
const ACHIEVEMENT_METRIC: Record<string, Metric> = {
  first_workout: 'workouts',
  workouts_5: 'workouts',
  workouts_25: 'workouts',
  workouts_100: 'workouts',
  weekly_goal_1: 'weeksMet',
  streak_4_weeks: 'longestStreak',
  streak_12_weeks: 'longestStreak',
  first_pr: 'prs',
  prs_10: 'prs',
  first_food_log: 'foodDays',
  food_log_7_days: 'foodDays',
  protein_target_7_days: 'proteinDays',
  body_weight_4_weeks: 'bodyWeightWeeks',
  coach_first_question: 'coachQuestions',
};

/** Current value of every achievement metric, computed from the user's stored data. */
export async function achievementMetrics(sql: Sql, ctx: UserContext, workouts: WorkoutRecord[]): Promise<Record<Metric, number>> {
  const status = weeklyStatus(ctx, workouts);
  const profile = await getProfile(sql, ctx.userId);
  const proteinTarget = profile.targets?.proteinG ?? null;
  const counts = await sql.one<{ prs: number; food_days: number; protein_days: number; coach: number }>(
    `SELECT
       (SELECT COUNT(*) FROM personal_records WHERE user_id = $1)::int AS prs,
       (SELECT COUNT(DISTINCT logged_on) FROM food_log_entries WHERE user_id = $1 AND logged_on <= $2)::int AS food_days,
       (SELECT COUNT(*) FROM (
          SELECT logged_on FROM food_log_entries WHERE user_id = $1 AND logged_on <= $2
           GROUP BY logged_on HAVING $3::numeric IS NOT NULL AND SUM(protein_g) >= $3::numeric
        ) d)::int AS protein_days,
       (SELECT COUNT(*) FROM coach_messages WHERE user_id = $1 AND role = 'user')::int AS coach`,
    [ctx.userId, ctx.today, proteinTarget == null ? null : proteinTarget * XP_RULES.proteinTargetThreshold],
  );
  const weighIns = await sql.many<{ measured_on: string }>('SELECT measured_on FROM body_weight_entries WHERE user_id = $1', [ctx.userId]);
  const weighInWeeks = new Set(weighIns.map((w) => startOfWeek(w.measured_on, ctx.weekStart)));
  return {
    // A finished session with no completed set is not a workout.
    workouts: workouts.filter((w) => w.completedSets > 0).length,
    weeksMet: status.weeksMet,
    longestStreak: status.streak.longestWeeks,
    prs: Number(counts.prs),
    foodDays: Number(counts.food_days),
    proteinDays: Number(counts.protein_days),
    bodyWeightWeeks: weighInWeeks.size,
    coachQuestions: Math.min(1, Number(counts.coach)),
  };
}

export async function unlockedAchievements(sql: Sql, userId: string): Promise<Map<string, Date>> {
  const rows = await sql.many<{ achievement_id: string; unlocked_at: Date }>(
    'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1',
    [userId],
  );
  return new Map(rows.map((r) => [r.achievement_id, new Date(r.unlocked_at)]));
}

/** Unlocks an achievement (idempotent) and notifies the user the first time. */
export async function unlockAchievement(sql: Sql, userId: string, achievementId: string): Promise<boolean> {
  const row = await sql.maybeOne(
    `INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)
     ON CONFLICT (user_id, achievement_id) DO NOTHING RETURNING achievement_id`,
    [userId, achievementId],
  );
  if (!row) return false;
  await notify(sql, userId, 'achievement', { achievementId }, `achievement:${achievementId}`);
  return true;
}

/** Unlocks every achievement whose recorded progress reached its target; returns the new ones. */
export async function evaluateAchievements(sql: Sql, ctx: UserContext, workouts?: WorkoutRecord[]): Promise<string[]> {
  const history = workouts ?? (await loadCompletedWorkouts(sql, ctx));
  const metrics = await achievementMetrics(sql, ctx, history);
  const unlocked = await unlockedAchievements(sql, ctx.userId);
  const fresh: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    const metric = ACHIEVEMENT_METRIC[a.id];
    if (!metric || metrics[metric] < a.target) continue;
    if (await unlockAchievement(sql, ctx.userId, a.id)) fresh.push(a.id);
  }
  return fresh;
}

// ---------------------------------------------------------------------------- Read model

export async function getGamification(sql: Sql, ctx: UserContext): Promise<GamificationDTO> {
  const workouts = await loadCompletedWorkouts(sql, ctx);
  const status = weeklyStatus(ctx, workouts);
  const metrics = await achievementMetrics(sql, ctx, workouts);
  const unlocked = await unlockedAchievements(sql, ctx.userId);
  const achievements: AchievementStatusDTO[] = ACHIEVEMENTS.map((a) => {
    const metric = ACHIEVEMENT_METRIC[a.id];
    const unlockedAt = unlocked.get(a.id) ?? null;
    const current = metric ? metrics[metric] : 0;
    return {
      id: a.id,
      unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
      progress: { current: unlockedAt ? a.target : Math.min(current, a.target), target: a.target },
    };
  });
  const recent = await sql.many<{ source_type: string; xp: number; created_at: Date }>(
    `SELECT source_type, xp, created_at FROM xp_events WHERE user_id = $1 AND xp > 0 ORDER BY created_at DESC, id LIMIT 20`,
    [ctx.userId],
  );
  return {
    level: levelInfo(await totalXp(sql, ctx.userId)),
    achievements,
    weeklyGoal: status.weeklyGoal,
    streak: status.streak,
    recentXp: recent.map((r) => ({ sourceType: r.source_type, xp: Number(r.xp), createdAt: new Date(r.created_at).toISOString() })),
  };
}

/** Completed workouts per day for the 7 days of the current week. */
export function currentWeekDays(ctx: UserContext, workouts: WorkoutRecord[]): { date: string; workouts: number }[] {
  const days = dateRange(ctx.currentWeekStart, addDays(ctx.currentWeekStart, 6));
  return days.map((date) => ({ date, workouts: workouts.filter((w) => w.date === date).length }));
}
