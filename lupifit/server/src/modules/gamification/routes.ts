import { Router } from 'express';
import { idParamSchema, notificationsQuerySchema } from '@shared/schemas/progress';
import type { GamificationDTO, NotificationListResponse, NotificationMutationResponse } from '@shared/types';
import { db } from '../../db/pool';
import { userId } from '../../middleware/context';
import { parseParams, parseQuery } from '../../middleware/validate';
import { loadUserContext } from '../progress/data';
import { deleteNotification, listNotifications, markAllRead, markRead, unreadCount } from './notifications';
import { getGamification } from './service';

/** Mounted at /api by app.ts (authenticated). Implemented by the gamification module. */
export const gamificationRouter = Router();

gamificationRouter.get('/gamification', async (req, res) => {
  const ctx = await loadUserContext(db, userId(req));
  const body: GamificationDTO = await getGamification(db, ctx);
  res.json(body);
});

gamificationRouter.get('/notifications', async (req, res) => {
  const { limit } = parseQuery(notificationsQuerySchema, req);
  const body: NotificationListResponse = await listNotifications(db, userId(req), limit);
  res.json(body);
});

gamificationRouter.post('/notifications/read-all', async (req, res) => {
  const id = userId(req);
  await markAllRead(db, id);
  const body: NotificationMutationResponse = { ok: true, unreadCount: await unreadCount(db, id) };
  res.json(body);
});

gamificationRouter.post('/notifications/:id/read', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  const uid = userId(req);
  await markRead(db, uid, id);
  const body: NotificationMutationResponse = { ok: true, unreadCount: await unreadCount(db, uid) };
  res.json(body);
});

gamificationRouter.delete('/notifications/:id', async (req, res) => {
  const { id } = parseParams(idParamSchema, req);
  const uid = userId(req);
  await deleteNotification(db, uid, id);
  const body: NotificationMutationResponse = { ok: true, unreadCount: await unreadCount(db, uid) };
  res.json(body);
});
