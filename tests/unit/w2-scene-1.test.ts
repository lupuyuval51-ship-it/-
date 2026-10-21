import { afterEach, describe, expect, it } from "vitest";
import * as THREE from "three";
import { RENDER_PROFILES } from "@/config/graphics";
import type { GraphicsTier } from "@/config/plans";
import { ENVIRONMENTS } from "@/lib/game/spec/constants";
import { buildWorld } from "@/lib/game/world/build";
import { sceneBudget } from "@/components/game/scene/budget";
import { DECOR_GEO_ARGS, LIFE_SEGMENTS, SKYLINE_SEGMENTS, decorTriangles, lifeTriangles, skylineTriangles, type Detail } from "@/components/game/scene/geometry";
import {
  DPR_SCALE, FrameGovernor, MAX_QUALITY_LEVEL, MIN_DPR, degradeProfile, dprForLevel, forgetRememberedLevels,
} from "@/components/game/scene/governor";
import { validDemoSpec } from "./helpers";

const TIERS: GraphicsTier[] = ["A", "B", "C"];
/** The ratio the canvas starts from on a screen: the profile's cap, or the screen's own ratio when that is lower (as in GameCanvas). */
const baseDpr = (t: GraphicsTier, screen: number) => Math.min(RENDER_PROFILES[t].pixelRatioMax, screen);

afterEach(() => forgetRememberedLevels());

/** Feeds frames of `dt` seconds for `seconds`; the levels the governor stepped to, in order. */
const run = (g: FrameGovernor, dt: number, seconds: number) => {
  const out: number[] = [];
  for (let t = 0; t < seconds; t += dt) {
    const next = g.push(dt);
    if (next !== null) out.push(next);
  }
  return out;
};

describe("the pixel ratio of a fallback level never rises above the tier's own", () => {
  it("Tier C (0.4) stays at 0.4 at every level: the floor used to lift it to 0.6, 2.25 times the pixels", () => {
    for (let level = 0; level <= MAX_QUALITY_LEVEL; level++) expect(dprForLevel(baseDpr("C", 2.75), level)).toBe(0.4);
  });

  it("for every tier and screen, each level is at most the previous one and at most the starting ratio", () => {
    for (const t of TIERS) {
      for (const screen of [1, 1.5, 2, 2.75, 3, 4]) {
        const base = baseDpr(t, screen);
        let prev = base;
        for (let level = 0; level <= MAX_QUALITY_LEVEL; level++) {
          const dpr = dprForLevel(base, level);
          expect(dpr, `${t} screen ${screen} L${level}`).toBeLessThanOrEqual(prev);
          expect(dpr).toBeLessThanOrEqual(base);
          expect(dpr).toBeGreaterThanOrEqual(Math.min(base, MIN_DPR));
          prev = dpr;
        }
      }
    }
  });

  it("still steps a high ratio down by the ladder's scale, with the floor", () => {
    DPR_SCALE.forEach((scale, level) => expect(dprForLevel(3, level)).toBeCloseTo(Math.max(MIN_DPR, 3 * scale), 10));
    expect(dprForLevel(0.9, MAX_QUALITY_LEVEL)).toBe(MIN_DPR);
  });

  it("an out-of-range level is the nearest level of the ladder, never the full ratio", () => {
    expect(dprForLevel(3, 99)).toBe(dprForLevel(3, MAX_QUALITY_LEVEL));
    expect(dprForLevel(3, -2)).toBe(3);
    expect(dprForLevel(3, Number.NaN)).toBe(3);
    expect(dprForLevel(3, 2.6)).toBe(dprForLevel(3, 2));
  });

  it("a missing screen ratio never reaches the canvas as NaN or 0", () => {
    for (const bad of [Number.NaN, 0, -1, Number.POSITIVE_INFINITY]) {
      const dpr = dprForLevel(bad, 1);
      expect(Number.isFinite(dpr) && dpr > 0, String(bad)).toBe(true);
    }
  });
});

describe("a phone that draws only a few frames a second still steps down", () => {
  // Every frame above 0.25 s used to be ignored as a hitch, so at 3 fps no window ever filled and the governor never moved.
  it("3 fps steps down, and keeps stepping to the last level", () => {
    const g = new FrameGovernor();
    const steps = run(g, 1 / 3, 60);
    expect(steps[0]).toBe(1);
    expect(steps).toEqual([1, 2, 3, 4]);
    expect(g.level).toBe(MAX_QUALITY_LEVEL);
  });

  it("the first step comes after a warm-up plus a window of long frames, not on the first slow frames", () => {
    const g = new FrameGovernor();
    for (let i = 0; i < 11; i++) expect(g.push(0.3)).toBeNull(); // 3.3 s
    expect(g.push(0.3)).toBe(1); // 3.6 s: more than the 1.5 s warm-up plus a 2 s window
    for (let i = 0; i < 11; i++) expect(g.push(0.3)).toBeNull(); // the next step needs a whole new run
    expect(g.push(0.3)).toBe(2);
  });

  it("start-up stalls (a few long frames while shaders compile) do not step a device that then keeps up", () => {
    const g = new FrameGovernor();
    for (let i = 0; i < 4; i++) expect(g.push(0.6)).toBeNull();
    expect(run(g, 1 / 60, 30)).toEqual([]);
    expect(g.level).toBe(0);
  });

  it("isolated long frames between good ones never add up to a step", () => {
    const g = new FrameGovernor();
    for (let i = 0; i < 400; i++) {
      expect(g.push(i % 10 === 0 ? 0.4 : 1 / 60)).toBeNull();
    }
    expect(g.level).toBe(0);
  });

  it("frames longer than a second are still a tab switch or the app in the background, never a reason to step", () => {
    const g = new FrameGovernor();
    for (let i = 0; i < 50; i++) expect(g.push(2)).toBeNull();
    expect(g.level).toBe(0);
  });

  it("never steps past the last level", () => {
    const g = new FrameGovernor({ startLevel: MAX_QUALITY_LEVEL });
    expect(run(g, 0.4, 30)).toEqual([]);
    expect(g.level).toBe(MAX_QUALITY_LEVEL);
  });
});

