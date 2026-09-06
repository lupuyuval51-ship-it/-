/**
 * In-memory sliding-window rate limiter. One instance per limit "kind" (auth per IP, AI per subject…).
 * Windows live in process memory: good enough for a single Node instance; a multi-instance deployment
 * still has the DB-backed abuse blocks and the per-account daily limit as the backstop.
 */
export interface WindowCheck {
  allowed: boolean;
  remaining: number;
  /** Seconds until the oldest hit leaves the window (0 when allowed). */
  retryAfterSeconds: number;
}

export class SlidingWindow {
  private hits = new Map<string, number[]>();
  private lastSweep = Date.now();

  constructor(
    public readonly windowMs: number,
    private readonly maxEntries = 10_000,
  ) {}

  /** Records a hit when allowed. */
  check(key: string, limit: number, now = Date.now()): WindowCheck {
    this.sweep(now);
    const from = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > from);
    if (list.length >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((list[0] + this.windowMs - now) / 1000));
      this.hits.set(key, list);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    list.push(now);
    this.hits.set(key, list);
    return { allowed: true, remaining: Math.max(0, limit - list.length), retryAfterSeconds: 0 };
  }

  /** Reads the current count without recording a hit. */
  count(key: string, now = Date.now()): number {
    const from = now - this.windowMs;
    return (this.hits.get(key) ?? []).filter((t) => t > from).length;
  }

  reset(key?: string): void {
    if (key === undefined) this.hits.clear();
    else this.hits.delete(key);
  }

  private sweep(now: number): void {
    if (now - this.lastSweep < Math.min(this.windowMs, 60_000) && this.hits.size < this.maxEntries) return;
    this.lastSweep = now;
    const from = now - this.windowMs;
    for (const [key, list] of this.hits) {
      const kept = list.filter((t) => t > from);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    }
  }
}
