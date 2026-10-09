/**
 * Read side of the sessions module: row types, ownership-checked loaders and DTO
 * assembly (live session, summary, history). Every query is scoped by user_id.
 */
import type { PrType, SessionStatus } from '@shared/constants';
import { dateInTimeZone } from '@shared/dates';
import { isValidTimerState, type RestTimerState } from '@shared/timer';
import { estimateOneRepMax, setVolumeKg } from '@shared/training';
import {
  EMPTY_REWARD,
  type PersonalRecordDTO,
  type PreviousPerformanceDTO,
  type ProgressionSuggestionDTO,
  type RewardResultDTO,
  type SessionExerciseDTO,
  type SessionHistoryItemDTO,
  type SessionSetDTO,
  type SessionSummaryDTO,
  type WorkoutSessionDTO,
} from '@shared/types';
import type { Sql } from '../../db/pool';
import { conflict, notFound } from '../../lib/errors';
import { getExerciseMap, toExerciseSummary, type ExerciseRecord } from '../exercises/repository';

export const OPEN_STATUSES: SessionStatus[] = ['in_progress', 'paused'];

export interface SessionRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  plan_workout_id: string | null;
  name: string;
  status: SessionStatus;
  started_at: Date;
  paused_at: Date | null;
  paused_seconds: number;
  ended_at: Date | null;
  duration_seconds: number | null;
  current_exercise_index: number;
  rest_timer: unknown;
  total_volume_kg: number | null;
  total_sets: number | null;
  total_reps: number | null;
  perceived_exertion: number | null;
  notes: string;
  xp_awarded: number;
  rewards: RewardResultDTO | null;
}

export interface SessionExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string;
  position: number;
  rep_min: number | null;
  rep_max: number | null;
  target_seconds: number | null;
  rest_seconds: number;
  target_rpe: number | null;
  target_weight_kg: number | null;
  notes: string;
  suggestion: ProgressionSuggestionDTO | null;
}

export interface SessionSetRow {
  id: string;
  session_exercise_id: string;
  session_id: string;
  set_number: number;
  target_reps: number | null;
  target_weight_kg: number | null;
  target_seconds: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  completed: boolean;
  completed_at: Date | null;
}

const num = (v: number | string | null | undefined): number | null => (v == null ? null : Number(v));
const iso = (d: Date | string | null): string | null => (d == null ? null : new Date(d).toISOString());

export const isOpen = (status: SessionStatus) => OPEN_STATUSES.includes(status);

// ------------------------------------------------------------------ ownership-checked loaders

export async function findSession(sql: Sql, userId: string, sessionId: string, forUpdate = false): Promise<SessionRow | null> {
  return sql.maybeOne<SessionRow>(
    forUpdate
      ? 'SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE'
      : 'SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2',
    [sessionId, userId],
  );
}

export async function requireSession(sql: Sql, userId: string, sessionId: string, forUpdate = false): Promise<SessionRow> {
  const row = await findSession(sql, userId, sessionId, forUpdate);
  if (!row) throw notFound('session_not_found', 'Workout session not found');
  return row;
}

/** Locks the session row (serializes concurrent edits with finish) and requires it to be open. */
export async function requireOpenSession(sql: Sql, userId: string, sessionId: string): Promise<SessionRow> {
  const row = await requireSession(sql, userId, sessionId, true);
  if (!isOpen(row.status)) throw conflict('session_not_active', 'This workout is no longer in progress');
  return row;
}

export async function requireSessionExercise(sql: Sql, userId: string, sessionId: string, sessionExerciseId: string): Promise<SessionExerciseRow> {
  const row = await sql.maybeOne<SessionExerciseRow>(
    'SELECT * FROM session_exercises WHERE id = $1 AND session_id = $2 AND user_id = $3',
    [sessionExerciseId, sessionId, userId],
  );
  if (!row) throw notFound('session_exercise_not_found', 'Exercise not found in this workout');
  return row;
}

