import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { accountRoutes } from './account.ts';
import { coachRoutes } from './coach.ts';
import { foodRoutes } from './food.ts';
import { mediaRoutes } from './media.ts';
import { nutritionRoutes } from './nutrition.ts';
import { planRoutes } from './plans.ts';
import { profileRoutes } from './profile.ts';
import { progressRoutes } from './progress.ts';
import { readinessRoutes } from './readiness.ts';
import { sessionRoutes } from './sessions.ts';
import { weightRoutes } from './weights.ts';

/** Domain route modules (order matters only for overlapping patterns, e.g. /sessions/active before /sessions/:id). */
export const extraRoutes: ((r: Router, d: Deps) => void)[] = [
  profileRoutes, weightRoutes, readinessRoutes, planRoutes, sessionRoutes, foodRoutes, progressRoutes, coachRoutes, nutritionRoutes, accountRoutes, mediaRoutes,
];
