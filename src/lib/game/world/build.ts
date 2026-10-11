import { hashSeed, mulberry32 } from "../util/prng";
import type { GameSpec } from "../spec/schema";
import { makeCtx, type LayoutResult } from "./helpers";
import { LAYOUT_BUILDERS } from "./layouts";
import { themeFor } from "./theme";
import type { WorldBoss, WorldModel } from "./types";

/** The parts of a spec the world builder reads; satisfied by both the full and the public spec. */
export type WorldSpec = Pick<GameSpec, "meta" | "theme" | "areas" | "mechanics" | "challenges"> & { bosses?: GameSpec["bosses"] };

export const BOSS_SCALE = 2.2;

/**
 * A boss stands a few steps beyond its last phase station: first choice is away from where the player starts, then to
 * either side, then back towards the start. It never stands inside the bounds' margin or on top of another station,
 * character or the portal (a boss is drawn 2.2 times life size and needs room).
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
    const inside = (x: number, z: number) => x > b.x0 + 2 && x < b.x1 - 2 && z > b.z0 + 2 && z < b.z1 - 2;
    const others = taken.filter((p) => Math.hypot(p.x - last.x, p.z - last.z) > 0.01);
    let spot: { x: number; z: number } | null = null;
    // Directions in order of preference; for each, the farthest reach that still has room.
    search: for (const [ux, uz] of [[dx, dz], [-dz, dx], [dz, -dx], [-dx, -dz]] as const) {
      for (const reach of [5.2, 4.4, 3.8]) {
        const x = last.x + ux * reach, z = last.z + uz * reach;
        if (!inside(x, z)) continue;
        if (others.some((p) => Math.hypot(p.x - x, p.z - z) < 3.2)) continue;
        spot = { x, z };
        break search;
      }
    }
    // Nothing fits (a tiny area): stand right behind the station rather than leave the boss out.
    const x = spot?.x ?? Math.min(b.x1 - 1.5, Math.max(b.x0 + 1.5, last.x + dx * 3.2));
    const z = spot?.z ?? Math.min(b.z1 - 1.5, Math.max(b.z0 + 1.5, last.z + dz * 3.2));
    out.push({ bossId: boss.id, name: boss.name, color: boss.look.color, shape: boss.look.shape, x, y: last.y, z, facing: Math.atan2(-(world.spawn.x - x), -(world.spawn.z - z)), scale: BOSS_SCALE, phaseStationIds: boss.phaseStationIds });
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
  return { areaId, layout: area.layout, environment: spec.theme.environment, seed, theme, ...result, bosses: placeBosses(spec, areaId, result) };
}
