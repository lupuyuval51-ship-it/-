/**
 * Validation pipeline for model- or template-produced specs:
 *   sanitize → normalize (tolerant, lossless repairs) → strict Zod parse → cross-reference & completability
 *   checks → solvability proofs for puzzles → mechanics support verification → size cap.
 *
 * Returns precise, path-addressed error strings. Those same strings are fed back to the model in the repair loop.
 */
import { SPEC_LIMITS } from "./constants";
import { MECHANICS, type GameType } from "./constants";
import { estimateMinutes } from "./estimate";
import { LAYOUT_FOR_GAME_TYPE, impliedMechanics, verifyMechanics } from "./mechanics";
import { gameSpecSchema, type Area, type Challenge, type GameSpec } from "./schema";
import { goalReachable, runProgram } from "../challenges/program";
import { describeStuck, doorsOpenInOrder, orderStationsForDoors, playThrough } from "../world/flow";
import { LEVER_SLIDER_MIN, leverSolvable, projectileSolvable } from "../challenges/simulations";

export type ValidationResult =
  | { ok: true; spec: GameSpec; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

const BAD_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‎‏‪-‮⁦-⁩]/g;

/** Remove control / bidi-override characters and normalise newlines in every string; drop nulls. */
export function sanitizeDeep(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/\r\n?/g, "\n").replace(BAD_CHARS, "").replace(/\n{3,}/g, "\n\n").trim();
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
      if (v === null || v === undefined) continue; // models often emit null for "absent"
      out[k] = sanitizeDeep(v);
    }
    return out;
  }
  return value;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Lossless / defensive repairs that avoid a round-trip to the model for trivial issues. */
export function normalizeRawSpec(raw: unknown): { value: unknown; notes: string[] } {
  const notes: string[] = [];
  const spec = sanitizeDeep(raw);
  if (!isObj(spec)) return { value: spec, notes };

  if (isObj(spec.meta)) {
    delete spec.meta.generator; // always assigned by the server
    delete spec.meta.featureTier; // so is the tier the game was built at
  }

  const cap = (o: Obj, key: string, max: number, label: string) => {
    const list = o[key];
    if (Array.isArray(list) && list.length > max) {
      o[key] = list.slice(0, max);
      notes.push(`${label} truncated from ${list.length} to ${max}`);
    }
  };
  cap(spec, "areas", SPEC_LIMITS.areas, "areas");
  cap(spec, "missions", SPEC_LIMITS.missions, "missions");
  cap(spec, "challenges", SPEC_LIMITS.challenges, "challenges");
  cap(spec, "bosses", SPEC_LIMITS.bosses, "bosses");
  for (const b of arr(spec.bosses)) if (isObj(b)) cap(b, "phaseStationIds", SPEC_LIMITS.bossPhasesMax, `phases of boss ${String(b.id)}`);
  if (isObj(spec.learning)) cap(spec.learning, "objectives", SPEC_LIMITS.learningObjectives, "learning objectives");

  if (Array.isArray(spec.mechanics)) {
    const known = new Set<string>(MECHANICS);
    const kept = spec.mechanics.filter((m) => typeof m === "string" && known.has(m));
    const dropped = spec.mechanics.filter((m) => !kept.includes(m));
    if (dropped.length) notes.push(`unsupported mechanics dropped: ${dropped.map(String).join(", ")}`);
    spec.mechanics = [...new Set(kept)];
  }
  for (const area of arr(spec.areas)) {
    if (!isObj(area)) continue;
    cap(area, "stations", SPEC_LIMITS.stationsPerArea, `stations in ${String(area.id)}`);
    cap(area, "npcs", SPEC_LIMITS.npcsPerArea, `npcs in ${String(area.id)}`);
  }
  for (const m of arr(spec.missions)) {
    if (!isObj(m)) continue;
    cap(m, "objectives", SPEC_LIMITS.objectivesPerMission, `objectives in ${String(m.id)}`);
    // The same id listed twice would ask for two solves of one station: the objective could never be completed.
    for (const o of arr(m.objectives)) {
      if (!isObj(o)) continue;
      for (const key of ["challengeIds", "stationIds"] as const) {
        const list = o[key];
        if (Array.isArray(list) && new Set(list).size !== list.length) {
          o[key] = [...new Set(list)];
          notes.push(`duplicate ids removed from ${key} of an objective in mission ${String(m.id)}`);
        }
      }
    }
  }
  for (const c of arr(spec.challenges)) {
    if (!isObj(c)) continue;
    cap(c, "options", SPEC_LIMITS.optionsPerChoice, `options in ${String(c.id)}`);
    cap(c, "items", SPEC_LIMITS.itemsPerSequence, `items in ${String(c.id)}`);
    cap(c, "pairs", SPEC_LIMITS.pairsPerMatch, `pairs in ${String(c.id)}`);
  }
  return { value: spec, notes };
}

