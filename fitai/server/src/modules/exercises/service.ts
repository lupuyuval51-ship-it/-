import {
  DIFFICULTIES,
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  MUSCLE_GROUPS,
  MUSCLE_TO_GROUP,
  MUSCLES,
  type Equipment,
  type InjuryArea,
  type Locale,
  type MuscleGroup,
} from '@shared/constants';
import { estimateOneRepMax } from '@shared/training';
import type {
  ExerciseDetailDTO,
  ExerciseEquipmentFilter,
  ExerciseFacetsDTO,
  ExerciseFilterQuery,
  ExerciseHistoryEntryDTO,
  ExerciseListItemDTO,
  ExerciseListQuery,
  ExerciseListResponse,
} from '@shared/types';
import type { Sql } from '../../db/pool';
import { getProfile } from '../profile/repository';
import { getAllExercises, getExercise, toExerciseSummary, userContextFor, type ExerciseRecord } from './repository';
import { searchExercises } from './search';

const DIFFICULTY_ORDER = { beginner: 0, intermediate: 1, advanced: 2 } as const;
export const DEFAULT_PAGE_SIZE = 30;

export function muscleGroupsOf(e: Pick<ExerciseRecord, 'primaryMuscles'>): MuscleGroup[] {
  return Array.from(new Set(e.primaryMuscles.map((m) => MUSCLE_TO_GROUP[m])));
}

// ---------------------------------------------------------------- Filters

type FacetDimension = 'muscleGroup' | 'muscle' | 'equipment' | 'difficulty' | 'category';
const DIMENSIONS: FacetDimension[] = ['muscleGroup', 'muscle', 'equipment', 'difficulty', 'category'];

const MATCHERS: Record<FacetDimension, (e: ExerciseRecord, f: ExerciseFilterQuery) => boolean> = {
  muscleGroup: (e, f) => !f.muscleGroup || muscleGroupsOf(e).includes(f.muscleGroup),
  muscle: (e, f) => !f.muscle || e.primaryMuscles.includes(f.muscle) || e.secondaryMuscles.includes(f.muscle),
  equipment: (e, f) => !f.equipment || (f.equipment === 'none' ? e.equipment.length === 0 : e.equipment.includes(f.equipment)),
  difficulty: (e, f) => !f.difficulty || e.difficulty === f.difficulty,
  category: (e, f) => !f.category || e.category === f.category,
};

/** Facet dimensions whose filter the exercise does not satisfy. */
function failedDimensions(e: ExerciseRecord, f: ExerciseFilterQuery): FacetDimension[] {
  return DIMENSIONS.filter((d) => !MATCHERS[d](e, f));
}

/** The user's equipment & injuries, plus whether onboarding (and thus a real profile) exists. */
interface UserFit {
  onboarded: boolean;
  equipment: Equipment[];
  injuries: InjuryArea[];
}

async function loadUserFit(sql: Sql, userId: string): Promise<UserFit> {
  const profile = await getProfile(sql, userId);
  return { onboarded: profile.onboardingCompletedAt != null, equipment: profile.equipment, injuries: profile.injuries };
}

const hasEquipmentFor = (e: ExerciseRecord, fit: UserFit) => e.equipment.every((q) => fit.equipment.includes(q));

function toListItem(e: ExerciseRecord, fit: UserFit): ExerciseListItemDTO {
  return { ...toExerciseSummary(e), userContext: fit.onboarded ? userContextFor(e, fit.equipment, fit.injuries) : null };
}

const collators: Record<Locale, Intl.Collator> = {
  en: new Intl.Collator('en', { sensitivity: 'base' }),
  he: new Intl.Collator('he', { sensitivity: 'base' }),
};

// ---------------------------------------------------------------- List

/**
 * Searches (Hebrew/English, partial words, spelling-tolerant fallback), filters and
 * paginates the library. `availableOnly` keeps exercises whose required equipment is all
 * in the user's profile.
 */
export async function listExercises(sql: Sql, userId: string, query: ExerciseListQuery): Promise<ExerciseListResponse> {
  const [all, fit] = await Promise.all([getAllExercises(), loadUserFit(sql, userId)]);
  const { matches, approximate } = searchExercises(all, query.q);
  const lang: Locale = query.lang ?? 'en';
  const collator = collators[lang];
  const results = matches
    .filter(({ item }) => failedDimensions(item, query).length === 0 && (!query.availableOnly || hasEquipmentFor(item, fit)))
    .sort(
      (a, b) =>
        b.score - a.score ||
        DIFFICULTY_ORDER[a.item.difficulty] - DIFFICULTY_ORDER[b.item.difficulty] ||
        collator.compare(a.item.name[lang], b.item.name[lang]) ||
        a.item.id.localeCompare(b.item.id),
    );
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
  const page = Math.max(1, query.page ?? 1);
  return {
    items: results.slice((page - 1) * pageSize, page * pageSize).map(({ item }) => toListItem(item, fit)),
    total: results.length,
    page,
    pageSize,
    approximate: approximate && results.length > 0,
  };
}

