/** Hosted-mode server over in-memory PGlite: no PostgreSQL needed. For local dev, screenshots and E2E only. */
import { resolve } from 'node:path';
import { buildApp, DEFAULT_DEPS } from './createApp.ts';
import { migrate } from './db/migrate.ts';
import { PgliteAdapter } from './db/pgliteAdapter.ts';
import { createExpressApp } from './http/express.ts';
import { extraRoutes } from './routes/index.ts';

const db = await PgliteAdapter.create(process.env['PGLITE_DIR']);
await migrate(db);
const api = buildApp({ db, mode: 'hosted', clock: () => new Date(), ...DEFAULT_DEPS, pbkdf2Iterations: Number(process.env['PBKDF2_ITERATIONS'] ?? 600_000), secureCookies: false }, extraRoutes);
const app = createExpressApp(api, { mode: 'hosted', trustProxy: false, staticDir: resolve(process.env['STATIC_DIR'] ?? 'client/dist'), globalLimitPerMin: 100000 });
const port = Number(process.env['PORT'] ?? 8080);
app.listen(port, () => console.log(`dev server on :${port}`));
