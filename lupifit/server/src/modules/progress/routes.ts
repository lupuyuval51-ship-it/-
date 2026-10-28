import { Router } from 'express';
import {
  bodyWeightQuerySchema,
  bodyWeightSchema,
  exerciseIdParamSchema,
  exerciseProgressQuerySchema,
  idParamSchema,
  overviewQuerySchema,
  recordsQuerySchema,
} from '@shared/schemas/progress';
import type {
  BodyWeightListResponse,
  BodyWeightLogResponse,
  ExerciseProgressDTO,
  OkResponse,
  PersonalRecordsResponse,
  ProgressOverviewDTO,
  TrainedExercisesResponse,
} from '@shared/types';
import { db } from '../../db/pool';
import { userId } from '../../middleware/context';
import { parseBody, parseParams, parseQuery } from '../../middleware/validate';
import { deleteBodyWeight, listBodyWeight, logBodyWeight } from './bodyWeight';
import { loadRecentRecords, loadUserContext } from './data';
import { exerciseProgress, listTrainedExercises } from './exercises';
import { computeOverview } from './overview';

/** Mounted at /api by app.ts (authenticated). Implemented by the progress module. */
export const progressRouter = Router();

progressRouter.get('/progress/overview', async (req, res) => {
  const { period } = parseQuery(overviewQuerySchema, req);
  const ctx = await loadUserContext(db, userId(req));
  const body: ProgressOverviewDTO = await computeOverview(db, ctx, period);
  res.json(body);
});

progressRouter.get('/progress/exercises', async (req, res) => {
  const ctx = await loadUserContext(db, userId(req));
  const body: TrainedExercisesResponse = { exercises: await listTrainedExercises(db, ctx) };
  res.json(body);
});

progressRouter.get('/progress/exercises/:exerciseId', async (req, res) => {
  const { exerciseId } = parseParams(exerciseIdParamSchema, req);
  const { period } = parseQuery(exerciseProgressQuerySchema, req);
  const ctx = await loadUserContext(db, userId(req));
  const body: ExerciseProgressDTO = await exerciseProgress(db, ctx, exerciseId, period);
  res.json(body);
});

progressRouter.get('/progress/records', async (req, res) => {
  const { limit } = parseQuery(recordsQuerySchema, req);
  const body: PersonalRecordsResponse = { records: await loadRecentRecords(db, userId(req), limit) };
  res.json(body);
});

progressRouter.get('/progress/body-weight', async (req, res) => {
  const { period } = parseQuery(bodyWeightQuerySchema, req);
  const ctx = await loadUserContext(db, userId(req));
  const body: BodyWeightListResponse = { entries: await listBodyWeight(db, ctx, period) };
  res.json(body);
});

progressRouter.post('/progress/body-weight', async (req, res) => {
  const input = parseBody(bodyWeightSchema, req);
  const id = userId(req);
  const result = await db.tx(async (tx) => logBodyWeight(tx, await loadUserContext(tx, id), input));
  const body: BodyWeightLogResponse = { entry: result.entry, rewards: result.rewards };
  res.status(result.created ? 201 : 200).json(body);
});

progressRouter.delete('/progress/body-weight/:id', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  const uid = userId(req);
  await db.tx(async (tx) => deleteBodyWeight(tx, await loadUserContext(tx, uid), id));
  const body: OkResponse = { ok: true };
  res.json(body);
});
