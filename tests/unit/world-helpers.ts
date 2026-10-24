import { PLAYER_RADIUS } from "@/lib/game/engine/constants";
import type { GameSpec } from "@/lib/game/spec/schema";
import type { WorldModel } from "@/lib/game/world/types";

/**
 * Flood fill over a 0.4 m grid: which points can a player of real radius walk to from the spawn?
 * `gateOpen` says which doors are open (by gate id); closed doors, walls, scenery and lava block.
 */
export function walkable(world: WorldModel, gateOpen: (gateId: string) => boolean = () => true): (x: number, z: number, within: number) => boolean {
  const res = 0.4;
  const { x0, x1, z0, z1 } = world.bounds;
  const W = Math.ceil((x1 - x0) / res) + 1;
  const H = Math.ceil((z1 - z0) / res) + 1;
  const blocked = new Uint8Array(W * H);
  const solids = world.boxes.filter((b) => b.solid && !(b.kind === "gate" && gateOpen(b.gateId!)) && b.y1 > 0.45);
  for (let i = 0; i < W; i++) {
    for (let j = 0; j < H; j++) {
      const x = x0 + i * res;
      const z = z0 + j * res;
      const hit = solids.some((b) => Math.hypot(x - Math.max(b.x0, Math.min(x, b.x1)), z - Math.max(b.z0, Math.min(z, b.z1))) < PLAYER_RADIUS);
      const lava = world.hazards.some((h) => x > h.x0 - 0.3 && x < h.x1 + 0.3 && z > h.z0 - 0.3 && z < h.z1 + 0.3);
      if (hit || lava || x < x0 + PLAYER_RADIUS || x > x1 - PLAYER_RADIUS || z < z0 + PLAYER_RADIUS || z > z1 - PLAYER_RADIUS) blocked[i * H + j] = 1;
    }
  }
  const seen = new Uint8Array(W * H);
  const si = Math.round((world.spawn.x - x0) / res);
  const sj = Math.round((world.spawn.z - z0) / res);
  const stack = [[si, sj]] as [number, number][];
  seen[si * H + sj] = 1;
  while (stack.length) {
    const [i, j] = stack.pop()!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H || seen[ni * H + nj] || blocked[ni * H + nj]) continue;
      seen[ni * H + nj] = 1;
      stack.push([ni, nj]);
    }
  }
  return (x, z, within) => {
    const r = Math.ceil(within / res);
    const ci = Math.round((x - x0) / res);
    const cj = Math.round((z - z0) / res);
    for (let di = -r; di <= r; di++) {
      for (let dj = -r; dj <= r; dj++) {
        const i = ci + di, j = cj + dj;
        if (i < 0 || j < 0 || i >= W || j >= H) continue;
        if (Math.hypot(di * res, dj * res) <= within && seen[i * H + j]) return true;
      }
    }
    return false;
  };
}

/** Distance from (x, z) to the nearest solid box (walls, scenery, pedestals, doors), ignoring invisible bounds. */
export function clearanceAt(world: WorldModel, x: number, z: number): number {
  let best = Infinity;
  for (const b of world.boxes) {
    if (!b.solid || b.kind === "bounds" || b.y1 <= 0.45) continue;
    best = Math.min(best, Math.hypot(x - Math.max(b.x0, Math.min(x, b.x1)), z - Math.max(b.z0, Math.min(z, b.z1))));
  }
  return best;
}

/** A copy of `spec` whose first area is rebuilt with exactly the requested contents (the spec is NOT valid afterwards: world tests only). */
export function reshapeFirstArea(
  base: GameSpec,
  o: { layout: GameSpec["areas"][number]["layout"]; size: "small" | "medium" | "large"; stations: number; npcs: number; collectibles: number; portal: boolean; boss: boolean; hazards?: boolean },
): GameSpec {
  const spec = structuredClone(base);
  spec.mechanics = [...new Set([...spec.mechanics, "collect", "dialogue", "checkpoints", "gates", "hazards", "moving_platforms", "jump"])] as GameSpec["mechanics"];
  const a = spec.areas[0]!;
  const stationProto = a.stations.find((s) => s.kind === "challenge")!;
  const npcProto = a.npcs[0]!;
  a.layout = o.layout;
  a.size = o.size;
  a.hazardLevel = o.hazards === false ? "none" : "high";
  a.stations = Array.from({ length: o.stations }, (_, i) => ({ ...stationProto, id: `st${i}` }));
  a.npcs = Array.from({ length: o.npcs }, (_, i) => ({ ...npcProto, id: `npc${i}` }));
  a.collectibles = { ...a.collectibles, count: o.collectibles };
  if (o.portal) a.portal = { toAreaId: spec.areas[1]!.id, label: "go", requiresMissionIds: [] };
  else delete a.portal;
  spec.bosses = o.boss
    ? [{ id: "bb", areaId: a.id, name: "B", title: "t", intro: "i", defeatLine: "d", look: { color: "#ff0000", shape: "creature" }, phaseStationIds: a.stations.slice(0, Math.min(5, o.stations)).map((s) => s.id) }]
    : [];
  return spec;
}
