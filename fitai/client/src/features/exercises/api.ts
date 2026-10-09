import type { ExerciseDetailDTO, ExerciseHistoryEntryDTO, ExerciseListQuery, ExerciseListResponse } from '@shared/types';
import { apiGet } from '../../api/client';

export const fetchExercises = (q: ExerciseListQuery, signal?: AbortSignal) =>
  apiGet<ExerciseListResponse>('/exercises', q as Record<string, string | number | boolean | undefined>, signal);

export const fetchExercise = (id: string) => apiGet<{ exercise: ExerciseDetailDTO }>(`/exercises/${encodeURIComponent(id)}`).then((r) => r.exercise);

export const fetchExerciseHistory = (id: string, limit = 10) =>
  apiGet<{ history: ExerciseHistoryEntryDTO[] }>(`/exercises/${encodeURIComponent(id)}/history`, { limit }).then((r) => r.history);
