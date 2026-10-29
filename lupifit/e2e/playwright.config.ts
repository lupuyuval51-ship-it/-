import crypto from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

/**
 * Throwaway VAPID key pair so phone notifications are enabled in the E2E server. The push spec
 * stands in for the browser's push service, so no real push service is ever contacted.
 */
function vapidKeys() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const priv = ecdh.getPrivateKey();
  return {
    publicKey: ecdh.getPublicKey().toString('base64url'),
    privateKey: Buffer.concat([Buffer.alloc(32 - priv.length), priv]).toString('base64url'),
  };
}
const VAPID = vapidKeys();

const PORT = Number(process.env.E2E_PORT ?? 4010);
const LLM_PORT = Number(process.env.FAKE_LLM_PORT ?? 4011);
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://fitai:fitai_dev_password@127.0.0.1:5432/fitai_e2e';

export default defineConfig({
  testDir: './tests',
  outputDir: './.artifacts/results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: './.artifacts/report', open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Jerusalem',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: `node e2e/fake-llm.mjs`,
      url: `http://127.0.0.1:${LLM_PORT}`,
      cwd: '..',
      env: { FAKE_LLM_PORT: String(LLM_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `node e2e/reset-db.mjs && node dist/server/index.js`,
      url: `http://127.0.0.1:${PORT}/api/health`,
      cwd: '..',
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'production',
        PORT: String(PORT),
        HOST: '127.0.0.1',
        APP_URL: `http://127.0.0.1:${PORT}`,
        DATABASE_URL,
        SESSION_SECRET: 'e2e-session-secret-0123456789abcdef0123456789',
        COOKIE_SECURE: 'false',
        DB_AUTO_MIGRATE: 'true',
        AI_API_KEY: 'e2e-fake-key',
        AI_BASE_URL: `http://127.0.0.1:${LLM_PORT}`,
        AI_MAX_RETRIES: '0',
        OPENFOODFACTS_ENABLED: 'false',
        RATE_LIMIT_MULTIPLIER: '50',
        LOG_REQUESTS: 'false',
        VAPID_PUBLIC_KEY: VAPID.publicKey,
        VAPID_PRIVATE_KEY: VAPID.privateKey,
        VAPID_SUBJECT: 'mailto:e2e@example.com',
      },
    },
  ],
});
