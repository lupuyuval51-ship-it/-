/**
 * Tessellation tables for the procedural scenery. Pure numbers (no three.js) so the renderer and the budget tests
 * read the same source: "low" is what Tier C builds, "normal" is the existing look of Tier A and B.
 */
import type { Geo as DecorGeo } from "./decor";
import type { Geo as LifeGeo } from "./flocks";
import type { SkylineGeo } from "@/lib/game/world/skyline";

export type Detail = "normal" | "low";

/** Constructor arguments of the unit geometries used for scenery props. */
export const DECOR_GEO_ARGS: Record<Detail, {
  box: [number, number, number];
  cyl: [number, number, number, number];
  cone: [number, number, number];
  sphere: [number, number, number];
  oct: [number, number];
  torus: [number, number, number, number];
}> = {
  normal: { box: [1, 1, 1], cyl: [1, 1, 1, 10], cone: [1, 1, 10], sphere: [1, 12, 10], oct: [1, 0], torus: [1, 0.14, 8, 20] },
  low: { box: [1, 1, 1], cyl: [1, 1, 1, 6], cone: [1, 1, 6], sphere: [1, 8, 6], oct: [1, 0], torus: [1, 0.2, 4, 10] },
};

/** Distant silhouettes: [radialOrWidthSegments, heightSegments]. */
export const SKYLINE_SEGMENTS: Record<Detail, { cyl: number; cone: number; sphere: [number, number]; dome: [number, number] }> = {
  normal: { cyl: 12, cone: 12, sphere: [14, 10], dome: [16, 8] },
  low: { cyl: 6, cone: 6, sphere: [8, 5], dome: [10, 4] },
};

/** Ambient critters (birds, fish, cars...). */
export const LIFE_SEGMENTS: Record<Detail, { sphere: [number, number]; cone: number; torus: [number, number] }> = {
  normal: { sphere: [12, 8], cone: 8, torus: [6, 20] },
  low: { sphere: [8, 5], cone: 5, torus: [4, 10] },
};

const sphereTris = (w: number, h: number) => w * h * 2 - 2 * w;

export function decorTriangles(geo: DecorGeo, d: Detail): number {
  const a = DECOR_GEO_ARGS[d];
  switch (geo) {
    case "box": return 12;
    case "cyl": return 4 * a.cyl[3];
    case "cone": return 2 * a.cone[2];
    case "sphere": return sphereTris(a.sphere[1], a.sphere[2]);
    case "oct": return 8;
    case "torus": return 2 * a.torus[2] * a.torus[3];
  }
}

export function skylineTriangles(geo: SkylineGeo, d: Detail): number {
  const s = SKYLINE_SEGMENTS[d];
  switch (geo) {
    case "box": return 12;
    case "cyl": return 4 * s.cyl;
    case "cone": return 2 * s.cone;
    case "cone4": return 8;
    case "sphere": return sphereTris(s.sphere[0], s.sphere[1]);
    case "dome": return s.dome[0] * s.dome[1] * 2 - s.dome[0];
  }
}

export function lifeTriangles(geo: LifeGeo, d: Detail): number {
  const s = LIFE_SEGMENTS[d];
  switch (geo) {
    case "box": return 12;
    case "sphere": return sphereTris(s.sphere[0], s.sphere[1]);
    case "cone": return 2 * s.cone;
    case "torus": return 2 * s.torus[0] * s.torus[1];
  }
}
