import type {
  ActivityLevel,
  Allergen,
  DietaryRestriction,
  DietType,
  Equipment,
  ExperienceLevel,
  Goal,
  InjuryArea,
  MuscleGroup,
  OccupationActivity,
  Sex,
  StressLevel,
  TrainingLocation,
} from '../constants';
import type { ComputedTargets } from '../nutrition';
import type { ISODateTime } from './common';

export interface AbilityBenchmarks {
  pushUpsMax: number | null;
  pullUpsMax: number | null;
  plankSeconds: number | null;
  squat1rmKg: number | null;
  bench1rmKg: number | null;
  deadlift1rmKg: number | null;
}

export interface ReminderSettings {
  enabled: boolean;
  /** 0 = Sunday … 6 = Saturday */
  workoutDays: number[];
  /** HH:MM, 24h, user's local time */
  workoutTime: string;
  mealLogging: boolean;
  mealTimes: string[];
}

export interface NutritionTargetsDTO {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  /** True when the user overrode the computed targets. */
  custom: boolean;
  /** The evidence-based computation (null if the profile is incomplete). */
  computed: ComputedTargets | null;
}

export interface ProfileDTO {
  ageYears: number | null;
  /** Age today, derived from the onboarding answer and the date it was recorded. */
  currentAge: number | null;
  isMinor: boolean;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  experienceLevel: ExperienceLevel | null;
  ability: AbilityBenchmarks;
  goal: Goal | null;
  trainingLocation: TrainingLocation | null;
  equipment: Equipment[];
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  preferredDays: number[];
  focusMuscleGroups: MuscleGroup[];
  avoidExerciseIds: string[];
  exerciseLikes: string;
  exerciseDislikes: string;
  limitations: string;
  injuries: InjuryArea[];
  injuryNotes: string;
  dietType: DietType | null;
  allergies: Allergen[];
  dietaryRestrictions: DietaryRestriction[];
  dislikedFoods: string;
  activityLevel: ActivityLevel | null;
  occupationActivity: OccupationActivity | null;
  sleepHours: number | null;
  stressLevel: StressLevel | null;
  mealsPerDay: number | null;
  weeklyWorkoutGoal: number | null;
  targets: NutritionTargetsDTO | null;
  reminders: ReminderSettings;
  onboardingCompletedAt: ISODateTime | null;
  updatedAt: ISODateTime | null;
}

export interface ProfileResponse {
  profile: ProfileDTO;
}
