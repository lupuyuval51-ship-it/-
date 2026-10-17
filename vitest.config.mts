import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(import.meta.dirname, "src"),
  "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
};

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? "postgresql://levelup:levelup@127.0.0.1:54329/levelup_test";

const baseEnv = {
  APP_ENV: "test",
  APP_URL: "http://localhost:3000",
  TRUST_PROXY: "true",
  AI_PROVIDER: "demo",
  // the suites test the plans, so they run with them switched on (tests/*/plans-off.test.ts covers the off switch)
  PLANS_ENABLED: "true",
  // display switches: on in the suites (tests/integration/display-switches.test.ts covers them off)
  GAME_EDITING: "true",
  DEMO_TEMPLATES: "true",
  PAYMENTS_MODE: "disabled",
  ENABLE_TEST_HOOKS: "false",
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        // Some unit tests play every corpus game through; on a busy machine they can exceed the 5 s default.
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node", testTimeout: 30_000, env: { ...baseEnv, DATABASE_URL: testDatabaseUrl } },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/integration/global-setup.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
          env: { ...baseEnv, DATABASE_URL: testDatabaseUrl },
        },
      },
    ],
  },
});
