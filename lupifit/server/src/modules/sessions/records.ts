/**
 * Personal-record detection at workout completion. A record is stored only when a
 * completed set beats the user's best from ALL their previous completed sessions; the
 * very first performance of an exercise is a baseline, not a record.
 */
import type { PrType, TrackingType } from '@shared/constants';
import { estimateOneRepMax, setVolumeKg } from '@shared/training';
import type { Sql } from '../../db/pool';
import type { CompletedSet } from './repository';

export const PR_TYPES_BY_TRACKING: Record<TrackingType, PrType[]> = {
  weight_reps: ['max_weight', 'est_1rm', 'max_volume'],
  reps: ['max_reps'],
  time: ['max_duration'],
};

/** Smallest meaningful improvement per record type (guards against rounding noise). */
const EPSILON: Record<PrType, number> = { max_weight: 0.001, est_1rm: 0.05, max_volume: 0.001, max_reps: 0.5, max_duration: 0.5 };

export function prValue(type: PrType, s: Pick<CompletedSet, 'reps' | 'weightKg' | 'durationSeconds'>): number | null {
  switch (type) {
    case 'max_weight':
      return s.weightKg != null && s.weightKg > 0 && (s.reps ?? 0) >= 1 ? s.weightKg : null;
    case 'est_1rm':
      return estimateOneRepMax(s.weightKg, s.reps);
    case 'max_volume': {
      const v = setVolumeKg(s.weightKg, s.reps);
      return v > 0 ? v : null;
    }
    case 'max_reps':
      return s.reps != null && s.reps >= 1 ? s.reps : null;
    case 'max_duration':
      return s.durationSeconds != null && s.durationSeconds >= 1 ? s.durationSeconds : null;
  }
}

export interface BestOfType {
  value: number;
  set: CompletedSet;
}

/** Best set of the given type among `sets` (ties: heavier load / more reps wins). */
export function bestOfType(type: PrType, sets: CompletedSet[]): BestOfType | null {
  let best: BestOfType | null = null;
  for (const s of sets) {
    const value = prValue(type, s);
    if (value == null) continue;
    if (
      !best ||
      value > best.value ||
      (value === best.value && ((s.weightKg ?? 0) > (best.set.weightKg ?? 0) || ((s.weightKg ?? 0) === (best.set.weightKg ?? 0) && (s.reps ?? 0) > (best.set.reps ?? 0))))
    ) {
      best = { value, set: s };
    }
  }
  return best;
}

export interface DetectedRecord {
  exerciseId: string;
  type: PrType;
  value: number;
  previousValue: number;
  set: CompletedSet;
}

export type PreviousBests = Map<string, Partial<Record<PrType, number>>>;

/** Pure comparison of this session's best sets with the previous bests. */
export function detectRecords(sets: CompletedSet[], trackingTypes: Map<string, TrackingType>, previous: PreviousBests): DetectedRecord[] {
  const out: DetectedRecord[] = [];
  const byExercise = new Map<string, CompletedSet[]>();
  for (const s of sets) byExercise.set(s.exerciseId, [...(byExercise.get(s.exerciseId) ?? []), s]);
  for (const [exerciseId, own] of byExercise) {
    const tracking = trackingTypes.get(exerciseId);
    if (!tracking) continue;
    for (const type of PR_TYPES_BY_TRACKING[tracking]) {
      const best = bestOfType(type, own);
      const prev = previous.get(exerciseId)?.[type];
      if (!best || prev == null) continue; // first performance = baseline
      if (best.value > prev + EPSILON[type]) out.push({ exerciseId, type, value: best.value, previousValue: prev, set: best.set });
    }
  }
  return out;
}

/** Best values per exercise over all of the user's completed sessions except `excludeSessionId`. */
export async function loadPreviousBests(sql: Sql, userId: string, excludeSessionId: string, exerciseIds: string[]): Promise<PreviousBests> {
  const out: PreviousBests = new Map();
  if (exerciseIds.length === 0) return out;
  const rows = await sql.many<{
    exercise_id: string;
    max_weight: number | null;
    est_1rm: number | null;
    max_volume: number | null;
    max_reps: number | null;
    max_duration: number | null;
  }>(
    `SELECT se.exercise_id,
            max(ss.weight_kg) FILTER (WHERE ss.weight_kg > 0 AND ss.reps >= 1) AS max_weight,
            max(CASE WHEN ss.reps = 1 THEN round(ss.weight_kg, 1) ELSE round(ss.weight_kg * (1 + ss.reps / 30.0), 1) END)
              FILTER (WHERE ss.weight_kg > 0 AND ss.reps BETWEEN 1 AND 12) AS est_1rm,
            max(round(ss.weight_kg * ss.reps, 2)) FILTER (WHERE ss.weight_kg > 0 AND ss.reps >= 1) AS max_volume,
            max(ss.reps) FILTER (WHERE ss.reps >= 1) AS max_reps,
            max(ss.duration_seconds) FILTER (WHERE ss.duration_seconds >= 1) AS max_duration
       FROM session_sets ss
       JOIN session_exercises se ON se.id = ss.session_exercise_id
       JOIN workout_sessions ws ON ws.id = ss.session_id
      WHERE ws.user_id = $1 AND ss.user_id = $1 AND ws.status = 'completed' AND ws.id <> $2 AND ss.completed
        AND se.exercise_id = ANY($3::text[])
      GROUP BY se.exercise_id`,
    [userId, excludeSessionId, exerciseIds],
  );
  const n = (v: number | null) => (v == null ? undefined : Number(v));
  for (const r of rows) {
    out.set(r.exercise_id, {
      max_weight: n(r.max_weight),
      est_1rm: n(r.est_1rm),
      max_volume: n(r.max_volume),
      max_reps: n(r.max_reps),
      max_duration: n(r.max_duration),
    });
  }
  return out;
}

/** Inserts the detected records and returns their ids. */
export async function insertRecords(sql: Sql, userId: string, sessionId: string, achievedAt: Date, records: DetectedRecord[]): Promise<string[]> {
  const ids: string[] = [];
  for (const r of records) {
    const row = await sql.one<{ id: string }>(
      `INSERT INTO personal_records (user_id, exercise_id, record_type, value, previous_value, weight_kg, reps, duration_seconds, session_id, set_id, achieved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [userId, r.exerciseId, r.type, r.value, r.previousValue, r.set.weightKg, r.set.reps, r.set.durationSeconds, sessionId, r.set.id, achievedAt],
    );
    ids.push(row.id);
  }
  return ids;
}
