import { readFileSync } from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RENDER_PROFILES } from "@/config/graphics";
import { createMaterialSet } from "@/components/game/scene/materials";
import { clipCameraDistance } from "@/lib/game/engine/camera";
import { INTERACT_RADIUS } from "@/lib/game/engine/constants";
import { GameRuntime, type Interactable } from "@/lib/game/engine/runtime";
import { toPublicSpec } from "@/lib/game/spec/public";
import type { ClientState } from "@/lib/game/state/progress";
import { bossPhaseOpen, initialState, portalOpen, stationActive, stationDone, toClientState } from "@/lib/game/state/progress";
import { mulberry32 } from "@/lib/game/util/prng";
import type { WorldBox } from "@/lib/game/world/types";
import { validDemoSpec } from "./helpers";

/**
 * The per-frame code (camera clipping, "what is in reach", gate lookups) was rewritten to stop allocating and to skip
 * work for things that are out of reach. These tests pin the results to the straightforward versions they replaced.
 */

// ───────────────────────── camera clipping ─────────────────────────

/** The original implementation (arrays per box), kept here as the reference. */
function referenceClip(boxes: readonly WorldBox[], from: { x: number; y: number; z: number }, dir: { x: number; y: number; z: number }, maxDist: number, isOpenGate: (id: string) => boolean, minDist = 1.6): number {
  let best = maxDist;
  for (const b of boxes) {
    if (!b.solid || b.kind === "floor") continue;
    if (b.kind === "gate" && b.gateId && isOpenGate(b.gateId)) continue;
    let tmin = 0;
    let tmax = best;
    let hit = true;
    for (const [o, d, lo, hi] of [
      [from.x, dir.x, b.x0, b.x1],
      [from.y, dir.y, b.y0, b.y1],
      [from.z, dir.z, b.z0, b.z1],
    ] as const) {
      if (Math.abs(d) < 1e-9) {
        if (o < lo || o > hi) {
          hit = false;
          break;
        }
      } else {
        let t1 = (lo - o) / d;
        let t2 = (hi - o) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) {
          hit = false;
          break;
        }
      }
    }
    if (hit && tmin < best) best = tmin;
  }
  return Math.max(Math.min(minDist, maxDist), best - 0.35);
}

describe("clipCameraDistance", () => {
  const KINDS = ["wall", "prop", "floor", "gate", "platform", "bounds"] as const;
  const rnd = mulberry32(2024);
  const boxes: WorldBox[] = Array.from({ length: 60 }, (_, i) => {
    const x0 = rnd() * 60 - 30, y0 = rnd() * 6, z0 = rnd() * 60 - 30;
    const kind = KINDS[Math.floor(rnd() * KINDS.length)]!;
    return { id: `b${i}`, kind, x0, x1: x0 + 0.5 + rnd() * 8, y0, y1: y0 + 0.5 + rnd() * 5, z0, z1: z0 + 0.5 + rnd() * 8, solid: rnd() < 0.8, walkable: false, visible: true, style: "wall", gateId: kind === "gate" ? `g${i % 3}` : undefined } as WorldBox;
  });
  const open = (id: string) => id === "g1";

  it("returns exactly what the array-based version returned, for random and axis-parallel rays", () => {
    for (let n = 0; n < 3000; n++) {
      const from = { x: rnd() * 60 - 30, y: rnd() * 6, z: rnd() * 60 - 30 };
      // every third ray is parallel to an axis, which takes the "parallel slab" branch
      const raw = n % 3 === 0 ? { x: [0, 1, -1][n % 5 % 3]!, y: 0, z: [1, 0, -1][n % 7 % 3]! } : { x: rnd() * 2 - 1, y: rnd() * 2 - 1, z: rnd() * 2 - 1 };
      const len = Math.hypot(raw.x, raw.y, raw.z) || 1;
      const dir = { x: raw.x / len, y: raw.y / len, z: raw.z / len };
      const max = 4 + rnd() * 6;
      expect(clipCameraDistance(boxes, from, dir, max, open)).toBe(referenceClip(boxes, from, dir, max, open));
    }
  });

  it("stops the camera in front of a wall and keeps the minimum distance when the wall is right behind the player", () => {
    const wall = { id: "w", kind: "wall", x0: -5, x1: 5, y0: 0, y1: 4, z0: 4, z1: 5, solid: true, walkable: false, visible: true, style: "wall" } as WorldBox;
    const from = { x: 0, y: 1, z: 0 };
    expect(clipCameraDistance([wall], from, { x: 0, y: 0, z: 1 }, 7.2, () => false)).toBeCloseTo(4 - 0.35, 9);
    expect(clipCameraDistance([wall], { x: 0, y: 1, z: 3.9 }, { x: 0, y: 0, z: 1 }, 7.2, () => false)).toBeCloseTo(1.6, 9);
    expect(clipCameraDistance([wall], from, { x: 0, y: 0, z: -1 }, 7.2, () => false)).toBe(7.2 - 0.35);
  });
});

