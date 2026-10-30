/**
 * Write side of the sessions module. Every function expects to run inside `db.tx` and
 * locks the session row first (`requireOpenSession` → SELECT … FOR UPDATE) so concurrent
 * edits never interleave with finishing the workout.
 */
import type { Locale } from '@shared/constants';
import { dateInTimeZone } from '@shared/dates';
import {
  SESSION_LIMITS,
  type AddSessionExerciseInput,
  type FinishSessionInput,
  type SessionStateInput,
  type StartSessionInput,
  type UpdateSessionExerciseInput,
  type UpdateSetInput,
} from '@shared/schemas/sessions';
import { easierRpe, easierSets, readinessLevel, type ReadinessCheckin, type ReadinessLevel } from '@shared/readiness';
import { MAX_REST_SECONDS, isValidTimerState, type RestTimerState } from '@shared/timer';
import type { ProgressionSuggestionDTO, SessionSetDTO, SessionSummaryDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { getExercise, type ExerciseRecord } from '../exercises/repository';
import { onWorkoutCompleted } from '../gamification/hooks';
import { holdSuggestion, suggestProgressions } from './progression';
import { insertRecords, loadPreviousBests, detectRecords } from './records';
import {
  buildSummary,
  completedSetsOf,
  computeTotals,
  exerciseRecord,
  requireOpenSession,
  requireSession,
  requireSessionExercise,
  requireSessionSet,
  toSetDTO,
  type SessionSetRow,
} from './repository';

export interface SessionUser {
  id: string;
  locale: Locale;
  timezone: string;
}

const DEFAULT_EMPTY_NAME: Record<Locale, string> = { he: 'אימון חופשי', en: 'Quick workout' };

/** Serializes "start" requests of one user so the one-open-session rule yields a clean 409. */
async function lockUser(sql: Sql, userId: string) {
  await sql.exec('SELECT pg_advisory_xact_lock(hashtextextended($1, 7301))', [userId]);
}

/** Sensible defaults for an exercise added on the fly (no plan prescription). */
export function defaultPrescription(e: Pick<ExerciseRecord, 'trackingType' | 'isCompound' | 'category'>) {
  switch (e.trackingType) {
    case 'weight_reps':
      return e.isCompound
        ? { repMin: 6, repMax: 10, targetSeconds: null, restSeconds: 120 }
        : { repMin: 10, repMax: 15, targetSeconds: null, restSeconds: 75 };
    case 'reps':
      return { repMin: 8, repMax: 15, targetSeconds: null, restSeconds: e.isCompound ? 90 : 60 };
    case 'time':
      return e.category === 'cardio'
        ? { repMin: null, repMax: null, targetSeconds: 60, restSeconds: 60 }
        : { repMin: null, repMax: null, targetSeconds: 30, restSeconds: 45 };
  }
}

interface NewSessionExercise {
  exercise: ExerciseRecord;
  position: number;
  sets: number;
  restSeconds: number;
  targetRpe: number | null;
  notes: string;
  suggestion: ProgressionSuggestionDTO;
}

/** Snapshots one exercise into the session (targets from the suggestion) and pre-creates its sets. */
async function insertSessionExercise(sql: Sql, userId: string, sessionId: string, x: NewSessionExercise): Promise<string> {
  const s = x.suggestion;
  const tracking = x.exercise.trackingType;
  const targetReps = tracking === 'time' ? null : (s.targetReps ?? s.repMax ?? s.repMin);
  const targetSeconds = tracking === 'time' ? s.targetSeconds : null;
  const row = await sql.one<{ id: string }>(
    `INSERT INTO session_exercises
       (session_id, user_id, exercise_id, position, rep_min, rep_max, target_seconds, rest_seconds, target_rpe, target_weight_kg, notes, suggestion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb) RETURNING id`,
    [
      sessionId,
      userId,
      x.exercise.id,
      x.position,
      tracking === 'time' ? null : s.repMin,
      tracking === 'time' ? null : s.repMax,
      targetSeconds,
      x.restSeconds,
      x.targetRpe,
      s.targetWeightKg,
      x.notes,
      JSON.stringify(s),
    ],
  );
  await sql.exec(
    `INSERT INTO session_sets (session_exercise_id, session_id, user_id, set_number, target_reps, target_weight_kg, target_seconds)
     SELECT $1, $2, $3, n, $4, $5, $6 FROM generate_series(1, $7::int) AS n`,
    [row.id, sessionId, userId, targetReps, s.targetWeightKg, targetSeconds, x.sets],
  );
  return row.id;
}

/** Starts a session from a plan day (snapshot + progression targets) or an empty one. Returns the id. */
export async function startSession(sql: Sql, user: SessionUser, input: StartSessionInput): Promise<string> {
  await lockUser(sql, user.id);
  const open = await sql.maybeOne<{ id: string }>(
    `SELECT id FROM workout_sessions WHERE user_id = $1 AND status IN ('in_progress', 'paused') LIMIT 1`,
    [user.id],
  );
  if (open) throw conflict('session_already_active', 'A workout is already in progress', { sessionId: open.id });

  if (!('planWorkoutId' in input)) {
    const name = input.name?.trim() || DEFAULT_EMPTY_NAME[user.locale];
    const row = await sql.one<{ id: string }>('INSERT INTO workout_sessions (user_id, name) VALUES ($1, $2) RETURNING id', [user.id, name]);
    return row.id;
  }

  const workout = await sql.maybeOne<{ id: string; plan_id: string; name: string }>(
    `SELECT pw.id, pw.plan_id, pw.name
       FROM plan_workouts pw JOIN workout_plans wp ON wp.id = pw.plan_id
      WHERE pw.id = $1 AND pw.user_id = $2 AND wp.user_id = $2`,
    [input.planWorkoutId, user.id],
  );
  if (!workout) throw notFound('plan_workout_not_found', 'Workout not found');

  // An optional check-in is remembered for the day; it can only make today's session easier.
  const readiness = input.readiness ?? null;
  const level: ReadinessLevel = readiness ? readinessLevel(readiness) : 'normal';
  if (readiness) await saveCheckin(sql, user, readiness);
  const session = await sql.one<{ id: string }>(
    `INSERT INTO workout_sessions (user_id, plan_id, plan_workout_id, name, readiness, readiness_adjusted)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6) RETURNING id`,
    [user.id, workout.plan_id, workout.id, workout.name, readiness ? JSON.stringify(readiness) : null, level === 'easier'],
  );
  await seedFromPlan(sql, user.id, session.id, workout.id, level);
  return session.id;
}

async function saveCheckin(sql: Sql, user: SessionUser, c: ReadinessCheckin) {
  await sql.exec(
    `INSERT INTO readiness_checkins (user_id, checked_on, energy, soreness, sleep) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, checked_on) DO UPDATE SET energy = EXCLUDED.energy, soreness = EXCLUDED.soreness, sleep = EXCLUDED.sleep`,
    [user.id, dateInTimeZone(new Date(), user.timezone), c.energy, c.soreness, c.sleep],
  );
}

/** Copies a plan day into the session (exercises, sets, progression targets); `easier` trims volume and effort and holds loads. */
async function seedFromPlan(sql: Sql, userId: string, sessionId: string, planWorkoutId: string, level: ReadinessLevel) {
  const planExercises = await sql.many<{
    exercise_id: string;
    sets: number;
    rep_min: number | null;
    rep_max: number | null;
    target_seconds: number | null;
    rest_seconds: number;
    target_rpe: number | null;
    target_weight_kg: number | null;
    notes: string;
  }>(
    `SELECT exercise_id, sets, rep_min, rep_max, target_seconds, rest_seconds, target_rpe, target_weight_kg, notes
       FROM plan_exercises WHERE workout_id = $1 AND user_id = $2 ORDER BY position, created_at`,
    [planWorkoutId, userId],
  );
  const suggestions = await suggestProgressions(
    sql,
    userId,
    planExercises.map((p) => ({
      exerciseId: p.exercise_id,
      repMin: p.rep_min,
      repMax: p.rep_max,
      targetSeconds: p.target_seconds,
      targetWeightKg: p.target_weight_kg != null ? Number(p.target_weight_kg) : null,
    })),
  );
  const easier = level === 'easier';
  for (const [i, p] of planExercises.entries()) {
    const rpe = p.target_rpe != null ? Number(p.target_rpe) : null;
    await insertSessionExercise(sql, userId, sessionId, {
      exercise: await exerciseRecord(p.exercise_id),
      position: i,
      sets: easier ? easierSets(p.sets) : p.sets,
      restSeconds: p.rest_seconds,
      targetRpe: easier ? easierRpe(rpe) : rpe,
      notes: p.notes,
      suggestion: easier ? holdSuggestion(suggestions[i]!) : suggestions[i]!,
    });
  }
}

/**
 * "Use the full plan": rebuilds an easier session from the plan day. Only allowed while it is still
 * untouched (no logged set, no exercise added or removed), so nothing the user did is lost.
 */
export async function revertReadiness(sql: Sql, user: SessionUser, sessionId: string): Promise<void> {
  const row = await requireOpenSession(sql, user.id, sessionId);
  if (!row.readiness_adjusted || !row.plan_workout_id) throw conflict('readiness_not_adjusted', 'This workout was not made easier');
  const stats = await sql.one<{ done: number; have: number; planned: number }>(
    `SELECT (SELECT COUNT(*) FROM session_sets WHERE session_id = $1 AND user_id = $2 AND completed)::int AS done,
            (SELECT COUNT(*) FROM session_exercises WHERE session_id = $1 AND user_id = $2)::int AS have,
            (SELECT COUNT(*) FROM plan_exercises WHERE workout_id = $3 AND user_id = $2)::int AS planned`,
    [sessionId, user.id, row.plan_workout_id],
  );
  if (stats.done > 0 || stats.have !== stats.planned) {
    throw conflict('readiness_revert_unavailable', 'The workout has already been changed, so the full plan can no longer be restored');
  }
  await sql.exec('DELETE FROM session_exercises WHERE session_id = $1 AND user_id = $2', [sessionId, user.id]);
  await seedFromPlan(sql, user.id, sessionId, row.plan_workout_id, 'normal');
  await sql.exec('UPDATE workout_sessions SET readiness_adjusted = false, current_exercise_index = 0 WHERE id = $1 AND user_id = $2', [sessionId, user.id]);
}

/** A timer state is accepted only if it is internally consistent and not absurdly far in the future. */
export function isAcceptableTimer(state: RestTimerState, nowMs: number): boolean {
  if (!isValidTimerState(state)) return false;
  if (state.endsAt != null && state.remainingSeconds != null) return false;
  if (state.endsAt != null && Date.parse(state.endsAt) - nowMs > (MAX_REST_SECONDS + 60) * 1000) return false;
  return true;
}

export async function changeState(sql: Sql, userId: string, sessionId: string, input: SessionStateInput): Promise<void> {
  const row = await requireOpenSession(sql, userId, sessionId);
  if (input.restTimer != null && !isAcceptableTimer(input.restTimer, Date.now())) {
    throw badRequest('invalid_timer_state', 'Invalid rest timer state');
  }
  if (input.action === 'pause' && row.status === 'in_progress') {
    await sql.exec(`UPDATE workout_sessions SET status = 'paused', paused_at = now() WHERE id = $1`, [sessionId]);
  } else if (input.action === 'resume' && row.status === 'paused') {
    await sql.exec(
      `UPDATE workout_sessions
          SET status = 'in_progress',
              paused_seconds = paused_seconds + GREATEST(0, floor(extract(epoch FROM now() - paused_at)))::int,
              paused_at = NULL
        WHERE id = $1`,
      [sessionId],
    );
  }
  if (input.currentExerciseIndex !== undefined) {
    const { count } = await sql.one<{ count: number }>('SELECT count(*)::int AS count FROM session_exercises WHERE session_id = $1', [sessionId]);
    const index = Math.max(0, Math.min(input.currentExerciseIndex, count - 1));
    await sql.exec('UPDATE workout_sessions SET current_exercise_index = $2 WHERE id = $1', [sessionId, index]);
  }
  if (input.restTimer !== undefined) {
    await sql.exec('UPDATE workout_sessions SET rest_timer = $2::jsonb WHERE id = $1', [
      sessionId,
      input.restTimer === null ? null : JSON.stringify(input.restTimer),
    ]);
  }
}

export async function updateSet(sql: Sql, userId: string, sessionId: string, setId: string, input: UpdateSetInput): Promise<SessionSetDTO> {
  await requireOpenSession(sql, userId, sessionId);
  await requireSessionSet(sql, userId, sessionId, setId);
  const has = (k: keyof UpdateSetInput) => input[k] !== undefined;
  const row = await sql.one<SessionSetRow>(
    `UPDATE session_sets SET
        reps = CASE WHEN $2::boolean THEN $3::int ELSE reps END,
        weight_kg = CASE WHEN $4::boolean THEN $5::numeric ELSE weight_kg END,
        duration_seconds = CASE WHEN $6::boolean THEN $7::int ELSE duration_seconds END,
        rpe = CASE WHEN $8::boolean THEN $9::numeric ELSE rpe END,
        completed = COALESCE($10::boolean, completed),
        completed_at = CASE WHEN $10::boolean IS NULL THEN completed_at
                            WHEN $10::boolean THEN COALESCE(completed_at, now())
                            ELSE NULL END
      WHERE id = $1 AND user_id = $11
      RETURNING *`,
    [
      setId,
      has('reps'),
      input.reps ?? null,
      has('weightKg'),
      input.weightKg ?? null,
      has('durationSeconds'),
      input.durationSeconds ?? null,
      has('rpe'),
      input.rpe ?? null,
      input.completed ?? null,
      userId,
    ],
  );
  return toSetDTO(row);
}

/** Appends a set copying the previous set's targets and values (or the exercise targets). */
export async function addSet(sql: Sql, userId: string, sessionId: string, sessionExerciseId: string): Promise<void> {
  await requireOpenSession(sql, userId, sessionId);
  const se = await requireSessionExercise(sql, userId, sessionId, sessionExerciseId);
  const last = await sql.maybeOne<SessionSetRow>(
    'SELECT * FROM session_sets WHERE session_exercise_id = $1 ORDER BY set_number DESC, created_at DESC LIMIT 1',
    [se.id],
  );
  const nextNumber = (last?.set_number ?? 0) + 1;
  if (nextNumber > SESSION_LIMITS.setsPerExerciseMax) throw conflict('set_limit_reached', 'Too many sets for this exercise');
  const exercise = await exerciseRecord(se.exercise_id);
  const targetReps = last ? last.target_reps : exercise.trackingType === 'time' ? null : (se.rep_max ?? se.rep_min);
  await sql.exec(
    `INSERT INTO session_sets (session_exercise_id, session_id, user_id, set_number, target_reps, target_weight_kg, target_seconds, reps, weight_kg, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      se.id,
      sessionId,
      userId,
      nextNumber,
      targetReps,
      last ? last.target_weight_kg : se.target_weight_kg,
      last ? last.target_seconds : se.target_seconds,
      last?.reps ?? null,
      last?.weight_kg ?? null,
      last?.duration_seconds ?? null,
    ],
  );
}

export async function deleteSet(sql: Sql, userId: string, sessionId: string, setId: string): Promise<void> {
  await requireOpenSession(sql, userId, sessionId);
  const set = await requireSessionSet(sql, userId, sessionId, setId);
  await sql.exec('DELETE FROM session_sets WHERE id = $1', [set.id]);
  await sql.exec(
    `UPDATE session_sets s SET set_number = r.rn
       FROM (SELECT id, row_number() OVER (ORDER BY set_number, created_at)::int AS rn FROM session_sets WHERE session_exercise_id = $1) r
      WHERE s.id = r.id AND s.set_number <> r.rn`,
    [set.session_exercise_id],
  );
}

export async function addExercise(sql: Sql, userId: string, sessionId: string, input: AddSessionExerciseInput): Promise<string> {
  await requireOpenSession(sql, userId, sessionId);
  const exercise = await getExercise(input.exerciseId);
  if (!exercise) throw notFound('exercise_not_found', 'Exercise not found');
  const { count, max } = await sql.one<{ count: number; max: number | null }>(
    'SELECT count(*)::int AS count, max(position) AS max FROM session_exercises WHERE session_id = $1',
    [sessionId],
  );
  if (count >= SESSION_LIMITS.exercisesMax) throw conflict('exercise_limit_reached', 'Too many exercises in this workout');
  const defaults = defaultPrescription(exercise);
  const [suggestion] = await suggestProgressions(sql, userId, [
    { exerciseId: exercise.id, repMin: defaults.repMin, repMax: defaults.repMax, targetSeconds: defaults.targetSeconds, targetWeightKg: null },
  ]);
  return insertSessionExercise(sql, userId, sessionId, {
    exercise,
    position: (max ?? -1) + 1,
    sets: input.sets ?? 3,
    restSeconds: defaults.restSeconds,
    targetRpe: null,
    notes: '',
    suggestion: suggestion!,
  });
}

export async function removeExercise(sql: Sql, userId: string, sessionId: string, sessionExerciseId: string): Promise<void> {
  const session = await requireOpenSession(sql, userId, sessionId);
  const se = await requireSessionExercise(sql, userId, sessionId, sessionExerciseId);
  const ordered = await sql.many<{ id: string }>('SELECT id FROM session_exercises WHERE session_id = $1 ORDER BY position, created_at', [sessionId]);
  const removedIndex = ordered.findIndex((r) => r.id === se.id);
  await sql.exec('DELETE FROM session_exercises WHERE id = $1', [se.id]);
  await sql.exec(
    `UPDATE session_exercises s SET position = r.rn
       FROM (SELECT id, (row_number() OVER (ORDER BY position, created_at) - 1)::int AS rn FROM session_exercises WHERE session_id = $1) r
      WHERE s.id = r.id AND s.position <> r.rn`,
    [sessionId],
  );
  let index = session.current_exercise_index;
  if (removedIndex >= 0 && removedIndex < index) index -= 1;
  index = Math.max(0, Math.min(index, ordered.length - 2));
  await sql.exec('UPDATE workout_sessions SET current_exercise_index = $2 WHERE id = $1', [sessionId, index]);
}

/**
 * Swaps an exercise for another one in place (same position, same number of sets), e.g.
 * when the machine is taken. Only allowed before any set of the exercise was completed,
 * so logged work is never silently discarded.
 */
export async function replaceExercise(sql: Sql, userId: string, sessionId: string, sessionExerciseId: string, exerciseId: string): Promise<void> {
  await requireOpenSession(sql, userId, sessionId);
  const old = await requireSessionExercise(sql, userId, sessionId, sessionExerciseId);
  const stats = await sql.one<{ total: number; done: number }>(
    'SELECT count(*)::int AS total, count(*) FILTER (WHERE completed)::int AS done FROM session_sets WHERE session_exercise_id = $1',
    [old.id],
  );
  if (stats.done > 0) throw conflict('exercise_has_progress', 'Sets of this exercise are already logged');
  const newId = await addExercise(sql, userId, sessionId, { exerciseId, sets: Math.max(1, stats.total) });
  await sql.exec('UPDATE session_exercises SET position = $2 WHERE id = $1', [newId, old.position]);
  await sql.exec('DELETE FROM session_exercises WHERE id = $1', [old.id]);
  await sql.exec(
    `UPDATE session_exercises s SET position = r.rn
       FROM (SELECT id, (row_number() OVER (ORDER BY position, created_at) - 1)::int AS rn FROM session_exercises WHERE session_id = $1) r
      WHERE s.id = r.id AND s.position <> r.rn`,
    [sessionId],
  );
}

export async function updateExercise(sql: Sql, userId: string, sessionId: string, sessionExerciseId: string, input: UpdateSessionExerciseInput): Promise<void> {
  await requireOpenSession(sql, userId, sessionId);
  await requireSessionExercise(sql, userId, sessionId, sessionExerciseId);
  await sql.exec(
    `UPDATE session_exercises SET rest_seconds = COALESCE($2::int, rest_seconds), notes = COALESCE($3::text, notes)
      WHERE id = $1 AND user_id = $4`,
    [sessionExerciseId, input.restSeconds ?? null, input.notes ?? null, userId],
  );
}

/**
 * Completes the workout in one transaction: closes an open pause, computes duration and
 * totals from completed sets, detects personal records, advances the plan, grants rewards.
 * Finishing an already completed session returns its stored summary.
 */
export async function finishSession(sql: Sql, user: SessionUser, sessionId: string, input: FinishSessionInput): Promise<SessionSummaryDTO> {
  const row = await requireSession(sql, user.id, sessionId, true);
  if (row.status === 'completed') return buildSummary(sql, user.id, row, user.timezone);
  if (row.status === 'abandoned') throw conflict('session_not_active', 'This workout was discarded');

  const { now } = await sql.one<{ now: Date }>('SELECT now() AS now');
  const endedAt = new Date(now);
  const pausedSeconds =
    row.paused_seconds + (row.paused_at ? Math.max(0, Math.floor((endedAt.getTime() - new Date(row.paused_at).getTime()) / 1000)) : 0);
  const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - new Date(row.started_at).getTime()) / 1000) - pausedSeconds);

  const sets = await completedSetsOf(sql, user.id, sessionId);
  const totals = computeTotals(sets);
  const exerciseIds = Array.from(new Set(sets.map((s) => s.exerciseId)));
  const tracking = new Map<string, ExerciseRecord['trackingType']>();
  for (const id of exerciseIds) tracking.set(id, (await exerciseRecord(id)).trackingType);
  const previousBests = await loadPreviousBests(sql, user.id, sessionId, exerciseIds);
  const recordIds = await insertRecords(sql, user.id, sessionId, endedAt, detectRecords(sets, tracking, previousBests));

  if (row.plan_workout_id && row.plan_id) {
    const days = await sql.many<{ id: string }>(
      `SELECT pw.id FROM plan_workouts pw JOIN workout_plans wp ON wp.id = pw.plan_id
        WHERE pw.plan_id = $1 AND wp.user_id = $2 ORDER BY pw.position, pw.created_at`,
      [row.plan_id, user.id],
    );
    const idx = days.findIndex((d) => d.id === row.plan_workout_id);
    if (idx >= 0 && days.length > 0) {
      await sql.exec('UPDATE workout_plans SET next_workout_index = $3 WHERE id = $1 AND user_id = $2', [row.plan_id, user.id, (idx + 1) % days.length]);
    }
  }

  // Mark the session completed BEFORE granting rewards: the gamification hook counts the
  // user's completed sessions (weekly goal, achievements), which must include this one.
  await sql.exec(
    `UPDATE workout_sessions SET
        status = 'completed', ended_at = $2, paused_at = NULL, paused_seconds = $3, duration_seconds = $4,
        total_sets = $5, total_reps = $6, total_volume_kg = $7, notes = $8, perceived_exertion = $9,
        rest_timer = NULL
      WHERE id = $1`,
    [sessionId, endedAt, pausedSeconds, durationSeconds, totals.sets, totals.reps, totals.volumeKg, input.notes ?? '', input.perceivedExertion ?? null],
  );

  const rewards = await onWorkoutCompleted(sql, {
    userId: user.id,
    sessionId,
    date: dateInTimeZone(endedAt, user.timezone),
    endedAt,
    durationSeconds,
    completedSets: totals.sets,
    totalVolumeKg: totals.volumeKg,
    personalRecordIds: recordIds,
  });

  await sql.exec('UPDATE workout_sessions SET xp_awarded = $2, rewards = $3::jsonb WHERE id = $1', [sessionId, rewards.xpAwarded, JSON.stringify(rewards)]);
  const finished = await requireSession(sql, user.id, sessionId);
  return buildSummary(sql, user.id, finished, user.timezone);
}

export async function abandonSession(sql: Sql, userId: string, sessionId: string): Promise<void> {
  const row = await requireSession(sql, userId, sessionId, true);
  if (row.status === 'abandoned') return;
  if (row.status === 'completed') throw conflict('session_not_active', 'This workout is already finished');
  await sql.exec(
    `UPDATE workout_sessions SET
        status = 'abandoned', ended_at = now(),
        paused_seconds = paused_seconds + COALESCE(GREATEST(0, floor(extract(epoch FROM now() - paused_at)))::int, 0),
        paused_at = NULL, rest_timer = NULL
      WHERE id = $1`,
    [sessionId],
  );
}

export async function deleteSession(sql: Sql, userId: string, sessionId: string): Promise<void> {
  const row = await requireSession(sql, userId, sessionId, true);
  if (row.status === 'in_progress' || row.status === 'paused') {
    throw conflict('session_active', 'Finish or discard the workout before deleting it');
  }
  await sql.exec('DELETE FROM workout_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
}
