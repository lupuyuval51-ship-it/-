import { defineConfig, devices } from '@playwright/test';

/**
 * Device mode E2E: the app with the server inside it (PGlite in a worker). There is no app server and no
 * PostgreSQL: the device build (`npm run build:device` → dist/device) is served as static files, the way
 * the Android app's WebView loads them. Phone size (Pixel 7).
 */
const PORT = Number(process.env.E2E_DEVICE_PORT ?? 4620);

export default defineConfig({
  testDir: './device',
  outputDir: './.artifacts/device-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [['list'], ['html', { outputFolder: './.artifacts/device-report', open: 'never' }]],
  use: {
    ...devices['Pixel 7'],
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Jerusalem',
  },
  projects: [{ name: 'device-pixel7', use: { ...devices['Pixel 7'] } }],
  webServer: {
    // Static files only (Vite's preview server for dist/device: correct MIME types, SPA fallback).
    command: `npx vite preview --config client/vite.config.ts --mode device --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    cwd: '..',
    timeout: 60_000,
    reuseExistingServer: false,
  },
});