function dupes(ids: string[]): string[] {
  const seen = new Set<string>();
  const out = new Set<string>();
  for (const id of ids) (seen.has(id) ? out : seen).add(id);
  return [...out];
}

/** Everything Zod cannot express: references, reachability, completability, solvability. */
export function crossCheck(spec: GameSpec): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);

  const areaIds = spec.areas.map((a) => a.id);
  const missionIds = spec.missions.map((m) => m.id);
  const challengeIds = spec.challenges.map((c) => c.id);
  const stations = spec.areas.flatMap((a) => a.stations.map((s) => ({ ...s, areaId: a.id })));
  const npcs = spec.areas.flatMap((a) => a.npcs.map((n) => ({ ...n, areaId: a.id })));

  for (const [label, ids] of [
    ["area", areaIds], ["mission", missionIds], ["challenge", challengeIds], ["station", stations.map((s) => s.id)],
    ["npc", npcs.map((n) => n.id)], ["learning objective", spec.learning.objectives.map((o) => o.id)], ["boss", (spec.bosses ?? []).map((b) => b.id)],
  ] as const) {
    const d = dupes([...ids]);
    if (d.length) err(`duplicate ${label} ids: ${d.join(", ")}`);
  }

  const challengeById = new Map<string, Challenge>(spec.challenges.map((c) => [c.id, c]));
  const objectiveIds = new Set(spec.learning.objectives.map((o) => o.id));

  // ── stations ↔ challenges
  const placed = new Map<string, string>(); // challengeId → stationId
  for (const s of stations) {
    if (s.kind !== "challenge" || !s.challengeId) continue;
    if (!challengeById.has(s.challengeId)) err(`station "${s.id}" references unknown challenge "${s.challengeId}"`);
    else if (placed.has(s.challengeId)) err(`challenge "${s.challengeId}" is placed on two stations ("${placed.get(s.challengeId)}" and "${s.id}")`);
    else placed.set(s.challengeId, s.id);
  }
  const variantOf = new Map<string, string>();
  for (const c of spec.challenges) {
    for (const [field, v] of [["easierId", c.easierId], ["harderId", c.harderId]] as const) {
      if (!v) continue;
      if (v === c.id) err(`challenge "${c.id}" lists itself as ${field}`);
      else if (!challengeById.has(v)) err(`challenge "${c.id}" ${field} references unknown challenge "${v}"`);
      else if (placed.has(v)) err(`variant "${v}" (${field} of "${c.id}") must not also be placed on a station`);
      else if (variantOf.has(v)) err(`variant "${v}" is used by two challenges`);
      else variantOf.set(v, c.id);
    }
    if (c.objectiveId && !objectiveIds.has(c.objectiveId)) err(`challenge "${c.id}" assesses unknown learning objective "${c.objectiveId}"`);
  }
  for (const c of spec.challenges) {
    if (!placed.has(c.id) && !variantOf.has(c.id)) err(`challenge "${c.id}" is not placed on any station and is not a variant`);
  }

  // ── per-type solvability proofs
  for (const c of spec.challenges) {
    switch (c.type) {
      case "choice": {
        if (dupes(c.options.map((o) => o.id)).length) err(`challenge "${c.id}" has duplicate option ids`);
        if (!c.options.some((o) => o.id === c.correctOptionId)) err(`challenge "${c.id}" correctOptionId "${c.correctOptionId}" is not one of its options`);
        break;
      }
      case "sequence":
        if (dupes(c.items.map((i) => i.id)).length) err(`challenge "${c.id}" has duplicate item ids`);
        break;
      case "match":
        if (dupes(c.pairs.map((p) => p.id)).length) err(`challenge "${c.id}" has duplicate pair ids`);
        break;
      case "program": {
        const { grid } = c;
        const inGrid = (p: { x: number; y: number }) => p.x < grid.width && p.y < grid.height;
        const walls = new Set(grid.walls.map((w) => `${w.x},${w.y}`));
        if (!inGrid(grid.start) || !inGrid(grid.goal) || grid.walls.some((w) => !inGrid(w))) err(`challenge "${c.id}" has cells outside its ${grid.width}x${grid.height} grid`);
        else if (walls.has(`${grid.start.x},${grid.start.y}`) || walls.has(`${grid.goal.x},${grid.goal.y}`)) err(`challenge "${c.id}" start or goal sits on a wall`);
        else if (grid.start.x === grid.goal.x && grid.start.y === grid.goal.y) err(`challenge "${c.id}" starts on its goal`);
        else if (!goalReachable(c)) err(`challenge "${c.id}" goal is walled in`);
        else {
          const run = runProgram(c, c.solution);
          if (!run.success) err(`challenge "${c.id}" reference solution does not solve the puzzle within its constraints (${run.reason})`);
        }
        break;
      }
      case "simulation":
        if (c.sim.kind === "projectile" && !projectileSolvable(c.sim)) err(`challenge "${c.id}" target is out of reach even at maxSpeed`);
        if (c.sim.kind === "lever" && !leverSolvable(c.sim)) err(`challenge "${c.id}" balance point is outside the lever (0.2..${c.sim.maxDistance}) or too close to the pivot for the slider (from ${LEVER_SLIDER_MIN} m) to reach it within the tolerance`);
        break;
      case "numeric":
        break;
    }
  }

  // ── missions
  const missionById = new Map(spec.missions.map((m) => [m.id, m]));
  const areaById = new Map<string, Area>(spec.areas.map((a) => [a.id, a]));
  for (const m of spec.missions) {
    const area = areaById.get(m.areaId);
    if (!area) {
      err(`mission "${m.id}" happens in unknown area "${m.areaId}"`);
      continue;
    }
    for (const r of m.requires) {
      if (r === m.id) err(`mission "${m.id}" requires itself`);
      else if (!missionById.has(r)) err(`mission "${m.id}" requires unknown mission "${r}"`);
    }
    const areaStation = new Map(area.stations.map((s) => [s.id, s]));
    const areaChallengeIds = new Set(area.stations.filter((s) => s.kind === "challenge").map((s) => s.challengeId));
    for (const o of m.objectives) {
      switch (o.type) {
        case "solve":
          for (const id of o.challengeIds) if (!areaChallengeIds.has(id)) err(`mission "${m.id}" objective needs challenge "${id}" which has no station in area "${area.id}"`);
          break;
        case "collect":
          if (area.collectibles.count < o.count) err(`mission "${m.id}" asks to collect ${o.count} but area "${area.id}" only has ${area.collectibles.count}`);
          break;
        case "talk":
          if (!area.npcs.some((n) => n.id === o.npcId)) err(`mission "${m.id}" wants to talk to "${o.npcId}" who is not in area "${area.id}"`);
          break;
        case "visit":
          for (const id of o.stationIds) if (areaStation.get(id)?.kind !== "lore") err(`mission "${m.id}" visit objective "${id}" is not a lore station in area "${area.id}"`);
          break;
        case "defeat": {
          const boss = (spec.bosses ?? []).find((b) => b.id === o.bossId);
          if (!boss) err(`mission "${m.id}" wants to defeat unknown boss "${o.bossId}"`);
          else if (boss.areaId !== area.id) err(`mission "${m.id}" wants to defeat boss "${boss.id}" who lives in area "${boss.areaId}", not "${area.id}"`);
          break;
        }
      }
    }
  }
  // ── bosses: the battle is made of the area's own challenge stations, fought in order
  const phaseOwner = new Map<string, string>();
  for (const boss of spec.bosses ?? []) {
    const area = areaById.get(boss.areaId);
    if (!area) {
      err(`boss "${boss.id}" lives in unknown area "${boss.areaId}"`);
      continue;
    }
    const byId = new Map(area.stations.map((st) => [st.id, st]));
    if (dupes(boss.phaseStationIds).length) err(`boss "${boss.id}" lists the same phase station twice`);
    for (const id of boss.phaseStationIds) {
      const st = byId.get(id);
      if (!st) err(`boss "${boss.id}" phase "${id}" is not a station of area "${area.id}"`);
      else if (st.kind !== "challenge") err(`boss "${boss.id}" phase "${id}" must be a challenge station`);
      else if (phaseOwner.has(id)) err(`station "${id}" is a phase of two bosses ("${phaseOwner.get(id)}" and "${boss.id}")`);
      else phaseOwner.set(id, boss.id);
    }
  }
  for (const a of spec.areas) {
    for (const n of a.npcs) {
      for (const r of n.reactions ?? []) if (!missionById.has(r.afterMissionId)) err(`npc "${n.id}" reacts to unknown mission "${r.afterMissionId}"`);
    }
  }

  // mission dependency cycles
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      err(`mission requirements form a cycle: ${[...path, id].join(" → ")}`);
      return;
    }
    state.set(id, 1);
    for (const r of missionById.get(id)?.requires ?? []) if (missionById.has(r) && r !== id) visit(r, [...path, id]);
    state.set(id, 2);
  };
  for (const id of missionIds) visit(id, []);

  // ── areas & portals
  for (const a of spec.areas) {
    if (!a.portal) continue;
    if (a.portal.toAreaId === a.id) err(`area "${a.id}" portal leads to itself`);
    else if (!areaById.has(a.portal.toAreaId)) err(`area "${a.id}" portal leads to unknown area "${a.portal.toAreaId}"`);
    for (const r of a.portal.requiresMissionIds) if (!missionById.has(r)) err(`area "${a.id}" portal requires unknown mission "${r}"`);
  }
  const reachable = new Set<string>([spec.areas[0]!.id]);
  for (let i = 0; i < spec.areas.length; i++) {
    for (const a of spec.areas) if (reachable.has(a.id) && a.portal && areaById.has(a.portal.toAreaId)) reachable.add(a.portal.toAreaId);
  }
  for (const a of spec.areas) if (!reachable.has(a.id)) err(`area "${a.id}" cannot be reached: link it with a portal from an earlier area`);

  // ── completability: simulate "finish everything possible" using only static rules
  if (errors.length === 0) {
    const done = new Set<string>();
    const openAreas = new Set<string>([spec.areas[0]!.id]);
    let progress = true;
    while (progress) {
      progress = false;
      for (const m of spec.missions) {
        if (done.has(m.id) || !openAreas.has(m.areaId) || !m.requires.every((r) => done.has(r))) continue;
        done.add(m.id);
        progress = true;
      }
      for (const a of spec.areas) {
        if (openAreas.has(a.id) && a.portal && !openAreas.has(a.portal.toAreaId) && a.portal.requiresMissionIds.every((r) => done.has(r))) {
          openAreas.add(a.portal.toAreaId);
          progress = true;
        }
      }
    }
    for (const m of spec.missions) if (!done.has(m.id)) err(`mission "${m.id}" can never be completed (unreachable area or unmet requirements)`);
  }

  // ── play the game the way a perfect player would, with the real progress rules: boss phases open one after another
  // and, in layouts with doors, rooms open in station order. This is what proves the game can be finished.
  if (errors.length === 0) {
    const flow = playThrough(spec, "check");
    if (!flow.finished) {
      // Doors only force an order on the stations, which `orderStationsForDoors` fixes losslessly; report only what
      // no order can fix.
      const best = spec.areas.some((a) => doorsOpenInOrder(spec, a)) ? playThrough(spec, "plan") : flow;
      if (!best.finished && best.stuck) err(describeStuck(spec, best.stuck));
    }
  }

  // ── softer quality warnings
  const assessed = new Set(spec.challenges.map((c) => c.objectiveId).filter(Boolean));
  for (const o of spec.learning.objectives) if (!assessed.has(o.id)) warnings.push(`learning objective "${o.id}" is not assessed by any challenge`);
  const referenced = new Set(spec.missions.flatMap((m) => m.objectives.flatMap((o) => (o.type === "solve" ? o.challengeIds : []))));
  for (const [cid] of placed) if (!referenced.has(cid)) warnings.push(`challenge "${cid}" is optional: no mission requires it`);
  return { errors, warnings };
}

