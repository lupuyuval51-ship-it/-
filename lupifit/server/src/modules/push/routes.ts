/**
 * Phone notifications (Web Push). Mounted at /api by app.ts (authenticated, CSRF-protected).
 * GET  /push/public-key   whether push is available, the VAPID public key and the device count
 * POST /push/subscribe    store this browser's subscription (idempotent)
 * POST /push/unsubscribe  forget this browser's subscription
 * POST /push/test         send one test notification to the caller (this device or all)
 */
import { Router } from 'express';
import { pushSubscribeSchema, pushTestSchema, pushUnsubscribeSchema } from '@shared/schemas/push';
import type { PushConfigResponse, PushDevicesResponse, PushTestResponse } from '@shared/types';
import { db } from '../../db/pool';
import { badRequest, conflict, notFound, serviceUnavailable } from '../../lib/errors';
import { authUser, userId } from '../../middleware/context';
import { rateLimit } from '../../middleware/rateLimit';
import { parseBody } from '../../middleware/validate';
import { countSubscriptions, deleteSubscription, listSubscriptions, upsertSubscription } from './repository';
import { sendToSubscriptions } from './sender';
import { pushPayload } from './texts';
import { isAllowedEndpoint, pushEnabled, vapidDetails } from './vapid';

export const pushRouter = Router();

const subscriptionLimit = rateLimit({ name: 'push-subscription', limit: 30, windowMs: 15 * 60 * 1000 });
const testLimit = rateLimit({ name: 'push-test', limit: 5, windowMs: 10 * 60 * 1000 });

const disabled = () => serviceUnavailable('push_disabled', 'Phone notifications are not configured on this server');

pushRouter.get('/push/public-key', async (req, res) => {
  const vapid = vapidDetails();
  const body: PushConfigResponse = { enabled: vapid !== null, publicKey: vapid?.publicKey ?? null, devices: await countSubscriptions(db, userId(req)) };
  res.json(body);
});

pushRouter.post('/push/subscribe', subscriptionLimit, async (req, res) => {
  const input = parseBody(pushSubscribeSchema, req);
  if (!pushEnabled()) throw disabled();
  if (!isAllowedEndpoint(input.endpoint)) throw badRequest('push_endpoint_not_allowed', 'This push service is not supported');
  const id = userId(req);
  const devices = await db.tx((tx) => upsertSubscription(tx, id, input, req.get('user-agent') ?? ''));
  const body: PushDevicesResponse = { ok: true, devices };
  res.json(body);
});

pushRouter.post('/push/unsubscribe', subscriptionLimit, async (req, res) => {
  const { endpoint } = parseBody(pushUnsubscribeSchema, req);
  const id = userId(req);
  if (!(await deleteSubscription(db, id, endpoint))) throw notFound('push_subscription_not_found');
  const body: PushDevicesResponse = { ok: true, devices: await countSubscriptions(db, id) };
  res.json(body);
});

pushRouter.post('/push/test', testLimit, async (req, res) => {
  const { endpoint } = parseBody(pushTestSchema, req);
  if (!pushEnabled()) throw disabled();
  const user = authUser(req);
  const subscriptions = await listSubscriptions(db, user.id, endpoint);
  if (!subscriptions.length) {
    throw endpoint ? notFound('push_subscription_not_found') : conflict('push_not_subscribed', 'No device has phone notifications turned on');
  }
  const body: PushTestResponse = await sendToSubscriptions(db, subscriptions, pushPayload('test', user.locale), { ttlSeconds: 10 * 60, urgency: 'high' });
  res.json(body);
});
