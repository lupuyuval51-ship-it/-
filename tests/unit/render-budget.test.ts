import { describe, expect, it } from "vitest";
import { RENDER_PROFILES, type RenderProfile } from "@/config/graphics";
import type { GraphicsTier } from "@/config/plans";
import { resolveGraphicsTier } from "@/config/plans";
import { ENVIRONMENTS, LAYOUTS, type Environment, type Layout } from "@/lib/game/spec/constants";
import { buildWorld } from "@/lib/game/world/build";
import type { WorldModel } from "@/lib/game/world/types";
import { boxPlan, decorItemsFor, flockCountFor, particleSlots, sceneBudget } from "@/components/game/scene/budget";
import { DECOR_PARTS, LOW_DETAIL_MAX_PARTS, partsFor } from "@/components/game/scene/decor";
import { DECOR_GEO_ARGS, LIFE_SEGMENTS, SKYLINE_SEGMENTS, decorTriangles, lifeTriangles, skylineTriangles } from "@/components/game/scene/geometry";
import { FrameGovernor, MAX_QUALITY_LEVEL, degradeProfile } from "@/components/game/scene/governor";
import { validDemoSpec } from "./helpers";

const TIERS: GraphicsTier[] = ["A", "B", "C"];

interface Case { env: Environment; layout: Layout; world: WorldModel }

/** One world per environment x layout (40 worlds), plus the platformer's void world per environment. */
function allWorlds(): Case[] {
  const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
  const out: Case[] = [];
  for (const env of ENVIRONMENTS) {
    for (const layout of LAYOUTS) {
      const s = { ...spec, theme: { ...spec.theme, environment: env }, areas: spec.areas.map((a, i) => (i === 0 ? { ...a, layout } : a)) };
      out.push({ env, layout, world: buildWorld(s, s.areas[0]!.id) });
    }
  }
  const platformer = validDemoSpec({ gameType: "platformer", mode: "FULL" });
  for (const env of ENVIRONMENTS) {
    const s = { ...platformer, theme: { ...platformer.theme, environment: env } };
    out.push({ env, layout: s.areas[0]!.layout, world: buildWorld(s, s.areas[0]!.id) });
  }
  return out;
}

const WORLDS = allWorlds();

describe("render profiles", () => {
  it("cover every environment and layout", () => {
    expect(WORLDS.length).toBe(ENVIRONMENTS.length * LAYOUTS.length + ENVIRONMENTS.length);
    expect(new Set(WORLDS.map((w) => w.layout)).size).toBe(LAYOUTS.length);
    expect(WORLDS.some((w) => w.world.hasVoid)).toBe(true);
  });

  it("Plus and Pro resolve to the very same Tier A profile", () => {
    expect(RENDER_PROFILES[resolveGraphicsTier("PLUS", "A")]).toBe(RENDER_PROFILES[resolveGraphicsTier("PRO", "A")]);
    expect(RENDER_PROFILES.A.geometry).toBe("normal");
    expect(RENDER_PROFILES.A.limits.mergeStatic).toBe(false);
    expect(RENDER_PROFILES.A.limits.lifeScale).toBe(1);
    expect(RENDER_PROFILES.A.limits.water).toBe(1);
  });

  it("survive a JSON round trip (the server sends them to the browser)", () => {
    for (const t of TIERS) expect(JSON.parse(JSON.stringify(RENDER_PROFILES[t]))).toEqual(RENDER_PROFILES[t]);
  });

  it("Tier C is lighter than B, which is lighter than A, on every cost knob", () => {
    const { A, B, C } = RENDER_PROFILES;
    for (const [hi, lo] of [[A, B], [B, C]] as const) {
      expect(hi.pixelRatioMax).toBeGreaterThanOrEqual(lo.pixelRatioMax);
      expect(hi.environmentDetail).toBeGreaterThanOrEqual(lo.environmentDetail);
      expect(hi.particles.ambient).toBeGreaterThan(lo.particles.ambient);
      expect(hi.particles.burst).toBeGreaterThan(lo.particles.burst);
      expect(hi.limits.looseDecor).toBeGreaterThanOrEqual(lo.limits.looseDecor);
      expect(hi.limits.skylinePieces).toBeGreaterThanOrEqual(lo.limits.skylinePieces);
      expect(hi.limits.lifeScale).toBeGreaterThanOrEqual(lo.limits.lifeScale);
      expect(hi.limits.water).toBeGreaterThanOrEqual(lo.limits.water);
    }
    expect(C.pixelRatioMax).toBeLessThan(1);
    expect(C.shadows.enabled).toBe(false);
    expect(C.antialias).toBe(false);
    expect(C.glow).toBe(false);
    expect(C.particles.trails).toBe(false);
    expect(C.accentLights).toBe(0);
    expect(C.geometry).toBe("low");
    expect(C.limits.mergeStatic).toBe(true);
    expect(C.limits.water).toBe(0);
  });
});