export async function requireSessionSet(sql: Sql, userId: string, sessionId: string, setId: string): Promise<SessionSetRow> {
  const row = await sql.maybeOne<SessionSetRow>('SELECT * FROM session_sets WHERE id = $1 AND session_id = $2 AND user_id = $3', [setId, sessionId, userId]);
  if (!row) throw notFound('set_not_found', 'Set not found in this workout');
  return row;
}

export async function findOpenSessionId(sql: Sql, userId: string): Promise<string | null> {
  const row = await sql.maybeOne<{ id: string }>(
    `SELECT id FROM workout_sessions WHERE user_id = $1 AND status IN ('in_progress', 'paused') ORDER BY started_at DESC LIMIT 1`,
    [userId],
  );
  return row?.id ?? null;
}

// ------------------------------------------------------------------ DTO mapping

export function toSetDTO(r: SessionSetRow): SessionSetDTO {
  return {
    id: r.id,
    setNumber: r.set_number,
    targetReps: r.target_reps,
    targetWeightKg: num(r.target_weight_kg),
    targetSeconds: r.target_seconds,
    reps: r.reps,
    weightKg: num(r.weight_kg),
    durationSeconds: r.duration_seconds,
    rpe: num(r.rpe),
    completed: r.completed,
    completedAt: iso(r.completed_at),
  };
}

function storedSuggestion(v: unknown): ProgressionSuggestionDTO | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Partial<ProgressionSuggestionDTO>;
  return typeof s.action === 'string' && typeof s.reasonCode === 'string' && typeof s.exerciseId === 'string' ? (s as ProgressionSuggestionDTO) : null;
}

export function restTimerOf(v: unknown): RestTimerState | null {
  return isValidTimerState(v) ? v : null;
}

function fallbackExercise(id: string): ExerciseRecord {
  // Exercises are referenced by FK, so this only guards against a catalog cache miss.
  return {
    id,
    name: { en: id, he: id },
    description: { en: '', he: '' },
    primaryMuscles: [],
    secondaryMuscles: [],
    equipment: [],
    category: 'bodyweight',
    movementPattern: 'core',
    difficulty: 'beginner',
    trackingType: 'weight_reps',
    unilateral: false,
    isCompound: false,
    instructions: { en: [], he: [] },
    mistakes: { en: [], he: [] },
    safety: { en: [], he: [] },
    contraindications: [],
    easierAlternatives: [],
    harderAlternatives: [],
    loadIncrementKg: null,
    media: null,
  };
}

export async function exerciseRecord(id: string): Promise<ExerciseRecord> {
  return (await getExerciseMap()).get(id) ?? fallbackExercise(id);
}

/**
 * Sets of the most recent completed session (started before `before`) in which the user
 * completed at least one set of each exercise.
 */
export async function previousPerformance(
  sql: Sql,
  userId: string,
  exerciseIds: string[],
  excludeSessionId: string,
  before: Date,
  timezone: string,
): Promise<Map<string, PreviousPerformanceDTO>> {
  const out = new Map<string, PreviousPerformanceDTO>();
  if (exerciseIds.length === 0) return out;
  const latest = await sql.many<{ exercise_id: string; session_id: string; ended_at: Date; session_exercise_id: string }>(
    `SELECT DISTINCT ON (se.exercise_id) se.exercise_id, ws.id AS session_id, ws.ended_at, se.id AS session_exercise_id
       FROM session_exercises se
       JOIN workout_sessions ws ON ws.id = se.session_id
      WHERE ws.user_id = $1 AND se.user_id = $1 AND ws.status = 'completed' AND ws.id <> $2 AND ws.started_at < $3
        AND se.exercise_id = ANY($4::text[])
        AND EXISTS (SELECT 1 FROM session_sets ss WHERE ss.session_exercise_id = se.id AND ss.completed)
      ORDER BY se.exercise_id, ws.ended_at DESC, se.position`,
    [userId, excludeSessionId, before, exerciseIds],
  );
  if (latest.length === 0) return out;
  const sets = await sql.many<{ session_exercise_id: string; set_number: number; reps: number | null; weight_kg: number | null; duration_seconds: number | null }>(
    `SELECT session_exercise_id, set_number, reps, weight_kg, duration_seconds
       FROM session_sets
      WHERE user_id = $1 AND completed AND session_exercise_id = ANY($2::uuid[])
      ORDER BY set_number`,
    [userId, latest.map((l) => l.session_exercise_id)],
  );
  for (const l of latest) {
    out.set(l.exercise_id, {
      sessionId: l.session_id,
      date: dateInTimeZone(new Date(l.ended_at), timezone),
      sets: sets
        .filter((s) => s.session_exercise_id === l.session_exercise_id)
        .map((s) => ({ setNumber: s.set_number, reps: s.reps, weightKg: num(s.weight_kg), durationSeconds: s.duration_seconds })),
    });
  }
  return out;
}

