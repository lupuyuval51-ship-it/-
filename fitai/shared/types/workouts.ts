import type { Equipment, Goal, MuscleGroup, PlanStatus, SplitType, TrainingLocation } from '../constants';
import type { ISODateTime } from './common';
import type { ExerciseSummaryDTO } from './exercises';
import type { ProgressionAction } from './sessions';

export interface PlanExerciseDTO {
  id: string;
  exerciseId: string;
  exercise: ExerciseSummaryDTO;
  position: number;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  targetWeightKg: number | null;
  notes: string;
}

export interface PlanWorkoutDTO {
  id: string;
  position: number;
  name: string;
  focus: string;
  notes: string;
  estimatedMinutes: number | null;
  exercises: PlanExerciseDTO[];
}

/** Explanation of a generator decision, rendered client-side via i18n `workouts.notes.<code>`. */
export interface GenerationNote {
  code: string;
  params?: Record<string, string | number>;
}

export interface WorkoutPlanSummaryDTO {
  id: string;
  name: string;
  description: string;
  status: PlanStatus;
  goal: Goal | null;
  splitType: SplitType;
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  source: 'generated' | 'custom' | 'duplicate';
  workoutCount: number;
  exerciseCount: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface WorkoutPlanDTO extends WorkoutPlanSummaryDTO {
  workouts: PlanWorkoutDTO[];
  generationNotes: GenerationNote[];
  /** Resolved generator inputs (see `PlanGenerationInput`); `{}` for custom plans. */
  generationInput: Record<string, unknown>;
  nextWorkoutIndex: number;
}

/** How free-text preferences were turned into constrained generator options. */
export type PreferenceInterpreter = 'ai' | 'keywords';
export type PreferenceIntensity = 'easier' | 'normal' | 'harder';

/**
 * Shape of `WorkoutPlanDTO.generationInput` for generated plans (resolved inputs, no PII,
 * never the raw free text).
 */
export interface PlanGenerationInput {
  goal: Goal;
  experience: 'beginner' | 'intermediate' | 'advanced';
  location: TrainingLocation;
  equipment: Equipment[];
  /** Days per week the user asked for (training days may be capped at 6). */
  daysPerWeek: number;
  trainingDays: number;
  sessionMinutes: number;
  focusMuscleGroups: MuscleGroup[];
  minorSafetyRules: boolean;
  preferences: {
    interpreter: PreferenceInterpreter | null;
    focusMuscleGroups: MuscleGroup[];
    avoidExerciseIds: string[];
    avoidPatterns: string[];
    preferBodyweight: boolean;
    intensity: PreferenceIntensity;
  };
  variationSeed: number;
  generatorVersion: string;
}

export interface GeneratePlanInput {
  name?: string;
  goal?: Goal;
  daysPerWeek?: number;
  sessionMinutes?: number;
  location?: TrainingLocation;
  equipment?: Equipment[];
  focusMuscleGroups?: MuscleGroup[];
  /** Free-text preferences ("more arms", "no jumping"). Interpreted into constrained options. */
  notes?: string;
}

export interface PlanExerciseInput {
  /** Existing plan_exercises id to keep, omitted for new rows. */
  id?: string;
  exerciseId: string;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  targetWeightKg: number | null;
  notes: string;
}

export interface UpdateWorkoutInput {
  name: string;
  focus: string;
  notes: string;
  exercises: PlanExerciseInput[];
}

export interface ExerciseAlternativeDTO {
  exercise: ExerciseSummaryDTO;
  relation: 'easier' | 'harder' | 'similar';
  /** Doable with the user's equipment and not contraindicated by reported injuries. */
  suitable: boolean;
  missingEquipment: Equipment[];
}

export interface PlanResponse {
  plan: WorkoutPlanDTO;
}

export interface PlanListResponse {
  plans: WorkoutPlanSummaryDTO[];
}

export interface AlternativesResponse {
  alternatives: ExerciseAlternativeDTO[];
}

/** Prescription values touched by "apply progression". */
export interface PrescriptionTargets {
  targetWeightKg: number | null;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
}

export interface ProgressionChangeDTO {
  planExerciseId: string;
  exerciseId: string;
  action: ProgressionAction;
  before: PrescriptionTargets;
  after: PrescriptionTargets;
}

export interface ApplyProgressionResponse {
  plan: WorkoutPlanDTO;
  changes: ProgressionChangeDTO[];
}
