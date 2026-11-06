import { defineConfig, devices } from '@playwright/test';

/**
 * Device Mode E2E (`npm run e2e:device`). Builds the device client into /tmp/e2e-device-dist (never client/dist-device) and serves it
 * with a plain static file server on :8121: no API server exists at all. The browser itself cannot resolve any host except localhost
 * (--host-resolver-rules), so a request that leaves the machine fails loudly even if it comes from a worker or the service worker.
 */
const PORT = Number(process.env['E2E_DEVICE_PORT'] ?? 8121);
const DIST = process.env['E2E_DEVICE_DIST'] ?? '/tmp/e2e-device-dist';
const launchOptions = {
  executablePath: process.env['E2E_CHROME'] ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'],
};

const build = `npx vite build --config client/vite.config.ts --mode device --outDir ${DIST} --emptyOutDir client`;
const serve = `npx tsx e2e/staticServer.ts ${DIST} ${PORT}`;

export default defineConfig<{ lang: 'he' | 'en' }>({
  testDir: './device',
  outputDir: '/tmp/e2e-device-results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: Number(process.env['E2E_WORKERS'] ?? 3),
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, launchOptions, trace: 'off', screenshot: 'only-on-failure' },
  webServer: {
    command: process.env['E2E_SKIP_BUILD'] ? serve : `${build} && ${serve}`,
    cwd: '..',
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    { name: 'he-mobile', use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 }, locale: 'he-IL', lang: 'he' as const } },
    { name: 'en-mobile', use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 }, locale: 'en-US', lang: 'en' as const } },
  ],
});
