import { Router, type Request } from 'express';
import { z } from 'zod';
import {
  addSessionExerciseSchema,
  finishSessionSchema,
  replaceSessionExerciseSchema,
  sessionHistoryQuerySchema,
  sessionStateSchema,
  startSessionSchema,
  updateSessionExerciseSchema,
  updateSetSchema,
} from '@shared/schemas/sessions';
import { uuid } from '@shared/schemas/common';
import type {
  ActiveSessionResponse,
  OkResponse,
  SessionHistoryResponse,
  SessionResponse,
  SessionSetResponse,
  SessionSummaryResponse,
} from '@shared/types';
import { db, type Sql } from '../../db/pool';
import { authUser } from '../../middleware/context';
import { parseBody, parseParams, parseQuery } from '../../middleware/validate';
import { buildSummary, findOpenSessionId, listHistory, loadSessionDTO, requireSession } from './repository';
import {
  abandonSession,
  addExercise,
  addSet,
  changeState,
  deleteSession,
  deleteSet,
  finishSession,
  removeExercise,
  replaceExercise,
  revertReadiness,
  startSession,
  updateExercise,
  updateSet,
  type SessionUser,
} from './service';

/** Mounted at /api by app.ts (authenticated). */
export const sessionsRouter = Router();

const sessionParams = z.object({ id: uuid });
const setParams = z.object({ id: uuid, setId: uuid });
const exerciseParams = z.object({ id: uuid, sessionExerciseId: uuid });

function sessionUser(req: Request): SessionUser {
  const u = authUser(req);
  return { id: u.id, locale: u.locale, timezone: u.timezone };
}

async function sessionResponse(sql: Sql, user: SessionUser, sessionId: string): Promise<SessionResponse> {
  const row = await requireSession(sql, user.id, sessionId);
  return { session: await loadSessionDTO(sql, user.id, row, user.timezone) };
}

sessionsRouter.post('/sessions', async (req, res) => {
  const input = parseBody(startSessionSchema, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => sessionResponse(tx, user, await startSession(tx, user, input)));
  res.status(201).json(body);
});

sessionsRouter.post('/sessions/:id/readiness/revert', async (req, res) => {
  const { id } = parseParams(sessionParams, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => {
    await revertReadiness(tx, user, id);
    return sessionResponse(tx, user, id);
  });
  res.json(body);
});

sessionsRouter.get('/sessions', async (req, res) => {
  const query = parseQuery(sessionHistoryQuerySchema, req);
  const body: SessionHistoryResponse = await listHistory(db, authUser(req).id, query);
  res.json(body);
});

sessionsRouter.get('/sessions/active', async (req, res) => {
  const user = sessionUser(req);
  const id = await findOpenSessionId(db, user.id);
  const body: ActiveSessionResponse = { session: id ? (await sessionResponse(db, user, id)).session : null };
  res.json(body);
});

sessionsRouter.get('/sessions/:id', async (req, res) => {
  const { id } = parseParams(sessionParams, req);
  res.json(await sessionResponse(db, sessionUser(req), id));
});

sessionsRouter.get('/sessions/:id/summary', async (req, res) => {
  const { id } = parseParams(sessionParams, req);
  const user = sessionUser(req);
  const row = await requireSession(db, user.id, id);
  const body: SessionSummaryResponse = { summary: await buildSummary(db, user.id, row, user.timezone) };
  res.json(body);
});

sessionsRouter.patch('/sessions/:id/state', async (req, res) => {
  const { id } = parseParams(sessionParams, req);
  const input = parseBody(sessionStateSchema, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => {
    await changeState(tx, user.id, id, input);
    return sessionResponse(tx, user, id);
  });
  res.json(body);
});

sessionsRouter.patch('/sessions/:id/sets/:setId', async (req, res) => {
  const { id, setId } = parseParams(setParams, req);
  const input = parseBody(updateSetSchema, req);
  const userId = authUser(req).id;
  const body: SessionSetResponse = { set: await db.tx((tx) => updateSet(tx, userId, id, setId, input)) };
  res.json(body);
});

sessionsRouter.delete('/sessions/:id/sets/:setId', async (req, res) => {
  const { id, setId } = parseParams(setParams, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => {
    await deleteSet(tx, user.id, id, setId);
    return sessionResponse(tx, user, id);
  });
  res.json(body);
});

sessionsRouter.post('/sessions/:id/exercises/:sessionExerciseId/sets', async (req, res) => {
  const { id, sessionExerciseId } = parseParams(exerciseParams, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => {
    await addSet(tx, user.id, id, sessionExerciseId);
    return sessionResponse(tx, user, id);
  });
  res.status(201).json(body);
});

sessionsRouter.post('/sessions/:id/exercises', async (req, res) => {
  const { id } = parseParams(sessionParams, req);
  const input = parseBody(addSessionExerciseSchema, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => {
    await addExercise(tx, user.id, id, input);
    return sessionResponse(tx, user, id);
  });
  res.status(201).json(body);
});

sessionsRouter.post('/sessions/:id/exercises/:sessionExerciseId/replace', async (req, res) => {
  const { id, sessionExerciseId } = parseParams(exerciseParams, req);
  const { exerciseId } = parseBody(replaceSessionExerciseSchema, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => {
    await replaceExercise(tx, user.id, id, sessionExerciseId, exerciseId);
    return sessionResponse(tx, user, id);
  });
  res.json(body);
});

sessionsRouter.patch('/sessions/:id/exercises/:sessionExerciseId', async (req, res) => {
  const { id, sessionExerciseId } = parseParams(exerciseParams, req);
  const input = parseBody(updateSessionExerciseSchema, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => {
    await updateExercise(tx, user.id, id, sessionExerciseId, input);
    return sessionResponse(tx, user, id);
  });
  res.json(body);
});

sessionsRouter.delete('/sessions/:id/exercises/:sessionExerciseId', async (req, res) => {
  const { id, sessionExerciseId } = parseParams(exerciseParams, req);
  const user = sessionUser(req);
  const body = await db.tx(async (tx) => {
    await removeExercise(tx, user.id, id, sessionExerciseId);
    return sessionResponse(tx, user, id);
  });
  res.json(body);
});

sessionsRouter.post('/sessions/:id/finish', async (req, res) => {
  const { id } = parseParams(sessionParams, req);
  const input = parseBody(finishSessionSchema, req);
  const user = sessionUser(req);
  const body: SessionSummaryResponse = { summary: await db.tx((tx) => finishSession(tx, user, id, input)) };
  res.json(body);
});

sessionsRouter.post('/sessions/:id/abandon', async (req, res) => {
  const { id } = parseParams(sessionParams, req);
  const userId = authUser(req).id;
  await db.tx((tx) => abandonSession(tx, userId, id));
  const body: OkResponse = { ok: true };
  res.json(body);
});

sessionsRouter.delete('/sessions/:id', async (req, res) => {
  const { id } = parseParams(sessionParams, req);
  const userId = authUser(req).id;
  await db.tx((tx) => deleteSession(tx, userId, id));
  const body: OkResponse = { ok: true };
  res.json(body);
});
