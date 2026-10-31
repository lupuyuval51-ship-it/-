import { describe, expect, it } from "vitest";
import { PLAYER_HEIGHT, PLAYER_RADIUS, STEP_UP } from "@/lib/game/engine/constants";
import { WorldSim } from "@/lib/game/engine/sim";
import { ENVIRONMENTS, LAYOUTS } from "@/lib/game/spec/constants";
import { buildWorld } from "@/lib/game/world/build";
import { buildSkyline, SKYLINE_CLEARANCE, skylineGap, type SkylinePiece } from "@/lib/game/world/skyline";
import { themeFor } from "@/lib/game/world/theme";
import type { WorldModel } from "@/lib/game/world/types";
import { reshapeFirstArea } from "./world-helpers";
import { validDemoSpec } from "./helpers";

const base = validDemoSpec({ gameType: "adventure", mode: "FULL", subject: "Python loops" });
const SIZES = ["small", "medium", "large"] as const;

const world = (layout: (typeof LAYOUTS)[number], size: (typeof SIZES)[number], stations: number, crowd = true): WorldModel => {
  const spec = reshapeFirstArea(base, { layout, size, stations, npcs: crowd ? 3 : 0, collectibles: crowd ? 12 : 0, portal: crowd, boss: crowd && stations >= 2 });
  return buildWorld(spec, spec.areas[0]!.id);
};

/** Distance from the spawn to the nearest collider the player would bump into standing there. */
function spawnClearance(w: WorldModel): { gap: number; id: string } {
  let best = { gap: Infinity, id: "" };
  for (const b of w.boxes) {
    if (!b.solid || b.kind === "bounds" || b.y1 <= w.spawn.y + STEP_UP || b.y0 >= w.spawn.y + PLAYER_HEIGHT) continue;
    const gap = Math.hypot(Math.max(b.x0 - w.spawn.x, 0, w.spawn.x - b.x1), Math.max(b.z0 - w.spawn.z, 0, w.spawn.z - b.z1));
    if (gap < best.gap) best = { gap, id: b.id };
  }
  return best;
}

describe("the player never starts inside scenery", () => {
  it("every layout, size and number of stations: the spawn is clear of every collider and the player stays put on the first frames", () => {
    const problems: string[] = [];
    for (const layout of LAYOUTS) for (const size of SIZES) for (let stations = 1; stations <= 8; stations++) for (const crowd of [false, true]) {
      const w = world(layout, size, stations, crowd);
      const tag = `${layout}/${size}/st${stations}${crowd ? "/crowded" : ""}`;
      const c = spawnClearance(w);
      if (c.gap < PLAYER_RADIUS + 0.15) problems.push(`${tag}: spawn only ${c.gap.toFixed(2)} m from ${c.id}`);
      const sim = new WorldSim(w, { jumpEnabled: true, gateOpen: () => false });
      for (let i = 0; i < 5; i++) sim.step(1 / 60, { moveX: 0, moveY: 0, jump: false, sprint: false }, 0);
      const moved = Math.hypot(sim.player.x - w.spawn.x, sim.player.z - w.spawn.z);
      if (moved > 1e-6) problems.push(`${tag}: pushed ${moved.toFixed(2)} m out of a collider at the start`);
    }
    expect(problems).toEqual([]);
  });

  it("a small lab with a station due south (an even number of stations) starts just behind its bench, inside the walls", () => {
    for (const stations of [2, 4, 6, 8]) {
      const w = world("lab", "small", stations);
      const bench = w.boxes.find((b) => b.id === `bench-${stations / 2}`)!;
      expect(w.spawn.x).toBe(0);
      expect(w.spawn.z).toBeCloseTo(bench.z1 + PLAYER_RADIUS + 0.2, 6);
      expect(w.spawn.z).toBeLessThan(w.bounds.z1 - 1.2 + 1e-9);
    }
  });

  it("labs that were already fine keep their spawn exactly where it was", () => {
    for (const size of SIZES) for (let stations = 1; stations <= 8; stations++) {
      if (size === "small" && stations % 2 === 0) continue;
      const w = world("lab", size, stations);
      expect(w.spawn, `${size}/st${stations}`).toEqual({ x: 0, y: 0, z: w.bounds.z1 * 0.8, yaw: 0 });
    }
  });
});

describe("ambient scenery stays outside the playable floor", () => {
  it("no walk-through prop stands inside the area (the corners of the decor ellipse used to cut into it)", () => {
    const problems: string[] = [];
    for (const layout of LAYOUTS) for (const size of SIZES) for (const env of ENVIRONMENTS) for (const stations of [1, 4, 8]) {
      const spec = reshapeFirstArea(base, { layout, size, stations, npcs: 2, collectibles: 6, portal: true, boss: stations >= 2 });
      spec.theme.environment = env;
      const w = buildWorld(spec, spec.areas[0]!.id);
      const b = w.bounds;
      // the layout's own fittings stand inside on purpose: the lab's hologram and wall pipes, the corridor's wall pillars
      const fitting = (d: WorldModel["decor"][number]) =>
        d.solid || d.kind === "hologram" || (layout === "lab" && d.kind === "pipe" && d.y === 2.6) || (layout === "corridor" && d.kind === "pillar" && d.scale === 0.7);
      for (const d of w.decor) {
        if (fitting(d)) continue;
        if (d.x > b.x0 && d.x < b.x1 && d.z > b.z0 && d.z < b.z1) {
          problems.push(`${layout}/${size}/${env}/st${stations}: ${d.kind} ${Math.min(d.x - b.x0, b.x1 - d.x, d.z - b.z0, b.z1 - d.z).toFixed(1)} m inside`);
        }
        expect(Number.isFinite(d.x + d.z)).toBe(true);
      }
    }
    expect(problems).toEqual([]);
  });
});