// ───────────────────────── what is in reach ─────────────────────────

/** The original `computeNearby`: builds a candidate for everything, then filters by distance. */
function referenceNearby(rt: GameRuntime): Interactable | null {
  const p = rt.sim.player;
  let best: { d: number; t: Interactable } | null = null;
  const consider = (d: number, dy: number, t: Interactable) => {
    if (d > INTERACT_RADIUS || Math.abs(dy) > 2.6) return;
    if (!best || d < best.d) best = { d, t };
  };
  const area = rt.spec.areas.find((a) => a.id === rt.areaId)!;
  for (const s of rt.world.stations) {
    const def = area.stations.find((x) => x.id === s.stationId)!;
    const done = stationDone(rt.client, s.stationId);
    const status = done ? "done" : stationActive(rt.spec, rt.client, def) ? "active" : "locked";
    consider(Math.hypot(p.x - s.x, p.z - s.z), p.y - s.y, { kind: "station", id: s.stationId, label: s.label, stationKind: s.kind, status, lockedByBoss: status === "locked" && !bossPhaseOpen(rt.spec, rt.client, s.stationId), x: s.x, z: s.z });
  }
  for (const n of rt.world.npcs) consider(Math.hypot(p.x - n.x, p.z - n.z), p.y - n.y, { kind: "npc", id: n.npcId, label: n.name, x: n.x, z: n.z });
  for (const b of rt.world.bosses) consider(Math.hypot(p.x - b.x, p.z - b.z), p.y - b.y, { kind: "boss", id: b.bossId, label: b.name, x: b.x, z: b.z });
  const portal = rt.world.portal;
  if (portal) consider(Math.hypot(p.x - portal.x, p.z - portal.z), p.y - portal.y, { kind: "portal", id: portal.toAreaId, label: portal.label, open: portalOpen(rt.spec, rt.client, area), x: portal.x, z: portal.z });
  return best ? (best as { d: number; t: Interactable }).t : null;
}

describe("GameRuntime hot path", () => {
  for (const gameType of ["adventure", "puzzle", "exploration"] as const) {
    it(`finds the same nearest interactable as the exhaustive version (${gameType})`, () => {
      const spec = toPublicSpec(validDemoSpec({ gameType, mode: "FULL" }));
      const base = toClientState(initialState(spec as never, 0));
      const rnd = mulberry32(99);
      let checked = 0;
      let found = 0;
      for (const area of spec.areas) {
        const rt = new GameRuntime(spec, area.id, base);
        const w = rt.world;
        const stationIds = w.stations.map((s) => s.stationId);
        // a few progress states: nothing done, the first station done, every station done
        const states: ClientState[] = [
          base,
          { ...base, resolvedStations: Object.fromEntries(stationIds.slice(0, 1).map((id) => [id, "correct"])) } as ClientState,
          { ...base, resolvedStations: Object.fromEntries(stationIds.map((id) => [id, "correct"])), missionsDone: spec.missions.map((m) => m.id) } as ClientState,
        ];
        const spots = [...w.stations, ...w.npcs, ...w.bosses, ...(w.portal ? [w.portal] : [])].map((t) => ({ x: t.x, y: t.y ?? 0, z: t.z }));
        for (const state of states) {
          rt.setClientState(state);
          for (let n = 0; n < 150; n++) {
            const spot = spots.length > 0 && n % 3 !== 0 ? spots[n % spots.length]! : { x: w.bounds.x0 + rnd() * (w.bounds.x1 - w.bounds.x0), y: 0, z: w.bounds.z0 + rnd() * (w.bounds.z1 - w.bounds.z0) };
            rt.sim.teleport(spot.x + (rnd() - 0.5) * 2 * INTERACT_RADIUS, spot.y + (rnd() - 0.5) * 6, spot.z + (rnd() - 0.5) * 2 * INTERACT_RADIUS);
            rt.refreshNearby();
            const want = referenceNearby(rt);
            expect(rt.nearby).toEqual(want);
            checked++;
            if (want) found++;
          }
        }
      }
      expect(checked).toBeGreaterThan(300);
      expect(found).toBeGreaterThan(20); // the sampling really lands in reach of things
    });
  }

  it("keeps the gate answers per client state and recomputes when the state changes", () => {
    const spec = toPublicSpec(validDemoSpec({ gameType: "puzzle", mode: "FULL" }));
    const client = toClientState(initialState(spec as never, 0));
    const rt = new GameRuntime(spec, spec.areas[0]!.id, client);
    const gate = rt.world.gates[0]!;
    expect(rt.gateOpen(gate.id)).toBe(false);
    expect(rt.gateOpen(gate.id)).toBe(false); // from the cache
    expect(rt.gateOpen("no-such-gate")).toBe(true); // unknown gates never block
    const done = { ...client, resolvedStations: Object.fromEntries(gate.opensWhenStationsDone.map((id) => [id, "correct"])) } as ClientState;
    rt.setClientState(done);
    expect(rt.gateOpen(gate.id)).toBe(true);
    rt.setClientState(client); // going back (a restart) closes it again
    expect(rt.gateOpen(gate.id)).toBe(false);
  });
});

