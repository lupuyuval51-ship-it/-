import { describe, expect, it } from "vitest";
import { ENVIRONMENTS, LAYOUTS, type Layout } from "@/lib/game/spec/constants";
import { MECHANIC_REGISTRY } from "@/lib/game/spec/mechanics";
import { toPublicSpec } from "@/lib/game/spec/public";
import type { GameSpec } from "@/lib/game/spec/schema";
import { collectibleId } from "@/lib/game/state/progress";
import { BOSS_SCALE, buildWorld } from "@/lib/game/world/build";
import { dist2d } from "@/lib/game/world/helpers";
import type { WorldModel } from "@/lib/game/world/types";
import { reshapeFirstArea, walkable } from "./world-helpers";
import { validDemoSpec } from "./helpers";

/**
 * The world builder as a whole (wave 4, T1): what `buildWorld` promises about any area of any spec, beyond the per-layout
 * reachability and spacing suites. Boss placement (data, facing, several bosses, the cases that cannot be placed), that the
 * client's world (built from the public spec) is the one the server and the balance bots build, that the mechanics registry
 * says what the layouts really do, and the structural invariants the simulation and the renderer lean on (unique ids,
 * everything in a platformer stands on a platform, solid scenery has a collider).
 */

const base = validDemoSpec({ gameType: "adventure", mode: "FULL", subject: "Python loops" });
const SIZES = ["small", "medium", "large"] as const;

type Shape = Parameters<typeof reshapeFirstArea>[1];
const shape = (over: Partial<Shape> = {}): Shape => ({ layout: "plaza", size: "medium", stations: 4, npcs: 2, collectibles: 6, portal: true, boss: true, ...over });
const build = (over: Partial<Shape> = {}): { spec: GameSpec; w: WorldModel } => {
  const spec = reshapeFirstArea(base, shape(over));
  return { spec, w: buildWorld(spec, spec.areas[0]!.id) };
};

describe("buildWorld basics", () => {
  it("refuses an area the spec does not have", () => {
    expect(() => buildWorld(base, "a-nowhere")).toThrow(/unknown area a-nowhere/);
  });

  it("is a pure function of the spec: it never changes what it is given", () => {
    for (const layout of LAYOUTS) {
      const spec = reshapeFirstArea(base, shape({ layout, stations: 5 }));
      const before = JSON.stringify(spec);
      buildWorld(spec, spec.areas[0]!.id);
      expect(JSON.stringify(spec), layout).toBe(before);
    }
  });

  it("the browser's world (built from the public spec, which has no challenges) is the world the server and the bots build", () => {
    for (const gameType of ["adventure", "exploration", "puzzle", "simulation", "platformer"] as const) {
      const spec = validDemoSpec({ gameType, mode: "FULL" });
      const pub = toPublicSpec(spec);
      expect(pub.challenges).toEqual([]);
      for (const area of spec.areas) expect(JSON.stringify(buildWorld(pub, area.id)), `${gameType}/${area.id}`).toBe(JSON.stringify(buildWorld(spec, area.id)));
    }
  });

  it("the layout follows the area, the theme follows the spec", () => {
    for (const layout of LAYOUTS) {
      const { spec, w } = build({ layout });
      expect(w.layout).toBe(layout);
      expect(w.areaId).toBe(spec.areas[0]!.id);
      expect(w.environment).toBe(spec.theme.environment);
      expect(w.hasVoid, layout).toBe(layout === "terraces");
      // the world always has somewhere to stand at the start
      const b = w.bounds;
      expect(w.spawn.x >= b.x0 && w.spawn.x <= b.x1 && w.spawn.z >= b.z0 && w.spawn.z <= b.z1, layout).toBe(true);
    }
  });

  it("a platformer's kill height is below its lowest platform, and no other layout needs one it can reach", () => {
    for (const size of SIZES) for (const stations of [1, 4, 8]) {
      const { w } = build({ layout: "terraces", size, stations });
      const lowest = Math.min(...w.boxes.filter((b) => b.kind === "platform").map((b) => b.y0));
      expect(w.killY, `${size}/${stations}`).toBeLessThan(lowest);
    }
  });
});

