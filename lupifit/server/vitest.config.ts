import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('..', import.meta.url));
const testDb = process.env.TEST_DATABASE_URL ?? 'postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai_test';

export default defineConfig({
  root,
  resolve: { alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) } },
  test: {
    include: ['server/tests/**/*.test.ts', 'shared/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['server/tests/globalSetup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDb,
      TEST_DATABASE_URL: testDb,
      LOG_REQUESTS: 'false',
      RATE_LIMIT_MULTIPLIER: '100',
      AI_API_KEY: '',
      ANTHROPIC_API_KEY: '',
      OPENFOODFACTS_ENABLED: 'false',
      DB_AUTO_MIGRATE: 'false',
    },
    pool: 'forks',
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