describe("nonsense levels", () => {
  it("a start level that is not a whole number of the ladder is made one", () => {
    expect(new FrameGovernor({ startLevel: Number.NaN }).level).toBe(0);
    expect(new FrameGovernor({ startLevel: 2.7 }).level).toBe(2);
    const g = new FrameGovernor({ startLevel: 2.7 });
    expect(run(g, 1 / 10, 30)).toEqual([3, 4]);
  });

  it("degradeProfile treats a level that is not a number as level 0 (the granted profile)", () => {
    for (const t of TIERS) expect(degradeProfile(RENDER_PROFILES[t], Number.NaN)).toBe(RENDER_PROFILES[t]);
  });
});

describe("the triangle tables are the triangles three.js really builds", () => {
  const tris = (g: THREE.BufferGeometry) => (g.index ? g.index.count : g.attributes.position!.count) / 3;
  const details: Detail[] = ["normal", "low"];

  it("scenery props (built as WorldView builds them)", () => {
    for (const d of details) {
      const a = DECOR_GEO_ARGS[d];
      expect(tris(new THREE.BoxGeometry(...a.box))).toBe(decorTriangles("box", d));
      expect(tris(new THREE.CylinderGeometry(...a.cyl))).toBe(decorTriangles("cyl", d));
      expect(tris(new THREE.ConeGeometry(...a.cone))).toBe(decorTriangles("cone", d));
      expect(tris(new THREE.SphereGeometry(...a.sphere))).toBe(decorTriangles("sphere", d));
      expect(tris(new THREE.OctahedronGeometry(...a.oct))).toBe(decorTriangles("oct", d));
      expect(tris(new THREE.TorusGeometry(...a.torus))).toBe(decorTriangles("torus", d));
    }
  });

  it("skyline silhouettes (built as Backdrop builds them)", () => {
    for (const d of details) {
      const s = SKYLINE_SEGMENTS[d];
      expect(tris(new THREE.BoxGeometry(1, 1, 1))).toBe(skylineTriangles("box", d));
      expect(tris(new THREE.CylinderGeometry(1, 1, 1, s.cyl))).toBe(skylineTriangles("cyl", d));
      expect(tris(new THREE.ConeGeometry(1, 1, s.cone))).toBe(skylineTriangles("cone", d));
      expect(tris(new THREE.ConeGeometry(0.7071, 1, 4))).toBe(skylineTriangles("cone4", d));
      expect(tris(new THREE.SphereGeometry(1, s.sphere[0], s.sphere[1]))).toBe(skylineTriangles("sphere", d));
      expect(tris(new THREE.SphereGeometry(1, s.dome[0], s.dome[1], 0, Math.PI * 2, 0, Math.PI / 2))).toBe(skylineTriangles("dome", d));
    }
  });

  it("ambient life (built as Life builds it)", () => {
    for (const d of details) {
      const s = LIFE_SEGMENTS[d];
      expect(tris(new THREE.BoxGeometry(1, 1, 1))).toBe(lifeTriangles("box", d));
      expect(tris(new THREE.SphereGeometry(0.5, s.sphere[0], s.sphere[1]))).toBe(lifeTriangles("sphere", d));
      expect(tris(new THREE.ConeGeometry(0.5, 1, s.cone))).toBe(lifeTriangles("cone", d));
      expect(tris(new THREE.TorusGeometry(0.5, 0.05, s.torus[0], s.torus[1]))).toBe(lifeTriangles("torus", d));
    }
  });
});

describe("the budget counts the shadow-casting lights the scene really has", () => {
  it("one (the sun) when the profile has shadows, none otherwise, in every environment", () => {
    const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
    for (const env of ENVIRONMENTS) {
      const s = { ...spec, theme: { ...spec.theme, environment: env } };
      const world = buildWorld(s, s.areas[0]!.id);
      for (const t of TIERS) {
        const p = RENDER_PROFILES[t];
        expect(sceneBudget(world, p).shadowCastingLights, `${env}/${t}`).toBe(p.shadows.enabled ? 1 : 0);
        expect(sceneBudget(world, degradeProfile(p, 2)).shadowCastingLights).toBe(0);
      }
    }
  });
});
