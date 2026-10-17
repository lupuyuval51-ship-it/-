import { describe, expect, it } from "vitest";
import { addFinalBoss } from "@/lib/game/spec/boss";
import type { GameSpec } from "@/lib/game/spec/schema";
import { clampToFeatureTier, gameTypeAllowed } from "@/lib/game/spec/tier";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { demoCorpus, engineCorpus } from "@/lib/game/sim-balance/corpus";
import { hashSeed, mulberry32 } from "@/lib/game/util/prng";
import { playThrough } from "@/lib/game/world/flow";

const ids = (s: GameSpec) => ({
  areas: s.areas.map((a) => a.id),
  stations: s.areas.flatMap((a) => a.stations.map((x) => x.id)),
  missions: s.missions.map((m) => m.id),
  challenges: s.challenges.map((c) => c.id),
  bosses: s.bosses.map((b) => b.id),
});

describe("clampToFeatureTier: property tests over the corpus, with doors and shuffled stations", () => {
  const rnd = mulberry32(hashSeed("tier-property"));
  const variants: { id: string; spec: GameSpec }[] = [];
  for (const c of [...demoCorpus(), ...engineCorpus()]) {
    const base = addFinalBoss(c.spec).spec;
    variants.push({ id: c.id, spec: base });
    const doors = structuredClone(base);
    doors.mechanics = [...new Set([...doors.mechanics, "gates" as const])];
    for (const a of doors.areas) {
      a.layout = "rooms";
      a.stations.sort(() => rnd() - 0.5);
    }
    const checked = validateGameSpec(doors);
    if (checked.ok) variants.push({ id: `${c.id}+doors`, spec: checked.spec });
  }

  it("B and C results are valid, finishable, never reference anything that was removed, and only ever lose things relative to A", () => {
    let clamped = 0;
    for (const v of variants) {
      const a = clampToFeatureTier(v.spec, "A");
      expect(a.ok, v.id).toBe(true);
      if (!a.ok) continue;
      for (const tier of ["B", "C"] as const) {
        if (!gameTypeAllowed(tier, v.spec.meta.gameType)) continue;
        const res = clampToFeatureTier(v.spec, tier);
        if (!res.ok) {
          expect(res.errors.length, `${v.id}@${tier}`).toBeGreaterThan(0);
          continue;
        }
        clamped += 1;
        const out = ids(res.spec);
        const full = ids(a.spec);
        for (const k of Object.keys(out) as (keyof typeof out)[]) {
          for (const id of out[k]) expect(full[k], `${v.id}@${tier}: ${k} ${id} is not in the full game`).toContain(id);
        }
        // no dangling references: the clamped game passes the same gate every other game does, and can be played to the end
        expect(validateGameSpec(res.spec, { alignGameType: res.spec.meta.gameType }).ok, `${v.id}@${tier} revalidates`).toBe(true);
        expect(playThrough(res.spec, "check").finished, `${v.id}@${tier} finishable`).toBe(true);
        // a lower tier never has more than a higher one
        expect(res.spec.challenges.length).toBeLessThanOrEqual(a.spec.challenges.length);
        expect(res.spec.bosses.length).toBeLessThanOrEqual(a.spec.bosses.length);
        expect(res.spec.areas.length).toBeLessThanOrEqual(a.spec.areas.length);
      }
    }
    expect(clamped).toBeGreaterThan(40);
  });
});