describe("bosses", () => {
  it("carry what the spec says about them and stand at the height of their last phase station", () => {
    for (const layout of LAYOUTS) {
      const { spec, w } = build({ layout, stations: 4 });
      expect(w.bosses, layout).toHaveLength(1);
      const [boss] = w.bosses;
      const def = spec.bosses[0]!;
      expect(boss).toMatchObject({ bossId: def.id, name: def.name, color: def.look.color, shape: def.look.shape, scale: BOSS_SCALE, phaseStationIds: def.phaseStationIds });
      expect(BOSS_SCALE).toBe(2.2);
      const last = w.stations.find((s) => s.stationId === def.phaseStationIds.at(-1))!;
      expect(boss!.y, layout).toBe(last.y);
    }
  });

  it("face the player's start: the model looks along −z, so a yaw of atan2(dx, dz) turns it towards the spawn", () => {
    for (const layout of LAYOUTS) for (const size of SIZES) {
      const { w } = build({ layout, size, stations: 3 });
      const boss = w.bosses[0]!;
      const ahead = { x: -Math.sin(boss.facing), z: -Math.cos(boss.facing) };
      const toSpawn = { x: w.spawn.x - boss.x, z: w.spawn.z - boss.z };
      const len = Math.hypot(toSpawn.x, toSpawn.z);
      expect(ahead.x * (toSpawn.x / len) + ahead.z * (toSpawn.z / len), `${layout}/${size}`).toBeGreaterThan(0.9999);
    }
  });

  it("are built only in their own area, and a game with no bosses has none", () => {
    const spec = reshapeFirstArea(base, shape({ stations: 3 }));
    const other = spec.areas[1]!;
    expect(buildWorld(spec, other.id).bosses).toEqual([]);
    spec.bosses = [];
    expect(buildWorld(spec, spec.areas[0]!.id).bosses).toEqual([]);
  });

  it("a boss whose last phase station is not in the area is left out rather than crashing the world", () => {
    const spec = reshapeFirstArea(base, shape({ stations: 3 }));
    spec.bosses[0]!.phaseStationIds = ["st0", "st-gone"];
    const w = buildWorld(spec, spec.areas[0]!.id);
    expect(w.bosses).toEqual([]);
    expect(w.stations).toHaveLength(3);
  });

  it("several bosses in one area keep apart from each other, from every station, character and the portal", () => {
    const problems: string[] = [];
    for (const layout of LAYOUTS) for (const size of SIZES) for (const stations of [4, 6, 8]) {
      const spec = reshapeFirstArea(base, shape({ layout, size, stations, npcs: 3, collectibles: 12 }));
      const area = spec.areas[0]!;
      const template = spec.bosses[0]!;
      spec.bosses = [
        { ...template, id: "b1", phaseStationIds: area.stations.slice(0, 2).map((s) => s.id) },
        { ...template, id: "b2", name: "Second", phaseStationIds: area.stations.slice(stations - 2).map((s) => s.id) },
      ];
      const w = buildWorld(spec, area.id);
      const tag = `${layout}/${size}/st${stations}`;
      if (w.bosses.map((b) => b.bossId).join() !== "b1,b2") problems.push(`${tag}: bosses ${w.bosses.map((b) => b.bossId)}`);
      const [b1, b2] = w.bosses;
      if (b1 && b2 && dist2d(b1, b2) < 2.8) problems.push(`${tag}: the bosses are ${dist2d(b1, b2).toFixed(2)} m apart`);
      for (const b of w.bosses) {
        for (const p of [...w.stations, ...w.npcs, ...(w.portal ? [w.portal] : [])]) {
          const own = "stationId" in p && p.stationId === b.phaseStationIds.at(-1);
          const gap = dist2d(p, b);
          if (gap < (own ? 2.4 : 2.8) - 1e-6) problems.push(`${tag}: ${b.bossId} is ${gap.toFixed(2)} m from ${"stationId" in p ? p.stationId : "npcId" in p ? p.npcId : "the portal"}`);
        }
        for (const c of [...w.collectibles, ...w.checkpoints]) if (!w.hasVoid && dist2d(c, b) < 1.8) problems.push(`${tag}: an item is ${dist2d(c, b).toFixed(2)} m from ${b.bossId}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("collectibles and checkpoints are settled around the boss as well as around the stations", () => {
    for (const layout of ["plaza", "lab", "rooms", "corridor"] as const) for (const size of SIZES) {
      const { w } = build({ layout, size, stations: 4, npcs: 3, collectibles: 12 });
      const boss = w.bosses[0]!;
      for (const c of [...w.collectibles, ...w.checkpoints]) expect(dist2d(c, boss), `${layout}/${size}`).toBeGreaterThanOrEqual(1.8);
    }
  });

  it("stand inside the walls, with a margin, in every layout that has walls", () => {
    for (const layout of ["plaza", "lab", "rooms", "corridor"] as const) for (const size of SIZES) for (const stations of [1, 2, 8]) {
      const { w } = build({ layout, size, stations });
      const boss = w.bosses[0]!;
      const b = w.bounds;
      expect(boss.x, `${layout}/${size}/${stations}`).toBeGreaterThanOrEqual(b.x0 + 1.5);
      expect(boss.x).toBeLessThanOrEqual(b.x1 - 1.5);
      expect(boss.z).toBeGreaterThanOrEqual(b.z0 + 1.5);
      expect(boss.z).toBeLessThanOrEqual(b.z1 - 1.5);
    }
  });

  it("a platformer's second boss stands on the platform of its own last station", () => {
    for (const size of SIZES) {
      const spec = reshapeFirstArea(base, shape({ layout: "terraces", size, stations: 6 }));
      const area = spec.areas[0]!;
      const template = spec.bosses[0]!;
      spec.bosses = [
        { ...template, id: "b1", phaseStationIds: area.stations.slice(0, 2).map((s) => s.id) },
        { ...template, id: "b2", phaseStationIds: area.stations.slice(4).map((s) => s.id) },
      ];
      const w = buildWorld(spec, area.id);
      expect(w.bosses.map((b) => b.bossId)).toEqual(["b1", "b2"]);
      for (const boss of w.bosses) {
        const last = w.stations.find((s) => s.stationId === boss.phaseStationIds.at(-1))!;
        const pad = w.boxes.find((p) => p.kind === "platform" && last.x >= p.x0 && last.x <= p.x1 && last.z >= p.z0 && last.z <= p.z1)!;
        expect([boss.x > pad.x0 && boss.x < pad.x1, boss.z > pad.z0 && boss.z < pad.z1, Math.abs(boss.y - pad.y1) < 1e-9], `${size}/${boss.bossId}`).toEqual([true, true, true]);
      }
    }
  });
});

describe("the mechanics registry says what the layouts really build", () => {
  const withAllMechanics = (layout: Layout) => build({ layout, size: "medium", stations: 4, npcs: 2, collectibles: 6 }).w;
  const layoutsOf = (m: keyof typeof MECHANIC_REGISTRY) => new Set<Layout>(MECHANIC_REGISTRY[m].layouts);

  it("hazards, checkpoints, moving platforms and doors appear exactly in the layouts the registry lists", () => {
    for (const layout of LAYOUTS) {
      const w = withAllMechanics(layout);
      expect(w.hazards.length > 0, `${layout} hazards`).toBe(layoutsOf("hazards").has(layout));
      expect(w.checkpoints.length > 0, `${layout} checkpoints`).toBe(layoutsOf("checkpoints").has(layout));
      expect(w.boxes.some((b) => b.mover), `${layout} movers`).toBe(layoutsOf("moving_platforms").has(layout));
      expect(w.gates.length > 0, `${layout} gates`).toBe(layoutsOf("gates").has(layout));
      expect(w.boxes.some((b) => b.kind === "gate"), `${layout} gate boxes`).toBe(layoutsOf("gates").has(layout));
    }
  });

  it("switching a mechanic off removes it: no lava, no checkpoints (outside platformers), no sliding platforms, no doors", () => {
    const without = (layout: Layout, mechanic: string): WorldModel => {
      const spec = reshapeFirstArea(base, shape({ layout, stations: 4 }));
      spec.mechanics = spec.mechanics.filter((m) => m !== mechanic);
      return buildWorld(spec, spec.areas[0]!.id);
    };
    for (const layout of ["plaza", "terraces"] as const) expect(without(layout, "hazards").hazards, layout).toEqual([]);
    for (const layout of ["plaza", "corridor"] as const) expect(without(layout, "checkpoints").checkpoints, layout).toEqual([]);
    // a platformer implies its checkpoints (and jumping): they cannot be switched off
    expect(without("terraces", "checkpoints").checkpoints.length).toBeGreaterThan(0);
    expect(without("terraces", "moving_platforms").boxes.some((b) => b.mover)).toBe(false);
    for (const layout of ["rooms", "corridor"] as const) {
      const w = without(layout, "gates");
      expect([w.gates, w.boxes.filter((b) => b.kind === "gate")], layout).toEqual([[], []]);
      // with no doors shut, every station of the layout can be walked to from the start
      const can = walkable(w, () => false);
      for (const s of w.stations) expect(can(s.x, s.z, 2.0), `${layout} ${s.stationId}`).toBe(true);
    }
  });

  it("a level that has no lava keeps hazardLevel 'none' honest, 'low' and 'high' are two different amounts", () => {
    const lava = (layout: Layout, hazardLevel: "none" | "low" | "high") => {
      const spec = reshapeFirstArea(base, shape({ layout, size: "large", stations: 6 }));
      spec.areas[0]!.hazardLevel = hazardLevel;
      return buildWorld(spec, spec.areas[0]!.id).hazards.length;
    };
    for (const layout of ["plaza", "terraces"] as const) {
      expect(lava(layout, "none"), layout).toBe(0);
      expect(lava(layout, "low"), layout).toBeGreaterThan(0);
      expect(lava(layout, "low"), layout).toBeLessThanOrEqual(2);
      expect(lava(layout, "high"), layout).toBeGreaterThan(lava(layout, "low"));
      expect(lava(layout, "high"), layout).toBeLessThanOrEqual(5);
    }
  });

  it("sliding platforms carry the stations in pairs: one in front of every second station, none for a single station", () => {
    for (const stations of [1, 2, 3, 4, 6, 8]) {
      const { w } = build({ layout: "terraces", size: "medium", stations, npcs: 0, collectibles: 0, portal: false, boss: false });
      const movers = w.boxes.filter((b) => b.mover);
      expect(movers.length, `${stations} stations`).toBe(Math.floor(stations / 2));
      expect(new Set(movers.map((m) => m.id)).size).toBe(movers.length);
      for (const m of movers) expect(m.mover).toMatchObject({ axis: "z", amplitude: 1, period: 4.4 });
    }
  });
});

describe("structure the simulation and the renderer rely on", () => {
  const everyShape: Shape[] = [];
  for (const layout of LAYOUTS) for (const size of SIZES) for (const stations of [1, 3, 8]) for (const crowd of [false, true]) {
    everyShape.push(shape({ layout, size, stations, npcs: crowd ? 3 : 0, collectibles: crowd ? 12 : 0, boss: crowd && stations >= 2 }));
  }
  const tag = (s: Shape) => `${s.layout}/${s.size}/st${s.stations}/${s.npcs ? "crowd" : "bare"}`;

  it("ids are unique: boxes (the sim reports which one you stand on), stations, characters, collectibles, checkpoints, hazards, gates", () => {
    const dup = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);
    for (const s of everyShape) {
      const { w } = build(s);
      for (const [what, ids] of [
        ["boxes", w.boxes.map((b) => b.id)], ["stations", w.stations.map((x) => x.stationId)], ["npcs", w.npcs.map((x) => x.npcId)],
        ["collectibles", w.collectibles.map((x) => x.itemId)], ["checkpoints", w.checkpoints.map((x) => x.checkpointId)], ["hazards", w.hazards.map((x) => x.id)], ["gates", w.gates.map((x) => x.id)],
      ] as const) expect(dup([...ids]), `${tag(s)} ${what}`).toEqual([]);
    }
  });

  it("every door has its box, and every door waits for a station that exists", () => {
    for (const s of everyShape) {
      const { spec, w } = build(s);
      const stationIds = new Set(spec.areas[0]!.stations.map((x) => x.id));
      for (const g of w.gates) {
        expect(w.boxes.filter((b) => b.gateId === g.id), `${tag(s)} ${g.id}`).toHaveLength(1);
        expect(g.opensWhenStationsDone.length).toBeGreaterThan(0);
        for (const id of g.opensWhenStationsDone) expect(stationIds.has(id), `${tag(s)} ${g.id} waits for ${id}`).toBe(true);
      }
      for (const b of w.boxes.filter((x) => x.kind === "gate")) expect(w.gates.some((g) => g.id === b.gateId), `${tag(s)} ${b.id}`).toBe(true);
    }
  });

  it("every number in the world is finite, and decor is well formed", () => {
    for (const s of everyShape) {
      const { w } = build(s);
      for (const b of w.boxes) expect([b.x0, b.x1, b.y0, b.y1, b.z0, b.z1].every(Number.isFinite) && b.x0 <= b.x1 && b.y0 <= b.y1 && b.z0 <= b.z1, `${tag(s)} ${b.id}`).toBe(true);
      for (const d of w.decor) {
        expect([d.x, d.y, d.z, d.scale, d.rot, d.rank].every(Number.isFinite), `${tag(s)} ${d.kind}`).toBe(true);
        expect(d.scale).toBeGreaterThan(0);
        expect(d.rank).toBeGreaterThanOrEqual(0);
        expect(d.rank).toBeLessThan(1);
        expect(d.tint === Math.floor(d.tint) && d.tint >= 0 && d.tint <= 3, `${tag(s)} tint ${d.tint}`).toBe(true);
      }
      for (const p of [...w.stations, ...w.npcs, ...w.collectibles, ...w.checkpoints, w.spawn, ...(w.portal ? [w.portal] : [])]) expect([p.x, p.y, p.z].every(Number.isFinite), tag(s)).toBe(true);
    }
  });

  it("solid scenery has a collider: every solid decor stands inside a solid box", () => {
    for (const s of everyShape) {
      const { w } = build(s);
      for (const d of w.decor.filter((x) => x.solid)) {
        const hit = w.boxes.some((b) => b.solid && d.x >= b.x0 - 1e-9 && d.x <= b.x1 + 1e-9 && d.z >= b.z0 - 1e-9 && d.z <= b.z1 + 1e-9);
        expect(hit, `${tag(s)}: solid ${d.kind} at ${d.x.toFixed(1)},${d.z.toFixed(1)} has no collider`).toBe(true);
      }
      // ...and the plaza's invisible prop colliders are each the foot of a solid decor
      if (s.layout === "plaza") for (const b of w.boxes.filter((x) => x.kind === "prop")) {
        expect(w.decor.some((d) => d.solid && d.x >= b.x0 - 1e-9 && d.x <= b.x1 + 1e-9 && d.z >= b.z0 - 1e-9 && d.z <= b.z1 + 1e-9), `${tag(s)} ${b.id} is invisible with nothing drawn on it`).toBe(true);
      }
    }
  });

  it("every environment builds every layout (the theme and its scenery table never leave a gap)", () => {
    for (const env of ENVIRONMENTS) for (const layout of LAYOUTS) {
      const spec = reshapeFirstArea(base, shape({ layout, stations: 3 }));
      spec.theme.environment = env;
      const w = buildWorld(spec, spec.areas[0]!.id);
      expect(w.environment).toBe(env);
      expect(w.decor.length, `${env}/${layout}`).toBeGreaterThan(10);
    }
  });
});

describe("a platformer has something under everything", () => {
  const COUNTS = [0, 1, 5, 12];

  /** Is (x, z) over a platform whose top is at `y`? Sliding platforms may be up to their amplitude away along their axis. */
  const standsOn = (w: WorldModel, x: number, y: number, z: number): boolean =>
    w.boxes.some((b) => {
      if (b.kind !== "platform" || Math.abs(b.y1 - y) > 1e-6) return false;
      const slide = b.mover?.amplitude ?? 0;
      const sx = b.mover?.axis === "x" ? slide : 0;
      const sz = b.mover?.axis === "z" ? slide : 0;
      return x >= b.x0 - sx && x <= b.x1 + sx && z >= b.z0 - sz && z <= b.z1 + sz;
    });

  it("stations, checkpoints, the portal, the characters and the player's start stand on a platform", () => {
    for (const size of SIZES) for (const stations of [1, 2, 5, 8]) {
      const { w } = build({ layout: "terraces", size, stations, npcs: 3, collectibles: 0, boss: stations >= 2 });
      const tag = `${size}/st${stations}`;
      expect(standsOn(w, w.spawn.x, w.spawn.y, w.spawn.z), `${tag} spawn`).toBe(true);
      for (const s of w.stations) expect(standsOn(w, s.x, s.y, s.z), `${tag} ${s.stationId}`).toBe(true);
      for (const c of w.checkpoints) expect(standsOn(w, c.x, c.y, c.z), `${tag} ${c.checkpointId}`).toBe(true);
      for (const n of w.npcs) expect(standsOn(w, n.x, n.y, n.z), `${tag} ${n.npcId}`).toBe(true);
      for (const b of w.bosses) expect(standsOn(w, b.x, b.y, b.z), `${tag} ${b.bossId}`).toBe(true);
      expect(w.portal && standsOn(w, w.portal.x, w.portal.y, w.portal.z), `${tag} portal`).toBe(true);
    }
  });

  it("every declared collectible is in the world (up to 12, even in a one-station level) and none floats over the void", () => {
    for (const size of SIZES) for (const stations of [1, 2, 4, 8]) for (const count of COUNTS) {
      const { w } = build({ layout: "terraces", size, stations, npcs: 0, collectibles: count, boss: false });
      const tag = `${size}/st${stations}/c${count}`;
      expect(w.collectibles, tag).toHaveLength(count);
      for (const c of w.collectibles) expect(standsOn(w, c.x, c.y - 0.9, c.z), `${tag} ${c.itemId} at ${c.x.toFixed(1)},${c.y.toFixed(1)},${c.z.toFixed(1)}`).toBe(true);
    }
  });

  it("the number of collectibles is the declared number in every layout, named by the area and their place in the list", () => {
    for (const layout of LAYOUTS) for (const count of [0, 1, 7, 12]) {
      const { spec, w } = build({ layout, size: "small", stations: 3, collectibles: count });
      expect(w.collectibles.map((c) => c.itemId), `${layout}/${count}`).toEqual(Array.from({ length: count }, (_, i) => collectibleId(spec.areas[0]!.id, i)));
      expect(w.collectibles.every((c) => c.kind === spec.areas[0]!.collectibles.kind)).toBe(true);
    }
  });
});
