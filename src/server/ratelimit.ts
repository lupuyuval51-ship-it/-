import "server-only";
import { db } from "./db";

export interface RateLimitRule {
  readonly max: number;
  readonly windowSec: number;
}
export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Fixed-window counter stored in PostgreSQL, so limits hold across processes and instances.
 * One atomic upsert per check — there is no read-then-write race.
 */
export async function checkRateLimit(key: string, rule: RateLimitRule, now = new Date()): Promise<RateLimitResult> {
  const windowMs = rule.windowSec * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimitBucket"."count" + 1
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  if (Math.random() < 0.01) {
    // Opportunistic cleanup keeps the table small without a scheduler.
    void db.rateLimitBucket.deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - 24 * 3600 * 1000) } } }).catch(() => undefined);
  }
  return {
    ok: count <= rule.max,
    remaining: Math.max(0, rule.max - count),
    retryAfterSec: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000)),
  };
}
