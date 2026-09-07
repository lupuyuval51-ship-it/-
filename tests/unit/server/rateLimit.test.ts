import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { setupTestEnv } from "./helpers";

const env = setupTestEnv("ratelimit");

import { SlidingWindow } from "@/server/util/slidingWindow";
import { checkAiRateLimit, resetAiRateLimits, upsertBlock, removeBlock } from "@/server/ai/rateLimit";
import { invalidateSettingsCache } from "@/server/settings";

afterAll(() => env.teardown());
beforeEach(() => {
  resetAiRateLimits();
  invalidateSettingsCache();
});

describe("SlidingWindow", () => {
  it("allows `limit` hits per window and reports retryAfterSeconds", () => {
    const w = new SlidingWindow(60_000);
    const t = 1_000_000;
    expect(w.check("a", 3, t).allowed).toBe(true);
    expect(w.check("a", 3, t + 1000).allowed).toBe(true);
    expect(w.check("a", 3, t + 2000)).toMatchObject({ allowed: true, remaining: 0 });
    const blocked = w.check("a", 3, t + 3000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(57);
    expect(w.check("b", 3, t + 3000).allowed).toBe(true);
    // The oldest hit leaves the window after 60 s.
    expect(w.check("a", 3, t + 60_001).allowed).toBe(true);
    expect(w.count("a", t + 60_001)).toBe(3);
  });

  it("reset clears one key or everything", () => {
    const w = new SlidingWindow(1000);
    w.check("x", 1);
    w.check("y", 1);
    w.reset("x");
    expect(w.count("x")).toBe(0);
    expect(w.count("y")).toBe(1);
    w.reset();
    expect(w.count("y")).toBe(0);
  });
});

describe("checkAiRateLimit", () => {
  it("uses the per-hour and per-day limits from env and blocks per subject", async () => {
    process.env.AI_RATE_LIMIT_PER_HOUR = "2";
    process.env.AI_RATE_LIMIT_PER_DAY = "3";
    invalidateSettingsCache();
    expect((await checkAiRateLimit("guest:abc", "10.0.0.1")).allowed).toBe(true);
    expect((await checkAiRateLimit("guest:abc", "10.0.0.1")).allowed).toBe(true);
    const third = await checkAiRateLimit("guest:abc", "10.0.0.1");
    expect(third.allowed).toBe(false);
    expect(third.reason).toBe("hour");
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
    expect((await checkAiRateLimit("guest:other", "10.0.0.1")).allowed).toBe(true);
    delete process.env.AI_RATE_LIMIT_PER_HOUR;
    delete process.env.AI_RATE_LIMIT_PER_DAY;
  });

  it("honours admin blocks from ai_abuse_blocks", async () => {
    await upsertBlock("guest:blocked", "spam", 2);
    const d = await checkAiRateLimit("guest:blocked", "10.0.0.2");
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("blocked");
    expect(d.retryAfterSeconds).toBeGreaterThan(3600);
    await removeBlock("guest:blocked");
    expect((await checkAiRateLimit("guest:blocked", "10.0.0.2")).allowed).toBe(true);
  });
});
