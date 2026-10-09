import { todayInTimeZone } from '@shared/dates';
import type { OnboardingInput } from '@shared/schemas/profile';
import type { ProfileDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { getProfile, syncStoredTargets } from './repository';

/**
 * Saves the complete onboarding questionnaire. Re-running onboarding updates the
 * answers but keeps the original completion timestamp. The answered weight is also
 * recorded as today's body-weight entry so progress tracking starts immediately.
 */
export async function saveOnboarding(sql: Sql, userId: string, input: OnboardingInput): Promise<ProfileDTO> {
  const user = await sql.one<{ timezone: string }>('SELECT timezone FROM users WHERE id = $1', [userId]);
  const today = todayInTimeZone(user.timezone);
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
      input.heightCm,
      input.weightKg,
      input.experienceLevel,
      JSON.stringify(input.ability),
      input.goal,
      input.trainingLocation,
      input.equipment,
      input.daysPerWeek,
      input.sessionMinutes,
      input.preferredDays,
      input.focusMuscleGroups,
      input.avoidExerciseIds,
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
      input.weeklyWorkoutGoal ?? Math.min(input.daysPerWeek, 7),
    ],
  );
  await sql.exec(
    `INSERT INTO body_weight_entries (user_id, measured_on, weight_kg) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, measured_on) DO UPDATE SET weight_kg = EXCLUDED.weight_kg`,
    [userId, today, input.weightKg],
  );
  await syncStoredTargets(sql, userId);
  return getProfile(sql, userId);
}
