import { z } from 'zod';
import { LIMITS, SESSION_STATUSES } from '../constants';
import { READINESS_ENERGY, READINESS_SLEEP, READINESS_SORENESS } from '../readiness';
import { MAX_REST_SECONDS } from '../timer';
import { cleanText, slugId, uuid } from './common';

/** Upper bounds for a single live session (the DB allows a little more headroom). */
export const SESSION_LIMITS = {
  exercisesMax: LIMITS.exercisesPerWorkoutMax * 2,
  setsPerExerciseMax: 30,
  notesMax: 1000,
  exerciseNotesMax: 500,
  historyPageMax: 50,
} as const;

/** Optional pre-workout check-in: three taps, each answer required only if the check-in is sent. */
export const readinessSchema = z.object({
  energy: z.enum(READINESS_ENERGY),
  soreness: z.enum(READINESS_SORENESS),
  sleep: z.enum(READINESS_SLEEP),
});

export const startSessionSchema = z.union([
  z.object({ planWorkoutId: uuid, readiness: readinessSchema.optional() }),
  z.object({ empty: z.literal(true), name: cleanText(LIMITS.textShortMax).optional() }),
]);
export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const restTimerSchema = z
  .object({
    durationSeconds: z.number().int().min(0).max(MAX_REST_SECONDS),
    endsAt: z.string().datetime().nullable(),
    remainingSeconds: z.number().min(0).max(MAX_REST_SECONDS).nullable(),
    exerciseId: z.string().max(80).nullable(),
  })
  .nullable();

export const sessionStateSchema = z.object({
  action: z.enum(['pause', 'resume', 'update']),
  currentExerciseIndex: z.number().int().min(0).max(SESSION_LIMITS.exercisesMax).optional(),
  restTimer: restTimerSchema.optional(),
});
export type SessionStateInput = z.infer<typeof sessionStateSchema>;

export const updateSetSchema = z.object({
  reps: z.number().int().min(0).max(1000).nullable().optional(),
  weightKg: z.number().min(0).max(LIMITS.setWeightKgMax).nullable().optional(),
  durationSeconds: z.number().int().min(0).max(LIMITS.setDurationSecondsMax).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  completed: z.boolean().optional(),
});
export type UpdateSetInput = z.infer<typeof updateSetSchema>;

export const addSessionExerciseSchema = z.object({
  exerciseId: slugId,
  sets: z.number().int().min(1).max(LIMITS.setsMax).default(3),
});
export type AddSessionExerciseInput = z.input<typeof addSessionExerciseSchema>;

export const replaceSessionExerciseSchema = z.object({ exerciseId: slugId });
export type ReplaceSessionExerciseInput = z.infer<typeof replaceSessionExerciseSchema>;

export const updateSessionExerciseSchema = z
  .object({
    restSeconds: z.number().int().min(LIMITS.restSecondsMin).max(LIMITS.restSecondsMax).optional(),
    notes: cleanText(SESSION_LIMITS.exerciseNotesMax).optional(),
  })
  .refine((v) => v.restSeconds !== undefined || v.notes !== undefined, { message: 'required' });
export type UpdateSessionExerciseInput = z.infer<typeof updateSessionExerciseSchema>;

export const finishSessionSchema = z.object({
  notes: cleanText(SESSION_LIMITS.notesMax).default(''),
  perceivedExertion: z.number().int().min(1).max(10).nullable().default(null),
});
export type FinishSessionInput = z.input<typeof finishSessionSchema>;

export const sessionHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(SESSION_LIMITS.historyPageMax).default(20),
  before: z.string().datetime({ offset: true }).optional(),
  status: z.enum(SESSION_STATUSES).default('completed'),
});
export type SessionHistoryQuery = z.infer<typeof sessionHistoryQuerySchema>;