describe("scene budgets per tier, for every environment and layout", () => {
  it("Tier A still draws every decor item (no accidental regression of the top tier)", () => {
    for (const { world } of WORLDS) expect(decorItemsFor(world, RENDER_PROFILES.A)).toHaveLength(world.decor.length);
  });

  it("Tier C stays inside hard budgets in all worlds", () => {
    for (const { env, layout, world } of WORLDS) {
      const b = sceneBudget(world, RENDER_PROFILES.C);
      const tag = `${env}/${layout}`;
      expect(b.drawCalls, `draw calls ${tag}`).toBeLessThanOrEqual(56);
      expect(b.triangles, `triangles ${tag}`).toBeLessThanOrEqual(6000);
      expect(b.particleSlots, `particles ${tag}`).toBeLessThanOrEqual(64);
      expect(b.skylinePieces, `skyline ${tag}`).toBeLessThanOrEqual(14);
      expect(b.critters, `critters ${tag}`).toBeLessThanOrEqual(6);
      expect(b.lifeMatricesPerFrame, `life matrices ${tag}`).toBeLessThanOrEqual(24);
      expect(b.decorDrawCalls, `decor draw calls ${tag}`).toBeLessThanOrEqual(30);
      expect(b.lights, `lights ${tag}`).toBe(2);
      expect(b.shadowCastingLights, `shadows ${tag}`).toBe(0);
      const loose = decorItemsFor(world, RENDER_PROFILES.C).filter((d) => !d.solid).length;
      expect(loose, `loose decor ${tag}`).toBeLessThanOrEqual(RENDER_PROFILES.C.limits.looseDecor);
    }
  });

  it("Tier B stays inside its (looser) budgets in all worlds", () => {
    for (const { env, layout, world } of WORLDS) {
      const b = sceneBudget(world, RENDER_PROFILES.B);
      const tag = `${env}/${layout}`;
      expect(b.particleSlots, `particles ${tag}`).toBeLessThanOrEqual(300);
      expect(b.shadowCastingLights, `shadows ${tag}`).toBeLessThanOrEqual(1);
      expect(b.lights, `lights ${tag}`).toBeLessThanOrEqual(3);
    }
  });

  it("every cost drops (or stays equal) from A to B to C in every world", () => {
    for (const { env, layout, world } of WORLDS) {
      const [a, b, c] = TIERS.map((t) => sceneBudget(world, RENDER_PROFILES[t]));
      for (const key of ["drawCalls", "triangles", "decorItems", "decorInstances", "skylinePieces", "critters", "lifeMatricesPerFrame", "particleSlots", "lights"] as const) {
        expect(a![key], `A>=B ${key} ${env}/${layout}`).toBeGreaterThanOrEqual(b![key]);
        expect(b![key], `B>=C ${key} ${env}/${layout}`).toBeGreaterThanOrEqual(c![key]);
      }
      expect(c!.triangles).toBeLessThan(a!.triangles);
      expect(c!.particleSlots).toBeLessThan(a!.particleSlots / 10);
    }
  });

  it("Tier C more than halves the draw calls of box-heavy levels", () => {
    const heavy = WORLDS.filter((w) => w.layout === "rooms");
    expect(heavy.length).toBeGreaterThanOrEqual(ENVIRONMENTS.length);
    for (const { env, world } of heavy) {
      const a = sceneBudget(world, RENDER_PROFILES.A);
      const c = sceneBudget(world, RENDER_PROFILES.C);
      expect(c.drawCalls, env).toBeLessThan(a.drawCalls * 0.5);
    }
  });

  it("budgets are deterministic", () => {
    const w = WORLDS[7]!.world;
    expect(sceneBudget(w, RENDER_PROFILES.C)).toEqual(sceneBudget(w, RENDER_PROFILES.C));
  });
});

describe("static box merging (Tier C)", () => {
  it("keeps every visible box, groups static ones by style and leaves movers and gates alone", () => {
    for (const { env, layout, world } of WORLDS) {
      const visible = world.boxes.filter((b) => b.visible);
      const c = boxPlan(world, RENDER_PROFILES.C);
      const mergedCount = [...c.merged.values()].reduce((n, g) => n + g.length, 0);
      expect(c.individual.length + mergedCount, `${env}/${layout}`).toBe(visible.length);
      for (const b of c.individual) expect(Boolean(b.mover) || b.kind === "gate").toBe(true);
      for (const group of c.merged.values()) for (const b of group) expect(b.mover === undefined && b.kind !== "gate").toBe(true);
      expect(c.merged.size).toBeLessThanOrEqual(new Set(visible.map((b) => b.style)).size);
      const a = boxPlan(world, RENDER_PROFILES.A);
      expect(a.merged.size).toBe(0);
      expect(a.individual).toHaveLength(visible.length);
    }
  });
});

