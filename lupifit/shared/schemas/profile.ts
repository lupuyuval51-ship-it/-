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

export const MAX_MEAL_REMINDERS = 6;

export const remindersSchema = z.object({
  enabled: z.boolean(),
  workoutDays: uniqueArray(z.number().int().min(0).max(6), 7).transform((days) => [...days].sort((a, b) => a - b)),
  workoutTime: timeOfDay,
  mealLogging: z.boolean(),
  // Unique and chronological, so reminders never fire twice for the same minute.
  mealTimes: z
    .array(timeOfDay)
    .max(MAX_MEAL_REMINDERS)
    .transform((times) => Array.from(new Set(times)).sort()),
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

/** Custom daily targets (bounds mirror the DB constraints). The server additionally enforces the safety rules below. */
export const customTargetsSchema = z.object({
  calories: z.number().int().min(1000).max(6000),
  proteinG: z.number().int().min(20).max(400),
  carbsG: z.number().int().min(0).max(900),
  fatG: z.number().int().min(15).max(300),
});
export type CustomTargetsInput = z.infer<typeof customTargetsSchema>;

/** Custom nutrition targets, or `{ reset: true }` to go back to the computed targets. */
/** Accepts the calorie suggestion that is currently offered (the server re-checks that it still is the offered one). */
export const adjustmentApplySchema = z.object({ offsetKcal: z.number().int().min(-150).max(150) });
export type AdjustmentApplyInput = z.infer<typeof adjustmentApplySchema>;

export const targetsUpdateSchema = z.union([customTargetsSchema, z.object({ reset: z.literal(true) })]);
export type TargetsUpdateInput = z.infer<typeof targetsUpdateSchema>;

/** Minimum protein accepted for custom targets (g per kg of body weight). */
export const MIN_PROTEIN_G_PER_KG = 0.8;
/** Largest accepted gap between calories and the energy of the macros (4/4/9 kcal per g). */
export const MACRO_CALORIE_TOLERANCE = 0.1;

export const macroCalories = (t: Pick<CustomTargetsInput, 'proteinG' | 'carbsG' | 'fatG'>) => t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
export const minimumProteinG = (weightKg: number) => Math.ceil(weightKg * MIN_PROTEIN_G_PER_KG);

export type CustomTargetsIssue =
  | { code: 'calories_below_safe_minimum'; details: { minimum: number } }
  | { code: 'protein_too_low'; details: { minimum: number } }
  | { code: 'macros_inconsistent'; details: { macroCalories: number } };

/**
 * Safety rules for user-defined targets, shared by the server (authoritative, first issue → 422)
 * and the client (live hints): calories never below the computed safe minimum (which already
 * forbids any deficit for minors), protein at least 0.8 g/kg, and macros that add up to the
 * calories within 10%.
 */
export function customTargetsIssues(
  t: CustomTargetsInput,
  ctx: { minimumCalories: number; weightKg: number },
): CustomTargetsIssue[] {
  const issues: CustomTargetsIssue[] = [];
  if (t.calories < ctx.minimumCalories) issues.push({ code: 'calories_below_safe_minimum', details: { minimum: ctx.minimumCalories } });
  const minProtein = minimumProteinG(ctx.weightKg);
  if (t.proteinG < minProtein) issues.push({ code: 'protein_too_low', details: { minimum: minProtein } });
  const kcal = macroCalories(t);
  if (t.calories > 0 && Math.abs(kcal - t.calories) / t.calories > MACRO_CALORIE_TOLERANCE) {
    issues.push({ code: 'macros_inconsistent', details: { macroCalories: kcal } });
  }
  return issues;
}

export const bodyWeightSchema = z.object({
  date: dateString,
  weightKg: z.number().min(LIMITS.weightKgMin).max(LIMITS.weightKgMax),
  note: cleanText(200).default(''),
});
export type BodyWeightInput = z.infer<typeof bodyWeightSchema>;

export const DELETE_CONFIRMATION = 'DELETE';
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'required').max(LIMITS.passwordMax),
  confirm: z.literal(DELETE_CONFIRMATION),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
