import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashSeed, makeId, mulberry32, pick, shuffle } from '../src/engine/random.ts';

const take = (rng: () => number, n: number) => Array.from({ length: n }, () => rng());

describe('hashSeed', () => {
  it('is deterministic and returns a 32-bit unsigned integer', () => {
    for (const parts of [[], ['a'], ['run-1', 'undercover-tourist', 'quiet-detective'], [42, 'x', -7.5]] as Array<Array<string | number>>) {
      const h = hashSeed(...parts);
      expect(hashSeed(...parts)).toBe(h);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });

  it('respects part boundaries', () => {
    expect(hashSeed('ab', 'c')).not.toBe(hashSeed('a', 'bc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('ab', 'c'));
    expect(hashSeed(1, 23)).not.toBe(hashSeed(12, 3));
  });

  it('spreads near-identical inputs without collisions', () => {
    const hashes = new Set(Array.from({ length: 2000 }, (_, i) => hashSeed('draw', i)));
    expect(hashes.size).toBe(2000);
    // The high bit should be set about half the time (avalanche check).
    const highBits = [...hashes].filter((h) => h >= 2 ** 31).length;
    expect(highBits).toBeGreaterThan(850);
    expect(highBits).toBeLessThan(1150);
  });
});

describe('mulberry32', () => {
  it('produces a reproducible sequence in [0, 1)', () => {
    const a = take(mulberry32(1234), 500);
    expect(take(mulberry32(1234), 500)).toEqual(a);
    for (const x of a) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('gives different sequences for different seeds', () => {
    expect(take(mulberry32(1), 5)).not.toEqual(take(mulberry32(2), 5));
    // Integer seeds are taken modulo 2^32.
    expect(take(mulberry32(2 ** 32), 5)).toEqual(take(mulberry32(0), 5));
  });

  it('is roughly uniform', () => {
    const rng = mulberry32(99);
    const buckets = new Array(10).fill(0);
    const n = 20_000;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const x = rng();
      sum += x;
      buckets[Math.floor(x * 10)]++;
    }
    expect(sum / n).toBeGreaterThan(0.48);
    expect(sum / n).toBeLessThan(0.52);
    for (const count of buckets) {
      expect(count).toBeGreaterThan(n / 10 - 300);
      expect(count).toBeLessThan(n / 10 + 300);
    }
  });

  it('does not collapse fractional or odd seeds onto one sequence', () => {
    expect(take(mulberry32(0.1), 3)).not.toEqual(take(mulberry32(0.2), 3));
    expect(take(mulberry32(0.1), 3)).not.toEqual(take(mulberry32(0), 3));
    expect(take(mulberry32(-1), 3)).toEqual(take(mulberry32(2 ** 32 - 1), 3));
    expect(take(mulberry32(Number.NaN), 3)).toEqual(take(mulberry32(Number.NaN), 3));
  });
});

describe('pick', () => {
  it('returns items from the list and eventually every item', () => {
    const items = ['a', 'b', 'c', 'd'] as const;
    const rng = mulberry32(5);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const x = pick(rng, items);
      expect(items).toContain(x);
      seen.add(x);
    }
    expect(seen.size).toBe(items.length);
  });

  it('is reproducible for a seed', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect(Array.from({ length: 20 }, () => pick(a, items))).toEqual(Array.from({ length: 20 }, () => pick(b, items)));
  });

  it('throws on an empty list and survives generators that return 1', () => {
    expect(() => pick(mulberry32(1), [])).toThrow(RangeError);
    expect(pick(() => 1, ['x', 'y', 'z'])).toBe('z');
    expect(pick(() => Number.NaN, ['x', 'y'])).toBe('x');
  });
});

describe('shuffle', () => {
  it('returns a new permutation and leaves the input untouched', () => {
    const input = Object.freeze(Array.from({ length: 20 }, (_, i) => i));
    const out = shuffle(mulberry32(3), input);
    expect(out).not.toBe(input);
    expect([...out].sort((a, b) => a - b)).toEqual([...input]);
    expect(out).not.toEqual([...input]);
  });

  it('is reproducible per seed and varies across seeds', () => {
    const input = Array.from({ length: 10 }, (_, i) => i);
    expect(shuffle(mulberry32(11), input)).toEqual(shuffle(mulberry32(11), input));
    const orders = new Set(Array.from({ length: 20 }, (_, seed) => shuffle(mulberry32(seed), input).join(',')));
    expect(orders.size).toBeGreaterThan(15);
  });

  it('handles tiny inputs and bad generators', () => {
    expect(shuffle(mulberry32(1), [])).toEqual([]);
    expect(shuffle(mulberry32(1), ['only'])).toEqual(['only']);
    expect([...shuffle(() => 1, [1, 2, 3])].sort()).toEqual([1, 2, 3]);
  });
});

describe('makeId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('formats prefix-body ids', () => {
    expect(makeId('run')).toMatch(/^run-[0-9a-z]{12}$/);
    expect(makeId('')).toMatch(/^[0-9a-z]{12}$/);
  });

  it('is reproducible with a seeded generator', () => {
    expect(makeId('draw', mulberry32(42))).toBe(makeId('draw', mulberry32(42)));
    expect(makeId('draw', mulberry32(42))).not.toBe(makeId('draw', mulberry32(43)));
  });

  it('does not collide in practice', () => {
    const ids = new Set(Array.from({ length: 5000 }, () => makeId('run')));
    expect(ids.size).toBe(5000);
  });

  it('falls back to Math.random when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(makeId('run')).toMatch(/^run-[0-9a-z]{12}$/);
  });
});