const sameSlot = (a: SkylinePiece, b: SkylinePiece) => a.x === b.x && a.z === b.z;

describe("skyline: distant scenery keeps clear of the playable area", () => {
  it("without bounds the ring is unchanged, and compact areas (plaza, lab) get exactly the same ring with them", () => {
    for (const env of ENVIRONMENTS) {
      const theme = themeFor(env, "day");
      for (const seed of [1, 12345, 987654321]) {
        const ring = buildSkyline(env, theme, seed, 0);
        expect(buildSkyline(env, theme, seed, 0, undefined)).toEqual(ring);
        for (const R of [14, 16, 22, 28]) expect(buildSkyline(env, theme, seed, 0, { x0: -R, x1: R, z0: -R, z1: R }), `${env}/${seed}/R${R}`).toEqual(ring);
      }
    }
  });

  it("long levels (eight-station corridors, rooms and platformers): every piece clears the bounds, nothing else changes", () => {
    const problems: string[] = [];
    let moved = 0;
    for (const layout of ["corridor", "rooms", "terraces"] as const) for (const size of SIZES) {
      const w = world(layout, size, 8);
      const b = w.bounds;
      const groundY = w.hasVoid ? w.killY + 3 : -0.03;
      for (const env of ENVIRONMENTS) {
        const theme = themeFor(env, "day");
        const free = buildSkyline(env, theme, w.seed, groundY);
        const kept = buildSkyline(env, theme, w.seed, groundY, b);
        expect(kept.length).toBe(free.length);
        kept.forEach((p, i) => {
          const q = free[i]!;
          const tag = `${layout}/${size} ${env} #${i} ${p.geo}`;
          // same piece, same look: only its position may differ
          expect({ ...p, x: 0, z: 0 }, tag).toEqual({ ...q, x: 0, z: 0 });
          const gap = skylineGap(p, p.x, p.z, b);
          if (gap < SKYLINE_CLEARANCE - 1e-6) problems.push(`${tag}: ${gap.toFixed(1)} m from the playable area`);
          // never pushed so far that it would leave the camera's far plane (520 m) from the nearest playable point
          if (gap > 470) problems.push(`${tag}: pushed ${gap.toFixed(0)} m away`);
          // the parts of one ring slot (a tower and its lit band, an island and its rock) stay together
          const prev = free[i - 1];
          if (prev && sameSlot(prev, q)) expect(sameSlot(kept[i - 1]!, p), `${tag} left its slot`).toBe(true);
        });
        // a slot only moves when it had to, and then no further than needed (within the 1 m step)
        for (let i = 0; i < free.length; ) {
          let j = i + 1;
          while (j < free.length && sameSlot(free[j]!, free[i]!)) j++;
          const before = Math.min(...free.slice(i, j).map((q) => skylineGap(q, q.x, q.z, b)));
          const after = Math.min(...kept.slice(i, j).map((p) => skylineGap(p, p.x, p.z, b)));
          const tag = `${layout}/${size} ${env} slot #${i}`;
          if (sameSlot(free[i]!, kept[i]!)) expect(before, tag).toBeGreaterThanOrEqual(SKYLINE_CLEARANCE);
          else {
            moved++;
            expect(before, tag).toBeLessThan(SKYLINE_CLEARANCE);
            expect(after, tag).toBeLessThan(SKYLINE_CLEARANCE + 1 + 1e-6);
          }
          i = j;
        }
      }
    }
    expect(problems).toEqual([]);
    // the long platformers really did run into the ring before (forest hills, desert dunes, towers): the fix has work to do
    expect(moved).toBeGreaterThan(0);
  });

  it("a platformer that reaches into the ring: the unbounded ring overlaps it, the bounded one does not", () => {
    const w = world("terraces", "large", 8);
    const groundY = w.killY + 3;
    const theme = themeFor("forest", "day");
    const overlap = (pieces: SkylinePiece[]) => Math.min(...pieces.map((p) => skylineGap(p, p.x, p.z, w.bounds)));
    expect(overlap(buildSkyline("forest", theme, w.seed, groundY))).toBeLessThan(0);
    expect(overlap(buildSkyline("forest", theme, w.seed, groundY, w.bounds))).toBeGreaterThanOrEqual(SKYLINE_CLEARANCE - 1e-6);
  });
});
