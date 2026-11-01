import { z } from 'zod';
import {
  ACTIVITY_LEVELS, ALLERGENS, DIETARY_RESTRICTIONS, DIET_TYPES, DIFFICULTIES, EQUIPMENT, GOALS,
  INJURY_AREAS, LANGUAGES, LIMITS, MEAL_SLOTS, PLACES, SEXES, SPORTS, THEMES, UNITS, WORKOUT_MODES,
} from './enums.js';

const intIn = (min: number, max: number) => z.number().int().min(min).max(max);
const numIn = (min: number, max: number) => z.number().min(min).max(max);

export const EmailSchema = z.string().trim().toLowerCase().email().max(254);
export const PasswordSchema = z.string().min(10).max(200);
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const RegisterBodySchema = z.object({ email: EmailSchema, password: PasswordSchema });
export const LoginBodySchema = z.object({ email: EmailSchema, password: z.string().min(1).max(200) });
export const ForgotPasswordBodySchema = z.object({ email: EmailSchema });
export const ResetPasswordBodySchema = z.object({ token: z.string().min(16).max(200), password: PasswordSchema });

export const ProfileInputSchema = z.object({
  displayName: z.string().trim().max(60).optional(),
  language: z.enum(LANGUAGES),
  theme: z.enum(THEMES).default('system'),
  units: z.enum(UNITS).default('metric'),
  sex: z.enum(SEXES),
  age: intIn(LIMITS.age.min, LIMITS.age.max),
  heightCm: numIn(LIMITS.heightCm.min, LIMITS.heightCm.max),
  weightKg: numIn(LIMITS.weightKg.min, LIMITS.weightKg.max),
  goal: z.enum(GOALS),
  experience: z.enum(DIFFICULTIES),
  place: z.enum(PLACES),
  equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length),
  injuries: z.array(z.enum(INJURY_AREAS)).max(INJURY_AREAS.length),
  daysPerWeek: intIn(LIMITS.daysPerWeek.min, LIMITS.daysPerWeek.max),
  sessionMinutes: intIn(LIMITS.sessionMinutes.min, LIMITS.sessionMinutes.max),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  diet: z.enum(DIET_TYPES).default('omnivore'),
  allergies: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length).default([]),
  restrictions: z.array(z.enum(DIETARY_RESTRICTIONS)).max(DIETARY_RESTRICTIONS.length).default([]),
  customKcal: intIn(800, 6000).optional(),
});
export type ProfileInput = z.infer<typeof ProfileInputSchema>;

export const SetInputSchema = z.object({
  reps: intIn(0, LIMITS.reps.max).optional(),
  weightKg: numIn(0, 1000).optional(),
  durationSec: intIn(0, 7200).optional(),
  rpe: numIn(LIMITS.rpe.min, LIMITS.rpe.max).refine((v) => Number.isInteger(v * 2), 'rpe_step').optional(),
});

export const GenerateWorkoutQuerySchema = z.object({
  place: z.enum(PLACES),
  equipment: z.array(z.enum(EQUIPMENT)).default([]),
  mode: z.enum(WORKOUT_MODES),
  sport: z.enum(SPORTS).nullable().optional(),
});

export const FoodLogInputSchema = z.object({
  loggedDate: IsoDateSchema,
  slot: z.enum(MEAL_SLOTS),
  foodId: z.string().min(1).max(80).optional(),
  name: z.string().trim().min(1).max(120),
  grams: numIn(1, 5000),
  kcal: numIn(0, 5000),
  proteinG: numIn(0, 500),
  carbsG: numIn(0, 1000),
  fatG: numIn(0, 500),
});

/** Backup payload: every collection has a hard .max() so restore cannot be used for memory DoS. */
export const BackupPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().max(40),
  profile: ProfileInputSchema.nullable(),
  bodyWeight: z.array(z.object({ loggedDate: IsoDateSchema, weightKg: numIn(LIMITS.weightKg.min, LIMITS.weightKg.max), note: z.string().max(300).optional() })).max(20000),
  foodLog: z.array(FoodLogInputSchema).max(100000),
  sessions: z.array(z.object({
    id: z.string().max(80),
    startedAt: z.string().max(40),
    finishedAt: z.string().max(40).nullable(),
    exercises: z.array(z.object({
      exerciseId: z.string().max(80),
      sport: z.enum(SPORTS).nullable(),
      isFinisher: z.boolean(),
      sets: z.array(SetInputSchema).max(LIMITS.sets.max * 3),
    })).max(LIMITS.maxExercisesPerWorkout + 5),
  })).max(20000),
}).strict();
export type BackupPayload = z.infer<typeof BackupPayloadSchema>;
