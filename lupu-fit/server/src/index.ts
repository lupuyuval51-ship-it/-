/** Hosted entrypoint: Node 22 + PostgreSQL 16. Configuration via environment variables only. */
import { resolve } from 'node:path';
import { PgAdapter } from './db/pgAdapter.ts';
import { migrate } from './db/migrate.ts';
import { buildApp, DEFAULT_DEPS } from './createApp.ts';
import { createExpressApp } from './http/express.ts';
import { extraRoutes } from './routes/index.ts';
import { providersFromEnv } from './ai/providers.ts';

const url = process.env['DATABASE_URL'];
if (!url) { console.error('DATABASE_URL is required'); process.exit(1); }
const db = PgAdapter.fromUrl(url);
await migrate(db);
const prod = process.env['NODE_ENV'] === 'production';
const api = buildApp({
  db, mode: 'hosted', clock: () => new Date(), ...DEFAULT_DEPS, secureCookies: prod,
  ...(providersFromEnv(process.env) ? { ai: providersFromEnv(process.env) } : {}),
  adminUsernames: (process.env['ADMIN_USERNAMES'] ?? '').split(',').map((x) => x.trim()).filter(Boolean),
}, extraRoutes);
const trust = process.env['TRUST_PROXY'];
const app = createExpressApp(api, {
  mode: 'hosted', trustProxy: trust === undefined ? (prod ? 1 : false) : /^\d+$/.test(trust) ? Number(trust) : trust === 'true' ? true : trust === 'false' ? false : trust,
  staticDir: resolve(process.env['STATIC_DIR'] ?? '../client/dist'), assetLinksFile: process.env['ASSETLINKS_FILE'] ?? resolve('assetlinks.json'),
});
const port = Number(process.env['PORT'] ?? 8080);
app.listen(port, () => console.log(`LUPU-FIT hosted listening on :${port}`));
