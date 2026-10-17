import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE = `http://127.0.0.1:${PORT}`;
const DB = process.env.TEST_DATABASE_URL ?? "postgresql://levelup:levelup@127.0.0.1:54329/levelup_test";

// Use a system/preinstalled Chromium when Playwright's own browser download is unavailable.
const candidates = [process.env.PW_CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter((p): p is string => Boolean(p));
const executablePath = candidates.find((p) => existsSync(p));

const launchOptions = {
  ...(executablePath ? { executablePath } : {}),
  // Software GL so WebGL works in headless CI containers without a GPU.
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000, toHaveScreenshot: { animations: "disabled", caret: "hide" } },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "test-results",
  use: { baseURL: BASE, trace: "retain-on-failure", screenshot: "only-on-failure", launchOptions },
  webServer: {
    command: `npx prisma migrate deploy && npm run build && npx next start -p ${PORT} -H 127.0.0.1`,
    url: `${BASE}/api/ai/status`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      APP_ENV: "test",
      APP_URL: BASE,
      DATABASE_URL: DB,
      TRUST_PROXY: "true",
      AI_PROVIDER: "demo",
      PLANS_ENABLED: "true",
      // the display switches are on in the suites (tests/integration/display-switches.test.ts covers them off)
      GAME_EDITING: "true",
      DEMO_TEMPLATES: "true",
      PAYMENTS_MODE: "dev",
      ENABLE_TEST_HOOKS: "true",
      NODE_ENV: "production",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 }, launchOptions } },
    { name: "mobile", testMatch: /responsive\.spec\.ts/, use: { ...devices["Pixel 7"], launchOptions } },
  ],
});