/**
 * Portals are one-way: there is no door back. A portal that opens before the area's own missions are finished lets a
 * player walk away from objectives they can then never complete, so the game could not be finished (found by the
 * "rusher" bot in the balance simulation). Every portal therefore also waits for the area's final missions.
 */
export function sealPortals(spec: GameSpec): string[] {
  const notes: string[] = [];
  for (const area of spec.areas) {
    if (!area.portal) continue;
    const here = spec.missions.filter((m) => m.areaId === area.id);
    // "Final" missions: nothing else in this area builds on them (finishing those finishes their prerequisites).
    const final = here.filter((m) => !m.optional && !here.some((o) => o.requires.includes(m.id)));
    const wanted = [...new Set([...area.portal.requiresMissionIds, ...final.map((m) => m.id)])];
    // The schema allows four; keep the portal's own requirements first, then as many final missions as fit.
    const next = wanted.slice(0, 4);
    if (next.length > area.portal.requiresMissionIds.length) {
      area.portal.requiresMissionIds = next;
      notes.push(`portal in area "${area.id}" now waits for the area's final missions, so nobody can leave objectives behind`);
    }
  }
  return notes;
}

/** Align layouts to the chosen game type so "platformer" really plays as a platformer. */
export function alignLayoutsToGameType(spec: GameSpec, gameType: GameType): string[] {
  const notes: string[] = [];
  spec.meta.gameType = gameType;
  if (gameType === "adventure") return notes;
  const layout = LAYOUT_FOR_GAME_TYPE[gameType];
  for (const area of spec.areas) {
    if (area.layout !== layout) {
      notes.push(`area "${area.id}" layout changed from ${area.layout} to ${layout} to match game type "${gameType}"`);
      area.layout = layout;
    }
  }
  return notes;
}

