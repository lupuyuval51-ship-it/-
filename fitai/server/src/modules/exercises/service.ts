import { MUSCLE_TO_GROUP, type MuscleGroup } from '@shared/constants';
import { estimateOneRepMax } from '@shared/training';
import type { ExerciseDetailDTO, ExerciseHistoryEntryDTO, ExerciseListQuery, ExerciseListResponse } from '@shared/types';
import type { Sql } from '../../db/pool';
import { getProfile } from '../profile/repository';
import { getAllExercises, getExercise, toExerciseSummary, userContextFor, type ExerciseRecord } from './repository';

const DIFFICULTY_ORDER = { beginner: 0, intermediate: 1, advanced: 2 } as const;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[֑-ׇ]/g, '') // Hebrew niqqud
    .replace(/[̀-ͯ]/g, '')
    .replace(/[-_'"׳״]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchScore(e: ExerciseRecord, q: string): number {
  if (!q) return 1;
  const terms = q.split(' ').filter(Boolean);
  const hay = normalize([e.id, e.name.en, e.name.he, ...e.primaryMuscles, ...e.secondaryMuscles, e.category, e.movementPattern, ...e.equipment].join(' '));
  const nameEn = normalize(e.name.en);
  const nameHe = normalize(e.name.he);
  let score = 0;
  for (const term of terms) {
    if (!hay.includes(term)) return 0;
    if (nameEn.startsWith(term) || nameHe.startsWith(term)) score += 3;
    else if (nameEn.includes(term) || nameHe.includes(term)) score += 2;
    else score += 1;
  }
  return score;
}

export function muscleGroupsOf(e: Pick<ExerciseRecord, 'primaryMuscles'>): MuscleGroup[] {
  return Array.from(new Set(e.primaryMuscles.map((m) => MUSCLE_TO_GROUP[m])));
}

/** Filters, searches (EN/HE, typo-tolerant prefix/substring) and paginates the library. */
export async function listExercises(sql: Sql, userId: string, query: ExerciseListQuery): Promise<ExerciseListResponse> {
  const all = await getAllExercises();
  const q = normalize(query.q ?? '');
  let userEquipment: ExerciseRecord['equipment'] | null = null;
  let injuries: ExerciseRecord['contraindications'] = [];
  if (query.availableOnly) {
    const profile = await getProfile(sql, userId);
    userEquipment = profile.equipment;
    injuries = profile.injuries;
  }
  const scored = all
    .map((e) => ({ e, score: searchScore(e, q) }))
    .filter(({ e, score }) => {
      if (score === 0) return false;
      if (query.muscle && !e.primaryMuscles.includes(query.muscle) && !e.secondaryMuscles.includes(query.muscle)) return false;
      if (query.muscleGroup && !muscleGroupsOf(e).includes(query.muscleGroup)) return false;
      if (query.equipment && !e.equipment.includes(query.equipment)) return false;
      if (query.difficulty && e.difficulty !== query.difficulty) return false;
      if (query.category && e.category !== query.category) return false;
      if (userEquipment) {
        const ctx = userContextFor(e, userEquipment, injuries);
        if (!ctx.hasRequiredEquipment) return false;
      }
      return true;
    })
    .sort((a, b) => b.score - a.score || DIFFICULTY_ORDER[a.e.difficulty] - DIFFICULTY_ORDER[b.e.difficulty] || a.e.name.en.localeCompare(b.e.name.en));
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 30));
  const page = Math.max(1, query.page ?? 1);
  return {
    items: scored.slice((page - 1) * pageSize, page * pageSize).map(({ e }) => toExerciseSummary(e)),
    total: scored.length,
    page,
    pageSize,
  };
}

/** Recent sessions in which the user completed sets of this exercise (newest first). */
export async function exerciseHistory(sql: Sql, userId: string, exerciseId: string, limit = 5): Promise<ExerciseHistoryEntryDTO[]> {
  const rows = await sql.many<{ session_id: string; ended_at: Date; timezone: string; sets: { reps: number | null; weightKg: number | null; durationSeconds: number | null }[] }>(
    `SELECT ws.id AS session_id, ws.ended_at, u.timezone,
            json_agg(json_build_object('reps', ss.reps, 'weightKg', ss.weight_kg, 'durationSeconds', ss.duration_seconds)
                     ORDER BY ss.set_number) AS sets
       FROM workout_sessions ws
       JOIN users u ON u.id = ws.user_id
       JOIN session_exercises se ON se.session_id = ws.id
       JOIN session_sets ss ON ss.session_exercise_id = se.id AND ss.completed
      WHERE ws.user_id = $1 AND se.exercise_id = $2 AND ws.status = 'completed'
      GROUP BY ws.id, ws.ended_at, u.timezone
      ORDER BY ws.ended_at DESC
      LIMIT $3`,
    [userId, exerciseId, limit],
  );
  return rows.map((r) => ({
    sessionId: r.session_id,
    date: new Intl.DateTimeFormat('en-CA', { timeZone: r.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(r.ended_at)),
    sets: r.sets.map((s) => ({ reps: s.reps, weightKg: s.weightKg != null ? Number(s.weightKg) : null, durationSeconds: s.durationSeconds })),
    bestEst1rmKg: r.sets.reduce<number | null>((best, s) => {
      const est = estimateOneRepMax(s.weightKg != null ? Number(s.weightKg) : null, s.reps);
      return est != null && (best == null || est > best) ? est : best;
    }, null),
  }));
}

export async function exerciseDetail(sql: Sql, userId: string, id: string): Promise<ExerciseDetailDTO | null> {
  const e = await getExercise(id);
  if (!e) return null;
  const profile = await getProfile(sql, userId);
  const resolve = async (ids: string[]) => (await Promise.all(ids.map((x) => getExercise(x)))).filter((x): x is ExerciseRecord => x != null).map(toExerciseSummary);
  return {
    ...toExerciseSummary(e),
    description: e.description,
    instructions: e.instructions,
    mistakes: e.mistakes,
    safety: e.safety,
    contraindications: e.contraindications,
    isCompound: e.isCompound,
    loadIncrementKg: e.loadIncrementKg,
    easierAlternatives: await resolve(e.easierAlternatives),
    harderAlternatives: await resolve(e.harderAlternatives),
    media: e.media,
    userContext: profile.onboardingCompletedAt ? userContextFor(e, profile.equipment, profile.injuries) : null,
    recentHistory: await exerciseHistory(sql, userId, id),
  };
}
