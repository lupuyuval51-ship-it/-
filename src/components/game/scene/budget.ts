/**
 * Pure render budgets. Everything the renderer decides about "how much to draw" for a tier lives here as plain
 * functions of (world, profile), so the numbers can be unit-tested for every layout and environment without a GPU.
 * The React components call the same functions, so the tested budget is the drawn budget.
 */
import type { RenderProfile } from "@/config/graphics";
import { buildSkyline, buildWater, type SkylinePiece } from "@/lib/game/world/skyline";
import type { DecorItem, WorldBox, WorldModel } from "@/lib/game/world/types";
import { partsFor } from "./decor";
import { FLOCKS, PARTS } from "./flocks";
import { decorTriangles, lifeTriangles, skylineTriangles } from "./geometry";

/** Decor that is drawn at this profile: solid props always (they have collision), the rest by rank and cap. */
export function decorItemsFor(world: WorldModel, profile: RenderProfile): DecorItem[] {
  const out: DecorItem[] = [];
  let loose = 0;
  for (const item of world.decor) {
    if (item.solid) {
      out.push(item);
      continue;
    }
    if (item.rank >= profile.environmentDetail) continue;
    if (loose >= profile.limits.looseDecor) continue;
    loose += 1;
    out.push(item);
  }
  return out;
}

/** The nearest-to-the-start slice of the skyline that this profile keeps (a ring, so a prefix is still balanced). */
export function skylineFor(all: SkylinePiece[], profile: RenderProfile): SkylinePiece[] {
  const keep = Math.max(profile.limits.skylineMin, profile.environmentDetail);
  const kept = all.filter((_, i) => i / all.length < keep);
  return kept.slice(0, profile.limits.skylinePieces);
}

export function flockCountFor(base: number, profile: RenderProfile): number {
  if (profile.limits.lifeScale <= 0) return 0;
  const n = Math.round(base * Math.min(1, 0.25 + profile.environmentDetail * 0.75) * profile.limits.lifeScale);
  return Math.max(1, n);
}

/** Particle slots the profile allocates: ambient motes, the burst pool and the movement trail. */
export function particleSlots(profile: RenderProfile): { ambient: number; burst: number; trail: number; total: number } {
  const ambient = profile.particles.ambient;
  const burst = profile.particles.burst > 0 ? Math.max(8, profile.particles.burst * 6) : 0;
  const trail = profile.particles.trails ? 60 : 0;
  return { ambient, burst, trail, total: ambient + burst + trail };
}

/**
 * Level geometry split for drawing. With `mergeStatic` the boxes that never move or open are grouped by material
 * style (one mesh per style); movers and gates always stay individual because they are animated.
 */
export function boxPlan(world: WorldModel, profile: RenderProfile): { individual: WorldBox[]; merged: Map<string, WorldBox[]> } {
  const visible = world.boxes.filter((b) => b.visible);
  if (!profile.limits.mergeStatic) return { individual: visible, merged: new Map() };
  const individual: WorldBox[] = [];
  const merged = new Map<string, WorldBox[]>();
  for (const b of visible) {
    if (b.mover || b.kind === "gate") {
      individual.push(b);
      continue;
    }
    const key = b.style;
    const list = merged.get(key);
    if (list) list.push(b);
    else merged.set(key, [b]);
  }
  return { individual, merged };
}

export interface SceneBudget {
  /** Individually drawn level geometry (platforms, walls, gates...). */
  boxMeshes: number;
  decorItems: number;
  /** Instanced meshes (one draw call each) and their total instances. */
  decorDrawCalls: number;
  decorInstances: number;
  skylinePieces: number;
  skylineDrawCalls: number;
  critters: number;
  /** Instanced meshes for ambient life, and matrices composed on the CPU every frame. */
  lifeDrawCalls: number;
  lifeMatricesPerFrame: number;
  particleSlots: number;
  /** Lights in the scene (sun + hemisphere + accents). */
  lights: number;
  shadowCastingLights: number;
  /** Rough count of draw calls before characters/stations, for comparing tiers. */
  drawCalls: number;
  /** Triangles in level geometry, scenery, skyline and ambient life (characters and stations excluded). */
  triangles: number;
}

export function sceneBudget(world: WorldModel, profile: RenderProfile): SceneBudget {
  const detail = profile.geometry;
  const plan = boxPlan(world, profile);
  const boxMeshes = plan.individual.length + plan.merged.size;
  let triangles = (plan.individual.length + [...plan.merged.values()].reduce((n, g) => n + g.length, 0)) * 12;

  const decor = decorItemsFor(world, profile);
  const kinds = new Map<string, number>();
  for (const it of decor) kinds.set(it.kind, (kinds.get(it.kind) ?? 0) + 1);
  let decorDrawCalls = 0;
  let decorInstances = 0;
  for (const [kind, n] of kinds) {
    const parts = partsFor(kind as DecorItem["kind"], detail === "low");
    decorDrawCalls += parts.length;
    decorInstances += parts.length * n;
    for (const part of parts) triangles += decorTriangles(part.geo, detail) * n;
  }

  const groundY = world.hasVoid ? world.killY + 3 : -0.03;
  const sky = skylineFor(buildSkyline(world.environment, world.theme, world.seed, groundY), profile);
  const skylineDrawCalls = new Set(sky.map((p) => p.geo)).size;
  for (const p of sky) triangles += skylineTriangles(p.geo, detail);
  const water = world.hasVoid || profile.limits.water === 0 ? [] : buildWater(world.environment, world.theme, world.seed, world.bounds);
  const waterDrawCalls = new Set(water.map((p) => `${p.shape}-${p.role}`)).size;

  let critters = 0;
  let lifeDrawCalls = 0;
  let lifeMatricesPerFrame = 0;
  for (const f of FLOCKS[world.environment] ?? []) {
    const n = flockCountFor(f.count, profile);
    if (n === 0) continue;
    critters += n;
    lifeDrawCalls += PARTS[f.kind].length;
    lifeMatricesPerFrame += n * PARTS[f.kind].length;
    for (const part of PARTS[f.kind]) triangles += lifeTriangles(part.geo, detail) * n;
  }

  const slots = particleSlots(profile);
  const accents = Math.min(profile.accentLights, world.stations.length + (world.portal ? 1 : 0));
  const lights = 2 + accents;
  const hasPoints = slots.ambient > 0 ? 2 : 1;
  const drawCalls = boxMeshes + decorDrawCalls + skylineDrawCalls + waterDrawCalls + lifeDrawCalls + hasPoints + 2 /* ground + grid */ + (world.hazards.length > 0 ? world.hazards.length : 0);
  return {
    boxMeshes,
    decorItems: decor.length,
    decorDrawCalls,
    decorInstances,
    skylinePieces: sky.length,
    skylineDrawCalls: skylineDrawCalls + waterDrawCalls,
    critters,
    lifeDrawCalls,
    lifeMatricesPerFrame,
    particleSlots: slots.total,
    lights,
    shadowCastingLights: profile.shadows.enabled ? profile.shadows.casters : 0,
    drawCalls,
    triangles,
  };
}
