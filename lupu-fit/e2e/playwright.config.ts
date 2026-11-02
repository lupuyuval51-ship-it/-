import { defineConfig, devices } from '@playwright/test';

/**
 * Real browser E2E. `npm run e2e` builds the hosted client into /tmp/e2e-dist and starts the in-memory PGlite dev server
 * on :8101 itself (see webServer), then tears it down. Nothing is written to client/dist or dist-device.
 */
const PORT = Number(process.env['E2E_PORT'] ?? 8101);
const DIST = process.env['E2E_DIST'] ?? '/tmp/e2e-dist';
const launchOptions = { executablePath: process.env['E2E_CHROME'] ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--no-sandbox'] };

const build = `npx vite build --config client/vite.config.ts --mode hosted --outDir ${DIST} --emptyOutDir client`;
const serve = `PORT=${PORT} TRUST_PROXY=1 PBKDF2_ITERATIONS=1000 STATIC_DIR=${DIST} npx tsx server/src/devServer.ts`;

export default defineConfig<{ lang: 'he' | 'en' }>({
  testDir: './specs',
  outputDir: '/tmp/e2e-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: Number(process.env['E2E_WORKERS'] ?? 3),
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, launchOptions, trace: 'off', screenshot: 'only-on-failure' },
  webServer: {
    command: process.env['E2E_SKIP_BUILD'] ? serve : `${build} && ${serve}`,
    cwd: '..',
    url: `http://localhost:${PORT}/api/auth/me`,
    // /api/auth/me answers 401 when signed out; any HTTP answer means the server is up.
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    { name: 'he-mobile', use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 }, locale: 'he-IL', lang: 'he' as const } },
    { name: 'en-mobile', use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 }, locale: 'en-US', lang: 'en' as const } },
    { name: 'en-desktop', use: { viewport: { width: 1280, height: 800 }, locale: 'en-US', lang: 'en' as const } },
  ],
});
