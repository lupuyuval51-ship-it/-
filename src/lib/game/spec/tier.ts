/**
 * Feature tiers applied to a finished game.
 *
 * A game is built at one tier (C, B or A, see `TIER_FEATURES` in `src/config/plans.ts`). Whatever produced the game
 * (a model, a template, the study engine, an edit) may include things the tier does not have; this module removes
 * them and repairs everything that pointed at them (stations, missions, requirements, portals, reactions, boss phases),
 * then validates the result with the normal gate. Nothing here trusts the producer: a tier is enforced on the saved
 * game itself, so it cannot be bypassed from the browser.
 */
import { FEATURE_TIERS, TIER_FEATURES, TIER_MAX_AREAS, tierHas, type FeatureTier, type GameFeature } from "@/config/plans";
import type { ChallengeType, GameType, Mechanic } from "./constants";
import type { GameSpec } from "./schema";
import { validateGameSpec } from "./validate";

const CHALLENGE_FEATURE: Record<ChallengeType, GameFeature> = {
  choice: "challenge:choice", numeric: "challenge:numeric", sequence: "challenge:sequence", match: "challenge:match", program: "challenge:program", simulation: "challenge:simulation",
};

const MECHANIC_FEATURE: Partial<Record<Mechanic, GameFeature>> = {
  collect: "system:collect", dialogue: "system:dialogue", checkpoints: "system:checkpoints", hazards: "system:hazards",
  timed_bonus: "system:timed_bonus", adaptive_difficulty: "system:adaptive_difficulty", portals: "system:multi_area",
};

/** Adventures are the multi-area stories; every other type is its own feature. */
export function gameTypeFeature(type: GameType): GameFeature {
  return type === "adventure" ? "system:multi_area" : (`type:${type}` as GameFeature);
}
export const gameTypeAllowed = (tier: FeatureTier, type: GameType): boolean => tierHas(tier, gameTypeFeature(type));
/** A Full Adventure and an extension both add areas, so they need multi-area. Fast games are single-area. */
export const modeAllowed = (tier: FeatureTier, mode: "FAST" | "FULL" | "EXTEND"): boolean => mode === "FAST" || tierHas(tier, "system:multi_area");
export const challengeTypeAllowed = (tier: FeatureTier, type: ChallengeType): boolean => tierHas(tier, CHALLENGE_FEATURE[type]);
export const maxAreasFor = (tier: FeatureTier): number => (tierHas(tier, "system:multi_area") ? TIER_MAX_AREAS[tier] : 1);

/** The fuller of two tiers (C < B < A). */
export const maxTier = (a: FeatureTier, b: FeatureTier): FeatureTier => (FEATURE_TIERS.indexOf(a) >= FEATURE_TIERS.indexOf(b) ? a : b);

export type ClampResult =
  | { ok: true; spec: GameSpec; /** Features the producer included that this tier does not have (and which were taken out). */ removed: GameFeature[]; notes: string[] }
  | { ok: false; errors: string[] };

