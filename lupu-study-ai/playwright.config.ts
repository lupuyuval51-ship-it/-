import { defineConfig, devices } from "@playwright/test";

const MOCK = 4010;
const APP = 3101; // עם מפתח AI (מול שרת Anthropic מדומה)
const APP_NOKEY = 3102; // בלי מפתח AI
const APP_LIMIT = 3103; // מגבלת קצב נמוכה

const env = (extra: Record<string, string>) => ({ NEXT_TELEMETRY_DISABLED: "1", ...extra }) as Record<string, string>;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${APP}`, locale: "he-IL", timezoneId: "Asia/Jerusalem", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: [
    { command: `node tests/e2e/mock-anthropic.mjs`, port: MOCK, env: env({ MOCK_PORT: String(MOCK) }), reuseExistingServer: true },
    { command: `npx next start -p ${APP}`, port: APP, reuseExistingServer: true, env: env({ ANTHROPIC_API_KEY: "e2e-test-key", ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK}`, AI_RATE_LIMIT_PER_MINUTE: "500", AI_RATE_LIMIT_PER_DAY: "5000" }) },
    { command: `npx next start -p ${APP_NOKEY}`, port: APP_NOKEY, reuseExistingServer: true, env: env({}) },
    { command: `npx next start -p ${APP_LIMIT}`, port: APP_LIMIT, reuseExistingServer: true, env: env({ ANTHROPIC_API_KEY: "e2e-test-key", ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK}`, AI_RATE_LIMIT_PER_MINUTE: "3", AI_RATE_LIMIT_PER_DAY: "5000" }) },
  ],
});
