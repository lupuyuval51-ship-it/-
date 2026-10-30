/**
 * Canonical enumerations shared by the server (validation, DB check constraints,
 * generator logic) and the client (forms, filters, labels). Every value here has a
 * matching translation key in the client i18n dictionaries (`enums.<group>.<value>`).
 */

export const LOCALES = ['he', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const SEXES = ['male', 'female', 'unspecified'] as const;
export type Sex = (typeof SEXES)[number];

export const GOALS = ['muscle_gain', 'strength', 'general_fitness', 'fat_loss', 'athletic_performance'] as const;
export type Goal = (typeof GOALS)[number];

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const LOCATIONS = ['gym', 'home', 'outdoor'] as const;
export type TrainingLocation = (typeof LOCATIONS)[number];

/** Every piece of equipment an exercise may require. An exercise with `equipment: []` needs nothing. */
export const EQUIPMENT = [
  'barbell',
  'dumbbells',
  'kettlebell',
  'ez_bar',
  'squat_rack',
  'bench',
  'cable_machine',
  'lat_pulldown_machine',
  'leg_press_machine',
  'leg_curl_machine',
  'leg_extension_machine',
  'chest_press_machine',
  'smith_machine',
  'pull_up_bar',
  'dip_bars',
  'resistance_bands',
  'suspension_trainer',
  'gymnastic_rings',
  'medicine_ball',
  'plyo_box',
  'jump_rope',
  'cardio_machine',
  'ab_wheel',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

/**
 * Ready-made workouts. `bodyweight` = your own body (a pull-up bar, dip bars or a bench may be used, no external
 * load); `weights` = any external resistance (dumbbells, kettlebell, barbell, machines, cables, bands).
 */
export const TRAINING_MODES = ['bodyweight', 'weights'] as const;
export type TrainingMode = (typeof TRAINING_MODES)[number];

/** The muscle (or muscle family) a ready workout is built around. Labels: `enums.readyFocus.<value>`. */
export const READY_FOCUSES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'arms',
  'abs',
  'core',
  'glutes',
  'quads',
  'hamstrings',
  'legs',
  'upper_body',
  'full_body',
  'cardio',
] as const;
export type ReadyFocus = (typeof READY_FOCUSES)[number];

/**
 * Sports that can get a 10-minute finisher at the end of a workout. `general` is the fallback for a sport that is
 * not listed. Labels: `enums.sport.<value>`; every sport has blocks in `server/src/data/sport-blocks/`.
 */
export const SPORTS = [
  'soccer',
  'basketball',
  'volleyball',
  'tennis_padel',
  'running',
  'cycling',
  'swimming',
  'striking',
  'grappling',
  'climbing',
  'surfing',
  'calisthenics',
  'general',
] as const;
export type SportId = (typeof SPORTS)[number];

/** Three ways to build the same sport block: no gear, with light gear, and a low-impact version. */
export const SPORT_BLOCK_VARIANTS = ['bodyweight', 'gear', 'gentle'] as const;
export type SportBlockVariant = (typeof SPORT_BLOCK_VARIANTS)[number];

/** Length of the sport finisher. */
export const SPORT_BLOCK_MINUTES = 10;

/** Equipment pre-selected in onboarding for each location (users can change it). */
export const DEFAULT_EQUIPMENT_BY_LOCATION: Record<TrainingLocation, Equipment[]> = {
  gym: [
    'barbell', 'dumbbells', 'kettlebell', 'ez_bar', 'squat_rack', 'bench', 'cable_machine',
    'lat_pulldown_machine', 'leg_press_machine', 'leg_curl_machine', 'leg_extension_machine',
    'chest_press_machine', 'smith_machine', 'pull_up_bar', 'dip_bars', 'resistance_bands',
    'medicine_ball', 'plyo_box', 'jump_rope', 'cardio_machine', 'ab_wheel',
  ],
  home: [],
  outdoor: ['pull_up_bar', 'dip_bars'],
};

export const MUSCLES = [
  'chest',
  'lats',
  'upper_back',
  'traps',
  'lower_back',
  'shoulders',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'glutes',
  'quadriceps',
  'hamstrings',
  'adductors',
  'calves',
  'hip_flexors',
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'core', 'legs'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_TO_GROUP: Record<Muscle, MuscleGroup> = {
  chest: 'chest',
  lats: 'back',
  upper_back: 'back',
  traps: 'back',
  lower_back: 'back',
  shoulders: 'shoulders',
  rear_delts: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  abs: 'core',
  obliques: 'core',
  glutes: 'legs',
  quadriceps: 'legs',
  hamstrings: 'legs',
  adductors: 'legs',
  calves: 'legs',
  hip_flexors: 'legs',
};

/** Training modality — used for the library "training category" filter. */
export const EXERCISE_CATEGORIES = [
  'free_weight',
  'machine',
  'cable',
  'bodyweight',
  'calisthenics',
  'band',
  'plyometric',
  'cardio',
  'mobility',
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const MOVEMENT_PATTERNS = [
  'squat',
  'hinge',
  'lunge',
  'hip_thrust',
  'horizontal_push',
  'vertical_push',
  'horizontal_pull',
  'vertical_pull',
  'chest_fly',
  'shoulder_raise',
  'elbow_flexion',
  'elbow_extension',
  'knee_extension',
  'knee_flexion',
  'calf_raise',
  'core',
  'rotation',
  'carry',
  'jump',
  'conditioning',
  'mobility',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export const INJURY_AREAS = ['neck', 'shoulder', 'elbow', 'wrist', 'lower_back', 'hip', 'knee', 'ankle'] as const;
export type InjuryArea = (typeof INJURY_AREAS)[number];

/**
 * weight_reps: external load + reps (barbell, dumbbell, machine).
 * reps: bodyweight reps (optional added load recorded in weight field).
 * time: held/performed for seconds (plank, wall sit, intervals).
 */
export const TRACKING_TYPES = ['weight_reps', 'reps', 'time'] as const;
export type TrackingType = (typeof TRACKING_TYPES)[number];

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

/** Mifflin-St Jeor TDEE multipliers. */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const OCCUPATION_ACTIVITY = ['desk', 'mixed', 'physical'] as const;
export type OccupationActivity = (typeof OCCUPATION_ACTIVITY)[number];

export const STRESS_LEVELS = ['low', 'moderate', 'high'] as const;
export type StressLevel = (typeof STRESS_LEVELS)[number];

export const DIET_TYPES = ['omnivore', 'vegetarian', 'vegan', 'pescatarian'] as const;
export type DietType = (typeof DIET_TYPES)[number];

export const ALLERGENS = ['gluten', 'dairy', 'egg', 'peanut', 'tree_nut', 'soy', 'fish', 'shellfish', 'sesame'] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DIETARY_RESTRICTIONS = ['no_pork', 'no_beef', 'no_shellfish', 'no_alcohol', 'lactose_free', 'gluten_free'] as const;
export type DietaryRestriction = (typeof DIETARY_RESTRICTIONS)[number];

/** Ingredient flags used to evaluate dietary restrictions (allergens are tracked separately). */
export const FOOD_CONTAINS = ['pork', 'beef', 'shellfish', 'alcohol', 'lactose', 'gluten'] as const;
export type FoodContains = (typeof FOOD_CONTAINS)[number];

/** What kind of animal product a food contains — drives vegan/vegetarian/pescatarian compatibility. */
export const ANIMAL_SOURCES = ['none', 'dairy_egg', 'fish', 'meat'] as const;
export type AnimalSource = (typeof ANIMAL_SOURCES)[number];

export const FOOD_CATEGORIES = [
  'meat',
  'poultry',
  'fish_seafood',
  'eggs',
  'dairy',
  'plant_protein',
  'grains',
  'vegetables',
  'fruits',
  'nuts_seeds',
  'fats_oils',
  'prepared_dishes',
  'snacks_sweets',
  'beverages',
  'condiments_sauces',
  'supplements',
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const THEMES = ['system', 'dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

export const UNITS = ['metric', 'imperial'] as const;
export type Units = (typeof UNITS)[number];

export const PLAN_STATUSES = ['draft', 'active', 'archived'] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const SPLIT_TYPES = ['full_body', 'upper_lower', 'push_pull_legs', 'upper_lower_full', 'custom'] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

export const SESSION_STATUSES = ['in_progress', 'paused', 'completed', 'abandoned'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const PR_TYPES = ['max_weight', 'est_1rm', 'max_reps', 'max_volume', 'max_duration'] as const;
export type PrType = (typeof PR_TYPES)[number];

export const PROGRESS_PERIODS = [7, 30, 90] as const;
export type ProgressPeriod = (typeof PROGRESS_PERIODS)[number];

export const NOTIFICATION_KINDS = ['achievement', 'level_up', 'personal_record', 'weekly_goal', 'reminder', 'info'] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const COACH_SOURCES = ['llm', 'builtin'] as const;
export type CoachSource = (typeof COACH_SOURCES)[number];

/** Minimum account age. Users 13–17 get teen-safe defaults (no calorie deficit, conservative loading). */
export const MIN_AGE = 13;
export const ADULT_AGE = 18;

/** Numeric bounds used by both client forms and server validation. */
export const LIMITS = {
  ageMin: MIN_AGE,
  ageMax: 100,
  heightCmMin: 120,
  heightCmMax: 230,
  weightKgMin: 30,
  weightKgMax: 300,
  daysPerWeekMin: 1,
  daysPerWeekMax: 7,
  sessionMinutesMin: 15,
  sessionMinutesMax: 180,
  setsMin: 1,
  setsMax: 10,
  repsMin: 1,
  repsMax: 100,
  restSecondsMin: 0,
  restSecondsMax: 600,
  rpeMin: 1,
  rpeMax: 10,
  setWeightKgMax: 1000,
  setDurationSecondsMax: 7200,
  exercisesPerWorkoutMax: 20,
  workoutsPerPlanMax: 7,
  foodGramsMax: 5000,
  coachMessageMaxChars: 2000,
  textShortMax: 120,
  textLongMax: 2000,
  passwordMin: 8,
  passwordMax: 200,
} as const;
