import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

// The managed environment ships a pinned Chromium; use it when Playwright's own revision is absent.
const pinnedChromium = process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const executablePath = fs.existsSync(pinnedChromium) ? pinnedChromium : undefined;
const port = Number(process.env.E2E_PORT || 3100);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    locale: "he-IL",
    viewport: { width: 390, height: 844 },
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"], launchOptions: executablePath ? { executablePath } : {} } }],
  webServer: {
    command: `PORT=${port} PGLITE_DATA_DIR=./data/pglite-e2e node scripts/e2e-server.mjs`,
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
