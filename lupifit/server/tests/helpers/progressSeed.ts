/**
 * SQL seeding helpers for the progress / gamification / dashboard tests: realistic
 * training, nutrition and body-weight history inserted directly (the sessions and
 * nutrition APIs are owned by other modules).
 */
import { db } from '../../src/db/pool';

export interface SeedSet {
  exerciseId: string;
  reps?: number | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
  completed?: boolean;
}

export interface SeedSession {
  endedAt: Date | string;
  durationSeconds?: number;
  status?: 'completed' | 'abandoned' | 'in_progress' | 'paused';
  name?: string;
  sets: SeedSet[];
  planId?: string | null;
  planWorkoutId?: string | null;
}

/** Inserts a session with one session_exercise per distinct exercise and the given sets. */
export async function seedSession(userId: string, s: SeedSession): Promise<string> {
  const ended = new Date(s.endedAt);
  const duration = s.durationSeconds ?? 45 * 60;
  const started = new Date(ended.getTime() - duration * 1000);
  const status = s.status ?? 'completed';
  const open = status === 'in_progress' || status === 'paused';
  const session = await db.one<{ id: string }>(
    `INSERT INTO workout_sessions (user_id, plan_id, plan_workout_id, name, status, started_at, paused_at, ended_at, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      userId,
      s.planId ?? null,
      s.planWorkoutId ?? null,
      s.name ?? 'Seeded workout',
      status,
      started,
      status === 'paused' ? ended : null,
      open ? null : ended,
      open ? null : duration,
    ],
  );
  const exerciseIds = Array.from(new Set(s.sets.map((x) => x.exerciseId)));
  const seIds = new Map<string, string>();
  for (const [position, exerciseId] of exerciseIds.entries()) {
    const se = await db.one<{ id: string }>(
      `INSERT INTO session_exercises (session_id, user_id, exercise_id, position) VALUES ($1, $2, $3, $4) RETURNING id`,
      [session.id, userId, exerciseId, position],
    );
    seIds.set(exerciseId, se.id);
  }
  const setNumbers = new Map<string, number>();
  for (const set of s.sets) {
    const n = (setNumbers.get(set.exerciseId) ?? 0) + 1;
    setNumbers.set(set.exerciseId, n);
    const completed = set.completed ?? true;
    await db.exec(
      `INSERT INTO session_sets (session_exercise_id, session_id, user_id, set_number, reps, weight_kg, duration_seconds, completed, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [seIds.get(set.exerciseId), session.id, userId, n, set.reps ?? null, set.weightKg ?? null, set.durationSeconds ?? null, completed, completed ? ended : null],
    );
  }
  return session.id;
}

/** `count` identical sets of one exercise. */
export const sets = (count: number, set: SeedSet): SeedSet[] => Array.from({ length: count }, () => ({ ...set }));

export async function seedPr(
  userId: string,
  r: { exerciseId: string; recordType: string; value: number; previousValue?: number | null; sessionId?: string | null; achievedAt: Date | string; weightKg?: number; reps?: number },
): Promise<string> {
  const row = await db.one<{ id: string }>(
    `INSERT INTO personal_records (user_id, exercise_id, record_type, value, previous_value, weight_kg, reps, session_id, achieved_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [userId, r.exerciseId, r.recordType, r.value, r.previousValue ?? null, r.weightKg ?? null, r.reps ?? null, r.sessionId ?? null, new Date(r.achievedAt)],
  );
  return row.id;
}

export async function seedFood(
  userId: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  m: { kcal: number; proteinG?: number; carbsG?: number; fatG?: number; fiberG?: number },
  createdAt?: Date,
): Promise<void> {
  await db.exec(
    `INSERT INTO food_log_entries (user_id, logged_on, meal_type, food_name, grams, kcal, protein_g, carbs_g, fat_g, fiber_g, source, created_at)
     VALUES ($1, $2, $3, $4, 100, $5, $6, $7, $8, $9, 'quick_add', COALESCE($10, now()))`,
    [userId, date, mealType, JSON.stringify({ en: 'Test food', he: 'מזון לבדיקה' }), m.kcal, m.proteinG ?? 0, m.carbsG ?? 0, m.fatG ?? 0, m.fiberG ?? 0, createdAt ?? null],
  );
}

export async function seedBodyWeight(userId: string, date: string, weightKg: number): Promise<string> {
  const row = await db.one<{ id: string }>(
    `INSERT INTO body_weight_entries (user_id, measured_on, weight_kg) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, measured_on) DO UPDATE SET weight_kg = EXCLUDED.weight_kg RETURNING id`,
    [userId, date, weightKg],
  );
  return row.id;
}

/** Moves the account creation date back so past weeks count as "tracked" weeks. */
export async function backdateAccount(userId: string, days: number): Promise<void> {
  await db.exec(`UPDATE users SET created_at = now() - make_interval(days => $2) WHERE id = $1`, [userId, days]);
}

/** Active plan with workouts (each with `exercises` plan_exercises rows of the given exercise ids). */
export async function seedPlan(
  userId: string,
  opts: { name?: string; nextWorkoutIndex?: number; workouts: { name: string; focus?: string; estimatedMinutes?: number | null; exercises: string[] }[] },
): Promise<{ planId: string; workoutIds: string[] }> {
  const plan = await db.one<{ id: string }>(
    `INSERT INTO workout_plans (user_id, name, status, source, next_workout_index) VALUES ($1, $2, 'active', 'custom', $3) RETURNING id`,
    [userId, opts.name ?? 'Seeded plan', opts.nextWorkoutIndex ?? 0],
  );
  const workoutIds: string[] = [];
  for (const [position, w] of opts.workouts.entries()) {
    const row = await db.one<{ id: string }>(
      `INSERT INTO plan_workouts (plan_id, user_id, position, name, focus, estimated_minutes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [plan.id, userId, position, w.name, w.focus ?? '', w.estimatedMinutes ?? null],
    );
    workoutIds.push(row.id);
    for (const [i, exerciseId] of w.exercises.entries()) {
      await db.exec(
        `INSERT INTO plan_exercises (workout_id, user_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds)
         VALUES ($1, $2, $3, $4, 3, 8, 12, 90)`,
        [row.id, userId, exerciseId, i],
      );
    }
  }
  return { planId: plan.id, workoutIds };
}

/** Noon UTC on a calendar date (a safe instant for UTC users). */
export const noonUtc = (date: string) => new Date(`${date}T12:00:00Z`);
