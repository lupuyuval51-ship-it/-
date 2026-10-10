import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/** E2E for the offline Android app's web bundle (the same files Capacitor ships), on a phone viewport. */
const PORT = 4173;
const candidates = [process.env.PW_CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter((p): p is string => Boolean(p));
const executablePath = candidates.find((p) => existsSync(p));
const launchOptions = { ...(executablePath ? { executablePath } : {}), args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] };

export default defineConfig({
  testDir: "../tests/e2e-mobile",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  outputDir: "../test-results/mobile",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure", screenshot: "only-on-failure", launchOptions },
  webServer: {
    command: `npx vite build --config mobile/vite.config.mts --mode e2e && npx vite preview --config mobile/vite.config.mts --host 127.0.0.1 --port ${PORT}`,
    cwd: "..",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [{ name: "android-phone", use: { ...devices["Pixel 7"], launchOptions } }],
});