/** Full live-session DTO (exercises, sets, previous performance, stored suggestion, server time). */
export async function loadSessionDTO(sql: Sql, userId: string, row: SessionRow, timezone: string): Promise<WorkoutSessionDTO> {
  const exercises = await sql.many<SessionExerciseRow>(
    'SELECT * FROM session_exercises WHERE session_id = $1 AND user_id = $2 ORDER BY position, created_at',
    [row.id, userId],
  );
  const sets = await sql.many<SessionSetRow>(
    'SELECT * FROM session_sets WHERE session_id = $1 AND user_id = $2 ORDER BY set_number, created_at',
    [row.id, userId],
  );
  const previous = await previousPerformance(sql, userId, Array.from(new Set(exercises.map((e) => e.exercise_id))), row.id, new Date(row.started_at), timezone);
  const catalog = await getExerciseMap();
  const exerciseDTOs: SessionExerciseDTO[] = exercises.map((e) => ({
    id: e.id,
    exerciseId: e.exercise_id,
    exercise: toExerciseSummary(catalog.get(e.exercise_id) ?? fallbackExercise(e.exercise_id)),
    position: e.position,
    repMin: e.rep_min,
    repMax: e.rep_max,
    targetSeconds: e.target_seconds,
    restSeconds: e.rest_seconds,
    targetRpe: num(e.target_rpe),
    targetWeightKg: num(e.target_weight_kg),
    notes: e.notes,
    sets: sets.filter((s) => s.session_exercise_id === e.id).map(toSetDTO),
    previous: previous.get(e.exercise_id) ?? null,
    suggestion: storedSuggestion(e.suggestion),
  }));
  return {
    id: row.id,
    planId: row.plan_id,
    planWorkoutId: row.plan_workout_id,
    name: row.name,
    status: row.status,
    startedAt: new Date(row.started_at).toISOString(),
    pausedAt: iso(row.paused_at),
    pausedSeconds: row.paused_seconds,
    endedAt: iso(row.ended_at),
    durationSeconds: row.duration_seconds,
    currentExerciseIndex: Math.min(row.current_exercise_index, Math.max(0, exerciseDTOs.length - 1)),
    restTimer: isOpen(row.status) ? restTimerOf(row.rest_timer) : null,
    notes: row.notes,
    perceivedExertion: row.perceived_exertion,
    exercises: exerciseDTOs,
    serverTime: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------ totals & best sets

export interface CompletedSet {
  id: string;
  sessionExerciseId: string;
  exerciseId: string;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
}

export interface SessionTotals {
  sets: number;
  reps: number;
  volumeKg: number;
}

/** Totals from completed sets only: volume = Σ weight × reps for sets with a recorded load. */
export function computeTotals(sets: CompletedSet[]): SessionTotals {
  let reps = 0;
  let volume = 0;
  for (const s of sets) {
    reps += s.reps != null && s.reps > 0 ? s.reps : 0;
    volume += setVolumeKg(s.weightKg, s.reps);
  }
  return { sets: sets.length, reps, volumeKg: Math.round(volume * 100) / 100 };
}

/** The most impressive completed set for the exercise's tracking type. */
export function bestSetOf(sets: CompletedSet[], trackingType: ExerciseRecord['trackingType']): CompletedSet | null {
  let best: CompletedSet | null = null;
  const score = (s: CompletedSet): [number, number] => {
    if (trackingType === 'time') return [s.durationSeconds ?? 0, s.weightKg ?? 0];
    if (trackingType === 'reps') return [s.reps ?? 0, s.weightKg ?? 0];
    return [estimateOneRepMax(s.weightKg, s.reps) ?? s.weightKg ?? 0, s.reps ?? 0];
  };
  for (const s of sets) {
    if (!best) {
      best = s;
      continue;
    }
    const [a1, a2] = score(s);
    const [b1, b2] = score(best);
    if (a1 > b1 || (a1 === b1 && a2 > b2)) best = s;
  }
  return best;
}

export async function completedSetsOf(sql: Sql, userId: string, sessionId: string): Promise<CompletedSet[]> {
  const rows = await sql.many<{ id: string; session_exercise_id: string; exercise_id: string; reps: number | null; weight_kg: number | null; duration_seconds: number | null }>(
    `SELECT ss.id, ss.session_exercise_id, se.exercise_id, ss.reps, ss.weight_kg, ss.duration_seconds
       FROM session_sets ss JOIN session_exercises se ON se.id = ss.session_exercise_id
      WHERE ss.session_id = $1 AND ss.user_id = $2 AND ss.completed
      ORDER BY se.position, ss.set_number`,
    [sessionId, userId],
  );
  return rows.map((r) => ({
    id: r.id,
    sessionExerciseId: r.session_exercise_id,
    exerciseId: r.exercise_id,
    reps: r.reps,
    weightKg: num(r.weight_kg),
    durationSeconds: r.duration_seconds,
  }));
}

// ------------------------------------------------------------------ personal records

interface PrRow {
  id: string;
  exercise_id: string;
  record_type: PrType;
  value: number;
  previous_value: number | null;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  achieved_at: Date;
  session_id: string | null;
}

export async function recordsOfSession(sql: Sql, userId: string, sessionId: string): Promise<PersonalRecordDTO[]> {
  const rows = await sql.many<PrRow>(
    `SELECT id, exercise_id, record_type, value, previous_value, weight_kg, reps, duration_seconds, achieved_at, session_id
       FROM personal_records WHERE user_id = $1 AND session_id = $2
      ORDER BY created_at, exercise_id, record_type`,
    [userId, sessionId],
  );
  const catalog = await getExerciseMap();
  return rows.map((r) => ({
    id: r.id,
    exerciseId: r.exercise_id,
    exerciseName: (catalog.get(r.exercise_id) ?? fallbackExercise(r.exercise_id)).name,
    recordType: r.record_type,
    value: Number(r.value),
    previousValue: num(r.previous_value),
    weightKg: num(r.weight_kg),
    reps: r.reps,
    durationSeconds: r.duration_seconds,
    achievedAt: new Date(r.achieved_at).toISOString(),
    sessionId: r.session_id,
  }));
}

// ------------------------------------------------------------------ summary & history

export async function buildSummary(sql: Sql, userId: string, row: SessionRow, timezone: string): Promise<SessionSummaryDTO> {
  if (row.status !== 'completed' || !row.ended_at) throw conflict('session_not_completed', 'This workout has not been finished');
  const exercises = await sql.many<{ id: string; exercise_id: string }>(
    'SELECT id, exercise_id FROM session_exercises WHERE session_id = $1 AND user_id = $2 ORDER BY position, created_at',
    [row.id, userId],
  );
  const sets = await completedSetsOf(sql, userId, row.id);
  const catalog = await getExerciseMap();
  const totals = computeTotals(sets);
  const exerciseSummaries = exercises.map((e) => {
    const ex = catalog.get(e.exercise_id) ?? fallbackExercise(e.exercise_id);
    const own = sets.filter((s) => s.sessionExerciseId === e.id);
    const best = bestSetOf(own, ex.trackingType);
    return {
      exerciseId: e.exercise_id,
      name: ex.name,
      completedSets: own.length,
      bestSet: best ? { reps: best.reps, weightKg: best.weightKg, durationSeconds: best.durationSeconds } : null,
    };
  });
  let previous: SessionSummaryDTO['previous'] = null;
  if (row.plan_workout_id) {
    const prev = await sql.maybeOne<{ id: string; ended_at: Date; total_volume_kg: number | null; duration_seconds: number | null }>(
      `SELECT id, ended_at, total_volume_kg, duration_seconds FROM workout_sessions
        WHERE user_id = $1 AND plan_workout_id = $2 AND status = 'completed' AND id <> $3 AND started_at < $4
        ORDER BY started_at DESC LIMIT 1`,
      [userId, row.plan_workout_id, row.id, row.started_at],
    );
    if (prev) {
      previous = {
        sessionId: prev.id,
        date: dateInTimeZone(new Date(prev.ended_at), timezone),
        volumeKg: num(prev.total_volume_kg) ?? 0,
        durationSeconds: prev.duration_seconds ?? 0,
      };
    }
  }
  const rewards: RewardResultDTO = row.rewards ?? { ...EMPTY_REWARD, xpAwarded: row.xp_awarded };
  return {
    session: {
      id: row.id,
      name: row.name,
      startedAt: new Date(row.started_at).toISOString(),
      endedAt: new Date(row.ended_at).toISOString(),
      durationSeconds: row.duration_seconds ?? 0,
    },
    totals: { exercises: exerciseSummaries.filter((e) => e.completedSets > 0).length, sets: totals.sets, reps: totals.reps, volumeKg: totals.volumeKg },
    exercises: exerciseSummaries,
    personalRecords: await recordsOfSession(sql, userId, row.id),
    rewards: {
      xpAwarded: rewards.xpAwarded ?? 0,
      newAchievements: Array.isArray(rewards.newAchievements) ? rewards.newAchievements : [],
      levelUp: rewards.levelUp ?? null,
      notes: Array.isArray(rewards.notes) ? rewards.notes : [],
    },
    previous,
  };
}

export async function listHistory(
  sql: Sql,
  userId: string,
  query: { limit: number; before?: string; status: SessionStatus },
): Promise<{ sessions: SessionHistoryItemDTO[]; nextCursor: string | null }> {
  const rows = await sql.many<{
    id: string;
    name: string;
    status: SessionStatus;
    started_at: Date;
    ended_at: Date | null;
    duration_seconds: number | null;
    total_sets: number;
    total_volume_kg: number;
    exercise_count: number;
    pr_count: number;
    cursor: string;
  }>(
    `SELECT ws.id, ws.name, ws.status, ws.started_at, ws.ended_at, ws.duration_seconds,
            COALESCE(ws.total_sets, (SELECT count(*) FROM session_sets ss WHERE ss.session_id = ws.id AND ss.completed))::int AS total_sets,
            COALESCE(ws.total_volume_kg, 0) AS total_volume_kg,
            (SELECT count(*) FROM session_exercises se
              WHERE se.session_id = ws.id
                AND EXISTS (SELECT 1 FROM session_sets ss WHERE ss.session_exercise_id = se.id AND ss.completed))::int AS exercise_count,
            (SELECT count(*) FROM personal_records pr WHERE pr.session_id = ws.id)::int AS pr_count,
            to_char(ws.started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor
       FROM workout_sessions ws
      WHERE ws.user_id = $1 AND ws.status = $2 AND ($3::timestamptz IS NULL OR ws.started_at < $3::timestamptz)
      ORDER BY ws.started_at DESC, ws.id DESC
      LIMIT $4`,
    [userId, query.status, query.before ?? null, query.limit + 1],
  );
  const page = rows.slice(0, query.limit);
  return {
    sessions: page.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      startedAt: new Date(r.started_at).toISOString(),
      endedAt: iso(r.ended_at),
      durationSeconds: r.duration_seconds,
      totalSets: r.total_sets,
      totalVolumeKg: Number(r.total_volume_kg),
      exerciseCount: r.exercise_count,
      prCount: r.pr_count,
    })),
    nextCursor: rows.length > query.limit ? (page[page.length - 1]?.cursor ?? null) : null,
  };
}
