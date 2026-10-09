import { Router } from 'express';
import { onboardingSchema } from '@shared/schemas/profile';
import type { ProfileResponse, UserDTO } from '@shared/types';
import { db } from '../../db/pool';
import { userId } from '../../middleware/context';
import { parseBody } from '../../middleware/validate';
import { getUserDTO } from '../auth/users';
import { getProfile } from './repository';
import { saveOnboarding } from './service';

/** Mounted at /api by app.ts (authenticated). */
export const profileRouter = Router();

profileRouter.get('/profile', async (req, res) => {
  const body: ProfileResponse = { profile: await getProfile(db, userId(req)) };
  res.json(body);
});

profileRouter.put('/profile/onboarding', async (req, res) => {
  const input = parseBody(onboardingSchema, req);
  const id = userId(req);
  const profile = await db.tx((tx) => saveOnboarding(tx, id, input));
  const user = (await getUserDTO(db, id)) as UserDTO;
  res.json({ profile, user });
});
