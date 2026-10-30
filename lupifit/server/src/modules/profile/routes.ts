import { Router } from 'express';
import {
  adjustmentApplySchema,
  deleteAccountSchema,
  onboardingSchema,
  profileUpdateSchema,
  settingsUpdateSchema,
  targetsUpdateSchema,
} from '@shared/schemas/profile';
import type {
  OkResponse,
  OnboardingResponse,
  ProfileResponse,
  ProfileUpdateResponse,
  SettingsUpdateResponse,
  TargetSuggestionResponse,
  UserDTO,
} from '@shared/types';
import { db } from '../../db/pool';
import { verifyPassword } from '../../lib/crypto';
import { badRequest } from '../../lib/errors';
import { clearSessionCookie } from '../../middleware/auth';
import { userId } from '../../middleware/context';
import { rateLimit } from '../../middleware/rateLimit';
import { parseBody } from '../../middleware/validate';
import { getUserDTO } from '../auth/users';
import { buildAccountExport } from './account';
import { applyAdjustment, dismissSuggestion, getTargetSuggestion, resetAdjustment } from './adjustment';
import { getProfile } from './repository';
import { saveOnboarding, updateProfile, updateSettings, updateTargets } from './service';

/** Mounted at /api by app.ts (authenticated, CSRF-protected). */
export const profileRouter = Router();

profileRouter.get('/profile', async (req, res) => {
  const body: ProfileResponse = { profile: await getProfile(db, userId(req)) };
  res.json(body);
});

profileRouter.put('/profile/onboarding', async (req, res) => {
  const input = parseBody(onboardingSchema, req);
  const id = userId(req);
  const profile = await db.tx((tx) => saveOnboarding(tx, id, input));
  const body: OnboardingResponse = { profile, user: (await getUserDTO(db, id)) as UserDTO };
  res.json(body);
});

profileRouter.patch('/profile', async (req, res) => {
  const input = parseBody(profileUpdateSchema, req);
  const id = userId(req);
  const body: ProfileUpdateResponse = await db.tx((tx) => updateProfile(tx, id, input));
  res.json(body);
});

profileRouter.put('/profile/targets', async (req, res) => {
  const input = parseBody(targetsUpdateSchema, req);
  const id = userId(req);
  const body: ProfileResponse = { profile: await db.tx((tx) => updateTargets(tx, id, input)) };
  res.json(body);
});

profileRouter.get('/profile/targets/suggestion', async (req, res) => {
  const body: TargetSuggestionResponse = await getTargetSuggestion(db, userId(req));
  res.json(body);
});

profileRouter.post('/profile/targets/adjustment', async (req, res) => {
  const { offsetKcal } = parseBody(adjustmentApplySchema, req);
  const id = userId(req);
  const body: ProfileResponse = { profile: await db.tx((tx) => applyAdjustment(tx, id, offsetKcal)) };
  res.json(body);
});

profileRouter.post('/profile/targets/adjustment/dismiss', async (req, res) => {
  const id = userId(req);
  await db.tx((tx) => dismissSuggestion(tx, id));
  const body: OkResponse = { ok: true };
  res.json(body);
});

profileRouter.delete('/profile/targets/adjustment', async (req, res) => {
  const id = userId(req);
  const body: ProfileResponse = { profile: await db.tx((tx) => resetAdjustment(tx, id)) };
  res.json(body);
});

profileRouter.patch('/settings', async (req, res) => {
  const input = parseBody(settingsUpdateSchema, req);
  const id = userId(req);
  const body: SettingsUpdateResponse = await db.tx((tx) => updateSettings(tx, id, input));
  res.json(body);
});

profileRouter.get('/account/export', rateLimit({ name: 'account-export', limit: 10, windowMs: 15 * 60 * 1000 }), async (req, res) => {
  const id = userId(req);
  const body = await db.tx((tx) => buildAccountExport(tx, id));
  res.setHeader('Content-Disposition', `attachment; filename="fitai-export-${body.exportDate}.json"`);
  res.type('application/json').send(JSON.stringify(body, null, 2));
});

profileRouter.delete('/account', rateLimit({ name: 'account-delete', limit: 5, windowMs: 15 * 60 * 1000 }), async (req, res) => {
  const input = parseBody(deleteAccountSchema, req);
  const id = userId(req);
  const row = await db.one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [id]);
  if (!(await verifyPassword(input.password, row.password_hash))) {
    throw badRequest('invalid_current_password', 'Password is incorrect');
  }
  // Every user-owned table references users(id) ON DELETE CASCADE (sessions included).
  await db.exec('DELETE FROM users WHERE id = $1', [id]);
  clearSessionCookie(res);
  const body: OkResponse = { ok: true };
  res.json(body);
});
