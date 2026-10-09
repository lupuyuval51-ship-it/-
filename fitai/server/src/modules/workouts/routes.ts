import { Router } from 'express';
import { z } from 'zod';
import { uuid } from '@shared/schemas/common';
import {
  addWorkoutSchema,
  alternativesQuerySchema,
  createPlanSchema,
  generatePlanSchema,
  planListQuerySchema,
  reorderWorkoutsSchema,
  updatePlanSchema,
  updateWorkoutSchema,
} from '@shared/schemas/workouts';
import type { AlternativesResponse, ApplyProgressionResponse, OkResponse, PlanListResponse, PlanResponse } from '@shared/types';
import { db } from '../../db/pool';
import { badRequest } from '../../lib/errors';
import { authUser, userId } from '../../middleware/context';
import { parseBody, parseParams, parseQuery } from '../../middleware/validate';
import {
  activatePlan,
  addWorkout,
  alternativesFor,
  applyProgression,
  archivePlan,
  createCustomPlan,
  deletePlan,
  deleteWorkout,
  duplicatePlan,
  duplicateWorkout,
  generatePlanForUser,
  getPlanDTO,
  listPlans,
  regenerateWorkout,
  reorderWorkouts,
  updatePlan,
  updateWorkout,
} from './service';

/** Mounted at /api by app.ts (authenticated, CSRF-protected, idempotency-aware). */
export const workoutsRouter = Router();

const planParams = z.object({ id: uuid });
const workoutParams = z.object({ id: uuid, workoutId: uuid });
const planExerciseParams = z.object({ id: uuid, workoutId: uuid, planExerciseId: uuid });

workoutsRouter.get('/plans', async (req, res) => {
  const { includeArchived } = parseQuery(planListQuerySchema, req);
  const body: PlanListResponse = { plans: await listPlans(db, userId(req), includeArchived ?? false) };
  res.json(body);
});

workoutsRouter.post('/plans/generate', async (req, res) => {
  const input = parseBody(generatePlanSchema, req);
  const user = authUser(req);
  const body: PlanResponse = { plan: await generatePlanForUser(user.id, user.locale, input) };
  res.status(201).json(body);
});

workoutsRouter.post('/plans', async (req, res) => {
  const input = parseBody(createPlanSchema, req);
  const user = authUser(req);
  const body: PlanResponse = { plan: await createCustomPlan(user.id, user.locale, input) };
  res.status(201).json(body);
});

workoutsRouter.get('/plans/:id', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const body: PlanResponse = { plan: await getPlanDTO(db, userId(req), id) };
  res.json(body);
});

workoutsRouter.patch('/plans/:id', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const patch = parseBody(updatePlanSchema, req);
  const body: PlanResponse = { plan: await updatePlan(userId(req), id, patch) };
  res.json(body);
});

workoutsRouter.delete('/plans/:id', async (req, res) => {
  const { id } = parseParams(planParams, req);
  await deletePlan(userId(req), id);
  const body: OkResponse = { ok: true };
  res.json(body);
});

workoutsRouter.post('/plans/:id/activate', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const body: PlanResponse = { plan: await activatePlan(userId(req), id) };
  res.json(body);
});

workoutsRouter.post('/plans/:id/archive', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const body: PlanResponse = { plan: await archivePlan(userId(req), id) };
  res.json(body);
});

workoutsRouter.post('/plans/:id/duplicate', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const user = authUser(req);
  const body: PlanResponse = { plan: await duplicatePlan(user.id, user.locale, id) };
  res.status(201).json(body);
});

workoutsRouter.post('/plans/:id/apply-progression', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const body: ApplyProgressionResponse = await applyProgression(userId(req), id);
  res.json(body);
});

/** Alternatives for any library exercise in the context of a plan (used for unsaved draft rows). */
workoutsRouter.get('/plans/:id/alternatives', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const { exerciseId } = parseQuery(alternativesQuerySchema, req);
  if (!exerciseId) {
    throw badRequest('validation_error', 'Invalid input', { issues: [{ path: 'exerciseId', code: 'invalid_type', message: 'required' }] });
  }
  const body: AlternativesResponse = { alternatives: await alternativesFor(userId(req), id, null, exerciseId) };
  res.json(body);
});

workoutsRouter.post('/plans/:id/workouts', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const input = parseBody(addWorkoutSchema, req);
  const body: PlanResponse = { plan: await addWorkout(userId(req), id, input) };
  res.status(201).json(body);
});

workoutsRouter.post('/plans/:id/workouts/reorder', async (req, res) => {
  const { id } = parseParams(planParams, req);
  const { workoutIds } = parseBody(reorderWorkoutsSchema, req);
  const body: PlanResponse = { plan: await reorderWorkouts(userId(req), id, workoutIds) };
  res.json(body);
});

workoutsRouter.put('/plans/:id/workouts/:workoutId', async (req, res) => {
  const { id, workoutId } = parseParams(workoutParams, req);
  const input = parseBody(updateWorkoutSchema, req);
  const body: PlanResponse = { plan: await updateWorkout(userId(req), id, workoutId, input) };
  res.json(body);
});

workoutsRouter.delete('/plans/:id/workouts/:workoutId', async (req, res) => {
  const { id, workoutId } = parseParams(workoutParams, req);
  const body: PlanResponse = { plan: await deleteWorkout(userId(req), id, workoutId) };
  res.json(body);
});

workoutsRouter.post('/plans/:id/workouts/:workoutId/duplicate', async (req, res) => {
  const { id, workoutId } = parseParams(workoutParams, req);
  const user = authUser(req);
  const body: PlanResponse = { plan: await duplicateWorkout(user.id, user.locale, id, workoutId) };
  res.status(201).json(body);
});

workoutsRouter.post('/plans/:id/workouts/:workoutId/regenerate', async (req, res) => {
  const { id, workoutId } = parseParams(workoutParams, req);
  const user = authUser(req);
  const body: PlanResponse = { plan: await regenerateWorkout(user.id, user.locale, id, workoutId) };
  res.json(body);
});

workoutsRouter.get('/plans/:id/workouts/:workoutId/exercises/:planExerciseId/alternatives', async (req, res) => {
  const { id, workoutId, planExerciseId } = parseParams(planExerciseParams, req);
  const { exerciseId } = parseQuery(alternativesQuerySchema, req);
  const body: AlternativesResponse = { alternatives: await alternativesFor(userId(req), id, { workoutId, planExerciseId }, exerciseId) };
  res.json(body);
});
