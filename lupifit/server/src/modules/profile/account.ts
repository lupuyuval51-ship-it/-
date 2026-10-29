/**
 * Account data export ("download my data") and account deletion.
 *
 * The export uses explicit column lists per table (an allow-list), so secrets such as password
 * hashes, session/CSRF tokens, reset tokens and idempotency records can never leak into it, even
 * when columns are added later. `EXPORTED_TABLES` / `EXCLUDED_TABLES` together must cover every
 * table that holds per-user rows (enforced by a test), so new user data is never silently
 * missing from the export.
 */
import { todayInTimeZone } from '@shared/dates';
import type { AccountExportDTO, ExportRecord, UserDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { getUserDTO } from '../auth/users';
import { getProfile } from './repository';

/** Tables with per-user rows that are included in the export. */
export const EXPORTED_TABLES = [
  'profiles',
  'body_weight_entries',
  'workout_plans',
  'plan_workouts',
  'plan_exercises',
  'workout_sessions',
  'session_exercises',
  'session_sets',
  'readiness_checkins',
  'personal_records',
  'foods',
  'food_log_entries',
  'saved_meals',
  'saved_meal_items',
  'coach_threads',
  'coach_messages',
  'xp_events',
  'user_achievements',
  'notifications',
  'ai_usage_events',
  'coach_usage',
] as const;

/** Tables with per-user rows that are deliberately NOT exported (secrets / internal bookkeeping). */
export const EXCLUDED_TABLES: Record<string, string> = {
  auth_sessions: 'session and CSRF tokens',
  password_reset_tokens: 'password reset tokens',
  idempotency_keys: 'internal duplicate-request cache',
};

const camel = (key: string) => key.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

function camelRows(rows: Record<string, unknown>[]): ExportRecord[] {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v])));
}

