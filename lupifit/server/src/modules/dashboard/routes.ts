import { Router } from 'express';
import type { DashboardDTO } from '@shared/types';
import { db } from '../../db/pool';
import { userId } from '../../middleware/context';
import { loadUserContext } from '../progress/data';
import { getDashboard } from './service';

/** Mounted at /api by app.ts (authenticated). Implemented by the dashboard module. */
export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', async (req, res) => {
  const ctx = await loadUserContext(db, userId(req));
  const body: DashboardDTO = await getDashboard(db, ctx);
  res.json(body);
});