export function validateGameSpec(raw: unknown, opts: { alignGameType?: GameType } = {}): ValidationResult {
  const warnings: string[] = [];
  const bytes = (() => {
    try {
      return JSON.stringify(raw)?.length ?? 0;
    } catch {
      return Infinity;
    }
  })();
  if (bytes > SPEC_LIMITS.maxBytes * 2) return { ok: false, errors: [`specification is too large (${bytes} bytes)`], warnings };

  const { value, notes } = normalizeRawSpec(raw);
  warnings.push(...notes);
  const parsed = gameSpecSchema.safeParse(value);
  if (!parsed.success) {
    const errors = parsed.error.issues.slice(0, 30).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
    return { ok: false, errors, warnings };
  }
  const spec = parsed.data;
  if (opts.alignGameType) warnings.push(...alignLayoutsToGameType(spec, opts.alignGameType));

  // Content requires some mechanics; switch them on instead of rejecting the game.
  const missing = impliedMechanics(spec).filter((m) => !spec.mechanics.includes(m));
  if (missing.length) {
    spec.mechanics = [...spec.mechanics, ...missing];
    warnings.push(`mechanics enabled automatically because the content needs them: ${missing.join(", ")}`);
  }

  // Before the cross-checks, so a seal that would make the game unfinishable is reported as such.
  warnings.push(...sealPortals(spec));

  const cross = crossCheck(spec);
  warnings.push(...cross.warnings);
  if (cross.errors.length) return { ok: false, errors: cross.errors.slice(0, 30), warnings };
  // Rooms with doors are met in the order the stations are listed: list them in the order the missions unlock them.
  warnings.push(...orderStationsForDoors(spec));

  const report = verifyMechanics(spec);
  for (const i of report.ignored) warnings.push(`mechanic "${i.mechanic}" has no effect: ${i.reason}`);
  spec.mechanics = spec.mechanics.filter((m) => !report.ignored.some((i) => i.mechanic === m));

  // The length shown to learners is measured from the content, not trusted from the generator or the model.
  spec.meta.estimatedMinutes = estimateMinutes(spec);

  const size = JSON.stringify(spec).length;
  if (size > SPEC_LIMITS.maxBytes) return { ok: false, errors: [`specification is too large after validation (${size} bytes, max ${SPEC_LIMITS.maxBytes})`], warnings };
  return { ok: true, spec, warnings };
}