describe("low-detail geometry", () => {
  it("thins props with many parts and never invents parts", () => {
    for (const kind of Object.keys(DECOR_PARTS) as (keyof typeof DECOR_PARTS)[]) {
      const all = DECOR_PARTS[kind];
      const low = partsFor(kind, true);
      expect(partsFor(kind, false)).toBe(all);
      expect(low.length).toBeGreaterThanOrEqual(1);
      expect(low.length).toBeLessThanOrEqual(Math.max(all.length > LOW_DETAIL_MAX_PARTS ? LOW_DETAIL_MAX_PARTS : all.length, 1));
      for (const p of low) expect(all).toContain(p);
    }
    expect(partsFor("palm", true).length).toBeLessThan(DECOR_PARTS.palm.length);
  });

  it("uses fewer triangles than normal detail for every primitive", () => {
    for (const geo of ["cyl", "cone", "sphere", "torus"] as const) expect(decorTriangles(geo, "low")).toBeLessThan(decorTriangles(geo, "normal"));
    for (const geo of ["cyl", "cone", "sphere", "dome"] as const) expect(skylineTriangles(geo, "low")).toBeLessThan(skylineTriangles(geo, "normal"));
    for (const geo of ["sphere", "cone", "torus"] as const) expect(lifeTriangles(geo, "low")).toBeLessThan(lifeTriangles(geo, "normal"));
    expect(DECOR_GEO_ARGS.low.cyl[3]).toBeGreaterThanOrEqual(5);
    expect(SKYLINE_SEGMENTS.low.cyl).toBeGreaterThanOrEqual(5);
    expect(LIFE_SEGMENTS.low.sphere[0]).toBeGreaterThanOrEqual(6);
  });
});

describe("pure budget helpers", () => {
  it("particle slots follow the profile and are zero-safe", () => {
    for (const t of TIERS) {
      const s = particleSlots(RENDER_PROFILES[t]);
      expect(s.total).toBe(s.ambient + s.burst + s.trail);
    }
    const none = { ...RENDER_PROFILES.C, particles: { ambient: 0, burst: 0, trails: false } };
    expect(particleSlots(none).total).toBe(0);
  });

  it("critter counts shrink with detail and can reach zero", () => {
    expect(flockCountFor(16, RENDER_PROFILES.A)).toBe(16);
    expect(flockCountFor(16, RENDER_PROFILES.C)).toBeLessThan(flockCountFor(16, RENDER_PROFILES.B));
    expect(flockCountFor(1, RENDER_PROFILES.C)).toBe(1);
    expect(flockCountFor(16, { ...RENDER_PROFILES.C, limits: { ...RENDER_PROFILES.C.limits, lifeScale: 0 } })).toBe(0);
  });
});

