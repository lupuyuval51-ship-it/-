/**
 * Device-mode test harness (`npm run test:server:device`), no PostgreSQL server needed:
 * - server-on-pglite: the existing server suite (server/tests) with `pg` aliased to the PGlite shim
 *   (in-memory database per test process), real Express and HTTP. Proves the SQL, type parsers and error
 *   codes on PGlite. Skips only the tests listed in client/src/device/testing/pglite-skips.ts.
 * - device-units: the device shims (Buffer, crypto, pg, express, migrations) against Node / node-postgres behaviour.
 * - device-flows: API flows through the Express shim (no HTTP) with every device alias and the device env.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { DEVICE_ALIASES, PG_ALIAS } from '../client/src/device/aliases';
import { DEVICE_ENV } from '../client/src/device/env';

const root = fileURLToPath(new URL('..', import.meta.url));
const shared = { find: /^@shared\//, replacement: `${fileURLToPath(new URL('../shared', import.meta.url))}/` };

export default defineConfig({
  root,
  test: {
    projects: [
      {
        resolve: { alias: [shared, PG_ALIAS] },
        test: {
          name: 'server-on-pglite',
          root,
          include: ['server/tests/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['client/src/device/testing/server-suite.setup.ts'],
          env: {
            NODE_ENV: 'test',
            DATABASE_URL: 'memory://',
            LOG_REQUESTS: 'false',
            RATE_LIMIT_MULTIPLIER: '100',
            AI_API_KEY: '',
            ANTHROPIC_API_KEY: '',
            OPENFOODFACTS_ENABLED: 'false',
            DB_AUTO_MIGRATE: 'false',
          },
          pool: 'forks',
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
      {
        resolve: { alias: [shared] },
        test: {
          name: 'device-units',
          root,
          include: ['client/src/device/**/*.test.ts'],
          exclude: ['client/src/device/**/*.flow.test.ts'],
          environment: 'node',
          pool: 'forks',
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
      {
        resolve: { alias: [shared, ...DEVICE_ALIASES] },
        test: {
          name: 'device-flows',
          root,
          include: ['client/src/device/**/*.flow.test.ts'],
          environment: 'node',
          // The device environment, with an in-memory database instead of IndexedDB.
          env: { ...DEVICE_ENV, DATABASE_URL: 'memory://' },
          // The flows replace the global Buffer with the device one; child-process IPC (forks) relies on
          // Node's Buffer, worker threads talk through structured clone.
          pool: 'threads',
          testTimeout: 60_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
