/**
 * How a perfect player moves through a game, including the doors of the layouts that have them.
 *
 * In `rooms` and `corridor` areas with the `gates` mechanic, the door after station k opens only once station k is
 * done, so the stations are met strictly in the order they are listed. The world builder (`layouts.ts`) puts every
 * NPC in the first room, collectible `j` in room `j mod n`, and the portal in the last room; this module is the same
 * rule as data, and `tests/unit/flow.test.ts` checks it against the real geometry.
 *
 * Why it matters: a station that belongs to a mission which only unlocks after a LATER station (or a boss phase that is
 * fought after a station behind a later door) can never be played, because the door in front of the later station stays
 * shut. Stations are only a list order, so the planner below reorders them (losslessly) in the order missions unlock
 * them; if even that cannot work, the validator reports it with the stations and missions involved.
 */
import { mechanicsForArea } from "../spec/mechanics";
import type { Area, GameSpec } from "../spec/schema";
import { collectibleIds, initialState, portalOpen, recompute, stationActive, stationDone, type PlayState } from "../state/progress";

type FlowSpec = Pick<GameSpec, "areas" | "mechanics" | "challenges" | "missions"> & { bosses?: GameSpec["bosses"] };

/** Do this area's doors open one after another, in station order? */
export function doorsOpenInOrder(spec: Pick<GameSpec, "areas" | "mechanics" | "challenges">, area: Area): boolean {
  return area.stations.length > 1 && mechanicsForArea(spec, area.id).has("gates");
}

/** The room (0-based station index) a collectible lives in, in a layout with doors. */
export const collectibleRoom = (area: Pick<Area, "stations">, index: number): number => index % Math.max(1, area.stations.length);

export interface FlowStuck {
  areaId: string;
  /** The area's doors open in station order (the way out may be behind a door). */
  doors: boolean;
  /** Stations done in this area when the player ran out of things to do. */
  stationsDone: number;
  /** Stations that could not be played (their missions never unlock), in list order. */
  blocked: string[];
  /** Missions that unlock the blocked stations but are not done. */
  waitingFor: string[];
  /** Required missions still open. */
  openMissions: string[];
}

export interface FlowResult {
  finished: boolean;
  /** Per door-gated area: its stations in the order a perfect player meets them (only meaningful for `plan`). */
  order: Map<string, string[]>;
  stuck: FlowStuck | null;
}

/**
 * Play the game like a perfect player: do everything possible in the area, then walk through the portal.
 *  - `check` keeps the stations in their listed order (doors open in that order);
 *  - `plan` is free to meet the stations in any order and reports the order that works.
 * A greedy choice is enough for `plan`: finishing a station only ever unlocks more, so picking any playable station never
 * loses a game that some other order could win.
 */
