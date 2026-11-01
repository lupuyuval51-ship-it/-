/** Canonical enumerations. Pure data, zero I/O. */

export const LANGUAGES = ['he', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const THEMES = ['dark', 'light', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export const UNITS = ['metric', 'imperial'] as const;
export type Units = (typeof UNITS)[number];

export const SEXES = ['male', 'female', 'unspecified'] as const;
export type Sex = (typeof SEXES)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const GOALS = ['fat_loss', 'muscle_gain', 'strength', 'general_fitness', 'athletic_performance'] as const;
export type Goal = (typeof GOALS)[number];

export const PLACES = ['gym', 'home', 'park'] as const;
export type Place = (typeof PLACES)[number];

export const WORKOUT_MODES = ['bodyweight', 'weights'] as const;
export type WorkoutMode = (typeof WORKOUT_MODES)[number];

export const MUSCLES = [
  'chest', 'upper_back', 'lats', 'lower_back', 'traps', 'front_delts', 'side_delts', 'rear_delts',
  'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'glutes', 'quads', 'hamstrings', 'calves', 'adductors',
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'core', 'legs'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_TO_GROUP: Record<Muscle, MuscleGroup> = {
  chest: 'chest',
  upper_back: 'back', lats: 'back', lower_back: 'back', traps: 'back',
  front_delts: 'shoulders', side_delts: 'shoulders', rear_delts: 'shoulders',
  biceps: 'arms', triceps: 'arms', forearms: 'arms',
  abs: 'core', obliques: 'core',
  glutes: 'legs', quads: 'legs', hamstrings: 'legs', calves: 'legs', adductors: 'legs',
};

export const EQUIPMENT = [
  'none', 'barbell', 'dumbbell', 'kettlebell', 'machine', 'cable', 'bench', 'squat_rack', 'pullup_bar',
  'dip_station', 'resistance_band', 'trx', 'medicine_ball', 'swiss_ball', 'ab_wheel', 'jump_rope',
  'box', 'rings', 'parallettes', 'sled', 'landmine', 'ez_bar', 'foam_roller',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EXERCISE_CATEGORIES = [
  'weight_reps', 'bodyweight_reps', 'duration', 'plyometric', 'cardio', 'mobility', 'stretch', 'carry', 'isometric',
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const MOVEMENT_PATTERNS = [
  'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'squat', 'hinge', 'lunge',
  'carry', 'core_flexion', 'core_rotation', 'core_stability', 'elbow_flexion', 'elbow_extension',
  'shoulder_raise', 'calf_raise', 'hip_abduction', 'hip_adduction', 'jump', 'locomotion', 'mobility', 'stretch',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export const INJURY_AREAS = ['neck', 'shoulder', 'elbow', 'wrist', 'lower_back', 'hip', 'knee', 'ankle'] as const;
export type InjuryArea = (typeof INJURY_AREAS)[number];

export const SPORTS = [
  'soccer', 'basketball', 'volleyball', 'racquet', 'running', 'cycling', 'swimming',
  'combat_striking', 'grappling', 'climbing', 'surfing', 'calisthenics', 'general',
] as const;
export type Sport = (typeof SPORTS)[number];

export const FINISHER_VARIANTS = ['bodyweight', 'gear', 'gentle'] as const;
export type FinisherVariant = (typeof FINISHER_VARIANTS)[number];

export const ALLERGENS = ['dairy', 'egg', 'peanut', 'tree_nut', 'sesame', 'soy', 'gluten', 'fish', 'shellfish'] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DIET_TYPES = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'kosher'] as const;
export type DietType = (typeof DIET_TYPES)[number];

export const DIETARY_RESTRICTIONS = ['no_pork', 'no_shellfish', 'halal', 'kosher', 'low_sodium', 'lactose_free'] as const;
export type DietaryRestriction = (typeof DIETARY_RESTRICTIONS)[number];

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const AGE_BUCKETS = ['minor', 'adult', 'master', 'senior'] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];

export const READINESS_STATES = ['normal', 'easier', 'rest'] as const;
export type ReadinessState = (typeof READINESS_STATES)[number];

export const ACHIEVEMENT_IDS = [
  'first_workout', 'five_workouts', 'twenty_five_workouts', 'first_pr', 'five_prs',
  'two_week_streak', 'month_streak', 'weekly_goal', 'first_food_log', 'seven_food_days',
  'protein_week', 'first_weigh_in', 'first_finisher', 'first_coach_chat',
] as const;
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export const LIMITS = {
  age: { min: 13, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 300 },
  daysPerWeek: { min: 1, max: 7 },
  maxLiftingDays: 6,
  sessionMinutes: { min: 15, max: 180 },
  sets: { min: 1, max: 10 },
  reps: { min: 1, max: 100 },
  restSec: { min: 0, max: 600 },
  rpe: { min: 1, max: 10 },
  maxExercisesPerWorkout: 20,
  maxDaysPerPlan: 7,
} as const;
