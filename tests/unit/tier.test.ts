import { describe, expect, it } from "vitest";
import { GAME_FEATURES, PLANS, TIER_FEATURES, TIER_MAX_AREAS, featureShare, planUnlocking, tierHas, type FeatureTier, type GameFeature } from "@/config/plans";
import { addFinalBoss } from "@/lib/game/spec/boss";
import { CHALLENGE_TYPES } from "@/lib/game/spec/constants";
import type { GameSpec } from "@/lib/game/spec/schema";
import { challengeTypeAllowed, clampToFeatureTier, gameTypeAllowed, gameTypeFeature, maxAreasFor, modeAllowed } from "@/lib/game/spec/tier";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { SKILLS, playGame } from "@/lib/game/sim-balance/bot";
import { demoCorpus, engineCorpus } from "@/lib/game/sim-balance/corpus";
import { validDemoSpec } from "./helpers";

const TIERS: FeatureTier[] = ["C", "B", "A"];

describe("feature tiers (the promise: C 40 %, B 70 %, A 100 % of the game's features)", () => {
  it("exposes exactly 40 / 70 / 100 percent of the features, each tier containing the one below", () => {
    expect(GAME_FEATURES.length).toBe(20);
    expect(featureShare("C")).toBe(40);
    expect(featureShare("B")).toBe(70);
    expect(featureShare("A")).toBe(100);
    for (const f of TIER_FEATURES.C) expect(TIER_FEATURES.B).toContain(f);
    for (const f of TIER_FEATURES.B) expect(TIER_FEATURES.A).toContain(f);
    expect(new Set(GAME_FEATURES).size).toBe(GAME_FEATURES.length);
  });

  it("every plan has a tier: Free → C, Plus → B, Pro → A; Free makes up to 2 games", () => {
    expect(PLANS.FREE.featureTier).toBe("C");
    expect(PLANS.PLUS.featureTier).toBe("B");
    expect(PLANS.PRO.featureTier).toBe("A");
    expect(PLANS.FREE.gamesPerPeriod).toBe(2);
    expect(PLANS.FREE.monthlyPrices.USD).toBe(0);
  });

  it("names the plan that unlocks a feature", () => {
    expect(planUnlocking("challenge:choice")).toBe("FREE");
    expect(planUnlocking("type:platformer")).toBe("PLUS");
    expect(planUnlocking("system:side_missions")).toBe("PLUS");
    expect(planUnlocking("system:boss")).toBe("PRO");
    expect(planUnlocking("challenge:program")).toBe("PRO");
  });

  it("game types, modes, challenge types and area counts follow the tier", () => {
    expect(gameTypeAllowed("C", "exploration")).toBe(true);
    expect(gameTypeAllowed("C", "puzzle")).toBe(true);
    expect(gameTypeAllowed("C", "platformer")).toBe(false);
    expect(gameTypeAllowed("C", "adventure")).toBe(false);
    expect(gameTypeAllowed("B", "platformer")).toBe(true);
    expect(gameTypeAllowed("B", "adventure")).toBe(true);
    expect(gameTypeAllowed("B", "simulation")).toBe(false);
    expect(gameTypeAllowed("A", "simulation")).toBe(true);
    expect(gameTypeFeature("adventure")).toBe("system:multi_area");
    expect(modeAllowed("C", "FAST")).toBe(true);
    expect(modeAllowed("C", "FULL")).toBe(false);
    expect(modeAllowed("C", "EXTEND")).toBe(false);
    expect(modeAllowed("B", "FULL")).toBe(true);
    expect(CHALLENGE_TYPES.filter((t) => challengeTypeAllowed("C", t))).toEqual(["choice", "numeric", "sequence"]);
    expect(CHALLENGE_TYPES.filter((t) => challengeTypeAllowed("B", t))).toEqual(["choice", "numeric", "sequence", "match"]);
    expect(CHALLENGE_TYPES.filter((t) => challengeTypeAllowed("A", t))).toEqual([...CHALLENGE_TYPES]);
    expect([maxAreasFor("C"), maxAreasFor("B"), maxAreasFor("A")]).toEqual([1, TIER_MAX_AREAS.B, TIER_MAX_AREAS.A]);
  });
});

