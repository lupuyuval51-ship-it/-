/**
 * Exercise-library state ⇄ URL query string. The library keeps search, filters and the
 * number of loaded pages in the URL so results are shareable and back/forward works.
 * Parsing is tolerant: unknown or invalid values are dropped, never thrown.
 */
import {
  DIFFICULTIES,
  EQUIPMENT,
  EXERCISE_CATEGORIES,
  MUSCLE_GROUPS,
  MUSCLE_TO_GROUP,
  MUSCLES,
  type Difficulty,
  type ExerciseCategory,
  type Locale,
  type Muscle,
  type MuscleGroup,
} from '@shared/constants';
import { EXERCISE_SEARCH_MAX } from '@shared/schemas/exercises';
import type { ExerciseEquipmentFilter, ExerciseFilterQuery, ExerciseListQuery } from '@shared/types';

export const LIBRARY_PAGE_SIZE = 24;
/** Upper bound for the `page` URL parameter (pages × page size covers any realistic library). */
export const MAX_LIBRARY_PAGES = 40;

export interface LibraryFilters {
  q: string;
  muscleGroup: MuscleGroup | null;
  muscle: Muscle | null;
  equipment: ExerciseEquipmentFilter | null;
  difficulty: Difficulty | null;
  category: ExerciseCategory | null;
  availableOnly: boolean;
}

export interface LibraryState extends LibraryFilters {
  /** Number of result pages shown ("Load more" adds one). */
  pages: number;
}

export const DEFAULT_LIBRARY_STATE: LibraryState = {
  q: '',
  muscleGroup: null,
  muscle: null,
  equipment: null,
  difficulty: null,
  category: null,
  availableOnly: false,
  pages: 1,
};

/** URL parameter names (short and readable: `/exercises?q=squat&group=legs&page=2`). */
export const LIBRARY_PARAMS = {
  q: 'q',
  muscleGroup: 'group',
  muscle: 'muscle',
  equipment: 'equipment',
  difficulty: 'difficulty',
  category: 'category',
  availableOnly: 'available',
  pages: 'page',
} as const satisfies Record<keyof LibraryState, string>;

const EQUIPMENT_FILTERS: readonly ExerciseEquipmentFilter[] = [...EQUIPMENT, 'none'];

function oneOf<T extends string>(values: readonly T[], raw: string | null): T | null {
  return raw != null && (values as readonly string[]).includes(raw) ? (raw as T) : null;
}

/** Collapses whitespace and limits the length the API accepts. */
export function cleanSearch(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, EXERCISE_SEARCH_MAX);
}

/** A muscle only stays selected when it belongs to the selected muscle group. */
function consistentMuscle(muscle: Muscle | null, group: MuscleGroup | null): Muscle | null {
  return muscle && group && MUSCLE_TO_GROUP[muscle] !== group ? null : muscle;
}

export function parseLibraryState(params: URLSearchParams): LibraryState {
  const muscleGroup = oneOf(MUSCLE_GROUPS, params.get(LIBRARY_PARAMS.muscleGroup));
  const pagesRaw = Number(params.get(LIBRARY_PARAMS.pages));
  const available = params.get(LIBRARY_PARAMS.availableOnly);
  return {
    q: cleanSearch(params.get(LIBRARY_PARAMS.q) ?? ''),
    muscleGroup,
    muscle: consistentMuscle(oneOf(MUSCLES, params.get(LIBRARY_PARAMS.muscle)), muscleGroup),
    equipment: oneOf(EQUIPMENT_FILTERS, params.get(LIBRARY_PARAMS.equipment)),
    difficulty: oneOf(DIFFICULTIES, params.get(LIBRARY_PARAMS.difficulty)),
    category: oneOf(EXERCISE_CATEGORIES, params.get(LIBRARY_PARAMS.category)),
    availableOnly: available === '1' || available === 'true',
    pages: Number.isInteger(pagesRaw) && pagesRaw >= 1 ? Math.min(pagesRaw, MAX_LIBRARY_PAGES) : 1,
  };
}

/** Only non-default values are written, in a stable order. */
export function serializeLibraryState(state: LibraryState): URLSearchParams {
  const params = new URLSearchParams();
  const q = cleanSearch(state.q);
  if (q) params.set(LIBRARY_PARAMS.q, q);
  if (state.muscleGroup) params.set(LIBRARY_PARAMS.muscleGroup, state.muscleGroup);
  const muscle = consistentMuscle(state.muscle, state.muscleGroup);
  if (muscle) params.set(LIBRARY_PARAMS.muscle, muscle);
  if (state.equipment) params.set(LIBRARY_PARAMS.equipment, state.equipment);
  if (state.difficulty) params.set(LIBRARY_PARAMS.difficulty, state.difficulty);
  if (state.category) params.set(LIBRARY_PARAMS.category, state.category);
  if (state.availableOnly) params.set(LIBRARY_PARAMS.availableOnly, '1');
  const pages = Math.min(Math.max(1, Math.floor(state.pages)), MAX_LIBRARY_PAGES);
  if (pages > 1) params.set(LIBRARY_PARAMS.pages, String(pages));
  return params;
}

/** `?…` suffix for links (empty string for the default state). */
export function librarySearchString(state: LibraryState): string {
  const qs = serializeLibraryState(state).toString();
  return qs ? `?${qs}` : '';
}

/**
 * Applies a filter change: results restart from the first page, and changing the muscle
 * group clears a specific muscle that is not part of it.
 */
export function changeFilters(state: LibraryState, patch: Partial<LibraryFilters>): LibraryState {
  const next: LibraryState = { ...state, ...patch, pages: 1 };
  next.muscle = consistentMuscle(next.muscle, next.muscleGroup);
  return next;
}

/** Keeps the search text, drops every other filter. */
export function clearFilters(state: LibraryState): LibraryState {
  return { ...DEFAULT_LIBRARY_STATE, q: state.q };
}

/** Number of active filters, not counting the search text. */
export function activeFilterCount(f: LibraryFilters): number {
  return [f.muscleGroup, f.muscle, f.equipment, f.difficulty, f.category].filter(Boolean).length + (f.availableOnly ? 1 : 0);
}

export function hasCriteria(f: LibraryFilters): boolean {
  return cleanSearch(f.q) !== '' || activeFilterCount(f) > 0;
}

/** API filter parameters (only set values). */
export function toFilterQuery(f: LibraryFilters): ExerciseFilterQuery {
  const q = cleanSearch(f.q);
  const out: ExerciseFilterQuery = {};
  if (q) out.q = q;
  if (f.muscleGroup) out.muscleGroup = f.muscleGroup;
  const muscle = consistentMuscle(f.muscle, f.muscleGroup);
  if (muscle) out.muscle = muscle;
  if (f.equipment) out.equipment = f.equipment;
  if (f.difficulty) out.difficulty = f.difficulty;
  if (f.category) out.category = f.category;
  if (f.availableOnly) out.availableOnly = true;
  return out;
}

export function toListQuery(f: LibraryFilters, page: number, lang: Locale, pageSize = LIBRARY_PAGE_SIZE): ExerciseListQuery {
  return { ...toFilterQuery(f), page, pageSize, lang };
}
