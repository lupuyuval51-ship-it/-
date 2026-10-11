/**
 * Read-only access to the user's recorded training history, shared by the progress,
 * gamification and dashboard modules. Everything is scoped by `user_id` and expressed in
 * calendar dates of the user's own time zone.
 */
import type { Locale } from '@shared/constants';
import { addDays, startOfWeek, todayInTimeZone } from '@shared/dates';
import { isQualifyingWorkout, weeklyGoalFor } from '@shared/gamification';
import { round1 } from '@shared/nutrition';
import type { PersonalRecordDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { notFound } from '../../lib/errors';
import { getExerciseMap, type ExerciseRecord } from '../exercises/repository';

export interface UserContext {
  userId: string;
  timezone: string;
  locale: Locale;
  /** 0 = weeks start on Sunday (Hebrew), 1 = Monday. */
  weekStart: 0 | 1;
  today: string;
  /** Calendar date the account was created (user time zone). */
  createdOn: string;
  weeklyGoal: number;
  currentWeekStart: string;
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = dateFormatters.get(timeZone);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      f = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
    }
    dateFormatters.set(timeZone, f);
  }
  return f;
}

/** Calendar date (YYYY-MM-DD) of an instant in the given time zone (cached formatter). */
export function localDate(instant: Date, timeZone: string): string {
  const parts = formatterFor(timeZone).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Instant bounds that safely contain every instant of the local dates [from, to] in any time zone. */
export function instantBounds(from: string, to: string): [Date, Date] {
  return [new Date(`${addDays(from, -1)}T00:00:00Z`), new Date(`${addDays(to, 2)}T00:00:00Z`)];
}

export async function loadUserContext(sql: Sql, userId: string): Promise<UserContext> {
  const row = await sql.maybeOne<{
    timezone: string;
    locale: Locale;
    week_start: 0 | 1;
    created_at: Date;
    weekly_workout_goal: number | null;
    days_per_week: number | null;
  }>(
    `SELECT u.timezone, u.locale, u.week_start, u.created_at, p.weekly_workout_goal, p.days_per_week
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  if (!row) throw notFound('user_not_found');
  const weekStart = row.week_start;
  const today = todayInTimeZone(row.timezone);
  return {
    userId,
    timezone: row.timezone,
    locale: row.locale,
    weekStart,
    today,
    createdOn: localDate(new Date(row.created_at), row.timezone),
    weeklyGoal: weeklyGoalFor(row.weekly_workout_goal, row.days_per_week),
    currentWeekStart: startOfWeek(today, weekStart),
  };
}

export interface WorkoutRecord {
  id: string;
  name: string;
  endedAt: Date;
  /** Local calendar date the session ended. */
  date: string;
  durationSeconds: number;
  completedSets: number;
  reps: number;
  volumeKg: number;
  /** Meets the minimum-effort bar (counts toward XP, weekly goal and streaks). */
  qualifies: boolean;
}

interface WorkoutRow {
  id: string;
  name: string;
  ended_at: Date;
  duration_seconds: number;
  completed_sets: number;
  reps: number;
  volume_kg: number;
}

/**
 * Completed sessions (oldest first) with totals derived from their completed sets.
 * With `range` (local dates, inclusive) only sessions that ended in that range are returned.
 */
export async function loadCompletedWorkouts(sql: Sql, ctx: Pick<UserContext, 'userId' | 'timezone'>, range?: { from: string; to: string }): Promise<WorkoutRecord[]> {
  const [lo, hi] = range ? instantBounds(range.from, range.to) : [null, null];
  const rows = await sql.many<WorkoutRow>(
    `SELECT s.id, s.name, COALESCE(s.ended_at, s.started_at) AS ended_at,
            COALESCE(s.duration_seconds,
                     GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (COALESCE(s.ended_at, s.started_at) - s.started_at)))::int - s.paused_seconds)
            )::int AS duration_seconds,
            COALESCE(st.sets, 0)::int AS completed_sets,
            COALESCE(st.reps, 0)::int AS reps,
            COALESCE(st.volume, 0)::float8 AS volume_kg
       FROM workout_sessions s
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS sets,
                SUM(COALESCE(ss.reps, 0)) AS reps,
                SUM(CASE WHEN ss.weight_kg > 0 AND ss.reps > 0 THEN ss.weight_kg * ss.reps ELSE 0 END) AS volume
           FROM session_exercises se
           JOIN session_sets ss ON ss.session_exercise_id = se.id
          WHERE se.session_id = s.id AND se.user_id = s.user_id AND ss.completed
       ) st ON true
      WHERE s.user_id = $1 AND s.status = 'completed'
        AND ($2::timestamptz IS NULL OR COALESCE(s.ended_at, s.started_at) >= $2)
        AND ($3::timestamptz IS NULL OR COALESCE(s.ended_at, s.started_at) < $3)
      ORDER BY COALESCE(s.ended_at, s.started_at), s.id`,
    [ctx.userId, lo, hi],
  );
  const out: WorkoutRecord[] = [];
  for (const r of rows) {
    const endedAt = new Date(r.ended_at);
    const date = localDate(endedAt, ctx.timezone);
    if (range && (date < range.from || date > range.to)) continue;
    out.push({
      id: r.id,
      name: r.name,
      endedAt,
      date,
      durationSeconds: Number(r.duration_seconds) || 0,
      completedSets: Number(r.completed_sets) || 0,
      reps: Number(r.reps) || 0,
      volumeKg: round1(Number(r.volume_kg) || 0),
      qualifies: isQualifyingWorkout(Number(r.duration_seconds) || 0, Number(r.completed_sets) || 0),
    });
  }
  return out;
}

/** Qualifying workouts per week (key = week-start date). */
export function qualifyingWeekCounts(workouts: WorkoutRecord[], weekStart: 0 | 1): Map<string, number> {
  const counts = new Map<string, number>();
  for (const w of workouts) {
    if (!w.qualifies) continue;
    const key = startOfWeek(w.date, weekStart);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export interface ExerciseSetStat {
  sessionId: string;
  exerciseId: string;
  sets: number;
  bestEst1rmKg: number | null;
}

/** Completed sets and best estimated 1RM per (session, exercise) for sessions ended in [from, to]. */
export async function loadExerciseSetStats(sql: Sql, ctx: Pick<UserContext, 'userId'>, from: string, to: string): Promise<ExerciseSetStat[]> {
  const [lo, hi] = instantBounds(from, to);
  const rows = await sql.many<{ session_id: string; exercise_id: string; sets: number; best_e1rm: number | null }>(
    `SELECT s.id AS session_id, se.exercise_id, COUNT(*)::int AS sets,
            MAX(CASE WHEN ss.weight_kg > 0 AND ss.reps = 1 THEN ss.weight_kg::float8
                     WHEN ss.weight_kg > 0 AND ss.reps BETWEEN 2 AND 12 THEN ss.weight_kg::float8 * (1 + ss.reps / 30.0)
                END) AS best_e1rm
       FROM workout_sessions s
       JOIN session_exercises se ON se.session_id = s.id AND se.user_id = s.user_id
       JOIN session_sets ss ON ss.session_exercise_id = se.id
      WHERE s.user_id = $1 AND s.status = 'completed' AND ss.completed
        AND COALESCE(s.ended_at, s.started_at) >= $2 AND COALESCE(s.ended_at, s.started_at) < $3
      GROUP BY s.id, se.exercise_id`,
    [ctx.userId, lo, hi],
  );
  return rows.map((r) => ({
    sessionId: r.session_id,
    exerciseId: r.exercise_id,
    sets: Number(r.sets),
    bestEst1rmKg: r.best_e1rm == null ? null : Math.round(Number(r.best_e1rm) * 10) / 10,
  }));
}

export interface PersonalRecordRow {
  id: string;
  exercise_id: string;
  record_type: PersonalRecordDTO['recordType'];
  value: number;
  previous_value: number | null;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  achieved_at: Date;
  session_id: string | null;
}

export const PR_COLUMNS = 'id, exercise_id, record_type, value, previous_value, weight_kg, reps, duration_seconds, achieved_at, session_id';

export function toPersonalRecordDTO(r: PersonalRecordRow, exercises: Map<string, ExerciseRecord>): PersonalRecordDTO {
  const ex = exercises.get(r.exercise_id);
  return {
    id: r.id,
    exerciseId: r.exercise_id,
    exerciseName: ex ? ex.name : { en: r.exercise_id, he: r.exercise_id },
    recordType: r.record_type,
    value: Number(r.value),
    previousValue: r.previous_value == null ? null : Number(r.previous_value),
    weightKg: r.weight_kg == null ? null : Number(r.weight_kg),
    reps: r.reps == null ? null : Number(r.reps),
    durationSeconds: r.duration_seconds == null ? null : Number(r.duration_seconds),
    achievedAt: new Date(r.achieved_at).toISOString(),
    sessionId: r.session_id,
  };
}

/** Most recent personal records (newest first). */
export async function loadRecentRecords(sql: Sql, userId: string, limit: number, since?: Date): Promise<PersonalRecordDTO[]> {
  const rows = await sql.many<PersonalRecordRow>(
    `SELECT ${PR_COLUMNS} FROM personal_records
      WHERE user_id = $1 AND ($2::timestamptz IS NULL OR achieved_at >= $2)
      ORDER BY achieved_at DESC, created_at DESC, id
      LIMIT $3`,
    [userId, since ?? null, limit],
  );
  const exercises = await getExerciseMap();
  return rows.map((r) => toPersonalRecordDTO(r, exercises));
}

/** Total XP earned so far. */
export async function totalXp(sql: Sql, userId: string): Promise<number> {
  const row = await sql.one<{ total: number }>('SELECT COALESCE(SUM(xp), 0)::int AS total FROM xp_events WHERE user_id = $1', [userId]);
  return Number(row.total);
}
