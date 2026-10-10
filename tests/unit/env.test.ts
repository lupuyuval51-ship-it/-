import { afterEach, describe, expect, it } from "vitest";
import { getEnv, resetEnvForTests } from "@/server/env";

const KEYS = ["APP_ENV", "PAYMENTS_MODE", "ENABLE_TEST_HOOKS", "SESSION_SECRET"] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  resetEnvForTests();
});

function withEnv(over: Partial<Record<(typeof KEYS)[number], string>>) {
  Object.assign(process.env, over);
  resetEnvForTests();
  return () => getEnv();
}

describe("production safety guards", () => {
  const prod = { APP_ENV: "production", SESSION_SECRET: "x".repeat(48), PAYMENTS_MODE: "disabled", ENABLE_TEST_HOOKS: "false" };

  it("refuses the payment simulator in production", () => {
    expect(withEnv({ ...prod, PAYMENTS_MODE: "dev" })).toThrow(/PAYMENTS_MODE=dev is not allowed/);
  });
  it("refuses test hooks in production", () => {
    expect(withEnv({ ...prod, ENABLE_TEST_HOOKS: "true" })).toThrow(/ENABLE_TEST_HOOKS/);
  });
  it("refuses a placeholder session secret in production", () => {
    expect(withEnv({ ...prod, SESSION_SECRET: "replace-with-a-long-random-string-0123456789abcdef" })).toThrow(/SESSION_SECRET/);
  });
  it("accepts a real production configuration, and allows the simulator outside production", () => {
    expect(withEnv(prod)().PAYMENTS_MODE).toBe("disabled");
    expect(withEnv({ ...prod, APP_ENV: "local", PAYMENTS_MODE: "dev" })().PAYMENTS_MODE).toBe("dev");
  });
  it("rejects short session secrets everywhere", () => {
    expect(withEnv({ ...prod, APP_ENV: "local", SESSION_SECRET: "short" })).toThrow(/at least 32/);
  });
});
