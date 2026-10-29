/**
 * Profile data access shared by every module (generator, nutrition, coach, dashboard).
 * The profile module's routes own writes; other modules only read through here.
 */
import { ADULT_AGE, type Sex } from '@shared/constants';
import { todayInTimeZone, yearsBetween } from '@shared/dates';
import { computeNutritionTargets, type ComputedTargets, type DietPreferences } from '@shared/nutrition';
import { customTargetsIssues } from '@shared/schemas/profile';
import type { AbilityBenchmarks, NutritionTargetsDTO, ProfileDTO, ReminderSettings } from '@shared/types';
import type { Sql } from '../../db/pool';

export interface ProfileRow {
  user_id: string;
  age_years: number | null;
  age_recorded_on: string | null;
  sex: ProfileDTO['sex'];
  height_cm: number | null;
  weight_kg: number | null;
  experience_level: ProfileDTO['experienceLevel'];
  ability: Partial<AbilityBenchmarks> | null;
  goal: ProfileDTO['goal'];
  training_location: ProfileDTO['trainingLocation'];
  equipment: ProfileDTO['equipment'];
  days_per_week: number | null;
  session_minutes: number | null;
  preferred_days: number[];
  focus_muscle_groups: ProfileDTO['focusMuscleGroups'];
  avoid_exercise_ids: string[];
  exercise_likes: string;
  exercise_dislikes: string;
  limitations: string;
  injuries: ProfileDTO['injuries'];
  injury_notes: string;
  diet_type: ProfileDTO['dietType'];
  allergies: ProfileDTO['allergies'];
  dietary_restrictions: ProfileDTO['dietaryRestrictions'];
  disliked_foods: string;
  activity_level: ProfileDTO['activityLevel'];
  occupation_activity: ProfileDTO['occupationActivity'];
  sleep_hours: number | null;
  stress_level: ProfileDTO['stressLevel'];
  meals_per_day: number | null;
  weekly_workout_goal: number | null;
  calorie_target: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  targets_custom: boolean;
  calorie_adjustment: number;
  calorie_adjusted_on: string | null;
  adjustment_dismissed_until: string | null;
  reminders: ReminderSettings | null;
  onboarding_completed_at: Date | null;
  updated_at: Date | null;
  timezone: string;
}

const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  workoutDays: [],
  workoutTime: '18:00',
  mealLogging: false,
  mealTimes: ['08:00', '13:00', '19:30'],
};

const DEFAULT_ABILITY: AbilityBenchmarks = {
  pushUpsMax: null,
  pullUpsMax: null,
  plankSeconds: null,
  squat1rmKg: null,
  bench1rmKg: null,
  deadlift1rmKg: null,
};

/** Age today: the onboarding answer advanced by whole years since it was recorded. */
export function currentAge(row: Pick<ProfileRow, 'age_years' | 'age_recorded_on' | 'timezone'>): number | null {
  if (row.age_years == null) return null;
  if (!row.age_recorded_on) return row.age_years;
  return row.age_years + yearsBetween(row.age_recorded_on, todayInTimeZone(row.timezone));
}

/** Evidence-based targets from the profile, or null when required fields are missing. */
export function computedTargetsFor(row: ProfileRow, calorieOffset: number = row.calorie_adjustment ?? 0): ComputedTargets | null {
  const age = currentAge(row);
  if (age == null || !row.sex || !row.height_cm || !row.weight_kg || !row.activity_level || !row.goal) return null;
  return computeNutritionTargets({
    ageYears: age,
    sex: row.sex as Sex,
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    activityLevel: row.activity_level,
    goal: row.goal,
    calorieOffset,
  });
}

export function targetsFor(row: ProfileRow): NutritionTargetsDTO | null {
  const computed = computedTargetsFor(row);
  if (row.targets_custom && row.calorie_target && row.protein_target_g != null && row.carbs_target_g != null && row.fat_target_g != null) {
    return {
      calories: row.calorie_target,
      proteinG: row.protein_target_g,
      carbsG: row.carbs_target_g,
      fatG: row.fat_target_g,
      fiberG: Math.round((row.calorie_target / 1000) * 14),
      custom: true,
      adjustmentKcal: 0,
      computed,
    };
  }
  if (!computed) return null;
  return {
    calories: computed.calories,
    proteinG: computed.proteinG,
    carbsG: computed.carbsG,
    fatG: computed.fatG,
    fiberG: computed.fiberG,
    custom: false,
    adjustmentKcal: row.calorie_adjustment ?? 0,
    computed,
  };
}

