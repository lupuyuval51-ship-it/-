/**
 * "Extend Existing Game": merge an extension (new areas, missions, challenges, mechanics) into a saved spec.
 * Existing content is preserved untouched — the only edit to the old world is a portal on the last area of
 * the chain so the new area is reachable. Colliding ids are renamed and every reference is rewritten.
 * The merged result always goes through full validation before it is saved.
 */
import { SPEC_LIMITS } from "./constants";
import type { Area, GameExtension, GameSpec, Mission } from "./schema";

export interface MergeOutcome {
  /** Unvalidated merged spec (run it through validateGameSpec). */
  raw: GameSpec;
  notes: string[];
  addedAreas: number;
  addedMissions: number;
  addedChallenges: number;
}

function uniqueId(id: string, taken: Set<string>): string {
  if (!taken.has(id)) return id;
  for (let n = 2; n < 200; n++) {
    const candidate = `${id.slice(0, 34)}-x${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${id.slice(0, 30)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function mergeExtension(base: GameSpec, ext: GameExtension): MergeOutcome {
  const spec = structuredClone(base);
  const notes: string[] = [];

  const takenAreas = new Set(spec.areas.map((a) => a.id));
  const takenMissions = new Set(spec.missions.map((m) => m.id));
  const takenChallenges = new Set(spec.challenges.map((c) => c.id));
  const takenStations = new Set(spec.areas.flatMap((a) => a.stations.map((s) => s.id)));
  const takenNpcs = new Set(spec.areas.flatMap((a) => a.npcs.map((n) => n.id)));
  const takenObjectives = new Set(spec.learning.objectives.map((o) => o.id));

  const rename = {
    area: new Map<string, string>(), mission: new Map<string, string>(), challenge: new Map<string, string>(),
    station: new Map<string, string>(), npc: new Map<string, string>(), objective: new Map<string, string>(),
  };
  const claim = (kind: keyof typeof rename, id: string, taken: Set<string>): string => {
    const next = uniqueId(id, taken);
    taken.add(next);
    if (next !== id) {
      rename[kind].set(id, next);
      notes.push(`renamed ${kind} "${id}" to "${next}" to avoid a clash`);
    }
    return next;
  };
  const map = (kind: keyof typeof rename, id: string) => rename[kind].get(id) ?? id;

  const extAreas = structuredClone(ext.areas).slice(0, Math.max(0, SPEC_LIMITS.areas - spec.areas.length));
  const extMissions = structuredClone(ext.missions).slice(0, Math.max(0, SPEC_LIMITS.missions - spec.missions.length));
  const extChallenges = structuredClone(ext.challenges).slice(0, Math.max(0, SPEC_LIMITS.challenges - spec.challenges.length));
  if (extAreas.length < ext.areas.length) notes.push("some new areas were dropped: the game is at its area limit");
  if (extMissions.length < ext.missions.length) notes.push("some new missions were dropped: the game is at its mission limit");
  if (extChallenges.length < ext.challenges.length) notes.push("some new challenges were dropped: the game is at its challenge limit");

  // First pass: claim fresh ids.
  const room = Math.max(0, SPEC_LIMITS.learningObjectives - spec.learning.objectives.length);
  const newObjectives = ext.objectives.slice(0, room).map((o) => ({ ...o }));
  for (const o of newObjectives) o.id = claim("objective", o.id, takenObjectives);
  for (const a of extAreas) {
    a.id = claim("area", a.id, takenAreas);
  }
  for (const a of extAreas) {
    for (const s of a.stations) s.id = claim("station", s.id, takenStations);
    for (const n of a.npcs) n.id = claim("npc", n.id, takenNpcs);
  }
  for (const m of extMissions) m.id = claim("mission", m.id, takenMissions);
  for (const c of extChallenges) c.id = claim("challenge", c.id, takenChallenges);

  // Second pass: rewrite every reference to a renamed id.
  const stationOld = new Map<string, string>(); // new id → old id (extension-local)
  for (const [oldId, newId] of rename.station) stationOld.set(newId, oldId);
  for (const a of extAreas) {
    for (const s of a.stations) if (s.challengeId) s.challengeId = map("challenge", s.challengeId);
    // A reaction to a renamed new mission must follow it, or it would silently answer the old mission of the same name.
    for (const n of a.npcs) for (const r of n.reactions) r.afterMissionId = map("mission", r.afterMissionId);
    if (a.portal) {
      a.portal.toAreaId = map("area", a.portal.toAreaId);
      a.portal.requiresMissionIds = a.portal.requiresMissionIds.map((id) => map("mission", id));
    }
  }
  for (const m of extMissions) {
    m.areaId = map("area", m.areaId);
    m.requires = m.requires.map((id) => map("mission", id));
    m.objectives = m.objectives.map((o) => {
      if (o.type === "solve") return { ...o, challengeIds: o.challengeIds.map((id) => map("challenge", id)) };
      if (o.type === "talk") return { ...o, npcId: map("npc", o.npcId) };
      if (o.type === "visit") return { ...o, stationIds: o.stationIds.map((id) => map("station", id)) };
      return o;
    });
  }
  for (const c of extChallenges) {
    if (c.easierId) c.easierId = map("challenge", c.easierId);
    if (c.harderId) c.harderId = map("challenge", c.harderId);
    if (c.objectiveId) c.objectiveId = map("objective", c.objectiveId);
  }

  // Link the new area into the portal chain (the only change to existing areas).
  if (extAreas.length > 0) {
    let tail: Area = spec.areas[0]!;
    const seen = new Set<string>();
    while (tail.portal && !seen.has(tail.id)) {
      seen.add(tail.id);
      const next = spec.areas.find((a) => a.id === tail.portal!.toAreaId);
      if (!next) break;
      tail = next;
    }
    const entry = extAreas[0]!;
    const hasInbound = spec.areas.some((a) => a.portal?.toAreaId === entry.id) || extAreas.some((a) => a.portal?.toAreaId === entry.id);
    if (!tail.portal && !hasInbound) {
      const missionsHere = spec.missions.filter((m) => m.areaId === tail.id).map((m) => m.id);
      tail.portal = { toAreaId: entry.id, label: `→ ${entry.name}`.slice(0, 50), requiresMissionIds: missionsHere.slice(-2) };
      notes.push(`linked "${tail.name}" to the new area "${entry.name}" with a portal`);
    }
    // Chain additional new areas in order when the extension did not link them itself.
    for (let i = 0; i + 1 < extAreas.length; i++) {
      const cur = extAreas[i]!;
      if (!cur.portal) cur.portal = { toAreaId: extAreas[i + 1]!.id, label: `→ ${extAreas[i + 1]!.name}`.slice(0, 50), requiresMissionIds: [] };
    }
  }

  spec.areas.push(...extAreas);
  spec.missions.push(...(extMissions as Mission[]));
  spec.challenges.push(...extChallenges);
  spec.learning.objectives.push(...newObjectives);
  spec.mechanics = [...new Set([...spec.mechanics, ...ext.mechanics])];
  if (ext.conclusion) spec.learning.conclusion = ext.conclusion;
  return { raw: spec, notes, addedAreas: extAreas.length, addedMissions: extMissions.length, addedChallenges: extChallenges.length };
}
