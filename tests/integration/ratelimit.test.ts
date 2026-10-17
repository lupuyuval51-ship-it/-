import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db, disconnectDb } from "@/server/db";
import { checkRateLimit } from "@/server/ratelimit";

afterAll(disconnectDb);

/** A unique key per test so suites never share a bucket (and never touch real data: this is the `levelup_test` database). */
const key = (name: string) => `test:${name}:${randomUUID()}`;
const T = new Date("2026-03-10T10:00:30.000Z"); // 30 s into a minute-aligned window

describe("database-backed fixed-window rate limit", () => {
  it("allows exactly `max` requests in a window, then refuses with a Retry-After", async () => {
    const k = key("basic");
    const rule = { max: 3, windowSec: 60 };
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await checkRateLimit(k, rule, T));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0, 0]);
    // 30 s of the 60 s window are left; the answer is never 0 (a client told "retry in 0 s" would hammer the endpoint)
    expect(results[3]!.retryAfterSec).toBe(30);
    expect(results[0]!.retryAfterSec).toBe(30);
  });

  it("is atomic: 40 simultaneous requests against max 10 let exactly 10 through", async () => {
    const k = key("race");
    const rule = { max: 10, windowSec: 60 };
    const results = await Promise.all(Array.from({ length: 40 }, () => checkRateLimit(k, rule, T)));
    expect(results.filter((r) => r.ok)).toHaveLength(10);
    expect(results.filter((r) => !r.ok)).toHaveLength(30);
    expect(Math.max(...results.map((r) => r.remaining))).toBeLessThanOrEqual(9);
    const row = await db.rateLimitBucket.findFirstOrThrow({ where: { key: k } });
    expect(row.count).toBe(40);
  });

  it("starts a fresh budget in the next window and keeps different keys apart", async () => {
    const a = key("a");
    const b = key("b");
    const rule = { max: 1, windowSec: 60 };
    expect((await checkRateLimit(a, rule, T)).ok).toBe(true);
    expect((await checkRateLimit(a, rule, T)).ok).toBe(false);
    expect((await checkRateLimit(b, rule, T)).ok).toBe(true); // another subject is unaffected
    const nextWindow = new Date(T.getTime() + 31_000); // 10:01:01
    expect((await checkRateLimit(a, rule, nextWindow)).ok).toBe(true);
    expect((await checkRateLimit(a, rule, nextWindow)).ok).toBe(false);
  });

  it("reports the time left in the window at its edges (first and last second)", async () => {
    const rule = { max: 1, windowSec: 600 };
    const start = new Date("2026-03-10T10:00:00.000Z");
    const last = new Date("2026-03-10T10:09:59.500Z");
    expect((await checkRateLimit(key("edge-start"), rule, start)).retryAfterSec).toBe(600);
    expect((await checkRateLimit(key("edge-last"), rule, last)).retryAfterSec).toBe(1); // rounds up, never 0
  });
});