export function clampToFeatureTier(base: GameSpec, tier: FeatureTier): ClampResult {
  if (!gameTypeAllowed(tier, base.meta.gameType)) {
    return { ok: false, errors: [`the game type "${base.meta.gameType}" is not part of tier ${tier}`] };
  }
  const spec = structuredClone(base);
  const removed = new Set<GameFeature>();
  const notes: string[] = [];
  const drop = (feature: GameFeature, note: string) => {
    removed.add(feature);
    notes.push(note);
  };
  const has = (f: GameFeature) => tierHas(tier, f);

  // ── helpers that remove something and repair what pointed at it
  const removeMissions = (ids: Set<string>) => {
    if (ids.size === 0) return;
    spec.missions = spec.missions.filter((m) => !ids.has(m.id));
    for (const m of spec.missions) m.requires = m.requires.filter((r) => !ids.has(r));
    for (const a of spec.areas) {
      if (a.portal) a.portal.requiresMissionIds = a.portal.requiresMissionIds.filter((r) => !ids.has(r));
      for (const n of a.npcs) n.reactions = n.reactions.filter((r) => !ids.has(r.afterMissionId));
    }
  };
  const removeEmptyMissions = () => {
    for (let guard = 0; guard < 10; guard++) {
      const empty = new Set(spec.missions.filter((m) => m.objectives.length === 0).map((m) => m.id));
      if (empty.size === 0) return;
      removeMissions(empty);
    }
  };
  const removeBosses = (ids: Set<string>) => {
    if (ids.size === 0) return;
    spec.bosses = spec.bosses.filter((b) => !ids.has(b.id));
    for (const m of spec.missions) m.objectives = m.objectives.filter((o) => !(o.type === "defeat" && ids.has(o.bossId)));
    removeEmptyMissions();
  };
  const removeChallenges = (wanted: Set<string>) => {
    if (wanted.size === 0) return;
    // A variant only exists to stand in for its base challenge, so it goes with it.
    const ids = new Set(wanted);
    for (let grow = true; grow;) {
      grow = false;
      for (const c of spec.challenges) {
        if (!ids.has(c.id)) continue;
        for (const v of [c.easierId, c.harderId]) if (v && !ids.has(v)) { ids.add(v); grow = true; }
      }
    }
    spec.challenges = spec.challenges.filter((c) => !ids.has(c.id));
    for (const c of spec.challenges) {
      if (c.easierId && ids.has(c.easierId)) delete c.easierId;
      if (c.harderId && ids.has(c.harderId)) delete c.harderId;
    }
    const goneStations = new Set<string>();
    for (const a of spec.areas) {
      a.stations = a.stations.filter((s) => {
        const gone = s.kind === "challenge" && Boolean(s.challengeId) && ids.has(s.challengeId!);
        if (gone) goneStations.add(s.id);
        return !gone;
      });
    }
    for (const m of spec.missions) {
      m.objectives = m.objectives
        .map((o) => (o.type === "solve" ? { ...o, challengeIds: o.challengeIds.filter((id) => !ids.has(id)) } : o))
        .filter((o) => !(o.type === "solve" && o.challengeIds.length === 0));
    }
    // a boss keeps only the rounds that still exist; fewer than two is no battle
    const small = new Set<string>();
    for (const b of spec.bosses) {
      b.phaseStationIds = b.phaseStationIds.filter((id) => !goneStations.has(id));
      if (b.phaseStationIds.length < 2) small.add(b.id);
    }
    removeBosses(small);
    removeEmptyMissions();
  };

  // ── 1. how many areas
  const maxAreas = maxAreasFor(tier);
  if (spec.areas.length > maxAreas) {
    const keepIds = new Set<string>();
    let cur: GameSpec["areas"][number] | undefined = spec.areas[0];
    while (cur && keepIds.size < maxAreas && !keepIds.has(cur.id)) {
      keepIds.add(cur.id);
      const next: string | undefined = cur.portal?.toAreaId;
      cur = spec.areas.find((a) => a.id === next);
    }
    for (const a of spec.areas) if (keepIds.size < maxAreas && !keepIds.has(a.id)) keepIds.add(a.id);
    const gone = spec.areas.filter((a) => !keepIds.has(a.id));
    const goneChallenges = new Set(gone.flatMap((a) => a.stations.map((s) => s.challengeId).filter((id): id is string => Boolean(id))));
    spec.areas = spec.areas.filter((a) => keepIds.has(a.id));
    for (const a of spec.areas) if (a.portal && !keepIds.has(a.portal.toAreaId)) delete a.portal;
    const goneAreaIds = new Set(gone.map((a) => a.id));
    removeMissions(new Set(spec.missions.filter((m) => goneAreaIds.has(m.areaId)).map((m) => m.id)));
    removeBosses(new Set(spec.bosses.filter((b) => goneAreaIds.has(b.areaId)).map((b) => b.id)));
    removeChallenges(goneChallenges);
    notes.push(`tier ${tier} allows ${maxAreas} area${maxAreas === 1 ? "" : "s"}: ${gone.length} later area${gone.length === 1 ? "" : "s"} left out`);
    if (maxAreas === 1) removed.add("system:multi_area");
  }

  // ── 2. which questions
  const typeGone = new Set(spec.challenges.filter((c) => !has(CHALLENGE_FEATURE[c.type])).map((c) => c.id));
  if (typeGone.size) {
    for (const c of spec.challenges) if (typeGone.has(c.id)) removed.add(CHALLENGE_FEATURE[c.type]);
    removeChallenges(typeGone);
    notes.push(`${typeGone.size} challenge${typeGone.size === 1 ? "" : "s"} of a type outside tier ${tier} left out`);
  }

  // ── 3. which systems
  if (!has("system:adaptive_difficulty")) {
    const variants = new Set(spec.challenges.flatMap((c) => [c.easierId, c.harderId]).filter((id): id is string => Boolean(id)));
    if (variants.size) {
      removeChallenges(variants);
      drop("system:adaptive_difficulty", "adaptive difficulty variants left out");
    }
  }
  if (!has("system:timed_bonus") && spec.challenges.some((c) => c.timeLimitSec)) {
    for (const c of spec.challenges) delete c.timeLimitSec;
    drop("system:timed_bonus", "time limits left out");
  }
  if (!has("system:boss") && spec.bosses.length) {
    removeBosses(new Set(spec.bosses.map((b) => b.id)));
    drop("system:boss", "boss battle left out");
  }
  if (!has("system:reactions") && spec.areas.some((a) => a.npcs.some((n) => n.reactions.length))) {
    for (const a of spec.areas) for (const n of a.npcs) n.reactions = [];
    drop("system:reactions", "character reactions left out");
  }
  if (!has("system:side_missions") && spec.missions.some((m) => m.optional)) {
    removeMissions(new Set(spec.missions.filter((m) => m.optional).map((m) => m.id)));
    drop("system:side_missions", "side missions left out");
  }
  if (!has("system:hazards") && spec.areas.some((a) => a.hazardLevel !== "none")) {
    for (const a of spec.areas) a.hazardLevel = "none";
    drop("system:hazards", "hazards left out");
  }
  const mechanics = spec.mechanics.filter((m) => {
    const f = MECHANIC_FEATURE[m];
    return !f || has(f);
  });
  if (mechanics.length !== spec.mechanics.length) spec.mechanics = mechanics;

  // ── 4. the result must still be a game
  if (spec.missions.length === 0) return { ok: false, errors: ["nothing is left of the game's missions at this tier"] };
  const checked = validateGameSpec(spec, { alignGameType: spec.meta.gameType });
  if (!checked.ok) return { ok: false, errors: checked.errors };
  checked.spec.meta.generator = base.meta.generator;
  checked.spec.meta.featureTier = tier;
  return { ok: true, spec: checked.spec, removed: [...removed], notes };
}

export { TIER_FEATURES };
