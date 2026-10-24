import { describe, expect, it } from "vitest";
import { ENVIRONMENTS } from "@/lib/game/spec/constants";
import { buildSkyline, buildWater, WATER_CLEARANCE, type WaterPiece } from "@/lib/game/world/skyline";
import { themeFor } from "@/lib/game/world/theme";

describe("skyline", () => {
  for (const env of ENVIRONMENTS) {
    it(`${env}: deterministic, non-empty, sits outside the playable area and inside the camera's far plane`, () => {
      const theme = themeFor(env, "day");
      const a = buildSkyline(env, theme, 12345, 0);
      const b = buildSkyline(env, theme, 12345, 0);
      expect(a.length).toBeGreaterThan(8);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      expect(JSON.stringify(buildSkyline(env, theme, 999, 0))).not.toBe(JSON.stringify(a));
      for (const p of a) {
        const r = Math.hypot(p.x, p.z);
        expect(r, `${env} piece too close`).toBeGreaterThan(150);
        expect(r, `${env} piece beyond the far plane`).toBeLessThan(470);
        expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(Number.isFinite(p.x + p.y + p.z + p.sx + p.sy + p.sz)).toBe(true);
      }
    });
  }
});

/** Distance from the piece's outline (sampled) to the nearest point of the bounds rectangle. */
function clearance(p: WaterPiece, b: { x0: number; x1: number; z0: number; z1: number }): number {
  const pts: [number, number][] = [];
  if (p.shape === "rect") {
    for (const u of [-0.5, 0, 0.5]) for (const v of [-0.5, 0, 0.5]) pts.push([u * p.sx, v * p.sz]);
  } else {
    for (let i = 0; i < 48; i++) pts.push([Math.cos((i / 48) * Math.PI * 2) * p.sx / 2, Math.sin((i / 48) * Math.PI * 2) * p.sz / 2]);
  }
  let best = Infinity;
  for (const [lx, lz] of pts) {
    // local x maps to (cos rot, −sin rot) in world x/z
    const x = p.x + lx * Math.cos(p.rot) + lz * Math.sin(p.rot);
    const z = p.z - lx * Math.sin(p.rot) + lz * Math.cos(p.rot);
    best = Math.min(best, Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.z0 - z, 0, z - b.z1)));
  }
  return best;
}

describe("water (rivers and lakes beyond the playable area)", () => {
  const boundsList = [
    { x0: -16, x1: 16, z0: -16, z1: 16 }, // small plaza
    { x0: -28, x1: 28, z0: -28, z1: 28 }, // large plaza
    { x0: -5, x1: 5, z0: -104, z1: 10 }, // long corridor
    { x0: 0, x1: 59, z0: -118, z1: 0 }, // big rooms grid
    { x0: -40, x1: 55, z0: -30, z1: 70 }, // off-centre platformer
  ];
  for (const env of ENVIRONMENTS) {
    it(`${env}: only desert and forest get water, deterministic, and never close to anything playable`, () => {
      const theme = themeFor(env, "day");
      for (const b of boundsList) {
        const w = buildWater(env, theme, 4242, b);
        expect(JSON.stringify(w)).toBe(JSON.stringify(buildWater(env, theme, 4242, b)));
        if (env !== "desert-ruins" && env !== "forest") {
          expect(w).toEqual([]);
          continue;
        }
        expect(w.some((p) => p.role === "water")).toBe(true);
        expect(w.some((p) => p.role === "bank")).toBe(true);
        for (const p of w) {
          expect(clearance(p, b), `${env} ${p.role} too close to ${JSON.stringify(b)}`).toBeGreaterThanOrEqual(WATER_CLEARANCE - 0.5);
          expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
          expect(Number.isFinite(p.x + p.z + p.sx + p.sz + p.rot)).toBe(true);
        }
      }
    });
  }
});
