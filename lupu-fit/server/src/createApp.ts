import { createApiApp, type ApiApp } from './core/app.ts';
import { Router } from './core/router.ts';
import type { Deps } from './core/types.ts';
import { authRoutes } from './routes/auth.ts';

export const DEFAULT_DEPS = { pbkdf2Iterations: 600_000, sessionTtlDays: 30 } as const;

/** Composes every route module into one portable app. Used by the hosted server, tests and the Device Mode worker. */
export function buildApp(deps: Deps, extra: ((r: Router, d: Deps) => void)[] = []): ApiApp {
  const router = new Router();
  router.get('/api/health', async () => ({ json: { ok: true, mode: deps.mode } }), { auth: false });
  authRoutes(router, deps);
  for (const add of extra) add(router, deps);
  return createApiApp(deps, router);
}
