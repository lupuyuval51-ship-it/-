import { mechanicsForArea } from "../spec/mechanics";
import type { Area } from "../spec/schema";
import type { WorldSpec } from "./build";
import type { Mechanic } from "../spec/constants";
import { rangeOf } from "../util/prng";
import { ENV_DECOR } from "./theme";
import type { BoxKind, DecorItem, EnvTheme, Placed, WorldBox, WorldModel } from "./types";

export interface LayoutCtx {
  spec: WorldSpec;
  area: Area;
  areaIndex: number;
  mech: Set<Mechanic>;
  rng: () => number;
  theme: EnvTheme;
}

export type LayoutResult = Omit<WorldModel, "areaId" | "layout" | "environment" | "seed" | "theme" | "bosses">;

export const makeCtx = (spec: WorldSpec, area: Area, rng: () => number, theme: EnvTheme): LayoutCtx => ({
  spec, area, areaIndex: spec.areas.findIndex((a) => a.id === area.id), mech: mechanicsForArea(spec, area.id), rng, theme,
});

export function box(
  id: string, kind: BoxKind, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, opts: Partial<WorldBox> = {},
): WorldBox {
  return {
    id, kind, x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), z0: Math.min(z0, z1), z1: Math.max(z0, z1),
    visible: kind !== "bounds", solid: kind !== "floor", walkable: kind === "floor" || kind === "platform" || kind === "prop", style: kind, ...opts,
  };
}

export const centered = (id: string, kind: BoxKind, cx: number, cz: number, w: number, d: number, y0: number, y1: number, opts: Partial<WorldBox> = {}): WorldBox =>
  box(id, kind, cx - w / 2, cx + w / 2, y0, y1, cz - d / 2, cz + d / 2, opts);

export const dist2d = (a: { x: number; z: number }, b: { x: number; z: number }): number => Math.hypot(a.x - b.x, a.z - b.z);

export function sizeScale(size: Area["size"]): number {
  return size === "small" ? 0 : size === "medium" ? 1 : 2;
}

/** Rejection-sample `count` points inside an annulus keeping `minDist` from each other and from `avoid` points. */
export function scatter(
  rng: () => number, count: number, region: { minR: number; maxR: number; cx?: number; cz?: number }, minDist: number, avoid: { x: number; z: number; r: number }[], existing: Placed[] = [],
): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  const cx = region.cx ?? 0;
  const cz = region.cz ?? 0;
  for (let tries = 0; out.length < count && tries < count * 60; tries++) {
    const r = Math.sqrt(rangeOf(rng, region.minR * region.minR, region.maxR * region.maxR));
    const a = rng() * Math.PI * 2;
    const p = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r };
    if (avoid.some((q) => dist2d(p, q) < q.r)) continue;
    if (out.some((q) => dist2d(p, q) < minDist)) continue;
    if (existing.some((q) => dist2d(p, q) < minDist)) continue;
    out.push(p);
  }
  return out;
}

