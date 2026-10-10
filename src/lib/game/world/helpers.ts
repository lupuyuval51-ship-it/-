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

export type LayoutResult = Omit<WorldModel, "areaId" | "layout" | "environment" | "seed" | "theme">;

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
