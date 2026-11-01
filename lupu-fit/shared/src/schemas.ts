import { z } from 'zod';
import {
  ACTIVITY_LEVELS, ALLERGENS, DIETARY_RESTRICTIONS, DIET_TYPES, DIFFICULTIES, EQUIPMENT, GOALS,
  INJURY_AREAS, LANGUAGES, LIMITS, MEAL_SLOTS, PLACES, SEXES, SPORTS, THEMES, UNITS, WORKOUT_MODES,
} from './enums.js';

const intIn = (min: number, max: number) => z.number().int().min(min).max(max);
const numIn = (min: number, max: number) => z.number().min(min).max(max);

/** Login name: 3-24 chars, lowercase letters/digits/_ . -, starting with a letter or digit. Case-insensitive (lowercased). */
export const UsernameSchema = z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9][a-z0-9_.-]*$/);
export const PasswordSchema = z.string().min(10).max(200);
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const RegisterBodySchema = z.object({ username: UsernameSchema, password: PasswordSchema });
export const LoginBodySchema = z.object({ username: UsernameSchema, password: z.string().min(1).max(200) });

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

/* ------------------------------------------------------------------ API bodies (shared by server and client) */
import { MEAL_SLOTS as _SLOTS } from './enums.js';

export const PrescriptionSchema = z.object({
  sets: intIn(LIMITS.sets.min, LIMITS.sets.max),
  repsMin: intIn(0, LIMITS.reps.max), repsMax: intIn(0, LIMITS.reps.max),
  rpe: numIn(LIMITS.rpe.min, LIMITS.rpe.max),
  restSec: intIn(LIMITS.restSec.min, LIMITS.restSec.max),
  loadKg: numIn(0, 1000).nullable(),
  durationSec: intIn(0, 7200).nullable(),
});

export const SessionStartSchema = z.object({
  name: z.string().trim().min(1).max(160),
  source: z.enum(['ready', 'plan', 'custom']),
  sourceId: z.string().max(120).optional(),
  sport: z.enum(SPORTS).nullable().optional(),
  localDate: IsoDateSchema,
  readiness: z.enum(['normal', 'easier', 'rest']).optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().min(1).max(80),
    isFinisher: z.boolean().default(false),
    sport: z.enum(SPORTS).nullable().optional(),
    planned: PrescriptionSchema,
  })).min(1).max(LIMITS.maxExercisesPerWorkout + 10),
});

export const SetBodySchema = z.object({
  sessionExerciseId: z.string().min(1).max(80),
  reps: intIn(0, LIMITS.reps.max).optional(),
  weightKg: numIn(0, 1000).optional(),
  durationSec: intIn(0, 7200).optional(),
  rpe: numIn(LIMITS.rpe.min, LIMITS.rpe.max).refine((v) => Number.isInteger(v * 2), 'rpe_step').optional(),
}).refine((b) => b.reps !== undefined || b.durationSec !== undefined, { message: 'reps_or_duration_required' });

export const SessionExerciseAddSchema = z.object({
  exerciseId: z.string().min(1).max(80), planned: PrescriptionSchema, isFinisher: z.boolean().default(false), sport: z.enum(SPORTS).nullable().optional(),
});
export const SessionExerciseReplaceSchema = z.object({ exerciseId: z.string().min(1).max(80) });
export const SessionOrderSchema = z.object({ ids: z.array(z.string().min(1).max(80)).min(1).max(40) });

export const WeightBodySchema = z.object({ loggedDate: IsoDateSchema, weightKg: numIn(LIMITS.weightKg.min, LIMITS.weightKg.max), note: z.string().trim().max(300).optional() });
export const ReadinessBodySchema = z.object({
  localDate: IsoDateSchema,
  sleep: intIn(1, 5), energy: intIn(1, 5), soreness: intIn(1, 5), pain: z.boolean(),
});

export const GeneratePlanBodySchema = z.object({
  seed: z.number().int().min(0).max(2 ** 31).default(1),
  daysPerWeek: intIn(LIMITS.daysPerWeek.min, LIMITS.daysPerWeek.max).optional(),
  sessionMinutes: intIn(LIMITS.sessionMinutes.min, LIMITS.sessionMinutes.max).optional(),
  mode: z.enum(WORKOUT_MODES).optional(),
  avoidIds: z.array(z.string().max(80)).max(60).default([]),
});
export const SavePlanBodySchema = z.object({ name: z.string().trim().min(1).max(120), plan: z.record(z.string(), z.unknown()), activate: z.boolean().default(false) });
export const PlanPatchSchema = z.object({ name: z.string().trim().min(1).max(120).optional(), archived: z.boolean().optional() });

export const FoodLogBodySchema = z.object({
  loggedDate: IsoDateSchema,
  slot: z.enum(_SLOTS),
  foodId: z.string().max(80).optional(), dishId: z.string().max(80).optional(),
  name: z.string().trim().min(1).max(160),
  grams: numIn(0.1, 5000), kcal: numIn(0, 5000), proteinG: numIn(0, 500), carbsG: numIn(0, 1000), fatG: numIn(0, 500),
  estimated: z.boolean().default(false),
});
export const FoodCopyBodySchema = z.object({ fromDate: IsoDateSchema, toDate: IsoDateSchema });
export const CustomFoodBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  kcal: numIn(0, 900), proteinG: numIn(0, 100), carbsG: numIn(0, 100), fatG: numIn(0, 100), servingG: numIn(1, 1000).default(100),
  barcode: z.string().regex(/^\d{8,14}$/).optional(),
});
export const SavedMealBodySchema = z.object({
  name: z.string().trim().min(1).max(120), slot: z.enum(_SLOTS),
  items: z.array(z.object({ foodId: z.string().max(80).optional(), name: z.string().trim().min(1).max(160), grams: numIn(0.1, 5000), kcal: numIn(0, 5000), proteinG: numIn(0, 500), carbsG: numIn(0, 1000), fatG: numIn(0, 500) })).min(1).max(40),
});
export const SavedMealLogBodySchema = z.object({ loggedDate: IsoDateSchema, slot: z.enum(_SLOTS).optional() });
export const PhotoEstimateBodySchema = z.object({ jpegBase64: z.string().min(100).max(11_000_000), lang: z.enum(LANGUAGES).default('he') });

export const CoachThreadBodySchema = z.object({ title: z.string().trim().min(1).max(120).optional() });
export const CoachMessageBodySchema = z.object({ text: z.string().trim().min(1).max(2000), lang: z.enum(LANGUAGES).default('he') });

export const AccountDeleteBodySchema = z.object({ confirm: z.literal('DELETE') });
export const ProfilePatchSchema = ProfileInputSchema.partial();