/** Everything a game contains, as features, so a test can check a clamped game stays inside its tier. */
function featuresOf(spec: GameSpec): Set<GameFeature> {
  const out = new Set<GameFeature>();
  for (const c of spec.challenges) out.add(`challenge:${c.type}` as GameFeature);
  if (spec.areas.length > 1) out.add("system:multi_area");
  if (spec.bosses.length) out.add("system:boss");
  if (spec.missions.some((m) => m.optional)) out.add("system:side_missions");
  if (spec.areas.some((a) => a.npcs.some((n) => n.reactions.length))) out.add("system:reactions");
  if (spec.areas.some((a) => a.hazardLevel !== "none")) out.add("system:hazards");
  if (spec.challenges.some((c) => c.timeLimitSec)) out.add("system:timed_bonus");
  if (spec.challenges.some((c) => c.easierId || c.harderId)) out.add("system:adaptive_difficulty");
  for (const m of spec.mechanics) {
    const map: Record<string, GameFeature> = { collect: "system:collect", dialogue: "system:dialogue", checkpoints: "system:checkpoints", hazards: "system:hazards", timed_bonus: "system:timed_bonus", adaptive_difficulty: "system:adaptive_difficulty", portals: "system:multi_area" };
    if (map[m]) out.add(map[m]!);
  }
  return out;
}

describe("clampToFeatureTier on every game in the corpus", () => {
  const items = [...engineCorpus(), ...demoCorpus()].map((c) => ({ ...c, spec: addFinalBoss(c.spec).spec }));

  for (const tier of TIERS) {
    it(`tier ${tier}: the result stays inside the tier, is valid and can be finished by a perfect player`, () => {
      let produced = 0;
      for (const item of items) {
        if (!gameTypeAllowed(tier, item.spec.meta.gameType)) continue;
        const res = clampToFeatureTier(item.spec, tier);
        expect(res.ok, `${item.id}: ${res.ok ? "" : res.errors.join("; ")}`).toBe(true);
        if (!res.ok) continue;
        produced += 1;
        const spec = res.spec;
        expect(spec.meta.featureTier).toBe(tier);
        expect(spec.meta.generator).toEqual(item.spec.meta.generator);
        for (const f of featuresOf(spec)) expect(tierHas(tier, f), `${item.id}: ${f} is outside tier ${tier}`).toBe(true);
        expect(spec.areas.length, item.id).toBeLessThanOrEqual(maxAreasFor(tier));
        expect(validateGameSpec(spec, { alignGameType: spec.meta.gameType }).ok, item.id).toBe(true);
        expect(playGame(spec, SKILLS.find((s) => s.id === "perfect")!, "tier").finished, `${item.id} finishable at ${tier}`).toBe(true);
      }
      expect(produced).toBeGreaterThan(5);
    });
  }

  it("tier A keeps everything (only the tier is recorded)", () => {
    for (const item of items.slice(0, 12)) {
      const res = clampToFeatureTier(item.spec, "A");
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.removed).toEqual([]);
        expect(res.spec.challenges.length).toBe(item.spec.challenges.length);
        expect(res.spec.bosses.length).toBe(item.spec.bosses.length);
        expect(res.spec.areas.length).toBe(item.spec.areas.length);
      }
    }
  });

  it("lower tiers really take things out: a Full Adventure with a boss loses it (and its mission) at B and C", () => {
    const base = addFinalBoss(validDemoSpec({ gameType: "adventure", mode: "FULL", subject: "Fractions" })).spec;
    expect(base.bosses.length).toBe(1);
    const b = clampToFeatureTier(base, "B");
    expect(b.ok).toBe(true);
    if (b.ok) {
      expect(b.spec.bosses).toEqual([]);
      expect(b.spec.missions.some((m) => m.objectives.some((o) => o.type === "defeat"))).toBe(false);
      expect(b.removed).toContain("system:boss");
      expect(b.spec.areas.length).toBeLessThanOrEqual(2);
    }
    // a Full Adventure is not a game type of tier C at all (it needs multi-area): the producer must ask for a single-area type
    const c = clampToFeatureTier(base, "C");
    expect(c.ok).toBe(false);
  });

  it("an exploration game clamps down to one area at tier C", () => {
    const base = validDemoSpec({ gameType: "exploration", mode: "FULL", subject: "Fractions" });
    const c = clampToFeatureTier(base, "C");
    expect(c.ok).toBe(true);
    if (c.ok) expect(c.spec.areas.length).toBe(1);
  });
});
