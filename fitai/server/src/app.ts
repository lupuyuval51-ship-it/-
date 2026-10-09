import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Router, type Express } from 'express';
import type { HealthResponse } from '@shared/types';
import { isLlmConfigured, llmModel } from './ai/llm';
import { config } from './config';
import { db } from './db/pool';
import { csrfProtection, loadSession, requireAuth } from './middleware/auth';
import { requestContext } from './middleware/context';
import { apiNotFound, errorHandler } from './middleware/errors';
import { idempotency } from './middleware/idempotency';
import { rateLimit } from './middleware/rateLimit';
import { noStore, originAndContentTypeGuard, permissionsPolicy, securityHeaders } from './middleware/security';
import { authRouter } from './modules/auth/routes';
import { coachRouter } from './modules/coach/routes';
import { dashboardRouter } from './modules/dashboard/routes';
import { exercisesRouter } from './modules/exercises/routes';
import { gamificationRouter } from './modules/gamification/routes';
import { nutritionRouter } from './modules/nutrition/routes';
import { profileRouter } from './modules/profile/routes';
import { progressRouter } from './modules/progress/routes';
import { sessionsRouter } from './modules/sessions/routes';
import { workoutsRouter } from './modules/workouts/routes';

function resolveStaticDir(): string | null {
  if (config.staticDir) return config.staticDir;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [path.resolve(here, '../client'), path.resolve(process.cwd(), 'dist/client')];
  return candidates.find((c) => fs.existsSync(path.join(c, 'index.html'))) ?? null;
}

export function createApp(options: { serveClient?: boolean } = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy ? 1 : false);
  app.set('query parser', 'simple');

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(permissionsPolicy);

  // ---------------------------------------------------------------- API
  const api = Router();
  api.use(noStore);
  api.use(rateLimit({ name: 'api', limit: 600, windowMs: 60_000 }));
  api.use(originAndContentTypeGuard);
  // The session is resolved before any body is read so the large upload limit below is
  // only ever granted to signed-in users (anonymous clients cannot make the server buffer
  // and parse 8 MB bodies).
  api.use(loadSession);
  // Larger body limit only for meal-photo uploads; everything else is capped at 100 KB.
  const photoJson = express.json({ limit: '8mb', strict: true });
  api.post('/nutrition/photo-analysis', (req, res, next) => (req.auth ? photoJson(req, res, next) : next()));
  api.use(express.json({ limit: '100kb', strict: true }));
  api.use(csrfProtection);
  api.use(idempotency);

  api.get('/health', async (_req, res) => {
    let database: HealthResponse['database'] = 'ok';
    try {
      await db.one('SELECT 1 AS ok');
    } catch {
      database = 'error';
    }
    const body: HealthResponse = {
      status: database === 'ok' ? 'ok' : 'degraded',
      database,
      version: config.version,
      ai: { configured: isLlmConfigured(), provider: isLlmConfigured() ? config.ai.provider : null, model: llmModel() },
      time: new Date().toISOString(),
    };
    res.status(database === 'ok' ? 200 : 503).json(body);
  });

  api.use('/auth', authRouter);

  const authed = Router();
  authed.use(requireAuth);
  authed.use(profileRouter);
  authed.use(exercisesRouter);
  authed.use(workoutsRouter);
  authed.use(sessionsRouter);
  authed.use(nutritionRouter);
  authed.use(progressRouter);
  authed.use(gamificationRouter);
  authed.use(dashboardRouter);
  authed.use(coachRouter);
  api.use(authed);

  api.use(apiNotFound);
  api.use(errorHandler);
  app.use('/api', api);

  // ---------------------------------------------------------------- Client (production build)
  const staticDir = options.serveClient === false ? null : resolveStaticDir();
  if (staticDir) {
    app.use(
      '/assets',
      express.static(path.join(staticDir, 'assets'), { immutable: true, maxAge: '1y', index: false, fallthrough: false }),
    );
    app.use(express.static(staticDir, { index: false, maxAge: '1h' }));
    const indexHtml = path.join(staticDir, 'index.html');
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  }
  app.use(errorHandler);
  return app;
}
