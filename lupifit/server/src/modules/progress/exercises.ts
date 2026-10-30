/** Per-exercise strength progression and personal records, from completed sets only. */
import { addDays } from '@shared/dates';
import { round1 } from '@shared/nutrition';
import { estimateOneRepMax, setVolumeKg } from '@shared/training';
import type { ExerciseProgressDTO, ExerciseProgressPointDTO, TrainedExerciseDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { notFound } from '../../lib/errors';
import { getExercise, getExerciseMap } from '../exercises/repository';
import { PR_COLUMNS, instantBounds, localDate, toPersonalRecordDTO, type PersonalRecordRow, type UserContext } from './data';

/** Exercises with at least one completed set in a completed session, most recently trained first. */
export async function listTrainedExercises(sql: Sql, ctx: UserContext): Promise<TrainedExerciseDTO[]> {
  const rows = await sql.many<{ exercise_id: string; sessions: number; last_at: Date }>(
    `SELECT se.exercise_id, COUNT(DISTINCT s.id)::int AS sessions, MAX(COALESCE(s.ended_at, s.started_at)) AS last_at
       FROM workout_sessions s
       JOIN session_exercises se ON se.session_id = s.id AND se.user_id = s.user_id
      WHERE s.user_id = $1 AND s.status = 'completed'
        AND EXISTS (SELECT 1 FROM session_sets ss WHERE ss.session_exercise_id = se.id AND ss.completed)
      GROUP BY se.exercise_id
      ORDER BY last_at DESC, se.exercise_id`,
    [ctx.userId],
  );
  const exercises = await getExerciseMap();
  return rows.map((r) => ({
    exerciseId: r.exercise_id,
    name: exercises.get(r.exercise_id)?.name ?? { en: r.exercise_id, he: r.exercise_id },
    sessions: Number(r.sessions),
    lastPerformed: localDate(new Date(r.last_at), ctx.timezone),
  }));
}

interface SetRow {
  session_id: string;
  at: Date;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
}

/** One point per completed session in the period (oldest first) plus the exercise's all-time records. */
export async function exerciseProgress(sql: Sql, ctx: UserContext, exerciseId: string, period: number): Promise<ExerciseProgressDTO> {
  const exercise = await getExercise(exerciseId);
  if (!exercise) throw notFound('exercise_not_found');
  const from = addDays(ctx.today, -(period - 1));
  const [lo] = instantBounds(from, ctx.today);
  const rows = await sql.many<SetRow>(
    `SELECT s.id AS session_id, COALESCE(s.ended_at, s.started_at) AS at, ss.reps, ss.weight_kg, ss.duration_seconds
       FROM workout_sessions s
       JOIN session_exercises se ON se.session_id = s.id AND se.user_id = s.user_id
       JOIN session_sets ss ON ss.session_exercise_id = se.id
      WHERE s.user_id = $1 AND s.status = 'completed' AND se.exercise_id = $2 AND ss.completed
        AND COALESCE(s.ended_at, s.started_at) >= $3
      ORDER BY COALESCE(s.ended_at, s.started_at), s.id, ss.set_number`,
    [ctx.userId, exerciseId, lo],
  );

  const bySession = new Map<string, { date: string; sets: SetRow[] }>();
  for (const r of rows) {
    const date = localDate(new Date(r.at), ctx.timezone);
    if (date < from || date > ctx.today) continue;
    const entry = bySession.get(r.session_id) ?? { date, sets: [] };
    entry.sets.push(r);
    bySession.set(r.session_id, entry);
  }

  const maxOf = (values: (number | null)[]) => {
    const present = values.filter((v): v is number => v != null && v > 0);
    return present.length ? Math.max(...present) : null;
  };
  const points: ExerciseProgressPointDTO[] = Array.from(bySession.entries()).map(([sessionId, { date, sets }]) => {
    const n = (v: number | null) => (v == null ? null : Number(v));
    return {
      date,
      sessionId,
      bestEst1rmKg: maxOf(sets.map((s) => estimateOneRepMax(n(s.weight_kg), n(s.reps)))),
      maxWeightKg: maxOf(sets.filter((s) => (n(s.reps) ?? 0) >= 1).map((s) => n(s.weight_kg))),
      maxReps: maxOf(sets.map((s) => n(s.reps))),
      maxDurationSeconds: maxOf(sets.map((s) => n(s.duration_seconds))),
      volumeKg: round1(sets.reduce((acc, s) => acc + setVolumeKg(n(s.weight_kg), n(s.reps)), 0)),
    };
  });

  const prRows = await sql.many<PersonalRecordRow>(
    `SELECT ${PR_COLUMNS} FROM personal_records
      WHERE user_id = $1 AND exercise_id = $2
      ORDER BY achieved_at DESC, created_at DESC, id LIMIT 50`,
    [ctx.userId, exerciseId],
  );
  const exercises = await getExerciseMap();
  return {
    exerciseId,
    name: exercise.name,
    trackingType: exercise.trackingType,
    points,
    records: prRows.map((r) => toPersonalRecordDTO(r, exercises)),
  };
}