function groupBy(rows: ExportRecord[], key: string): Map<unknown, ExportRecord[]> {
  const map = new Map<unknown, ExportRecord[]>();
  for (const row of rows) {
    const k = row[key];
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

/** Strips a parent-id column that is implied by the nesting. */
const without = (row: ExportRecord, key: string): ExportRecord => {
  const { [key]: _omit, ...rest } = row;
  return rest;
};

/**
 * Everything stored for the user. Runs in one REPEATABLE READ transaction (pass a
 * `db.tx` handle) so the export is a consistent snapshot.
 */
export async function buildAccountExport(sql: Sql, userId: string, now = new Date()): Promise<AccountExportDTO> {
  await sql.exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  const user = (await getUserDTO(sql, userId)) as UserDTO;
  const profile = await getProfile(sql, userId);
  const q = async (text: string) => camelRows(await sql.many(text, [userId]));

  const bodyWeights = await q(
    `SELECT id, measured_on, weight_kg, note, created_at, updated_at
       FROM body_weight_entries WHERE user_id = $1 ORDER BY measured_on`,
  );

  const plans = await q(
    `SELECT id, name, description, status, goal, split_type, days_per_week, session_minutes, source, generator_version,
            generation_input, generation_notes, next_workout_index, created_at, updated_at
       FROM workout_plans WHERE user_id = $1 ORDER BY created_at`,
  );
  const planWorkouts = await q(
    `SELECT id, plan_id, position, name, focus, notes, estimated_minutes, created_at, updated_at
       FROM plan_workouts WHERE user_id = $1 ORDER BY plan_id, position`,
  );
  const planExercises = await q(
    `SELECT id, workout_id, exercise_id, position, sets, rep_min, rep_max, target_seconds, rest_seconds, target_rpe,
            target_weight_kg, notes, created_at, updated_at
       FROM plan_exercises WHERE user_id = $1 ORDER BY workout_id, position`,
  );
  const exercisesByWorkout = groupBy(planExercises, 'workoutId');
  const workoutsByPlan = groupBy(planWorkouts, 'planId');
  const workoutPlans = plans.map((plan) => ({
    ...plan,
    workouts: (workoutsByPlan.get(plan.id) ?? []).map((w) => ({
      ...without(w, 'planId'),
      exercises: (exercisesByWorkout.get(w.id) ?? []).map((e) => without(e, 'workoutId')),
    })),
  }));

  const sessions = await q(
    `SELECT id, plan_id, plan_workout_id, name, status, started_at, paused_at, paused_seconds, ended_at, duration_seconds,
            current_exercise_index, rest_timer, total_volume_kg, total_sets, total_reps, perceived_exertion, notes,
            readiness, readiness_adjusted, xp_awarded, rewards, created_at, updated_at
       FROM workout_sessions WHERE user_id = $1 ORDER BY started_at`,
  );
  const sessionExercises = await q(
    `SELECT id, session_id, exercise_id, position, rep_min, rep_max, target_seconds, rest_seconds, target_rpe,
            target_weight_kg, notes, suggestion, created_at, updated_at
       FROM session_exercises WHERE user_id = $1 ORDER BY session_id, position`,
  );
  const sessionSets = await q(
    `SELECT id, session_exercise_id, set_number, target_reps, target_weight_kg, target_seconds, reps, weight_kg,
            duration_seconds, rpe, completed, completed_at, created_at, updated_at
       FROM session_sets WHERE user_id = $1 ORDER BY session_exercise_id, set_number`,
  );
  const setsByExercise = groupBy(sessionSets, 'sessionExerciseId');
  const exercisesBySession = groupBy(sessionExercises, 'sessionId');
  const workoutSessions = sessions.map((s) => ({
    ...s,
    exercises: (exercisesBySession.get(s.id) ?? []).map((e) => ({
      ...without(e, 'sessionId'),
      sets: (setsByExercise.get(e.id) ?? []).map((set) => without(set, 'sessionExerciseId')),
    })),
  }));

  const readinessCheckins = await q(
    `SELECT id, checked_on, energy, soreness, sleep, created_at, updated_at
       FROM readiness_checkins WHERE user_id = $1 ORDER BY checked_on`,
  );

  const personalRecords = await q(
    `SELECT id, exercise_id, record_type, value, previous_value, weight_kg, reps, duration_seconds, session_id, set_id,
            achieved_at, created_at
       FROM personal_records WHERE user_id = $1 ORDER BY achieved_at`,
  );

  const customFoods = await q(
    `SELECT id, source, name, brand, barcode, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg,
            serving_grams, serving_label, allergens, animal_source, contains, created_at, updated_at
       FROM foods WHERE owner_user_id = $1 ORDER BY created_at`,
  );
  const foodLog = await q(
    `SELECT id, logged_on, meal_type, food_id, food_name, grams, servings, kcal, protein_g, carbs_g, fat_g, fiber_g,
            is_corrected, source, note, created_at, updated_at
       FROM food_log_entries WHERE user_id = $1 ORDER BY logged_on, created_at`,
  );

  const meals = await q(
    `SELECT id, name, meal_type, created_at, updated_at FROM saved_meals WHERE user_id = $1 ORDER BY created_at`,
  );
  const mealItems = await q(
    `SELECT i.id, i.saved_meal_id, i.food_id, f.name AS food_name, i.grams, i.position
       FROM saved_meal_items i JOIN foods f ON f.id = i.food_id
      WHERE i.user_id = $1 ORDER BY i.saved_meal_id, i.position`,
  );
  const itemsByMeal = groupBy(mealItems, 'savedMealId');
  const savedMeals = meals.map((m) => ({ ...m, items: (itemsByMeal.get(m.id) ?? []).map((i) => without(i, 'savedMealId')) }));

  const threads = await q(`SELECT id, title, created_at, updated_at FROM coach_threads WHERE user_id = $1 ORDER BY created_at`);
  const messages = await q(
    `SELECT id, thread_id, role, content, source, status, model, input_tokens, output_tokens, created_at
       FROM coach_messages WHERE user_id = $1 ORDER BY thread_id, created_at`,
  );
  const messagesByThread = groupBy(messages, 'threadId');
  const coachThreads = threads.map((t) => ({ ...t, messages: (messagesByThread.get(t.id) ?? []).map((m) => without(m, 'threadId')) }));

  const xpEvents = await q(`SELECT id, source_type, source_key, xp, meta, created_at FROM xp_events WHERE user_id = $1 ORDER BY created_at`);
  const achievements = await q(`SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at`);
  const notifications = await q(`SELECT id, kind, data, read_at, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at`);
  // Metered AI feature usage (kind + time only; no prompts, images or outputs are ever stored).
  const aiUsage = [
    ...(await q(`SELECT kind, created_at FROM ai_usage_events WHERE user_id = $1`)),
    ...(await q(`SELECT 'coach_message' AS kind, created_at FROM coach_usage WHERE user_id = $1`)),
  ].sort((x, y) => new Date(x.createdAt as Date).getTime() - new Date(y.createdAt as Date).getTime());

  return {
    format: 'fitai-export',
    version: 1,
    exportedAt: now.toISOString(),
    exportDate: todayInTimeZone(user.timezone, now),
    user,
    profile,
    bodyWeights,
    workoutPlans,
    workoutSessions,
    readinessCheckins,
    personalRecords,
    customFoods,
    foodLog,
    savedMeals,
    coachThreads,
    xpEvents,
    achievements,
    notifications,
    aiUsage,
  };
}
