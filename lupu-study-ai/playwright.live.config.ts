import { defineConfig, devices } from "@playwright/test";

/**
 * בדיקות סנכרון מול פרויקט Supabase אמיתי. דורש משתני סביבה (ראה tests/live/sync.spec.ts):
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (גם ל-build), LIVE_USER_A/B (אימייל) ו-LIVE_PASSWORD.
 * הרצה: npm run test:live
 */
export default defineConfig({
  testDir: "tests/live",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3104", locale: "he-IL", timezoneId: "Asia/Jerusalem", trace: "retain-on-failure" },
  projects: [{ name: "live", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npx next start -p 3104", port: 3104, reuseExistingServer: true, env: { NEXT_DIST_DIR: ".next-live", NEXT_TELEMETRY_DISABLED: "1" } },
});
