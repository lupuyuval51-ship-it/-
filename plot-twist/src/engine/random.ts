/**
 * Deterministic randomness: seeds, a tiny PRNG and id generation.
 * Same seed → same sequence, on every device, so draws and posters are reproducible.
 */

const TWO_POW_32 = 4294967296;
const PART_SEPARATOR = '\u001f';
const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 12;

/**
 * Hashes any mix of strings and numbers into a 32-bit unsigned seed.
 * FNV-1a over the joined parts, finished with the murmur3 avalanche so that
 * near-identical inputs ("draw-1", "draw-2") still land far apart.
 */
export function hashSeed(...parts: Array<string | number>): number {
  const text = parts.map(String).join(PART_SEPARATOR);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return avalanche(h);
}

function avalanche(h: number): number {
  let x = h;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return x >>> 0;
}

/** Mulberry32: a fast, well-distributed 32-bit PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  // Non-integer seeds (e.g. Math.random()) would all truncate to 0; hash them instead.
  let state = Number.isInteger(seed) ? seed >>> 0 : hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / TWO_POW_32;
  };
}

/** Index in [0, length) from a generator, robust to generators that return 1 or garbage. */
function randomIndex(rng: () => number, length: number): number {
  const i = Math.floor(rng() * length);
  return Number.isFinite(i) ? Math.min(length - 1, Math.max(0, i)) : 0;
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('pick() needs at least one item');
  return items[randomIndex(rng, items.length)];
}

/** Fisher–Yates shuffle into a new array; the input is left untouched. */
export function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomIndex(rng, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Cryptographic randomness when available: ids are created on many devices and must not collide. */
function secureRandom(): number {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    return c.getRandomValues(new Uint32Array(1))[0] / TWO_POW_32;
  }
  return Math.random();
}

/** e.g. makeId('run') → "run-k3x9q0b2m7aa". Pass `rng` for reproducible ids (tests, seeded flows). */
export function makeId(prefix: string, rng: () => number = secureRandom): string {
  let body = '';
  for (let i = 0; i < ID_LENGTH; i++) body += ID_ALPHABET[randomIndex(rng, ID_ALPHABET.length)];
  return prefix ? `${prefix}-${body}` : body;
}
