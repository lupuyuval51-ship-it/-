import { afterEach, describe, expect, it } from "vitest";
import { getEnv, resetEnvForTests } from "@/server/env";

const KEYS = ["ANTHROPIC_MODEL", "OPENAI_MODEL"] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  resetEnvForTests();
});

describe("AI model names", () => {
  it("a blank value (as an .env file leaves it) means the default model, not an empty name", () => {
    Object.assign(process.env, { ANTHROPIC_MODEL: "", OPENAI_MODEL: "   " });
    resetEnvForTests();
    expect(getEnv().ANTHROPIC_MODEL).toBe("claude-opus-5-5");
    expect(getEnv().OPENAI_MODEL).toBe("gpt-4.1");
  });

  it("a set value is kept", () => {
    Object.assign(process.env, { ANTHROPIC_MODEL: "claude-sonnet-5-5" });
    resetEnvForTests();
    expect(getEnv().ANTHROPIC_MODEL).toBe("claude-sonnet-5-5");
  });
});
