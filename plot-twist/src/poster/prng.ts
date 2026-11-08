/**
 * Deterministic randomness for the poster renderer.
 *
 * A local mulberry32 + string hash (no dependency on src/engine/random.ts), so
 * the same PosterInput always produces the same poster, byte for byte.
 */

export type Rng = () => number;

/** murmur3 finalizer — spreads every input bit across the output. */
function fmix32(input: number): number {
  let h = input >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** 32-bit unsigned hash of a string (FNV-1a over UTF-16 code units, then fmix32). */
export function hashString(text: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return fmix32(h);
}

/** Hash of several parts; order matters and parts never run together ("ab","c" ≠ "a","bc"). */
export function hashParts(...parts: ReadonlyArray<string | number | boolean | null | undefined>): number {
  let h = 0x9e3779b9;
  for (const part of parts) h = hashString(`${String(part)}␟`, h);
  return h;
}

/** mulberry32 — small, fast, good enough for art. Returns floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An independent stream derived from a parent seed and a label (adding draws to one stream never shifts another). */
export function stream(seed: number, label: string): Rng {
  return mulberry32(hashParts(seed, label));
}

/** Uniform float in [min, max). */
export function range(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

/** Uniform integer in [min, max] (inclusive). */
export function int(rng: Rng, min: number, max: number): number {
  return Math.min(max, Math.floor(min + (max - min + 1) * rng()));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

/** Symmetric value in (-1, 1), peaked at 0 (sum of two uniforms). */
export function signedTri(rng: Rng): number {
  return rng() + rng() - 1;
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Hash → [0, 1). Handy to turn text (e.g. choice labels) into a stable variation value. */
export function unitHash(...parts: ReadonlyArray<string | number | boolean | null | undefined>): number {
  return hashParts(...parts) / 4294967296;
}
