import { afterAll, describe, expect, it } from "vitest";
import { setupTestEnv } from "./helpers";

const env = setupTestEnv("cache");

import { cacheKey, getCached, setCached } from "@/server/ai/cache";
import { canonicalJson } from "@/server/util/hash";

afterAll(() => env.teardown());

describe("cache keys", () => {
  it("is stable across key order and undefined values", () => {
    const a = cacheKey("chat", { message: "hi", locale: "he", nested: { x: 1, y: [1, 2] } });
    const b = cacheKey("chat", { nested: { y: [1, 2], x: 1 }, locale: "he", message: "hi", extra: undefined });
    expect(a).toEqual(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes with the action or any semantic input", () => {
    const base = cacheKey("generate-workout", { role: "handler", duration: 90 });
    expect(cacheKey("generate-plan", { role: "handler", duration: 90 })).not.toEqual(base);
    expect(cacheKey("generate-workout", { role: "handler", duration: 105 })).not.toEqual(base);
    expect(cacheKey("generate-workout", { role: "handler", duration: 90, seed: "x" })).not.toEqual(base);
    expect(canonicalJson({ b: 1, a: [{ d: 1, c: 2 }] })).toBe('{"a":[{"c":2,"d":1}],"b":1}');
  });

  it("stores and expires responses", async () => {
    const key = cacheKey("chat", { message: "what is a handler", locale: "en" });
    expect(await getCached(key)).toBeNull();
    await setCached(key, "chat", { ok: true, reply: "A handler…" });
    expect(await getCached<{ reply: string }>(key)).toMatchObject({ reply: "A handler…" });
    const expired = cacheKey("chat", { message: "expired", locale: "en" });
    await setCached(expired, "chat", { ok: true, reply: "old" }, -1);
    expect(await getCached(expired)).toBeNull();
  });
});
