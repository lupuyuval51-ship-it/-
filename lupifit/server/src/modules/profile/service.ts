import { todayInTimeZone } from '@shared/dates';
import type { OnboardingInput, ProfileUpdateInput, SettingsUpdateInput, TargetsUpdateInput } from '@shared/schemas/profile';
import { customTargetsIssues } from '@shared/schemas/profile';
import type { ProfileDTO, ProfileUpdateResponse, SettingsUpdateResponse, UserDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { conflict, unprocessable } from '../../lib/errors';
import { getUserDTO } from '../auth/users';
import { onBodyWeightLogged } from '../gamification/hooks';
import {
  computedTargetsFor,
  currentAge,
  enforceCustomTargetSafety,
  getProfile,
  lockProfileRow,
  syncStoredTargets,
} from './repository';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Keeps only ids that exist in the exercise library (stale ids from removed exercises are dropped). */
async function knownExerciseIds(sql: Sql, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await sql.many<{ id: string }>('SELECT id FROM exercises WHERE id = ANY($1::text[])', [ids]);
  const known = new Set(rows.map((r) => r.id));
  return ids.filter((id) => known.has(id));
}

/** Records the weight as the body-weight entry for `date` (one entry per day). */
async function upsertBodyWeight(sql: Sql, userId: string, date: string, weightKg: number) {
  await sql.exec(
    `INSERT INTO body_weight_entries (user_id, measured_on, weight_kg) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, measured_on) DO UPDATE SET weight_kg = EXCLUDED.weight_kg`,
    [userId, date, weightKg],
  );
  await onBodyWeightLogged(sql, { userId, date });
}

/**
 * A weight-trend calorie adjustment, its cooldown and a "not now" belong to the goal they were
 * offered for (a -100 kcal "loss too slow" step must not cut a new muscle-gain surplus).
 */
async function clearCalorieAdjustment(sql: Sql, userId: string) {
  await sql.exec(
    'UPDATE profiles SET calorie_adjustment = 0, calorie_adjusted_on = NULL, adjustment_dismissed_until = NULL WHERE user_id = $1',
    [userId],
  );
}

/**
 * Saves the complete onboarding questionnaire. Re-running onboarding updates the
 * answers but keeps the original completion timestamp. The answered weight is also
 * recorded as today's body-weight entry so progress tracking starts immediately.
 * A different goal drops the calorie adjustment approved for the old one.
 */
export async function saveOnboarding(sql: Sql, userId: string, input: OnboardingInput): Promise<ProfileDTO> {
  const row = await lockProfileRow(sql, userId);
  const today = todayInTimeZone(row.timezone);
  const weightKg = round1(input.weightKg);
  await sql.exec(
    `UPDATE profiles SET
       age_years = $2, age_recorded_on = $3, sex = $4, height_cm = $5, weight_kg = $6, experience_level = $7,
       ability = $8, goal = $9, training_location = $10, equipment = $11, days_per_week = $12, session_minutes = $13,
       preferred_days = $14, focus_muscle_groups = $15, avoid_exercise_ids = $16, exercise_likes = $17,
       exercise_dislikes = $18, limitations = $19, injuries = $20, injury_notes = $21, diet_type = $22, allergies = $23,
       dietary_restrictions = $24, disliked_foods = $25, activity_level = $26, occupation_activity = $27,
       sleep_hours = $28, stress_level = $29, meals_per_day = $30, weekly_workout_goal = $31,
       onboarding_completed_at = COALESCE(onboarding_completed_at, now())
     WHERE user_id = $1`,
    [
      userId,
      input.ageYears,
      today,
      input.sex,
      round1(input.heightCm),
      weightKg,
      input.experienceLevel,
      JSON.stringify(input.ability),
      input.goal,
      input.trainingLocation,
      input.equipment,
      input.daysPerWeek,
      input.sessionMinutes,
      [...input.preferredDays].sort((a, b) => a - b),
      input.focusMuscleGroups,
      await knownExerciseIds(sql, input.avoidExerciseIds),
      input.exerciseLikes,
      input.exerciseDislikes,
      input.limitations,
      input.injuries,
      input.injuryNotes,
      input.dietType,
      input.allergies,
      input.dietaryRestrictions,
      input.dislikedFoods,
      input.activityLevel,
      input.occupationActivity,
      input.sleepHours,
      input.stressLevel,
      input.mealsPerDay,
      input.weeklyWorkoutGoal ?? input.daysPerWeek,
    ],
  );
  // The form promises "we schedule workouts on these days": reminders use the same days unless the user already chose some.
  if (input.preferredDays.length) {
    await sql.exec(
      `UPDATE profiles
          SET reminders = COALESCE(reminders, '{}'::jsonb) || jsonb_build_object('workoutDays', $2::jsonb)
        WHERE user_id = $1 AND jsonb_array_length(COALESCE(reminders->'workoutDays', '[]'::jsonb)) = 0`,
      [userId, JSON.stringify([...input.preferredDays].sort((a, b) => a - b))],
    );
  }
  await upsertBodyWeight(sql, userId, today, weightKg);
  if (input.goal !== row.goal) await clearCalorieAdjustment(sql, userId);
  await enforceCustomTargetSafety(sql, userId);
  await syncStoredTargets(sql, userId);
  return getProfile(sql, userId);
}

/** Questionnaire field → profiles column. Column names are fixed identifiers, never user input. */
const PROFILE_COLUMNS = {
  sex: 'sex',
  heightCm: 'height_cm',
  experienceLevel: 'experience_level',
  goal: 'goal',
  trainingLocation: 'training_location',
  equipment: 'equipment',
  daysPerWeek: 'days_per_week',
  sessionMinutes: 'session_minutes',
  preferredDays: 'preferred_days',
  focusMuscleGroups: 'focus_muscle_groups',
  exerciseLikes: 'exercise_likes',
  exerciseDislikes: 'exercise_dislikes',
  limitations: 'limitations',
  injuries: 'injuries',
  injuryNotes: 'injury_notes',
  dietType: 'diet_type',
  allergies: 'allergies',
  dietaryRestrictions: 'dietary_restrictions',
  dislikedFoods: 'disliked_foods',
  activityLevel: 'activity_level',
  occupationActivity: 'occupation_activity',
  sleepHours: 'sleep_hours',
  stressLevel: 'stress_level',
  mealsPerDay: 'meals_per_day',
  weeklyWorkoutGoal: 'weekly_workout_goal',
} as const satisfies Partial<Record<keyof ProfileUpdateInput, string>>;

/** Collects `column = $n` assignments; parameter $1 is reserved for the row key. */
function assignments(key: unknown) {
  const sets: string[] = [];
  const values: unknown[] = [key];
  return {
    set(column: string, value: unknown) {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    },
    sets,
    values,
  };
}

/**
 * Partial profile update from the profile page. Only provided fields change.
 * - A changed weight is also logged as today's body-weight entry (user time zone).
 * - A changed age restarts the age clock (`age_recorded_on` = today).
 * - A changed goal drops the calorie adjustment approved for the old goal.
 * - Computed targets are re-synced; custom targets that became unsafe are reset.
 */
export async function updateProfile(sql: Sql, userId: string, input: ProfileUpdateInput): Promise<ProfileUpdateResponse> {
  const row = await lockProfileRow(sql, userId);
  const today = todayInTimeZone(row.timezone);
  const a = assignments(userId);

  for (const [field, column] of Object.entries(PROFILE_COLUMNS) as [keyof typeof PROFILE_COLUMNS, string][]) {
    const value = input[field];
    if (value === undefined) continue;
    if (field === 'heightCm') a.set(column, round1(value as number));
    else if (field === 'preferredDays') a.set(column, [...(value as number[])].sort((x, y) => x - y));
    else a.set(column, value);
  }
  if (input.ability !== undefined) a.set('ability', JSON.stringify(input.ability));
  if (input.avoidExerciseIds !== undefined) a.set('avoid_exercise_ids', await knownExerciseIds(sql, input.avoidExerciseIds));
  // The client shows the age *today*; only a different answer restarts the age clock.
  if (input.ageYears !== undefined && input.ageYears !== currentAge(row)) {
    a.set('age_years', input.ageYears);
    a.set('age_recorded_on', today);
  }
  const newWeight = input.weightKg !== undefined ? round1(input.weightKg) : null;
  const weightChanged = newWeight != null && newWeight !== (row.weight_kg != null ? Number(row.weight_kg) : null);
  if (weightChanged) a.set('weight_kg', newWeight);

  if (a.sets.length > 0) {
    // Assignments come from the fixed column maps above; every value is a bound parameter.
    await sql.exec('UPDATE profiles SET ' + a.sets.join(', ') + ' WHERE user_id = $1', a.values);
  }
  if (newWeight != null && weightChanged) await upsertBodyWeight(sql, userId, today, newWeight);
  if (input.goal !== undefined && input.goal !== row.goal) await clearCalorieAdjustment(sql, userId);

  const customTargetsReset = await enforceCustomTargetSafety(sql, userId);
  await syncStoredTargets(sql, userId);
  return { profile: await getProfile(sql, userId), customTargetsReset };
}

const USER_COLUMNS = {
  displayName: 'display_name',
  locale: 'locale',
  theme: 'theme',
  units: 'units',
  timezone: 'timezone',
} as const satisfies Partial<Record<keyof SettingsUpdateInput, string>>;

/** Account preferences (users table) and reminder settings (profiles.reminders). */
export async function updateSettings(sql: Sql, userId: string, input: SettingsUpdateInput): Promise<SettingsUpdateResponse> {
  const a = assignments(userId);
  for (const [field, column] of Object.entries(USER_COLUMNS) as [keyof typeof USER_COLUMNS, string][]) {
    if (input[field] !== undefined) a.set(column, input[field]);
  }
  if (a.sets.length > 0) {
    // Assignments come from the fixed column maps above; every value is a bound parameter.
    await sql.exec('UPDATE users SET ' + a.sets.join(', ') + ' WHERE id = $1', a.values);
  }
  if (input.workoutPrefs !== undefined) {
    await sql.exec(`UPDATE users SET workout_prefs = COALESCE(workout_prefs, '{}'::jsonb) || $2::jsonb WHERE id = $1`, [userId, JSON.stringify(input.workoutPrefs)]);
  }
  if (input.reminders !== undefined) {
    await lockProfileRow(sql, userId);
    await sql.exec('UPDATE profiles SET reminders = $2 WHERE user_id = $1', [userId, JSON.stringify(input.reminders)]);
  }
  const user = (await getUserDTO(sql, userId)) as UserDTO;
  return { user, profile: await getProfile(sql, userId) };
}

/**
 * Custom daily nutrition targets (validated against the shared safety rules) or a reset to
 * the computed, evidence-based targets. Requires a complete profile.
 */
export async function updateTargets(sql: Sql, userId: string, input: TargetsUpdateInput): Promise<ProfileDTO> {
  const row = await lockProfileRow(sql, userId);
  const computed = computedTargetsFor(row);
  if (!row.onboarding_completed_at || !computed || row.weight_kg == null) {
    throw conflict('onboarding_required', 'Complete your profile before setting nutrition targets');
  }
  if ('reset' in input) {
    await sql.exec('UPDATE profiles SET targets_custom = false WHERE user_id = $1', [userId]);
    await syncStoredTargets(sql, userId);
    return getProfile(sql, userId);
  }
  const [issue] = customTargetsIssues(input, { minimumCalories: computed.minimumCalories, weightKg: Number(row.weight_kg) });
  if (issue) throw unprocessable(issue.code, 'These targets are outside the safe range', issue.details);
  await sql.exec(
    `UPDATE profiles SET calorie_target = $2, protein_target_g = $3, carbs_target_g = $4, fat_target_g = $5, targets_custom = true
      WHERE user_id = $1`,
    [userId, input.calories, input.proteinG, input.carbsG, input.fatG],
  );
  return getProfile(sql, userId);
}