export function playThrough(spec: FlowSpec, mode: "check" | "plan" = "check"): FlowResult {
  const full = spec as GameSpec;
  const st: PlayState = initialState(full, 0);
  const order = new Map<string, string[]>();
  const seen = new Set<string>();
  let stuck: FlowStuck | null = null;

  const doStation = (areaId: string, id: string): void => {
    const s = spec.areas.find((a) => a.id === areaId)?.stations.find((x) => x.id === id);
    if (!s) return;
    if (s.kind === "lore") {
      if (!st.visited.includes(s.id)) st.visited.push(s.id);
    } else st.resolvedStations[s.id] = "correct";
  };

  for (let hop = 0; hop <= spec.areas.length && !st.finished; hop++) {
    const area = spec.areas.find((a) => a.id === st.areaId);
    if (!area || seen.has(area.id)) break;
    seen.add(area.id);
    const n = area.stations.length;
    const doors = doorsOpenInOrder(spec, area);
    const gems = collectibleIds(area);
    for (const npc of area.npcs) if (!st.talked.includes(npc.id)) st.talked.push(npc.id);

    const placed: string[] = []; // plan mode: the order the stations were met
    const firstUndone = (): number => area.stations.findIndex((s) => !stationDone(st, s.id));

    for (let step = 0; step < 4 * n + gems.length + 4; step++) {
      // The farthest room the player can stand in, given the doors opened so far.
      const reach = !doors ? n - 1 : mode === "plan" ? Math.min(n - 1, placed.length) : Math.min(n - 1, Math.max(0, firstUndone() === -1 ? n - 1 : firstUndone()));
      let changed = false;
      gems.forEach((id, j) => {
        if ((!doors || collectibleRoom(area, j) <= reach) && !st.collected.includes(id)) {
          st.collected.push(id);
          changed = true;
        }
      });
      recompute(full, st);

      if (!doors) {
        for (const s of area.stations) {
          if (!stationDone(st, s.id) && stationActive(full, st, s)) {
            doStation(area.id, s.id);
            recompute(full, st);
            changed = true;
          }
        }
      } else if (mode === "check") {
        const idx = firstUndone();
        const s = idx === -1 ? undefined : area.stations[idx];
        if (s && stationActive(full, st, s)) {
          doStation(area.id, s.id);
          recompute(full, st);
          changed = true;
        }
      } else {
        const s = area.stations.find((x) => !placed.includes(x.id) && stationActive(full, st, x));
        if (s) {
          placed.push(s.id);
          doStation(area.id, s.id);
          recompute(full, st);
          changed = true;
        }
      }
      if (!changed) break;
    }

    if (doors) {
      const rest = area.stations.filter((s) => !placed.includes(s.id)).map((s) => s.id);
      order.set(area.id, [...placed, ...rest]);
    }
    if (st.finished) break;

    const doneCount = area.stations.filter((s) => stationDone(st, s.id)).length;
    // The portal stands in the last room: with doors, the station in every room before it has to be done. In `plan`
    // mode those rooms hold the stations in the order they were met (the rest come after them), so one station that
    // never opens here (a side mission waiting for a later area) can still go in the last room, next to the portal.
    const portalReachable = !doors || (mode === "plan" ? placed.length >= n - 1 : area.stations.slice(0, n - 1).every((s) => stationDone(st, s.id)));
    if (area.portal && portalReachable && portalOpen(full, st, area) && spec.areas.some((a) => a.id === area.portal!.toAreaId)) {
      st.areaId = area.portal.toAreaId;
      continue;
    }

    // Nothing more can be done and the game is not finished: report where the player is stuck.
    const blocked = area.stations.filter((s) => !stationDone(st, s.id) && !stationActive(full, st, s));
    const waiting = new Set<string>();
    for (const s of blocked) {
      for (const m of spec.missions) {
        const wants = m.objectives.some((o) => (o.type === "solve" && s.kind === "challenge" && o.challengeIds.includes(s.challengeId ?? "")) || (o.type === "visit" && o.stationIds.includes(s.id)));
        if (wants) for (const r of m.requires) if (!st.missionsDone.includes(r)) waiting.add(r);
      }
    }
    stuck = {
      areaId: area.id, doors, stationsDone: doneCount, blocked: blocked.map((s) => s.id), waitingFor: [...waiting],
      openMissions: spec.missions.filter((m) => !m.optional && !st.missionsDone.includes(m.id)).map((m) => m.id),
    };
    break;
  }
  if (!st.finished && !stuck) {
    stuck = { areaId: st.areaId, doors: false, stationsDone: 0, blocked: [], waitingFor: [], openMissions: spec.missions.filter((m) => !m.optional && !st.missionsDone.includes(m.id)).map((m) => m.id) };
  }
  return { finished: st.finished, order, stuck: st.finished ? null : stuck };
}

/**
 * Reorder the stations of door-gated areas so a perfect player can walk through them (see the file comment). Stations
 * keep their ids and content, so nothing else changes; a game whose order already works is left exactly as it is.
 * Returns one note per area it reordered. Does nothing when the game cannot be finished in any order.
 */
export function orderStationsForDoors(spec: GameSpec): string[] {
  if (!spec.areas.some((a) => doorsOpenInOrder(spec, a))) return [];
  if (playThrough(spec, "check").finished) return [];
  const plan = playThrough(spec, "plan");
  if (!plan.finished) return [];
  const notes: string[] = [];
  for (const area of spec.areas) {
    const wanted = plan.order.get(area.id);
    if (!wanted || wanted.every((id, i) => area.stations[i]?.id === id)) continue;
    const byId = new Map(area.stations.map((s) => [s.id, s]));
    area.stations = wanted.map((id) => byId.get(id)!);
    notes.push(`area "${area.id}": stations reordered so its doors open in the order the missions unlock them`);
  }
  return notes;
}

/** A path-addressed, actionable message for a game that cannot be finished (used by the validator and the repair loop). */
export function describeStuck(spec: FlowSpec, stuck: FlowStuck): string {
  const list = (ids: string[]) => ids.map((id) => `"${id}"`).join(", ");
  const bossPhases = (spec.bosses ?? []).filter((b) => b.phaseStationIds.some((id) => stuck.blocked.includes(id)));
  const parts: string[] = [];
  if (stuck.blocked.length) {
    parts.push(`in area "${stuck.areaId}" the player gets stuck after ${stuck.stationsDone} of its stations: ${list(stuck.blocked)} can never be played`);
    if (stuck.waitingFor.length) parts.push(`they belong to missions that wait for ${list(stuck.waitingFor)}`);
    if (stuck.doors) {
      parts.push("this area's doors open one after another in station order, so a mission that needs something from a later room (a station or collectibles) can never start. Make the early stations belong to missions that need nothing from later rooms, or lower the collect counts");
    }
    if (bossPhases.length) parts.push(`boss phases are fought in order (${bossPhases.map((b) => `${b.id}: ${b.phaseStationIds.join(" → ")}`).join("; ")}), and a phase station must not belong to a mission that only unlocks after a LATER phase`);
  } else {
    parts.push(`the player runs out of things to do in area "${stuck.areaId}" without being able to leave it (check the portal's requiresMissionIds and the area chain)`);
  }
  const what = bossPhases.length ? "the game cannot be finished with the boss battles as written" : "the game cannot be finished";
  return `${what} (${parts.join("; ")}; required missions still open: ${stuck.openMissions.length ? list(stuck.openMissions) : "none"})`;
}