export function toProfileDTO(row: ProfileRow): ProfileDTO {
  const age = currentAge(row);
  return {
    ageYears: row.age_years,
    currentAge: age,
    isMinor: age != null && age < ADULT_AGE,
    sex: row.sex,
    heightCm: row.height_cm != null ? Number(row.height_cm) : null,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    experienceLevel: row.experience_level,
    ability: { ...DEFAULT_ABILITY, ...(row.ability ?? {}) },
    goal: row.goal,
    trainingLocation: row.training_location,
    equipment: row.equipment ?? [],
    daysPerWeek: row.days_per_week,
    sessionMinutes: row.session_minutes,
    preferredDays: row.preferred_days ?? [],
    focusMuscleGroups: row.focus_muscle_groups ?? [],
    avoidExerciseIds: row.avoid_exercise_ids ?? [],
    exerciseLikes: row.exercise_likes ?? '',
    exerciseDislikes: row.exercise_dislikes ?? '',
    limitations: row.limitations ?? '',
    injuries: row.injuries ?? [],
    injuryNotes: row.injury_notes ?? '',
    dietType: row.diet_type,
    allergies: row.allergies ?? [],
    dietaryRestrictions: row.dietary_restrictions ?? [],
    dislikedFoods: row.disliked_foods ?? '',
    activityLevel: row.activity_level,
    occupationActivity: row.occupation_activity,
    sleepHours: row.sleep_hours != null ? Number(row.sleep_hours) : null,
    stressLevel: row.stress_level,
    mealsPerDay: row.meals_per_day,
    weeklyWorkoutGoal: row.weekly_workout_goal ?? row.days_per_week ?? null,
    targets: targetsFor(row),
    reminders: { ...DEFAULT_REMINDERS, ...(row.reminders ?? {}) },
    onboardingCompletedAt: row.onboarding_completed_at ? new Date(row.onboarding_completed_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export async function getProfileRow(sql: Sql, userId: string): Promise<ProfileRow | null> {
  return sql.maybeOne<ProfileRow>(
    `SELECT p.*, u.timezone FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1`,
    [userId],
  );
}

/** The profile row locked for the rest of the transaction (serializes concurrent profile writes). */
export async function lockProfileRow(sql: Sql, userId: string): Promise<ProfileRow> {
  await sql.exec('INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
  return sql.one<ProfileRow>(
    `SELECT p.*, u.timezone FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1 FOR UPDATE OF p`,
    [userId],
  );
}

/** The user's profile (an empty profile row always exists from registration). */
export async function getProfile(sql: Sql, userId: string): Promise<ProfileDTO> {
  let row = await getProfileRow(sql, userId);
  if (!row) {
    await sql.exec('INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
    row = await getProfileRow(sql, userId);
  }
  return toProfileDTO(row!);
}

export function dietPreferences(p: Pick<ProfileDTO, 'dietType' | 'allergies' | 'dietaryRestrictions'>): DietPreferences {
  return { dietType: p.dietType, allergies: p.allergies, restrictions: p.dietaryRestrictions };
}

/**
 * Custom targets must stay safe when the profile changes (e.g. a new age makes the user a minor,
 * or a higher body weight raises the protein minimum). Unsafe custom targets are dropped in favour
 * of the computed ones. Returns true when that happened.
 */
export async function enforceCustomTargetSafety(sql: Sql, userId: string): Promise<boolean> {
  const row = await getProfileRow(sql, userId);
  if (!row?.targets_custom || row.calorie_target == null || row.protein_target_g == null || row.carbs_target_g == null || row.fat_target_g == null) {
    return false;
  }
  const computed = computedTargetsFor(row);
  if (!computed || row.weight_kg == null) return false;
  const issues = customTargetsIssues(
    { calories: row.calorie_target, proteinG: row.protein_target_g, carbsG: row.carbs_target_g, fatG: row.fat_target_g },
    { minimumCalories: computed.minimumCalories, weightKg: Number(row.weight_kg) },
  );
  if (!issues.some((i) => i.code === 'calories_below_safe_minimum' || i.code === 'protein_too_low')) return false;
  await sql.exec('UPDATE profiles SET targets_custom = false WHERE user_id = $1', [userId]);
  return true;
}

/**
 * Ranges of the stored target columns (profiles CHECK constraints). Computed targets for
 * extreme but allowed body sizes can fall outside them (e.g. > 6000 kcal for a very tall,
 * heavy, very active adult, < 1000 kcal for a small sedentary 13-year-old).
 */
const STORED_TARGET_RANGES = {
  calories: [1000, 6000],
  proteinG: [20, 400],
  carbsG: [0, 900],
  fatG: [15, 300],
} as const;

const storable = (value: number, [min, max]: readonly [number, number]) => (value >= min && value <= max ? value : null);

/**
 * Writes the effective targets into profile columns (used by SQL reports and dashboards).
 * The API always serves computed targets from the profile itself; a value that does not fit
 * its column is stored as NULL instead of failing the caller's transaction (onboarding,
 * profile edits, weigh-ins).
 */
export async function syncStoredTargets(sql: Sql, userId: string): Promise<void> {
  const row = await getProfileRow(sql, userId);
  if (!row || row.targets_custom) return;
  const computed = computedTargetsFor(row);
  if (!computed) return;
  await sql.exec(
    `UPDATE profiles SET calorie_target = $2, protein_target_g = $3, carbs_target_g = $4, fat_target_g = $5 WHERE user_id = $1`,
    [
      userId,
      storable(computed.calories, STORED_TARGET_RANGES.calories),
      storable(computed.proteinG, STORED_TARGET_RANGES.proteinG),
      storable(computed.carbsG, STORED_TARGET_RANGES.carbsG),
      storable(computed.fatG, STORED_TARGET_RANGES.fatG),
    ],
  );
}
