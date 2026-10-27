/**
 * הגבלת קצב בזיכרון (חלון נע). מתאים לשרת יחיד/Node רגיל. בפריסה serverless עם כמה מופעים
 * כדאי להחליף לאחסון משותף (Upstash Redis / Supabase) – הממשק נשאר זהה.
 */
interface Bucket {
  hits: number[];
}
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export interface LimitResult {
  ok: boolean;
  retryAfterSec: number;
  remaining: number;
}

export function hit(key: string, limit: number, windowMs: number, now = Date.now()): LimitResult {
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) if (!b.hits.length || now - b.hits[b.hits.length - 1] > 24 * 3600_000) buckets.delete(k);
  }
  const b = buckets.get(key) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) {
    buckets.set(key, b);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - b.hits[0])) / 1000)), remaining: 0 };
  }
  b.hits.push(now);
  buckets.set(key, b);
  return { ok: true, retryAfterSec: 0, remaining: limit - b.hits.length };
}

export function resetRateLimits() {
  buckets.clear();
}
