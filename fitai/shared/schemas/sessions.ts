import { z } from 'zod';
import { LIMITS } from '../constants';
import { cleanText, slugId, uuid } from './common';

export const startSessionSchema = z.union([
  z.object({ planWorkoutId: uuid }),
  z.object({ empty: z.literal(true), name: cleanText(LIMITS.textShortMax).optional() }),
]);

export const restTimerSchema = z
  .object({
    durationSeconds: z.number().int().min(0).max(600),
    endsAt: z.string().datetime().nullable(),
    remainingSeconds: z.number().min(0).max(600).nullable(),
    exerciseId: z.string().max(80).nullable(),
  })
  .nullable();

export const sessionStateSchema = z.object({
  action: z.enum(['pause', 'resume', 'update']),
  currentExerciseIndex: z.number().int().min(0).max(LIMITS.exercisesPerWorkoutMax * 2).optional(),
  restTimer: restTimerSchema.optional(),
});

export const updateSetSchema = z.object({
  reps: z.number().int().min(0).max(1000).nullable().optional(),
  weightKg: z.number().min(0).max(LIMITS.setWeightKgMax).nullable().optional(),
  durationSeconds: z.number().int().min(0).max(LIMITS.setDurationSecondsMax).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  completed: z.boolean().optional(),
});

export const addSessionExerciseSchema = z.object({
  exerciseId: slugId,
  sets: z.number().int().min(1).max(LIMITS.setsMax).default(3),
});

export const finishSessionSchema = z.object({
  notes: cleanText(1000).default(''),
  perceivedExertion: z.number().int().min(1).max(10).nullable().default(null),
});
