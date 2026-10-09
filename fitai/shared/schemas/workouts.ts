import { z } from 'zod';
import { EQUIPMENT, GOALS, LIMITS, LOCATIONS, MUSCLE_GROUPS } from '../constants';
import { cleanText, requiredText, slugId, uuid } from './common';

export const generatePlanSchema = z.object({
  name: cleanText(LIMITS.textShortMax).optional(),
  goal: z.enum(GOALS).optional(),
  daysPerWeek: z.number().int().min(LIMITS.daysPerWeekMin).max(LIMITS.daysPerWeekMax).optional(),
  sessionMinutes: z.number().int().min(LIMITS.sessionMinutesMin).max(LIMITS.sessionMinutesMax).optional(),
  location: z.enum(LOCATIONS).optional(),
  equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length).optional(),
  focusMuscleGroups: z.array(z.enum(MUSCLE_GROUPS)).max(MUSCLE_GROUPS.length).optional(),
  notes: cleanText(500).optional(),
});

export const planExerciseInputSchema = z
  .object({
    id: uuid.optional(),
    exerciseId: slugId,
    sets: z.number().int().min(LIMITS.setsMin).max(LIMITS.setsMax),
    repMin: z.number().int().min(LIMITS.repsMin).max(LIMITS.repsMax).nullable(),
    repMax: z.number().int().min(LIMITS.repsMin).max(LIMITS.repsMax).nullable(),
    targetSeconds: z.number().int().min(5).max(7200).nullable(),
    restSeconds: z.number().int().min(LIMITS.restSecondsMin).max(LIMITS.restSecondsMax),
    targetRpe: z.number().min(LIMITS.rpeMin).max(LIMITS.rpeMax).nullable(),
    targetWeightKg: z.number().min(0).max(LIMITS.setWeightKgMax).nullable(),
    notes: cleanText(500).default(''),
  })
  .refine((e) => e.repMin == null || e.repMax == null || e.repMin <= e.repMax, { message: 'rep_range_invalid', path: ['repMax'] })
  .refine((e) => e.repMin != null || e.targetSeconds != null, { message: 'reps_or_time_required', path: ['repMin'] });

export const updateWorkoutSchema = z.object({
  name: requiredText(LIMITS.textShortMax),
  focus: cleanText(LIMITS.textShortMax).default(''),
  notes: cleanText(1000).default(''),
  exercises: z.array(planExerciseInputSchema).max(LIMITS.exercisesPerWorkoutMax),
});

export const updatePlanSchema = z.object({
  name: requiredText(LIMITS.textShortMax).optional(),
  description: cleanText(1000).optional(),
});

export const createPlanSchema = z.object({
  name: requiredText(LIMITS.textShortMax),
  description: cleanText(1000).default(''),
});

export const addWorkoutSchema = z.object({
  name: requiredText(LIMITS.textShortMax),
  focus: cleanText(LIMITS.textShortMax).default(''),
});
