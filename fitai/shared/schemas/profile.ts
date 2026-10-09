import { z } from 'zod';
import {
  ACTIVITY_LEVELS,
  ALLERGENS,
  DIET_TYPES,
  DIETARY_RESTRICTIONS,
  EQUIPMENT,
  EXPERIENCE_LEVELS,
  GOALS,
  INJURY_AREAS,
  LIMITS,
  LOCALES,
  LOCATIONS,
  MUSCLE_GROUPS,
  OCCUPATION_ACTIVITY,
  SEXES,
  STRESS_LEVELS,
  THEMES,
  UNITS,
} from '../constants';
import { cleanText, dateString, nullableInt, requiredText, slugId, timeOfDay, timeZone } from './common';

const uniqueArray = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z.array(item).max(max).transform((a) => Array.from(new Set(a)) as z.infer<T>[]);

export const abilitySchema = z.object({
  pushUpsMax: nullableInt(0, 200).default(null),
  pullUpsMax: nullableInt(0, 100).default(null),
  plankSeconds: nullableInt(0, 3600).default(null),
  squat1rmKg: nullableInt(0, 500).default(null),
  bench1rmKg: nullableInt(0, 400).default(null),
  deadlift1rmKg: nullableInt(0, 500).default(null),
});

export const remindersSchema = z.object({
  enabled: z.boolean(),
  workoutDays: uniqueArray(z.number().int().min(0).max(6), 7),
  workoutTime: timeOfDay,
  mealLogging: z.boolean(),
  mealTimes: z.array(timeOfDay).max(6),
});

/** Full onboarding questionnaire. */
export const onboardingSchema = z.object({
  ageYears: z.number().int().min(LIMITS.ageMin, 'age_too_young').max(LIMITS.ageMax),
  sex: z.enum(SEXES),
  heightCm: z.number().min(LIMITS.heightCmMin).max(LIMITS.heightCmMax),
  weightKg: z.number().min(LIMITS.weightKgMin).max(LIMITS.weightKgMax),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  ability: abilitySchema.default({}),
  goal: z.enum(GOALS),
  trainingLocation: z.enum(LOCATIONS),
  equipment: uniqueArray(z.enum(EQUIPMENT), EQUIPMENT.length),
  daysPerWeek: z.number().int().min(LIMITS.daysPerWeekMin).max(LIMITS.daysPerWeekMax),
  sessionMinutes: z.number().int().min(LIMITS.sessionMinutesMin).max(LIMITS.sessionMinutesMax),
  preferredDays: uniqueArray(z.number().int().min(0).max(6), 7).default([]),
  focusMuscleGroups: uniqueArray(z.enum(MUSCLE_GROUPS), MUSCLE_GROUPS.length).default([]),
  avoidExerciseIds: uniqueArray(slugId, 50).default([]),
  exerciseLikes: cleanText(500).default(''),
  exerciseDislikes: cleanText(500).default(''),
  limitations: cleanText(1000).default(''),
  injuries: uniqueArray(z.enum(INJURY_AREAS), INJURY_AREAS.length).default([]),
  injuryNotes: cleanText(1000).default(''),
  dietType: z.enum(DIET_TYPES),
  allergies: uniqueArray(z.enum(ALLERGENS), ALLERGENS.length).default([]),
  dietaryRestrictions: uniqueArray(z.enum(DIETARY_RESTRICTIONS), DIETARY_RESTRICTIONS.length).default([]),
  dislikedFoods: cleanText(500).default(''),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  occupationActivity: z.enum(OCCUPATION_ACTIVITY),
  sleepHours: z.number().min(0).max(24).nullable().default(null),
  stressLevel: z.enum(STRESS_LEVELS).nullable().default(null),
  mealsPerDay: z.number().int().min(1).max(8).default(3),
  weeklyWorkoutGoal: z.number().int().min(1).max(7).optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

/** Partial profile edit from the profile page (same field rules, all optional). */
export const profileUpdateSchema = onboardingSchema.partial().extend({
  weeklyWorkoutGoal: z.number().int().min(1).max(7).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const settingsUpdateSchema = z.object({
  displayName: requiredText(60).optional(),
  locale: z.enum(LOCALES).optional(),
  theme: z.enum(THEMES).optional(),
  units: z.enum(UNITS).optional(),
  timezone: timeZone.optional(),
  reminders: remindersSchema.optional(),
});
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

/** Custom nutrition targets; `null` resets to computed targets. Server enforces safe minimums. */
export const targetsUpdateSchema = z.union([
  z.object({
    calories: z.number().int().min(1000).max(6000),
    proteinG: z.number().int().min(20).max(400),
    carbsG: z.number().int().min(0).max(900),
    fatG: z.number().int().min(15).max(300),
  }),
  z.object({ reset: z.literal(true) }),
]);
export type TargetsUpdateInput = z.infer<typeof targetsUpdateSchema>;

export const bodyWeightSchema = z.object({
  date: dateString,
  weightKg: z.number().min(LIMITS.weightKgMin).max(LIMITS.weightKgMax),
  note: cleanText(200).default(''),
});
export type BodyWeightInput = z.infer<typeof bodyWeightSchema>;

export const deleteAccountSchema = z.object({ password: z.string().min(1).max(LIMITS.passwordMax), confirm: z.literal('DELETE') });
