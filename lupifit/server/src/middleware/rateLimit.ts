/**
 * In-memory fixed-window rate limiter. Suitable for a single instance; for multiple
 * instances put a shared limiter (Redis / API gateway / WAF) in front — see README.
 * Per-user daily quotas for expensive AI calls are additionally enforced in the database.
 */
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { tooManyRequests } from '../lib/errors';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

/** Consumes one unit; returns seconds until reset when the limit is exceeded, else 0. */
export function consume(key: string, limit: number, windowMs: number, now = Date.now()): number {
  sweep(now);
  const effective = Math.max(1, Math.floor(limit * config.rateLimit.multiplier));
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return 0;
  }
  b.count += 1;
  if (b.count > effective) return (b.resetAt - now) / 1000;
  return 0;
}

export function resetRateLimits() {
  buckets.clear();
}

export function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

export interface RateLimitOptions {
  name: string;
  limit: number;
  windowMs: number;
  /** Defaults to the authenticated user id, falling back to IP. */
  key?: (req: Request) => string;
}

export function rateLimit(opts: RateLimitOptions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!config.rateLimit.enabled) return next();
    const k = opts.key ? opts.key(req) : req.auth ? `u:${req.auth.user.id}` : `ip:${clientIp(req)}`;
    const wait = consume(`${opts.name}:${k}`, opts.limit, opts.windowMs);
    if (wait > 0) return next(tooManyRequests(wait));
    next();
  };
}

/** Throws 429 if the key exceeded the limit (for use inside handlers). */
export function enforceRateLimit(name: string, key: string, limit: number, windowMs: number) {
  if (!config.rateLimit.enabled) return;
  const wait = consume(`${name}:${key}`, limit, windowMs);
  if (wait > 0) throw tooManyRequests(wait);
}
