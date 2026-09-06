/**
 * Coach rate limits: per subject (account id or guest id) per hour/day, plus a per-IP window,
 * plus admin-managed blocks from `ai_abuse_blocks`. Limits come from admin settings → env → defaults.
 * All of this is silent cost protection – the user only ever sees a calm "try again in a few minutes".
 */
import { gt, eq } from "drizzle-orm";
import { getDb, schema } from "../db/client";
import { effectiveRateLimits } from "../settings";
import { SlidingWindow } from "../util/slidingWindow";

export const hourWindow = new SlidingWindow(60 * 60 * 1000);
export const dayWindow = new SlidingWindow(24 * 60 * 60 * 1000);
export const ipWindow = new SlidingWindow(60 * 60 * 1000);

/** IPs are shared (NAT, campuses): allow a multiple of the per-subject hourly limit. */
export const IP_MULTIPLIER = 4;

export interface RateDecision {
  allowed: boolean;
  retryAfterSeconds: number;
  reason?: "blocked" | "hour" | "day" | "ip";
}

let blockCache: { at: number; subjects: Map<string, number> } | null = null;
const BLOCK_CACHE_MS = 60_000;

export function invalidateBlockCache(): void {
  blockCache = null;
}

async function activeBlocks(): Promise<Map<string, number>> {
  if (blockCache && Date.now() - blockCache.at < BLOCK_CACHE_MS) return blockCache.subjects;
  const subjects = new Map<string, number>();
  try {
    const db = await getDb();
    const rows = await db.select().from(schema.aiAbuseBlocks).where(gt(schema.aiAbuseBlocks.until, new Date()));
    for (const r of rows) subjects.set(r.subject, r.until.getTime());
  } catch {
    /* DB unavailable: no blocks */
  }
  blockCache = { at: Date.now(), subjects };
  return subjects;
}

export async function checkAiRateLimit(subject: string, ip: string): Promise<RateDecision> {
  const now = Date.now();
  const blocks = await activeBlocks();
  const blockedUntil = blocks.get(subject) ?? blocks.get(`ip:${ip}`);
  if (blockedUntil && blockedUntil > now) return { allowed: false, retryAfterSeconds: Math.ceil((blockedUntil - now) / 1000), reason: "blocked" };

  const { perHour, perDay } = await effectiveRateLimits();
  // Check without consuming first so a day-limit rejection does not burn an hour slot.
  if (dayWindow.count(subject, now) >= perDay) {
    const d = dayWindow.check(subject, perDay, now);
    return { allowed: false, retryAfterSeconds: d.retryAfterSeconds, reason: "day" };
  }
  const h = hourWindow.check(subject, perHour, now);
  if (!h.allowed) return { allowed: false, retryAfterSeconds: h.retryAfterSeconds, reason: "hour" };
  const i = ipWindow.check(`ip:${ip}`, perHour * IP_MULTIPLIER, now);
  if (!i.allowed) return { allowed: false, retryAfterSeconds: i.retryAfterSeconds, reason: "ip" };
  dayWindow.check(subject, perDay, now);
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function upsertBlock(subject: string, reason: string | null, hours: number): Promise<void> {
  const db = await getDb();
  const until = new Date(Date.now() + Math.max(1, hours) * 3600_000);
  await db
    .insert(schema.aiAbuseBlocks)
    .values({ subject, reason, until, createdAt: new Date() })
    .onConflictDoUpdate({ target: schema.aiAbuseBlocks.subject, set: { reason, until, createdAt: new Date() } });
  invalidateBlockCache();
}

export async function removeBlock(subject: string): Promise<void> {
  const db = await getDb();
  await db.delete(schema.aiAbuseBlocks).where(eq(schema.aiAbuseBlocks.subject, subject));
  invalidateBlockCache();
}

export async function listBlocks(): Promise<{ subject: string; reason: string | null; createdAt: string; until: string }[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.aiAbuseBlocks).where(gt(schema.aiAbuseBlocks.until, new Date()));
  return rows.map((r) => ({ subject: r.subject, reason: r.reason, createdAt: r.createdAt.toISOString(), until: r.until.toISOString() }));
}

/** Test helper. */
export function resetAiRateLimits(): void {
  hourWindow.reset();
  dayWindow.reset();
  ipWindow.reset();
  invalidateBlockCache();
}