// ───────────────────────── materials: shared and released ─────────────────────────

describe("createMaterialSet", () => {
  afterEach(() => vi.restoreAllMocks());
  const theme = new GameRuntime(toPublicSpec(validDemoSpec({ gameType: "adventure", mode: "FULL" })), "a-plaza", toClientState(initialState(toPublicSpec(validDemoSpec({ gameType: "adventure", mode: "FULL" })) as never, 0))).world.theme;

  it("hands out one material per look and releases every one of them exactly once", () => {
    const dispose = vi.spyOn(THREE.Material.prototype, "dispose");
    const set = createMaterialSet(RENDER_PROFILES.C, theme);
    const a = set.surface("wall", 3, 5);
    expect(set.surface("wall", 40, 2)).toBe(a); // untextured materials do not depend on the box size
    expect(set.surface("floor")).not.toBe(a);
    expect(set.glow("#ff0000", 1)).toBe(set.glow("#ff0000", 1));
    expect(set.solid("#00ff00")).toBe(set.solid("#00ff00"));
    expect(set.flat("#0000ff")).toBe(set.flat("#0000ff"));
    expect(set.unlit()).toBe(set.unlit());
    const created = new Set<THREE.Material>([a, set.surface("floor"), set.glow("#ff0000", 1), set.solid("#00ff00"), set.flat("#0000ff"), set.unlit()]);
    expect(created.size).toBe(6);
    expect(dispose).not.toHaveBeenCalled();
    set.dispose();
    expect(dispose).toHaveBeenCalledTimes(created.size);
    expect(new Set(dispose.mock.contexts)).toEqual(created);
  });

  it("a material set can be built and released again and again without keeping anything (entering and leaving games)", () => {
    const dispose = vi.spyOn(THREE.Material.prototype, "dispose");
    let made = 0;
    for (let round = 0; round < 25; round++) {
      const set = createMaterialSet(RENDER_PROFILES.B, theme);
      made += new Set([set.surface("wall", 3, 5), set.surface("platform", 6, 6), set.glow("#ffffff"), set.solid("#123456")]).size;
      set.dispose();
    }
    expect(dispose).toHaveBeenCalledTimes(made);
  });
});

// ───────────────────────── re-renders ─────────────────────────

describe("play screen re-renders", () => {
  it("the canvas is memoised, and the phone app's router is one stable object so the memo holds there too", async () => {
    const canvas = readFileSync(path.resolve(import.meta.dirname, "../../src/components/game/scene/GameCanvas.tsx"), "utf8");
    expect(canvas).toMatch(/export default memo\(GameCanvas\);/);
    // PlayClient's interaction handler lists the router as a dependency and is passed to the canvas as `onInteract`
    const { useRouter } = await import("../../mobile/src/shims/next-navigation");
    expect(useRouter()).toBe(useRouter());
  });
});
