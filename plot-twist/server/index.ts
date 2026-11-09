/**
 * Production server: serves the built app from ./dist and the API under /api.
 *   npm run build && npm start      (Node ≥ 22.18 runs this TypeScript file directly)
 */
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiHandler } from './api.ts';
import { redactSecrets } from './backend.ts';
import { loadDotEnv, readConfig } from './config.ts';
import { createStaticHandler, distBuildTime, sendText, staleDistWarning } from './static.ts';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
/** Built app directory (PLOT_TWIST_DIST overrides it, e.g. for isolated E2E builds). */
const DIST = resolve(ROOT, process.env.PLOT_TWIST_DIST || 'dist');

loadDotEnv(ROOT);
const config = readConfig();
const api = createApiHandler({ config, build: () => distBuildTime(DIST) });
const serveStatic = createStaticHandler(DIST);

const stale = staleDistWarning(DIST);
if (stale) console.warn(`[plot-twist] ${stale}`);

const server = createServer((req, res) => {
  const url = req.url ?? '/';
  const run = url.startsWith('/api/') ? api(req, res) : serveStatic(req, res);
  run.catch((err: unknown) => {
    console.error('[plot-twist] request failed:', redactSecrets(err instanceof Error ? (err.stack ?? err.message) : String(err)));
    sendText(res, 500, 'Internal error');
  });
});

server.listen(config.port, () => {
  const build = distBuildTime(DIST);
  console.log(`[plot-twist] PLOT TWIST running at http://localhost:${config.port}${build ? ` (build ${build})` : ''}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
