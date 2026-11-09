/** Sliding-window rate limiter keyed by client (e.g. IP). In-memory: fine for a single server process. */
export type RateDecision = { ok: true } | { ok: false; retryAfterMs: number };

export class RateLimiter {
  #hits = new Map<string, number[]>();
  #max: number;
  #windowMs: number;
  #now: () => number;

  constructor(max: number, windowMs: number, now: () => number = Date.now) {
    this.#max = max;
    this.#windowMs = windowMs;
    this.#now = now;
  }

  #fresh(key: string, now: number): number[] {
    const fresh = (this.#hits.get(key) ?? []).filter((t) => now - t < this.#windowMs);
    if (fresh.length) this.#hits.set(key, fresh);
    else this.#hits.delete(key);
    return fresh;
  }

  /** Whether a hit would be allowed now, and how long to wait when not. Records nothing. */
  check(key: string): RateDecision {
    const now = this.#now();
    const fresh = this.#fresh(key, now);
    return fresh.length >= this.#max ? { ok: false, retryAfterMs: Math.max(1_000, this.#windowMs - (now - fresh[0])) } : { ok: true };
  }

  /** Records a hit (call `check` first). */
  record(key: string): void {
    const now = this.#now();
    const fresh = this.#fresh(key, now);
    fresh.push(now);
    this.#hits.set(key, fresh);
    if (this.#hits.size > 5_000) this.#sweep(now);
  }

  /** Records a hit if allowed. Returns how long to wait when not allowed. */
  take(key: string): RateDecision {
    const decision = this.check(key);
    if (decision.ok) this.record(key);
    return decision;
  }

  #sweep(now: number) {
    for (const [key, times] of this.#hits) {
      if (times.every((t) => now - t >= this.#windowMs)) this.#hits.delete(key);
    }
  }
}

/**
 * Takes one hit from every limiter at once, or from none: a request refused by one
 * of them (a client's own limit, or its network's) uses up none of the others.
 */
export function takeAll(entries: readonly (readonly [RateLimiter, string])[]): RateDecision {
  const denied = entries.map(([limiter, key]) => limiter.check(key)).filter((d): d is { ok: false; retryAfterMs: number } => !d.ok);
  if (denied.length) return { ok: false, retryAfterMs: Math.max(...denied.map((d) => d.retryAfterMs)) };
  for (const [limiter, key] of entries) limiter.record(key);
  return { ok: true };
}
