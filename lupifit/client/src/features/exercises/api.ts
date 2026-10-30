import type {
  ExerciseDetailResponse,
  ExerciseFacetsResponse,
  ExerciseFilterQuery,
  ExerciseHistoryResponse,
  ExerciseListQuery,
  ExerciseListResponse,
} from '@shared/types';
import { apiGet } from '../../api/client';

type QueryParams = Record<string, string | number | boolean | undefined>;

/** Query keys owned by the exercises feature (under the shared `exercises` prefix). */
export const exerciseKeys = {
  facets: (params: ExerciseFilterQuery) => ['exercises', 'facets', params] as const,
};

export const fetchExercises = (q: ExerciseListQuery, signal?: AbortSignal) => apiGet<ExerciseListResponse>('/exercises', q as QueryParams, signal);

export const fetchExerciseFacets = (q: ExerciseFilterQuery, signal?: AbortSignal) =>
  apiGet<ExerciseFacetsResponse>('/exercises/facets', q as QueryParams, signal).then((r) => r.facets);

export const fetchExercise = (id: string, signal?: AbortSignal) =>
  apiGet<ExerciseDetailResponse>(`/exercises/${encodeURIComponent(id)}`, undefined, signal).then((r) => r.exercise);

export const fetchExerciseHistory = (id: string, limit = 10) =>
  apiGet<ExerciseHistoryResponse>(`/exercises/${encodeURIComponent(id)}/history`, { limit }).then((r) => r.history);
