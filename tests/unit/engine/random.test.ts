import { describe, expect, it } from "vitest";
import { createRng, hashString, shortHash } from "@/engine/random";

describe("seeded PRNG", () => {
  it("is deterministic for the same seed and differs across seeds", () => {
    const a = createRng("seed-1");
    const b = createRng("seed-1");
    const c = createRng("seed-2");
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    const seqC = Array.from({ length: 10 }, () => c.next());
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int stays inside the inclusive range", () => {
    const rng = createRng(42);
    for (let i = 0; i < 500; i++) {
      const v = rng.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("shuffle is a permutation and pick returns a member", () => {
    const rng = createRng("shuffle");
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = rng.shuffle(items);
    expect(shuffled).toHaveLength(items.length);
    expect(shuffled.slice().sort((a, b) => a - b)).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(items).toContain(rng.pick(items));
  });

  it("weightedPick favours heavier items and falls back to uniform on zero weights", () => {
    const rng = createRng("weights");
    const counts = { heavy: 0, light: 0 };
    for (let i = 0; i < 400; i++) {
      const picked = rng.weightedPick(["heavy", "light"] as const, (x) => (x === "heavy" ? 9 : 1));
      counts[picked] += 1;
    }
    expect(counts.heavy).toBeGreaterThan(counts.light * 3);
    expect(["a", "b"]).toContain(rng.weightedPick(["a", "b"], () => 0));
  });

  it("hashString / shortHash are stable", () => {
    expect(hashString("disccoach")).toBe(hashString("disccoach"));
    expect(hashString("disccoach")).not.toBe(hashString("disccoach2"));
    expect(shortHash("x")).toMatch(/^[0-9a-z]+$/);
  });
});