// ---------------------------------------------------------------- Facets

const zeroCounts = <K extends string>(keys: readonly K[]) => Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

/**
 * Result counts per filter value. Each dimension is counted with all *other* filters
 * applied (search text and `availableOnly` always apply), so a count is exactly the
 * number of results the list would return after choosing that value.
 */
export async function exerciseFacets(sql: Sql, userId: string, filters: ExerciseFilterQuery): Promise<ExerciseFacetsDTO> {
  const [all, fit] = await Promise.all([getAllExercises(), loadUserFit(sql, userId)]);
  const { matches } = searchExercises(all, filters.q);
  const facets: ExerciseFacetsDTO = {
    total: 0,
    availableTotal: 0,
    muscleGroup: zeroCounts(MUSCLE_GROUPS),
    muscle: zeroCounts(MUSCLES),
    equipment: zeroCounts<ExerciseEquipmentFilter>([...EQUIPMENT, 'none']),
    difficulty: zeroCounts(DIFFICULTIES),
    category: zeroCounts(EXERCISE_CATEGORIES),
  };
  const add: Record<FacetDimension, (e: ExerciseRecord) => void> = {
    muscleGroup: (e) => muscleGroupsOf(e).forEach((g) => facets.muscleGroup[g]++),
    muscle: (e) => new Set([...e.primaryMuscles, ...e.secondaryMuscles]).forEach((m) => facets.muscle[m]++),
    equipment: (e) => {
      if (e.equipment.length === 0) facets.equipment.none++;
      else e.equipment.forEach((q) => facets.equipment[q]++);
    },
    difficulty: (e) => facets.difficulty[e.difficulty]++,
    category: (e) => facets.category[e.category]++,
  };
  for (const { item: e } of matches) {
    const available = hasEquipmentFor(e, fit);
    const failed = failedDimensions(e, filters);
    if (failed.length === 0 && available) facets.availableTotal++;
    if (filters.availableOnly && !available) continue;
    if (failed.length === 0) {
      facets.total++;
      for (const d of DIMENSIONS) add[d](e);
    } else if (failed.length === 1) {
      add[failed[0]!](e);
    }
  }
  return facets;
}

// ---------------------------------------------------------------- Detail & history

/** Recent sessions in which the user completed sets of this exercise (newest first). */
export async function exerciseHistory(sql: Sql, userId: string, exerciseId: string, limit = 5): Promise<ExerciseHistoryEntryDTO[]> {
  const rows = await sql.many<{ session_id: string; ended_at: Date; timezone: string; sets: { reps: number | null; weightKg: number | null; durationSeconds: number | null }[] }>(
    `SELECT ws.id AS session_id, ws.ended_at, u.timezone,
            json_agg(json_build_object('reps', ss.reps, 'weightKg', ss.weight_kg, 'durationSeconds', ss.duration_seconds)
                     ORDER BY se.position, ss.set_number) AS sets
       FROM workout_sessions ws
       JOIN users u ON u.id = ws.user_id
       JOIN session_exercises se ON se.session_id = ws.id AND se.user_id = ws.user_id
       JOIN session_sets ss ON ss.session_exercise_id = se.id AND ss.completed
      WHERE ws.user_id = $1 AND se.exercise_id = $2 AND ws.status = 'completed'
      GROUP BY ws.id, ws.ended_at, u.timezone
      ORDER BY ws.ended_at DESC
      LIMIT $3`,
    [userId, exerciseId, limit],
  );
  return rows.map((r) => {
    const sets = r.sets.map((s) => ({ reps: s.reps, weightKg: s.weightKg != null ? Number(s.weightKg) : null, durationSeconds: s.durationSeconds }));
    return {
      sessionId: r.session_id,
      date: new Intl.DateTimeFormat('en-CA', { timeZone: r.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(r.ended_at)),
      sets,
      bestEst1rmKg: sets.reduce<number | null>((best, s) => {
        const est = estimateOneRepMax(s.weightKg, s.reps);
        return est != null && (best == null || est > best) ? est : best;
      }, null),
    };
  });
}

export async function exerciseDetail(sql: Sql, userId: string, id: string): Promise<ExerciseDetailDTO | null> {
  const e = await getExercise(id);
  if (!e) return null;
  const fit = await loadUserFit(sql, userId);
  const resolve = async (ids: string[]) =>
    (await Promise.all(ids.map((x) => getExercise(x)))).filter((x): x is ExerciseRecord => x != null).map((x) => toListItem(x, fit));
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
    userContext: fit.onboarded ? userContextFor(e, fit.equipment, fit.injuries) : null,
    recentHistory: await exerciseHistory(sql, userId, id),
  };
}
