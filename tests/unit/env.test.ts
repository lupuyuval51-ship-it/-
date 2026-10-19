import { afterEach, describe, expect, it } from "vitest";
import { getEnv, resetEnvForTests } from "@/server/env";

const KEYS = ["APP_ENV", "APP_URL", "PAYMENTS_MODE", "ENABLE_TEST_HOOKS", "DATABASE_URL", "AI_PROVIDER", "DEMO_TEMPLATES"] as const;
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
  const prod = { APP_ENV: "production", APP_URL: "https://levelup.example", PAYMENTS_MODE: "disabled", ENABLE_TEST_HOOKS: "false" };

  it("refuses the payment simulator in production", () => {
    expect(withEnv({ ...prod, PAYMENTS_MODE: "dev" })).toThrow(/PAYMENTS_MODE=dev is not allowed/);
  });
  it("refuses test hooks in production", () => {
    expect(withEnv({ ...prod, ENABLE_TEST_HOOKS: "true" })).toThrow(/ENABLE_TEST_HOOKS/);
  });
  it("accepts a real production configuration, and allows the simulator outside production", () => {
    expect(withEnv(prod)().PAYMENTS_MODE).toBe("disabled");
    expect(withEnv({ ...prod, APP_ENV: "local", PAYMENTS_MODE: "dev" })().PAYMENTS_MODE).toBe("dev");
  });
  it("requires https in production", () => {
    expect(withEnv({ ...prod, APP_URL: "http://levelup.example" })).toThrow(/https/);
  });
  it("requires a database URL", () => {
    expect(withEnv({ ...prod, APP_ENV: "local", DATABASE_URL: "" })).toThrow(/DATABASE_URL/);
  });
});

describe("settings of older deployments still start the server", () => {
  it("AI_PROVIDER=demo (the old name) means no AI, and a leftover DEMO_TEMPLATES is ignored", () => {
    expect(withEnv({ AI_PROVIDER: "demo", DEMO_TEMPLATES: "true" })().AI_PROVIDER).toBe("none");
  });
});
