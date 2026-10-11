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
  PAYMENTS_MODE: "disabled",
  ENABLE_TEST_HOOKS: "false",
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node", env: { ...baseEnv, DATABASE_URL: testDatabaseUrl } },
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