/** Among candidate spots, the one farthest from every obstacle. Used to put portals where nothing blocks them. */
export function farthestSpot(candidates: { x: number; z: number }[], avoid: { x: number; z: number }[]): { x: number; z: number } {
  let best = candidates[0]!;
  let bestD = -1;
  for (const c of candidates) {
    const d = avoid.length ? Math.min(...avoid.map((a) => dist2d(c, a))) : 99;
    if (d > bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Scenery dressing outside (and at the edge of) the playable area. */
export function ambientDecor(ctx: LayoutCtx, bounds: { x0: number; x1: number; z0: number; z1: number }, y: number, count: number): DecorItem[] {
  const kinds = ENV_DECOR[ctx.spec.theme.environment].ambient;
  const out: DecorItem[] = [];
  const cx = (bounds.x0 + bounds.x1) / 2;
  const cz = (bounds.z0 + bounds.z1) / 2;
  const hw = (bounds.x1 - bounds.x0) / 2;
  const hd = (bounds.z1 - bounds.z0) / 2;
  for (let i = 0; i < count; i++) {
    const a = ctx.rng() * Math.PI * 2;
    const reach = 1.08 + ctx.rng() * 0.9;
    out.push({
      kind: kinds[Math.floor(ctx.rng() * kinds.length)]!,
      x: cx + Math.cos(a) * hw * reach * 1.15,
      y,
      z: cz + Math.sin(a) * hd * reach * 1.15,
      scale: 0.8 + ctx.rng() * 1.6,
      rot: ctx.rng() * Math.PI * 2,
      rank: i / count, // earlier items are kept at lower detail tiers
      solid: false,
      tint: Math.floor(ctx.rng() * 4),
    });
  }
  return out;
}

export function solidDecorKind(ctx: LayoutCtx): DecorItem["kind"] {
  const kinds = ENV_DECOR[ctx.spec.theme.environment].solid;
  return kinds[Math.floor(ctx.rng() * kinds.length)]!;
}

// ───────────────────────────── clearance & settling ─────────────────────────────

const clampTo = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(v, hi));

/** Distance from (x, z) to the nearest thing that blocks walking (walls, scenery, pedestals, closed doors). Infinity if none. */
export function solidClearance(boxes: readonly WorldBox[], x: number, z: number): number {
  let best = Infinity;
  for (const b of boxes) {
    if (!b.solid || b.kind === "bounds" || b.y1 <= 0.45) continue;
    const d = Math.hypot(x - clampTo(x, b.x0, b.x1), z - clampTo(z, b.z0, b.z1));
    if (d < best) best = d;
  }
  return best;
}

type Rect = { x0: number; x1: number; z0: number; z1: number };
const nearHazard = (hazards: readonly Rect[], x: number, z: number, pad: number): boolean =>
  hazards.some((h) => x > h.x0 - pad && x < h.x1 + pad && z > h.z0 - pad && z < h.z1 + pad);

/** Nothing solid between the two points (so a spot found near an item is on the same side of every wall and door). */
export function lineOfWalk(boxes: readonly WorldBox[], from: { x: number; z: number }, to: { x: number; z: number }): boolean {
  const len = Math.hypot(to.x - from.x, to.z - from.z);
  for (let d = 0.4; d < len; d += 0.4) {
    const t = d / len;
    const x = to.x + (from.x - to.x) * t;
    const z = to.z + (from.z - to.z) * t;
    if (Math.hypot(x - from.x, z - from.z) < 1.0) continue; // the start itself may be hugging a prop
    if (solidClearance(boxes, x, z) < 0.3) return false;
  }
  return true;
}

/** Item kind → clearances: from scenery, from stations, from characters (NPCs and bosses), from the portal, from its own kind. */
const MIN_DISTANCE = {
  npc: { solid: 0.9, station: 3.0, character: 2.6, portal: 3.0, own: 2.2 },
  checkpoint: { solid: 0.9, station: 1.8, character: 1.8, portal: 2.0, own: 2.0 },
  collectible: { solid: 0.6, station: 1.6, character: 1.8, portal: 1.8, own: 1.0 },
} as const;

type Settled = Pick<LayoutResult, "boxes" | "hazards" | "stations" | "npcs" | "collectibles" | "checkpoints" | "portal" | "spawn" | "bounds" | "hasVoid">;

/**
 * Items that can be dropped on top of each other or inside scenery (characters, checkpoints, collectibles) are checked
 * against the finished layout and, only when they collide with something, moved to the nearest free spot that is on the
 * same side of every wall and door. Items that were fine stay exactly where the layout put them. Stations, the portal and
 * bosses are the anchors everything else keeps away from; characters settle first (`npcs`), so bosses can avoid them.
 */
export function settlePlacements(r: Settled, what: "npcs" | "items", bosses: readonly { x: number; z: number }[] = []): void {
  if (r.hasVoid) return; // platformers place everything on its own platform
  const b = r.bounds;
  const lists = { npc: r.npcs, checkpoint: r.checkpoints, collectible: r.collectibles } as const;
  const kinds = (what === "npcs" ? ["npc"] : ["checkpoint", "collectible"]) as (keyof typeof lists)[];

  for (const kind of kinds) {
    const rule = MIN_DISTANCE[kind];
    const own = lists[kind] as Placed[];
    const ok = (p: { x: number; z: number }, self: Placed): boolean => {
      if (p.x < b.x0 + 1 || p.x > b.x1 - 1 || p.z < b.z0 + 1 || p.z > b.z1 - 1) return false;
      if (solidClearance(r.boxes, p.x, p.z) < rule.solid) return false;
      if (nearHazard(r.hazards, p.x, p.z, 0.8)) return false;
      if (r.stations.some((s) => dist2d(p, s) < rule.station)) return false;
      if (r.npcs.some((n) => n !== self && dist2d(p, n) < rule.character) || bosses.some((s) => dist2d(p, s) < rule.character)) return false;
      if (r.portal && dist2d(p, r.portal) < rule.portal) return false;
      if (own.some((o) => o !== self && dist2d(p, o) < rule.own)) return false;
      if (kind === "npc" && dist2d(p, r.spawn) < 1.6) return false;
      return true;
    };
    for (const item of own) {
      if (ok(item, item)) continue;
      let moved = false;
      for (let radius = 0.6; radius <= 5 && !moved; radius += 0.6) {
        const steps = Math.max(8, Math.round(radius * 8));
        for (let k = 0; k < steps && !moved; k++) {
          const a = (k / steps) * Math.PI * 2 + 0.3;
          const cand = { x: item.x + Math.cos(a) * radius, z: item.z + Math.sin(a) * radius };
          if (!ok(cand, item) || !lineOfWalk(r.boxes, item, cand)) continue;
          item.x = cand.x;
          item.z = cand.z;
          moved = true;
        }
      }
    }
  }
}
