/**
 * Seeded pseudo-random generator (mulberry32 over a string hash).
 * Pure and environment-independent: the same seed yields the same sequence in Node and in the browser,
 * which makes engine output reproducible (`WorkoutRequest.seed`) and testable.
 */

/** 53-bit string hash (cyrb53). Returns a non-negative integer. */
export function hashString(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Short, URL-safe id fragment derived from a string (base36 of the 53-bit hash). */
export function shortHash(str: string): string {
  return hashString(str).toString(36);
}

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** Uniform pick from a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** Returns a new shuffled copy (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** Pick proportionally to `weight(item)` (weights ≤ 0 are treated as 0; falls back to uniform when all are 0). */
  weightedPick<T>(items: readonly T[], weight: (item: T) => number): T;
}

export function createRng(seed: string | number): Rng {
  let state = (typeof seed === "number" ? Math.floor(seed) : hashString(seed)) >>> 0;
  if (state === 0) state = 0x9e3779b9;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return lo + Math.floor(next() * (hi - lo + 1));
  };

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error("rng.pick: empty array");
      return items[int(0, items.length - 1)];
    },
    shuffle<T>(items: readonly T[]): T[] {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    weightedPick<T>(items: readonly T[], weight: (item: T) => number): T {
      if (items.length === 0) throw new Error("rng.weightedPick: empty array");
      const weights = items.map((it) => Math.max(0, weight(it)));
      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0) return items[int(0, items.length - 1)];
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    },
  };
}
