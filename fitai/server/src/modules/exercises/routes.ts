import { Router } from 'express';
import { z } from 'zod';
import { slugId } from '@shared/schemas/common';
import { exerciseFilterQuerySchema, exerciseHistoryQuerySchema, exerciseListQuerySchema } from '@shared/schemas/exercises';
import type { ExerciseDetailResponse, ExerciseFacetsResponse, ExerciseHistoryResponse, ExerciseListResponse } from '@shared/types';
import { db } from '../../db/pool';
import { notFound } from '../../lib/errors';
import { userId } from '../../middleware/context';
import { parseParams, parseQuery } from '../../middleware/validate';
import { getExercise } from './repository';
import { exerciseDetail, exerciseFacets, exerciseHistory, listExercises } from './service';

/** Mounted at /api by app.ts (authenticated). */
export const exercisesRouter = Router();

const idParams = z.object({ id: slugId });
const exerciseNotFound = () => notFound('exercise_not_found', 'Exercise not found');

exercisesRouter.get('/exercises', async (req, res) => {
  const query = parseQuery(exerciseListQuerySchema, req);
  const body: ExerciseListResponse = await listExercises(db, userId(req), query);
  res.json(body);
});

// Registered before `/exercises/:id` so "facets" is never treated as an exercise id.
exercisesRouter.get('/exercises/facets', async (req, res) => {
  const filters = parseQuery(exerciseFilterQuerySchema, req);
  const body: ExerciseFacetsResponse = { facets: await exerciseFacets(db, userId(req), filters) };
  res.json(body);
});

exercisesRouter.get('/exercises/:id', async (req, res) => {
  const { id } = parseParams(idParams, req);
  const detail = await exerciseDetail(db, userId(req), id);
  if (!detail) throw exerciseNotFound();
  const body: ExerciseDetailResponse = { exercise: detail };
  res.json(body);
});

exercisesRouter.get('/exercises/:id/history', async (req, res) => {
  const { id } = parseParams(idParams, req);
  const { limit } = parseQuery(exerciseHistoryQuerySchema, req);
  if (!(await getExercise(id))) throw exerciseNotFound();
  const body: ExerciseHistoryResponse = { history: await exerciseHistory(db, userId(req), id, limit) };
  res.json(body);
});
