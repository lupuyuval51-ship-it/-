import type { Equipment, Goal, MuscleGroup, PlanStatus, SplitType, TrainingLocation } from '../constants';
import type { ISODateTime } from './common';
import type { ExerciseSummaryDTO } from './exercises';

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
  generationInput: Record<string, unknown>;
  nextWorkoutIndex: number;
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
