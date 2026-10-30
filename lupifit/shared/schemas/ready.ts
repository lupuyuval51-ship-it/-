import { z } from 'zod';
import { DIFFICULTIES, EQUIPMENT, LOCATIONS, READY_FOCUSES, SPORTS, TRAINING_MODES } from '../constants';
import { intParam, slugId } from './common';

/** Most ready workouts one list response returns. */
export const READY_PAGE_SIZE_MAX = 60;

/** Comma-separated equipment (`dumbbells,bench`); an empty string means "no equipment". Unknown values are rejected. */
export const equipmentCsv = z
  .string()
  .max(400)
  .transform((s) => (s.trim() === '' ? [] : s.split(',').map((x) => x.trim())))
  .pipe(z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length))
  .transform((list) => Array.from(new Set(list)));

/** Filters of `GET /api/ready-workouts` (query-string values). Omitted `equipment` = the location's default gear. */
export const readyListQuerySchema = z.object({
  location: z.enum(LOCATIONS).default('home'),
  equipment: equipmentCsv.optional(),
  mode: z.enum(TRAINING_MODES).optional(),
  focus: z.enum(READY_FOCUSES).optional(),
  level: z.enum(DIFFICULTIES).optional(),
  /** Longest main workout (warm-up included) the user wants. */
  maxMinutes: intParam(10, 180).optional(),
  page: intParam(1, 1000).default(1),
  pageSize: intParam(1, READY_PAGE_SIZE_MAX).default(24),
});
export type ReadyListQueryInput = z.output<typeof readyListQuerySchema>;

/** `GET /api/ready-workouts/:id` — the equipment and sport the preview is built for. */
export const readyDetailQuerySchema = z.object({
  location: z.enum(LOCATIONS).default('home'),
  equipment: equipmentCsv.optional(),
  sport: z.enum(SPORTS).optional(),
});
export type ReadyDetailQueryInput = z.output<typeof readyDetailQuerySchema>;

/** Body part of `POST /api/sessions` that starts a ready workout (see `startSessionSchema`). */
export const startReadyWorkoutFields = {
  readyWorkoutId: slugId,
  sport: z.enum(SPORTS).optional(),
  location: z.enum(LOCATIONS).optional(),
  equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length).optional(),
};
