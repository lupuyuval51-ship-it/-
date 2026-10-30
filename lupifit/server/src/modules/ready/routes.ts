import { Router, type Request } from 'express';
import { z } from 'zod';
import { slugId } from '@shared/schemas/common';
import { readyDetailQuerySchema, readyListQuerySchema } from '@shared/schemas/ready';
import type { ReadyDetailResponse, ReadyListResponse } from '@shared/types';
import { db } from '../../db/pool';
import { authUser } from '../../middleware/context';
import { parseParams, parseQuery } from '../../middleware/validate';
import { getReady, listReady, type ReadyUser } from './service';

/** Mounted at /api by app.ts (authenticated). The global API rate limit is enough: both endpoints are cheap reads. */
export const readyRouter = Router();

const idParams = z.object({ id: slugId });

function readyUser(req: Request): ReadyUser {
  const u = authUser(req);
  return { id: u.id, locale: u.locale };
}

readyRouter.get('/ready-workouts', async (req, res) => {
  const query = parseQuery(readyListQuerySchema, req);
  const body: ReadyListResponse = await listReady(db, readyUser(req), query);
  res.json(body);
});

readyRouter.get('/ready-workouts/:id', async (req, res) => {
  const { id } = parseParams(idParams, req);
  const query = parseQuery(readyDetailQuerySchema, req);
  const body: ReadyDetailResponse = await getReady(db, readyUser(req), id, query);
  res.json(body);
});
