import { hashSeed, mulberry32 } from "../util/prng";
import type { GameSpec } from "../spec/schema";
import { lineOfWalk, makeCtx, settlePlacements, solidClearance, type LayoutResult } from "./helpers";
import { LAYOUT_BUILDERS } from "./layouts";
import { themeFor } from "./theme";
import type { WorldBoss, WorldModel } from "./types";

/** The parts of a spec the world builder reads; satisfied by both the full and the public spec. */
export type WorldSpec = Pick<GameSpec, "meta" | "theme" | "areas" | "mechanics" | "challenges"> & { bosses?: GameSpec["bosses"] };

export const BOSS_SCALE = 2.2;

/** A boss is drawn 2.2 times life size: it needs this much free floor around it and this much distance from anything else you can talk to. */
const BOSS_CLEARANCE = { strict: { solid: 1.5, others: 3.4 }, loose: { solid: 1.2, others: 2.8 } } as const;

/**
 * A boss stands a few steps beyond its last phase station: first choice is away from where the player starts, then to
 * either side, then back towards the start. It never stands inside scenery, a wall or a closed door, across a wall from
 * its station, over lava, off the platform its station is on, or on top of another station, character or the portal.
 */
function placeBosses(spec: WorldSpec, areaId: string, world: LayoutResult): WorldBoss[] {
  const out: WorldBoss[] = [];
  const b = world.bounds;
  const taken = [...world.stations, ...world.npcs, ...(world.portal ? [world.portal] : [])].map((p) => ({ x: p.x, z: p.z }));
  for (const boss of (spec.bosses ?? []).filter((x) => x.areaId === areaId)) {
    const last = world.stations.find((s) => s.stationId === boss.phaseStationIds[boss.phaseStationIds.length - 1]);
    if (!last) continue;
    const len = Math.hypot(last.x - world.spawn.x, last.z - world.spawn.z) || 1;
    const dx = (last.x - world.spawn.x) / len, dz = (last.z - world.spawn.z) / len;
    // Platformers: the boss stands on the platform its last phase station is on.
    const pad = world.hasVoid ? world.boxes.find((p) => p.kind === "platform" && last.x >= p.x0 && last.x <= p.x1 && last.z >= p.z0 && last.z <= p.z1 && Math.abs(p.y1 - last.y) < 0.05) : undefined;
    const others = taken.filter((p) => Math.hypot(p.x - last.x, p.z - last.z) > 0.01);
    const directions: [number, number][] = [[dx, dz], [-dz, dx], [dz, -dx], [-dx, -dz], [dx - dz, dz + dx], [dx + dz, dz - dx], [-dx - dz, -dz + dx], [-dx + dz, -dz - dx]];
    const reaches = [5.2, 4.4, 3.8, 3.2, 2.8, 2.4];
    const fits = (x: number, z: number, rule: { solid: number; others: number }): boolean => {
      if (pad) {
        if (x < pad.x0 + 1.2 || x > pad.x1 - 1.2 || z < pad.z0 + 1.2 || z > pad.z1 - 1.2) return false;
      } else if (!(x > b.x0 + 2 && x < b.x1 - 2 && z > b.z0 + 2 && z < b.z1 - 2)) return false;
      if (!world.hasVoid && solidClearance(world.boxes, x, z) < rule.solid) return false;
      if (world.hazards.some((h) => x > h.x0 - 1 && x < h.x1 + 1 && z > h.z0 - 1 && z < h.z1 + 1)) return false;
      return !others.some((p) => Math.hypot(p.x - x, p.z - z) < rule.others);
    };
    let spot: { x: number; z: number } | null = null;
    search: for (const rule of [BOSS_CLEARANCE.strict, BOSS_CLEARANCE.loose]) {
      for (const reach of reaches) {
        for (const [ux, uz] of directions) {
          const n = Math.hypot(ux, uz) || 1;
          const x = last.x + (ux / n) * reach, z = last.z + (uz / n) * reach;
          if (!fits(x, z, rule) || !(world.hasVoid || lineOfWalk(world.boxes, last, { x, z }))) continue;
          spot = { x, z };
          break search;
        }
      }
    }
    if (!spot) {
      // A crowded little area: take the free spot that is farthest from everything else you can talk to.
      let best = -1;
      for (const reach of reaches) {
        for (const [ux, uz] of directions) {
          const n = Math.hypot(ux, uz) || 1;
          const x = last.x + (ux / n) * reach, z = last.z + (uz / n) * reach;
          if (!fits(x, z, { solid: BOSS_CLEARANCE.loose.solid, others: 0 }) || !(world.hasVoid || lineOfWalk(world.boxes, last, { x, z }))) continue;
          const apart = Math.min(...others.map((p) => Math.hypot(p.x - x, p.z - z)), 99);
          if (apart > best) {
            best = apart;
            spot = { x, z };
          }
        }
      }
    }
    // Nothing fits at all: stand right behind the station rather than leave the boss out.
    const x = spot?.x ?? Math.min(b.x1 - 1.5, Math.max(b.x0 + 1.5, last.x + dx * 3.2));
    const z = spot?.z ?? Math.min(b.z1 - 1.5, Math.max(b.z0 + 1.5, last.z + dz * 3.2));
    out.push({ bossId: boss.id, name: boss.name, color: boss.look.color, shape: boss.look.shape, x, y: last.y, z, facing: Math.atan2(-(world.spawn.x - x), -(world.spawn.z - z)), scale: BOSS_SCALE, phaseStationIds: boss.phaseStationIds });
    taken.push({ x, z });
  }
  return out;
}

/** Build the world for one area of a validated spec. Pure and deterministic for a given spec + area. */
export function buildWorld(spec: WorldSpec, areaId: string): WorldModel {
  const area = spec.areas.find((a) => a.id === areaId);
  if (!area) throw new Error(`unknown area ${areaId}`);
  const seed = hashSeed(`${spec.meta.title}|${spec.meta.subject}|${area.id}|${area.layout}`);
  const theme = themeFor(spec.theme.environment, spec.theme.timeOfDay, spec.theme.palette);
  const ctx = makeCtx(spec, area, mulberry32(seed), theme);
  const result = LAYOUT_BUILDERS[area.layout](ctx);
  settlePlacements(result, "npcs");
  const bosses = placeBosses(spec, areaId, result);
  settlePlacements(result, "items", bosses);
  return { areaId, layout: area.layout, environment: spec.theme.environment, seed, theme, ...result, bosses };
}
