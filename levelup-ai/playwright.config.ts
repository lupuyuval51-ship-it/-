import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const address = new URL(baseURL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(address.hostname)) throw new Error('These Demo E2E fixtures are intended for a local server.');
const installedChrome = process.platform === 'win32' && existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
const channel = process.env.PLAYWRIGHT_CHANNEL || (installedChrome ? 'chrome' : undefined);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*e2e.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: process.env.LEVELUP_E2E_OUTPUT_DIR || './work/e2e-artifacts',
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    channel,
    baseURL,
    viewport: { width: 1280, height: 900 },
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_NO_SERVER === 'true' ? undefined : {
    command: `"${process.execPath}" "${resolve('node_modules/next/dist/bin/next')}" dev --webpack -H 127.0.0.1 -p ${address.port || '3000'}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { DEMO_MODE: 'true', APP_URL: baseURL },
  },
});
