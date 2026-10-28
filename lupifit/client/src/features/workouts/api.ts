import type {
  AlternativesResponse,
  ApplyProgressionResponse,
  ExerciseAlternativeDTO,
  GeneratePlanInput,
  HealthResponse,
  OkResponse,
  PlanListResponse,
  PlanResponse,
  ProfileDTO,
  ProfileResponse,
  UpdateWorkoutInput,
  WorkoutPlanDTO,
  WorkoutPlanSummaryDTO,
} from '@shared/types';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../../api/client';

/** Module-local query keys (shared ones — plans, plan, profile — live in `qk`). */
export const workoutKeys = {
  plansList: (includeArchived: boolean) => ['plans', { includeArchived }] as const,
  alternatives: (planId: string, exerciseId: string) => ['plan', planId, 'alternatives', exerciseId] as const,
  health: ['health'] as const,
};

const enc = encodeURIComponent;
const planPath = (id: string) => `/plans/${enc(id)}`;
const dayPath = (id: string, workoutId: string) => `${planPath(id)}/workouts/${enc(workoutId)}`;

export const fetchPlans = (includeArchived: boolean, signal?: AbortSignal) =>
  apiGet<PlanListResponse>('/plans', includeArchived ? { includeArchived: true } : undefined, signal).then((r): WorkoutPlanSummaryDTO[] => r.plans);

export const fetchPlan = (id: string, signal?: AbortSignal) => apiGet<PlanResponse>(planPath(id), undefined, signal).then((r) => r.plan);

export const fetchProfile = (signal?: AbortSignal) => apiGet<ProfileResponse>('/profile', undefined, signal).then((r): ProfileDTO => r.profile);

export const fetchHealth = (signal?: AbortSignal) => apiGet<HealthResponse>('/health', undefined, signal);

/** Generation may wait on the AI preference interpreter: allow a longer timeout. */
export const generatePlan = (input: GeneratePlanInput, key: string) =>
  apiPost<PlanResponse>('/plans/generate', input, key, 60_000).then((r) => r.plan);

export const createPlan = (input: { name: string; description: string }, key: string) => apiPost<PlanResponse>('/plans', input, key).then((r) => r.plan);

export const updatePlan = (id: string, patch: { name?: string; description?: string }) => apiPatch<PlanResponse>(planPath(id), patch).then((r) => r.plan);

export const activatePlan = (id: string) => apiPost<PlanResponse>(`${planPath(id)}/activate`).then((r) => r.plan);

export const archivePlan = (id: string) => apiPost<PlanResponse>(`${planPath(id)}/archive`).then((r) => r.plan);

export const deletePlan = (id: string) => apiDelete<OkResponse>(planPath(id));

export const duplicatePlan = (id: string, key: string) => apiPost<PlanResponse>(`${planPath(id)}/duplicate`, {}, key).then((r) => r.plan);

export const applyProgression = (id: string, key: string) => apiPost<ApplyProgressionResponse>(`${planPath(id)}/apply-progression`, {}, key);

export const addWorkout = (id: string, input: { name: string; focus: string }, key: string) =>
  apiPost<PlanResponse>(`${planPath(id)}/workouts`, input, key).then((r) => r.plan);

export const updateWorkout = (id: string, workoutId: string, input: UpdateWorkoutInput) =>
  apiPut<PlanResponse>(dayPath(id, workoutId), input).then((r): WorkoutPlanDTO => r.plan);

export const deleteWorkout = (id: string, workoutId: string) => apiDelete<PlanResponse>(dayPath(id, workoutId)).then((r) => r.plan);

export const duplicateWorkout = (id: string, workoutId: string, key: string) =>
  apiPost<PlanResponse>(`${dayPath(id, workoutId)}/duplicate`, {}, key).then((r) => r.plan);

export const regenerateWorkout = (id: string, workoutId: string, key: string) =>
  apiPost<PlanResponse>(`${dayPath(id, workoutId)}/regenerate`, {}, key).then((r) => r.plan);

export const reorderWorkouts = (id: string, workoutIds: string[]) =>
  apiPost<PlanResponse>(`${planPath(id)}/workouts/reorder`, { workoutIds }).then((r) => r.plan);

/**
 * Alternatives for a plan exercise. Saved rows use the plan-exercise endpoint (with the
 * draft's current exercise); unsaved rows use the plan-level endpoint.
 */
export const fetchAlternatives = (
  ref: { planId: string; workoutId: string; planExerciseId: string | null; exerciseId: string },
  signal?: AbortSignal,
): Promise<ExerciseAlternativeDTO[]> => {
  const path = ref.planExerciseId
    ? `${dayPath(ref.planId, ref.workoutId)}/exercises/${enc(ref.planExerciseId)}/alternatives`
    : `${planPath(ref.planId)}/alternatives`;
  return apiGet<AlternativesResponse>(path, { exerciseId: ref.exerciseId }, signal).then((r) => r.alternatives);
};

/** Starts a live session for a plan day (owned by the sessions module). */
export const startSession = (planWorkoutId: string, key: string) => apiPost<unknown>('/sessions', { planWorkoutId }, key);
