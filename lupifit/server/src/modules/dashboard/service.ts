/** Home-screen summary assembled from the user's own records (nothing is invented). */
import { levelInfo } from '@shared/gamification';
import { ZERO_MACROS, round1 } from '@shared/nutrition';
import type { DashboardDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { unreadCount } from '../gamification/notifications';
import { currentWeekDays, weeklyStatus } from '../gamification/service';
import { getProfile } from '../profile/repository';
import { loadCompletedWorkouts, loadRecentRecords, totalXp, type UserContext } from '../progress/data';
import { computeOverview } from '../progress/overview';

/** Rough duration for a plan day when the plan has no estimate: work (~40 s per rep-based set) + rest per set. */
const DEFAULT_SET_WORK_SECONDS = 40;

async function nextWorkout(sql: Sql, userId: string): Promise<Pick<DashboardDTO, 'activePlan' | 'nextWorkout'>> {
  const plan = await sql.maybeOne<{ id: string; name: string; next_workout_index: number }>(
    `SELECT id, name, next_workout_index FROM workout_plans WHERE user_id = $1 AND status = 'active'
      ORDER BY updated_at DESC LIMIT 1`,
    [userId],
  );
  if (!plan) return { activePlan: null, nextWorkout: null };
  const days = await sql.many<{
    id: string;
    name: string;
    focus: string;
    estimated_minutes: number | null;
    exercise_count: number;
    est_seconds: number;
  }>(
    `SELECT w.id, w.name, w.focus, w.estimated_minutes,
            COUNT(e.id)::int AS exercise_count,
            COALESCE(SUM(e.sets * (COALESCE(e.target_seconds, $3) + e.rest_seconds)), 0)::int AS est_seconds
       FROM plan_workouts w
       LEFT JOIN plan_exercises e ON e.workout_id = w.id AND e.user_id = w.user_id
      WHERE w.plan_id = $1 AND w.user_id = $2
      GROUP BY w.id
      ORDER BY w.position, w.created_at`,
    [plan.id, userId, DEFAULT_SET_WORK_SECONDS],
  );
  const activePlan = { id: plan.id, name: plan.name };
  if (!days.length) return { activePlan, nextWorkout: null };
  const index = ((plan.next_workout_index % days.length) + days.length) % days.length;
  const day = days[index]!;
  const estimated =
    day.estimated_minutes != null
      ? Number(day.estimated_minutes)
      : day.exercise_count > 0
        ? Math.max(5, Math.round(Number(day.est_seconds) / 60 / 5) * 5)
        : null;
  return {
    activePlan,
    nextWorkout: {
      planId: plan.id,
      workoutId: day.id,
      name: day.name,
      focus: day.focus,
      exerciseCount: Number(day.exercise_count),
      estimatedMinutes: estimated,
    },
  };
}

export async function getDashboard(sql: Sql, ctx: UserContext): Promise<DashboardDTO> {
  const { userId } = ctx;
  const plan = await nextWorkout(sql, userId);

  const active = await sql.maybeOne<{ id: string; name: string; status: 'in_progress' | 'paused'; started_at: Date }>(
    `SELECT id, name, status, started_at FROM workout_sessions
      WHERE user_id = $1 AND status IN ('in_progress', 'paused') ORDER BY started_at DESC LIMIT 1`,
    [userId],
  );
  const last = await sql.maybeOne<{ id: string; name: string; ended_at: Date | null; started_at: Date; duration_seconds: number | null }>(
    `SELECT id, name, ended_at, started_at, duration_seconds FROM workout_sessions
      WHERE user_id = $1 AND status = 'completed'
      ORDER BY COALESCE(ended_at, started_at) DESC LIMIT 1`,
    [userId],
  );

  const food = await sql.one<{ kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; entries: number; last_at: Date | null }>(
    `SELECT COALESCE(SUM(kcal), 0)::float8 AS kcal, COALESCE(SUM(protein_g), 0)::float8 AS protein_g,
            COALESCE(SUM(carbs_g), 0)::float8 AS carbs_g, COALESCE(SUM(fat_g), 0)::float8 AS fat_g,
            COALESCE(SUM(fiber_g), 0)::float8 AS fiber_g, COUNT(*)::int AS entries, MAX(created_at) AS last_at
       FROM food_log_entries WHERE user_id = $1 AND logged_on = $2`,
    [userId, ctx.today],
  );
  const profile = await getProfile(sql, userId);

  const workouts = await loadCompletedWorkouts(sql, ctx);
  const status = weeklyStatus(ctx, workouts);
  const overview = await computeOverview(sql, ctx, 30, workouts);

  return {
    today: ctx.today,
    activePlan: plan.activePlan,
    nextWorkout: plan.nextWorkout,
    activeSession: active
      ? { id: active.id, name: active.name, status: active.status, startedAt: new Date(active.started_at).toISOString() }
      : null,
    lastWorkout: last
      ? {
          id: last.id,
          name: last.name,
          endedAt: new Date(last.ended_at ?? last.started_at).toISOString(),
          durationSeconds: last.duration_seconds == null ? null : Number(last.duration_seconds),
        }
      : null,
    nutritionToday: {
      totals: Number(food.entries)
        ? {
            kcal: Math.round(Number(food.kcal)),
            proteinG: round1(Number(food.protein_g)),
            carbsG: round1(Number(food.carbs_g)),
            fatG: round1(Number(food.fat_g)),
            fiberG: round1(Number(food.fiber_g)),
          }
        : { ...ZERO_MACROS },
      targets: profile.targets,
      entryCount: Number(food.entries),
      lastLoggedAt: food.last_at ? new Date(food.last_at).toISOString() : null,
    },
    weeklyGoal: status.weeklyGoal,
    weekDays: currentWeekDays(ctx, workouts),
    streakWeeks: status.streak.currentWeeks,
    level: levelInfo(await totalXp(sql, userId)),
    recentRecords: await loadRecentRecords(sql, userId, 3),
    unreadNotifications: await unreadCount(sql, userId),
    insights: overview.insights.slice(0, 2),
  };
}
