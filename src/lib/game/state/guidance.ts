/**
 * "Where do I go next?" — pure logic that turns the mission structure and the player's progress into a short list
 * of world positions to guide towards (beacons, the companion drone and the on-screen marker all read this).
 *
 * It only uses information the browser already has (public spec + client state + the area's world model), never
 * answers. The guide always points at something that moves a mission forward and is currently possible.
 */
import type { PublicSpec } from "../spec/public";
import type { WorldModel } from "../world/types";
import { bossProgress, findBoss, missionUnlocked, objectiveProgress, stationActive, type ClientState } from "./progress";

export type GuideKind = "npc" | "station" | "lore" | "collectible" | "portal";

export interface GuideTarget {
  kind: GuideKind;
  /** npcId, stationId, itemId or the destination areaId (portal). */
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  /** Mission this target belongs to (null for the "head to the portal" fallback). */
  missionId: string | null;
}

export interface GuideOptions {
  /** Collectibles the player already picked up but the server has not confirmed yet. */
  isCollected?: (itemId: string) => boolean;
  player?: { x: number; z: number };
}

const dist2 = (a: { x: number; z: number }, b: { x: number; z: number }) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

/**
 * The targets for the first unfinished, unlocked mission (preferring one in the current area). When that mission
 * lives in another area the guide leads to this area's portal. Returns [] when everything is done.
 */
export function guideTargets(spec: PublicSpec, client: ClientState, world: WorldModel, opts: GuideOptions = {}): GuideTarget[] {
  const open = spec.missions.filter((m) => !client.missionsDone.includes(m.id) && missionUnlocked(client, m));
  if (open.length === 0) return [];
  const here = open.find((m) => m.areaId === world.areaId);
  const mission = here ?? open[0]!;
  const area = spec.areas.find((a) => a.id === world.areaId);

  if (mission.areaId !== world.areaId) {
    // The next mission is elsewhere: lead to the portal (locked or not — the portal label explains what is missing).
    if (!world.portal) return [];
    return [{ kind: "portal", id: world.portal.toAreaId, label: world.portal.label, x: world.portal.x, y: world.portal.y, z: world.portal.z, missionId: null }];
  }

  const out: GuideTarget[] = [];
  mission.objectives.forEach((o, i) => {
    if (objectiveProgress(spec, client, mission, i).done) return;
    switch (o.type) {
      case "talk": {
        const n = world.npcs.find((x) => x.npcId === o.npcId);
        if (n) out.push({ kind: "npc", id: n.npcId, label: n.name, x: n.x, y: n.y, z: n.z, missionId: mission.id });
        break;
      }
      case "solve": {
        for (const s of world.stations) {
          const def = area?.stations.find((x) => x.id === s.stationId);
          if (!def || def.kind !== "challenge" || !o.challengeIds.includes(def.challengeId ?? "")) continue;
          if (client.resolvedStations[s.stationId] || !stationActive(spec, client, def)) continue;
          out.push({ kind: "station", id: s.stationId, label: s.label, x: s.x, y: s.y, z: s.z, missionId: mission.id });
        }
        break;
      }
      case "visit": {
        for (const id of o.stationIds) {
          const s = world.stations.find((x) => x.stationId === id);
          if (s && !client.visited.includes(id)) out.push({ kind: "lore", id, label: s.label, x: s.x, y: s.y, z: s.z, missionId: mission.id });
        }
        break;
      }
      case "defeat": {
        // The next phase of the battle (phases open one after another).
        const boss = findBoss(spec as never, o.bossId);
        if (!boss) break;
        const next = bossProgress(boss, client).nextPhase;
        const s = next >= 0 ? world.stations.find((x) => x.stationId === boss.phaseStationIds[next]) : undefined;
        if (s) out.push({ kind: "station", id: s.stationId, label: s.label, x: s.x, y: s.y, z: s.z, missionId: mission.id });
        break;
      }
      case "collect": {
        // Only the nearest uncollected item: a beam over every coin would be noise.
        const isCollected = opts.isCollected ?? ((id: string) => client.collected.includes(id));
        const free = world.collectibles.filter((c) => !isCollected(c.itemId));
        const from = opts.player ?? world.spawn;
        free.sort((a, b) => dist2(a, from) - dist2(b, from));
        const c = free[0];
        if (c) out.push({ kind: "collectible", id: c.itemId, label: "", x: c.x, y: c.y, z: c.z, missionId: mission.id });
        break;
      }
    }
  });
  return out;
}

/** The closest target to a point (what the compass marker follows). */
export function nearestTarget(targets: readonly GuideTarget[], from: { x: number; z: number }): GuideTarget | null {
  let best: GuideTarget | null = null;
  let bd = Infinity;
  for (const t of targets) {
    const d = dist2(t, from);
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}

/**
 * Mutable guide state shared by the render loop and the HUD marker (no React state: it changes several times a
 * second). `tick` recomputes at 4 Hz, `refresh` immediately (e.g. after the server confirmed progress).
 */
export class GuideModel {
  targets: GuideTarget[] = [];
  primary: GuideTarget | null = null;
  enabled = true;
  private acc = 1;

  refresh(spec: PublicSpec, client: ClientState, world: WorldModel, opts: GuideOptions = {}): void {
    this.targets = guideTargets(spec, client, world, opts);
    this.primary = opts.player ? nearestTarget(this.targets, opts.player) : (this.targets[0] ?? null);
    this.acc = 0;
  }

  tick(dt: number, spec: PublicSpec, client: ClientState, world: WorldModel, opts: GuideOptions = {}): void {
    this.acc += dt;
    if (this.acc >= 0.25) this.refresh(spec, client, world, opts);
  }
}
