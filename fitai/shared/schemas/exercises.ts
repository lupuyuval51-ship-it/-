import { z } from 'zod';
import { DIFFICULTIES, EQUIPMENT, EXERCISE_CATEGORIES, LOCALES, MUSCLE_GROUPS, MUSCLES } from '../constants';
import { boolParam, cleanText, intParam } from './common';

/** Longest search text accepted by the exercise library. */
export const EXERCISE_SEARCH_MAX = 80;
/** Largest page the library API returns. */
export const EXERCISE_PAGE_SIZE_MAX = 100;

export const exerciseEquipmentFilter = z.enum([...EQUIPMENT, 'none']);

/** Filters shared by `GET /api/exercises` and `GET /api/exercises/facets` (query-string values). */
export const exerciseFilterQuerySchema = z.object({
  q: cleanText(EXERCISE_SEARCH_MAX).optional(),
  muscle: z.enum(MUSCLES).optional(),
  muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
  equipment: exerciseEquipmentFilter.optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  category: z.enum(EXERCISE_CATEGORIES).optional(),
  availableOnly: boolParam.optional(),
});

export const exerciseListQuerySchema = exerciseFilterQuerySchema.extend({
  page: intParam(1, 1000).optional(),
  pageSize: intParam(1, EXERCISE_PAGE_SIZE_MAX).optional(),
  lang: z.enum(LOCALES).optional(),
});

export const exerciseHistoryQuerySchema = z.object({
  limit: intParam(1, 50).default(10),
});

export type ExerciseFilterQueryInput = z.output<typeof exerciseFilterQuerySchema>;
export type ExerciseListQueryInput = z.output<typeof exerciseListQuerySchema>;
