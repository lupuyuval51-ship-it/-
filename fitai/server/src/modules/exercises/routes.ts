import { Router } from 'express';
import { z } from 'zod';
import { DIFFICULTIES, EQUIPMENT, EXERCISE_CATEGORIES, MUSCLE_GROUPS, MUSCLES } from '@shared/constants';
import { boolParam, cleanText, slugId } from '@shared/schemas/common';
import type { ExerciseDetailDTO } from '@shared/types';
import { db } from '../../db/pool';
import { notFound } from '../../lib/errors';
import { userId } from '../../middleware/context';
import { parseParams, parseQuery } from '../../middleware/validate';
import { exerciseDetail, exerciseHistory, listExercises } from './service';

/** Mounted at /api by app.ts (authenticated). */
export const exercisesRouter = Router();

const listQuery = z.object({
  q: cleanText(80).optional(),
  muscle: z.enum(MUSCLES).optional(),
  muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
  equipment: z.enum(EQUIPMENT).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  category: z.enum(EXERCISE_CATEGORIES).optional(),
  availableOnly: boolParam.optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

exercisesRouter.get('/exercises', async (req, res) => {
  const query = parseQuery(listQuery, req);
  res.json(await listExercises(db, userId(req), query));
});

exercisesRouter.get('/exercises/:id', async (req, res) => {
  const { id } = parseParams(z.object({ id: slugId }), req);
  const detail: ExerciseDetailDTO | null = await exerciseDetail(db, userId(req), id);
  if (!detail) throw notFound('exercise_not_found', 'Exercise not found');
  res.json({ exercise: detail });
});

exercisesRouter.get('/exercises/:id/history', async (req, res) => {
  const { id } = parseParams(z.object({ id: slugId }), req);
  const { limit } = parseQuery(z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) }), req);
  res.json({ history: await exerciseHistory(db, userId(req), id, limit) });
});
