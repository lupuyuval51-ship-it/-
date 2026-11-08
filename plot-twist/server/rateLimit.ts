/** Sliding-window rate limiter keyed by client (e.g. IP). In-memory: fine for a single server process. */
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

  /** Records a hit if allowed. Returns how long to wait when not allowed. */
  take(key: string): { ok: true } | { ok: false; retryAfterMs: number } {
    const now = this.#now();
    const fresh = (this.#hits.get(key) ?? []).filter((t) => now - t < this.#windowMs);
    if (fresh.length >= this.#max) {
      this.#hits.set(key, fresh);
      return { ok: false, retryAfterMs: Math.max(1_000, this.#windowMs - (now - fresh[0])) };
    }
    fresh.push(now);
    this.#hits.set(key, fresh);
    if (this.#hits.size > 5_000) this.#sweep(now);
    return { ok: true };
  }

  #sweep(now: number) {
    for (const [key, times] of this.#hits) {
      if (times.every((t) => now - t >= this.#windowMs)) this.#hits.delete(key);
    }
  }
}
