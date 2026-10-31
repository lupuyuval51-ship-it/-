/**
 * Registry of gameplay mechanics the runtime actually implements, and which layouts can express them.
 * A spec may only switch on mechanics from this registry (enforced by the schema enum), and
 * `verifyMechanics` reports which of them will really take effect for the chosen layouts.
 */
import type { GameSpec } from "./schema";
import type { GameType, Layout, Mechanic } from "./constants";

export interface MechanicInfo {
  id: Mechanic;
  /** Layouts whose world builder implements this mechanic. */
  layouts: readonly Layout[];
  description: string;
}

const ALL: readonly Layout[] = ["plaza", "corridor", "rooms", "terraces", "lab"];

export const MECHANIC_REGISTRY: Readonly<Record<Mechanic, MechanicInfo>> = {
  collect: { id: "collect", layouts: ALL, description: "Collectible items placed around each area." },
  dialogue: { id: "dialogue", layouts: ALL, description: "Talk to NPCs for story, hints and objectives." },
  jump: { id: "jump", layouts: ALL, description: "Jump physics (always on in platformer worlds)." },
  hazards: { id: "hazards", layouts: ["terraces", "plaza"], description: "Danger zones that send the player back to a checkpoint." },
  checkpoints: { id: "checkpoints", layouts: ["terraces", "plaza", "corridor"], description: "Respawn points that are remembered between sessions." },
  moving_platforms: { id: "moving_platforms", layouts: ["terraces"], description: "Platforms that slide between gaps and carry the player." },
  gates: { id: "gates", layouts: ["rooms", "corridor"], description: "Doors that open when the station before them is resolved." },
  portals: { id: "portals", layouts: ALL, description: "Doorways that travel between areas." },
  timed_bonus: { id: "timed_bonus", layouts: ALL, description: "Bonus points for answering timed challenges quickly." },
  adaptive_difficulty: { id: "adaptive_difficulty", layouts: ALL, description: "Easier/harder challenge variants chosen from the player's performance." },
};

/** Mechanics that the content itself requires, so they are switched on automatically. */
export function impliedMechanics(spec: Pick<GameSpec, "areas" | "challenges">): Mechanic[] {
  const out = new Set<Mechanic>();
  if (spec.areas.some((a) => a.collectibles.count > 0)) out.add("collect");
  if (spec.areas.some((a) => a.npcs.length > 0)) out.add("dialogue");
  if (spec.areas.length > 1 || spec.areas.some((a) => a.portal)) out.add("portals");
  if (spec.areas.some((a) => a.layout === "terraces")) {
    out.add("jump");
    out.add("checkpoints");
  }
  if (spec.challenges.some((c) => c.timeLimitSec)) out.add("timed_bonus");
  if (spec.challenges.some((c) => c.easierId || c.harderId)) out.add("adaptive_difficulty");
  return [...out];
}

export interface MechanicsReport {
  /** Mechanics that will be active in at least one area. */
  active: Mechanic[];
  /** Declared mechanics that none of the chosen layouts can express: they have no effect. */
  ignored: { mechanic: Mechanic; reason: string }[];
}

export function verifyMechanics(spec: Pick<GameSpec, "areas" | "mechanics" | "challenges">): MechanicsReport {
  const declared = new Set<Mechanic>([...spec.mechanics, ...impliedMechanics(spec)]);
  const active: Mechanic[] = [];
  const ignored: MechanicsReport["ignored"] = [];
  for (const m of declared) {
    const info = MECHANIC_REGISTRY[m];
    if (spec.areas.some((a) => info.layouts.includes(a.layout))) active.push(m);
    else ignored.push({ mechanic: m, reason: `no area uses a layout that supports "${m}" (${info.layouts.join(", ")})` });
  }
  return { active, ignored };
}

/** Which mechanics apply in a given area (used by the world builder and the runtime). */
export function mechanicsForArea(spec: Pick<GameSpec, "areas" | "mechanics" | "challenges">, areaId: string): Set<Mechanic> {
  const area = spec.areas.find((a) => a.id === areaId);
  const set = new Set<Mechanic>();
  if (!area) return set;
  for (const m of new Set<Mechanic>([...spec.mechanics, ...impliedMechanics(spec)])) {
    if (MECHANIC_REGISTRY[m].layouts.includes(area.layout)) set.add(m);
  }
  return set;
}

/** The layout each game type plays in. `adventure` keeps whatever mix the spec chose. */
export const LAYOUT_FOR_GAME_TYPE: Readonly<Record<Exclude<GameType, "adventure">, Layout>> = {
  exploration: "plaza",
  puzzle: "rooms",
  platformer: "terraces",
  simulation: "lab",
};
