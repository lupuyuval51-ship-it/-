import { describe, expect, it } from "vitest";
import { addFinalBoss } from "@/lib/game/spec/boss";
import { clampToFeatureTier, gameTypeAllowed } from "@/lib/game/spec/tier";
import type { GameSpec } from "@/lib/game/spec/schema";
import { demoCorpus, engineCorpus } from "@/lib/game/sim-balance/corpus";

/**
 * Algebraic laws of `clampToFeatureTier`. They matter because a game is clamped more than once in its life: when it is generated,
 * when an edit is saved, when a plan changes and the game is extended, and on the phone. If clamping were not idempotent, saving a
 * game twice could change it; if clamping twice differed from clamping once, a downgrade-then-edit path could drift.
 */
const items = [...engineCorpus(), ...demoCorpus()].map((c) => ({ id: c.id, spec: addFinalBoss(c.spec).spec }));
const clamp = (spec: GameSpec, tier: "A" | "B" | "C") => {
  const r = clampToFeatureTier(spec, tier);
  return r.ok ? r.spec : null;
};

describe("clampToFeatureTier laws", () => {
  it("is idempotent: clamping an already clamped game changes nothing, at every tier", () => {
    let checked = 0;
    for (const { id, spec } of items) {
      for (const tier of ["A", "B", "C"] as const) {
        const once = clamp(spec, tier);
        if (!once) continue;
        const twice = clamp(once, tier);
        expect(twice, `${id}@${tier} clamps again`).not.toBeNull();
        expect(twice, `${id}@${tier} second clamp is a no-op`).toEqual(once);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(30);
  });

  it("tier A is the identity apart from recording the tier", () => {
    for (const { id, spec } of items) {
      const a = clamp(spec, "A");
      expect(a, id).not.toBeNull();
      const withoutTier = (g: GameSpec) => ({ ...g, meta: { ...g.meta, featureTier: undefined } });
      expect(withoutTier(a!), id).toEqual(withoutTier(spec));
      expect(a!.meta.featureTier, id).toBe("A");
    }
  });

  it("never mutates its input", () => {
    for (const { id, spec } of items.slice(0, 40)) {
      const before = structuredClone(spec);
      for (const tier of ["A", "B", "C"] as const) clamp(spec, tier);
      expect(spec, id).toEqual(before);
    }
  });

  it("clamping down in two steps (A to B to C) ends inside tier C and keeps nothing a direct clamp to C would not keep", () => {
    let checked = 0;
    for (const { id, spec } of items) {
      if (!gameTypeAllowed("C", spec.meta.gameType)) continue;
      const direct = clamp(spec, "C");
      const viaB = clamp(spec, "B");
      const stepped = viaB ? clamp(viaB, "C") : null;
      if (!direct || !stepped) continue;
      const has = (s: GameSpec) => ({
        areas: s.areas.map((a) => a.id), challenges: s.challenges.map((c) => c.id), missions: s.missions.map((m) => m.id), bosses: s.bosses.map((b) => b.id),
      });
      const d = has(direct);
      const st = has(stepped);
      for (const k of Object.keys(d) as (keyof typeof d)[]) for (const x of st[k]) expect(d[k], `${id}: ${k} ${x} survives the two-step clamp but not the direct one`).toContain(x);
      expect(stepped.meta.featureTier).toBe("C");
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });
});
