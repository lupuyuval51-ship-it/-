import { Router } from 'express';
import {
  coachMessageSchema,
  coachMessagesQuerySchema,
  coachThreadParamsSchema,
  createThreadSchema,
  renameThreadSchema,
} from '@shared/schemas/coach';
import type {
  CoachMessagesResponse,
  CoachStatusDTO,
  CoachThreadListResponse,
  CoachThreadResponse,
  OkResponse,
  SendCoachMessageResponse,
} from '@shared/types';
import { db } from '../../db/pool';
import { authUser, userId } from '../../middleware/context';
import { parseBody, parseParams, parseQuery } from '../../middleware/validate';
import { coachStatus, createThread, deleteThread, listMessages, listThreads, renameThread } from './repository';
import { sendCoachMessage } from './service';

/** Mounted at /api by app.ts (authenticated). */
export const coachRouter = Router();

coachRouter.get('/coach/status', async (req, res) => {
  const body: CoachStatusDTO = await coachStatus(db, userId(req));
  res.json(body);
});

coachRouter.get('/coach/threads', async (req, res) => {
  const body: CoachThreadListResponse = { threads: await listThreads(db, userId(req)) };
  res.json(body);
});

coachRouter.post('/coach/threads', async (req, res) => {
  const input = parseBody(createThreadSchema, req);
  const body: CoachThreadResponse = { thread: await createThread(db, userId(req), input.title) };
  res.status(201).json(body);
});

coachRouter.patch('/coach/threads/:id', async (req, res) => {
  const { id } = parseParams(coachThreadParamsSchema, req);
  const input = parseBody(renameThreadSchema, req);
  const body: CoachThreadResponse = { thread: await renameThread(db, userId(req), id, input.title) };
  res.json(body);
});

coachRouter.delete('/coach/threads/:id', async (req, res) => {
  const { id } = parseParams(coachThreadParamsSchema, req);
  await deleteThread(db, userId(req), id);
  const body: OkResponse = { ok: true };
  res.json(body);
});

coachRouter.get('/coach/threads/:id/messages', async (req, res) => {
  const { id } = parseParams(coachThreadParamsSchema, req);
  const query = parseQuery(coachMessagesQuerySchema, req);
  const body: CoachMessagesResponse = await listMessages(db, userId(req), id, query);
  res.json(body);
});

coachRouter.post('/coach/threads/:id/messages', async (req, res) => {
  const { id } = parseParams(coachThreadParamsSchema, req);
  const input = parseBody(coachMessageSchema, req);
  const user = authUser(req);
  const body: SendCoachMessageResponse = await sendCoachMessage(user.id, id, input.content, user.locale);
  res.json(body);
});
