/** Hosted entrypoint: Node 22 + PostgreSQL 16. Configuration via environment variables only. (`devServer.ts` is the local/E2E entry.) */
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { PgAdapter } from './db/pgAdapter.ts';
import { migrate } from './db/migrate.ts';
import { buildApp, DEFAULT_DEPS } from './createApp.ts';
import { createExpressApp, parseTrustProxy } from './http/express.ts';
import { extraRoutes } from './routes/index.ts';
import { providersFromEnv } from './ai/providers.ts';
import { hostedConfigProblem } from './hostedConfig.ts';

// Fail closed: this entry always runs with production settings. Unset NODE_ENV or TRUST_PROXY would silently give dev-grade behaviour
// (every visitor behind a proxy shares one address for the login and registration limits, cookies without Secure, stack traces).
const problem = hostedConfigProblem(process.env);
if (problem) { console.error(problem); process.exit(1); }

const url = process.env['DATABASE_URL'] as string;
const db = PgAdapter.fromUrl(url);
await migrate(db);
const ai = providersFromEnv(process.env);
const api = buildApp({
  db, mode: 'hosted', clock: () => new Date(), ...DEFAULT_DEPS, secureCookies: true,
  // Session-token hashes run on every request: synchronous node:crypto takes microseconds and never queues behind PBKDF2 in libuv's pool.
  sha256: (text: string) => createHash('sha256').update(text).digest('hex'),
  ...(ai ? { ai } : {}),
  adminUsernames: (process.env['ADMIN_USERNAMES'] ?? '').split(',').map((x) => x.trim()).filter(Boolean),
}, extraRoutes);
const app = createExpressApp(api, {
  mode: 'hosted', trustProxy: parseTrustProxy(process.env['TRUST_PROXY'], true),
  staticDir: resolve(process.env['STATIC_DIR'] ?? '../client/dist'), assetLinksFile: process.env['ASSETLINKS_FILE'] ?? resolve('assetlinks.json'),
});
const port = Number(process.env['PORT'] ?? 8080);
// HOST: the interface to bind. Behind a reverse proxy on the same machine use 127.0.0.1 (or publish the container port only on
// 127.0.0.1), otherwise anyone reaching the port directly can write their own X-Forwarded-For. Unset = all interfaces (containers).
const host = process.env['HOST'];
const onListen = () => console.log(`LUPU-FIT hosted listening on ${host ?? ''}:${port}`);
const server = host ? app.listen(port, host, onListen) : app.listen(port, onListen);
// Node's defaults (5 min per request, 60 s for headers) let a slow client hold a connection far too long.
server.requestTimeout = 60_000;
server.headersTimeout = 20_000;