describe("dynamic quality fallback", () => {
  const numbers = (p: RenderProfile) => ({
    pixelRatioMax: p.pixelRatioMax,
    shadowMap: p.shadows.mapSize,
    casters: p.shadows.casters,
    accent: p.accentLights,
    detail: p.environmentDetail,
    ambient: p.particles.ambient,
    burst: p.particles.burst,
    looseDecor: p.limits.looseDecor,
    skylinePieces: p.limits.skylinePieces,
    skylineMin: p.limits.skylineMin,
    lifeScale: p.limits.lifeScale,
    water: p.limits.water,
    textureSize: p.textureSize,
  });

  it("level 0 is the granted profile itself", () => {
    for (const t of TIERS) expect(degradeProfile(RENDER_PROFILES[t], 0)).toBe(RENDER_PROFILES[t]);
  });

  it("never raises anything above the tier, at any level", () => {
    for (const t of TIERS) {
      const base = RENDER_PROFILES[t];
      const baseN = numbers(base);
      for (let level = 0; level <= MAX_QUALITY_LEVEL + 2; level++) {
        const p = degradeProfile(base, level);
        const n = numbers(p);
        for (const k of Object.keys(n) as (keyof typeof n)[]) expect(n[k], `${t} L${level} ${k}`).toBeLessThanOrEqual(baseN[k]);
        if (!base.glow) expect(p.glow).toBe(false);
        if (!base.particles.trails) expect(p.particles.trails).toBe(false);
        if (!base.shadows.enabled) expect(p.shadows.enabled).toBe(false);
        if (!base.limits.mergeStatic) expect(p.limits.mergeStatic).toBe(false);
        expect(p.tier).toBe(base.tier);
        expect(p.geometry).toBe(base.geometry);
        expect(p.materials).toBe(base.materials);
        expect(p.sky).toBe(base.sky);
      }
    }
  });

  it("each level is no more expensive than the previous one, in every world", () => {
    for (const t of TIERS) {
      for (const { env, layout, world } of WORLDS.filter((_, i) => i % 3 === 0)) {
        let prev = sceneBudget(world, RENDER_PROFILES[t]);
        for (let level = 1; level <= MAX_QUALITY_LEVEL; level++) {
          const cur = sceneBudget(world, degradeProfile(RENDER_PROFILES[t], level));
          for (const key of ["drawCalls", "triangles", "decorItems", "skylinePieces", "critters", "lifeMatricesPerFrame", "particleSlots", "lights", "shadowCastingLights"] as const) {
            expect(cur[key], `${t} L${level} ${key} ${env}/${layout}`).toBeLessThanOrEqual(prev[key]);
          }
          prev = cur;
        }
      }
    }
  });

  it("the last step really is light: no shadows, no loose decor, no ambient life", () => {
    for (const { world } of WORLDS) {
      const b = sceneBudget(world, degradeProfile(RENDER_PROFILES.A, MAX_QUALITY_LEVEL));
      expect(b.shadowCastingLights).toBe(0);
      expect(b.lights).toBe(2);
      expect(b.critters).toBe(0);
      expect(b.skylinePieces).toBeLessThanOrEqual(6);
      expect(decorItemsFor(world, degradeProfile(RENDER_PROFILES.A, MAX_QUALITY_LEVEL)).every((d) => d.solid)).toBe(true);
    }
  });

  it("does not mutate the profile it was given", () => {
    const before = JSON.stringify(RENDER_PROFILES.A);
    degradeProfile(RENDER_PROFILES.A, MAX_QUALITY_LEVEL);
    expect(JSON.stringify(RENDER_PROFILES.A)).toBe(before);
  });
});

describe("FrameGovernor", () => {
  const run = (g: FrameGovernor, dt: number, seconds: number) => {
    const steps: number[] = [];
    for (let t = 0; t < seconds; t += dt) {
      const r = g.push(dt);
      if (r !== null) steps.push(r);
    }
    return steps;
  };

  it("stays at level 0 at 60 and 40 fps", () => {
    expect(run(new FrameGovernor(), 1 / 60, 30)).toEqual([]);
    expect(run(new FrameGovernor(), 1 / 40, 30)).toEqual([]);
  });

  it("steps down after two sustained slow windows, then keeps stepping while it stays slow, up to the maximum", () => {
    const g = new FrameGovernor();
    const steps = run(g, 1 / 22, 120);
    expect(steps).toEqual([1, 2, 3, 4]);
    expect(g.level).toBe(MAX_QUALITY_LEVEL);
  });

  it("does not step during the warm-up period", () => {
    const g = new FrameGovernor();
    expect(run(g, 1 / 22, 1.4)).toEqual([]);
  });

  it("steps after a single window when the game is very slow", () => {
    const g = new FrameGovernor();
    const steps = run(g, 1 / 10, 6);
    expect(steps[0]).toBe(1);
  });

  it("one slow window followed by recovery does not step", () => {
    const g = new FrameGovernor();
    run(g, 1 / 60, 2);
    expect(run(g, 1 / 22, 2)).toEqual([]);
    expect(run(g, 1 / 60, 10)).toEqual([]);
    expect(g.level).toBe(0);
  });

  it("ignores long hitches (tab switch, garbage collection)", () => {
    const g = new FrameGovernor();
    for (let i = 0; i < 20; i++) expect(g.push(1.5)).toBeNull();
    expect(run(g, 1 / 60, 20)).toEqual([]);
  });

  it("never goes back up, even after the device recovers", () => {
    const g = new FrameGovernor();
    run(g, 1 / 22, 20);
    const level = g.level;
    expect(level).toBeGreaterThan(0);
    run(g, 1 / 120, 60);
    expect(g.level).toBe(level);
  });

  it("ignores invalid frame times and clamps the start level", () => {
    const g = new FrameGovernor({ startLevel: 99 });
    expect(g.level).toBe(MAX_QUALITY_LEVEL);
    expect(g.push(Number.NaN)).toBeNull();
    expect(g.push(-1)).toBeNull();
    expect(new FrameGovernor({ startLevel: -3 }).level).toBe(0);
  });
});
