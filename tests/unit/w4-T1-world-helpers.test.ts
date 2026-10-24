import { describe, expect, it } from "vitest";
import { ENVIRONMENTS, LAYOUTS, TIMES_OF_DAY } from "@/lib/game/spec/constants";
import { mulberry32 } from "@/lib/game/util/prng";
import { box, centered, dist2d, farthestSpot, lineOfWalk, scatter, settlePlacements, sizeScale, solidClearance, type LayoutResult } from "@/lib/game/world/helpers";
import { LAYOUT_BUILDERS } from "@/lib/game/world/layouts";
import { COLLIDER, ENV_DECOR, themeFor } from "@/lib/game/world/theme";
import type { EnvTheme, WorldBox } from "@/lib/game/world/types";

/**
 * World building blocks (wave 4, T1): the pure helpers every layout is made of, the theme table and the scenery tables.
 * The layouts themselves are covered by `world.test.ts`, `layout-quality.test.ts` and `w2-world-*.test.ts`; these tests
 * pin the small rules those suites rely on without saying so (what a box is, which scenery blocks a walk, when an item
 * is moved and when it is left exactly where it stands).
 */

const HEX = /^#[0-9a-f]{6}$/;
const channels = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const brightness = (c: string): number => channels(c).reduce((a, b) => a + b, 0);

describe("box and centered", () => {
  it("normalise reversed coordinates to min/max", () => {
    const b = box("b", "wall", 5, -5, 3, 0, 2, -2);
    expect([b.x0, b.x1, b.y0, b.y1, b.z0, b.z1]).toEqual([-5, 5, 0, 3, -2, 2]);
  });

  it("flag every kind the way the simulation reads it", () => {
    const flags = (kind: WorldBox["kind"]) => {
      const b = box("k", kind, 0, 1, 0, 1, 0, 1);
      return { visible: b.visible, solid: b.solid, walkable: b.walkable, style: b.style };
    };
    // the floor is stood on, never bumped into; a platform both; walls, doors and bounds only block; bounds are invisible
    expect(flags("floor")).toEqual({ visible: true, solid: false, walkable: true, style: "floor" });
    expect(flags("platform")).toEqual({ visible: true, solid: true, walkable: true, style: "platform" });
    expect(flags("wall")).toEqual({ visible: true, solid: true, walkable: false, style: "wall" });
    expect(flags("gate")).toEqual({ visible: true, solid: true, walkable: false, style: "gate" });
    expect(flags("bounds")).toEqual({ visible: false, solid: true, walkable: false, style: "bounds" });
    expect(flags("prop")).toMatchObject({ visible: true, solid: true });
  });

  it("let the options override a default, and centered is a box around its centre", () => {
    const b = box("g", "gate", 0, 1, 0, 1, 0, 1, { gateId: "gate-0", style: "door", visible: false });
    expect(b).toMatchObject({ gateId: "gate-0", style: "door", visible: false, solid: true });
    const c = centered("c", "prop", 2, -4, 4, 2, 0, 1);
    expect([c.x0, c.x1, c.z0, c.z1]).toEqual([0, 4, -5, -3]);
  });
});

describe("sizeScale and dist2d", () => {
  it("map the three sizes to 0, 1 and 2", () => {
    expect([sizeScale("small"), sizeScale("medium"), sizeScale("large")]).toEqual([0, 1, 2]);
  });

  it("dist2d ignores height", () => {
    expect(dist2d({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
    expect(dist2d({ x: 1, z: 1 }, { x: 1, z: 1 })).toBe(0);
  });
});

describe("scatter", () => {
  const region = { minR: 4, maxR: 12 };

  it("is deterministic for a random sequence", () => {
    expect(scatter(mulberry32(7), 8, region, 2, [])).toEqual(scatter(mulberry32(7), 8, region, 2, []));
    expect(scatter(mulberry32(7), 8, region, 2, [])).not.toEqual(scatter(mulberry32(8), 8, region, 2, []));
  });

  it("keeps every point inside the ring, apart from each other, clear of what to avoid and of what is already there", () => {
    const avoid = [{ x: 6, z: 0, r: 3 }, { x: -6, z: 0, r: 3 }];
    const existing = [{ x: 0, y: 0, z: 8 }];
    const pts = scatter(mulberry32(3), 10, region, 2.5, avoid, existing);
    expect(pts.length).toBeGreaterThan(3);
    for (const p of pts) {
      const r = Math.hypot(p.x, p.z);
      expect(r).toBeGreaterThanOrEqual(region.minR - 1e-9);
      expect(r).toBeLessThanOrEqual(region.maxR + 1e-9);
      for (const a of avoid) expect(dist2d(p, a)).toBeGreaterThanOrEqual(a.r);
      for (const e of existing) expect(dist2d(p, e)).toBeGreaterThanOrEqual(2.5);
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) expect(dist2d(pts[i]!, pts[j]!)).toBeGreaterThanOrEqual(2.5);
  });

  it("is centred on cx/cz when given", () => {
    for (const p of scatter(mulberry32(5), 6, { minR: 1, maxR: 3, cx: 100, cz: -50 }, 0.5, [])) {
      expect(Math.hypot(p.x - 100, p.z + 50)).toBeLessThanOrEqual(3 + 1e-9);
      expect(Math.hypot(p.x - 100, p.z + 50)).toBeGreaterThanOrEqual(1 - 1e-9);
    }
  });

  it("gives up after a bounded number of tries instead of looping when the room is too small", () => {
    // a ring 1 m wide cannot hold 50 points 3 m apart: it returns the few that fit, and it returns
    const pts = scatter(mulberry32(1), 50, { minR: 0, maxR: 1 }, 3, []);
    expect(pts.length).toBeGreaterThanOrEqual(1);
    expect(pts.length).toBeLessThan(5);
    expect(scatter(mulberry32(1), 0, region, 2, [])).toEqual([]);
    // everything is blocked: nothing comes back
    expect(scatter(mulberry32(1), 5, region, 2, [{ x: 0, z: 0, r: 100 }])).toEqual([]);
  });
});

describe("farthestSpot", () => {
  it("picks the candidate whose nearest obstacle is farthest away", () => {
    const candidates = [{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 20, z: 0 }];
    expect(farthestSpot(candidates, [{ x: 0, z: 0 }, { x: 10, z: 1 }])).toEqual({ x: 20, z: 0 });
    // it is the NEAREST obstacle that counts, not the average
    expect(farthestSpot([{ x: 0, z: 0 }, { x: 5, z: 0 }], [{ x: -1, z: 0 }, { x: 100, z: 0 }, { x: 5, z: 0.5 }])).toEqual({ x: 0, z: 0 });
  });

  it("without obstacles (or on a tie) the first candidate wins, and one candidate is returned as it is", () => {
    const candidates = [{ x: 1, z: 1 }, { x: 2, z: 2 }];
    expect(farthestSpot(candidates, [])).toBe(candidates[0]);
    expect(farthestSpot([{ x: 3, z: 3 }], [{ x: 3, z: 3 }])).toEqual({ x: 3, z: 3 });
  });
});

describe("solidClearance", () => {
  const wall = box("w", "wall", 0, 2, 0, 3, 0, 2);

  it("is the distance to the nearest solid box, and 0 inside it", () => {
    expect(solidClearance([wall], 5, 1)).toBe(3);
    expect(solidClearance([wall], 5, 6)).toBe(Math.hypot(3, 4)); // from the corner
    expect(solidClearance([wall], 1, 1)).toBe(0);
    expect(solidClearance([wall, box("w2", "wall", 10, 11, 0, 3, 0, 2)], 8, 1)).toBe(2);
  });

  it("is Infinity when nothing blocks", () => {
    expect(solidClearance([], 0, 0)).toBe(Infinity);
  });

  it("ignores what does not block a walk: the floor, the invisible bounds and anything lower than a step", () => {
    const floor = box("f", "floor", -50, 50, -0.5, 0, -50, 50);
    const bounds = box("b", "bounds", 3, 4, 0, 12, -50, 50);
    const kerb = box("k", "prop", 5, 6, 0, 0.45, 0, 2); // 0.45 m: the player steps over it
    const stool = box("s", "prop", 5, 6, 0, 0.46, 0, 2); // a hair taller: it blocks
    expect(solidClearance([floor, bounds, kerb], 4.5, 1)).toBe(Infinity);
    expect(solidClearance([kerb, stool], 7, 1)).toBe(1);
    // a closed door blocks
    expect(solidClearance([box("g", "gate", 0, 4, 0, 4, 0, 0.8, { gateId: "g" })], 2, 3)).toBe(2.2);
  });
});

describe("lineOfWalk", () => {
  const from = { x: 0, z: 0 };
  const to = { x: 10, z: 0 };

  it("is true across open floor and false through a wall, a door or scenery", () => {
    expect(lineOfWalk([], from, to)).toBe(true);
    expect(lineOfWalk([box("w", "wall", 4, 4.5, 0, 3, -5, 5)], from, to)).toBe(false);
    expect(lineOfWalk([box("g", "gate", 4, 4.8, 0, 4, -5, 5, { gateId: "g" })], from, to)).toBe(false);
    expect(lineOfWalk([box("p", "prop", 5, 6, 0, 1, -1, 1)], from, to)).toBe(false);
  });

  it("is not stopped by a wall the path runs alongside, or by something the player steps over", () => {
    expect(lineOfWalk([box("w", "wall", 0, 10, 0, 3, 3, 3.5)], from, to)).toBe(true);
    expect(lineOfWalk([box("kerb", "prop", 4, 4.5, 0, 0.4, -5, 5)], from, to)).toBe(true);
  });

  it("does not count scenery within a metre of the start (the item may be hugging a prop)", () => {
    expect(lineOfWalk([box("hug", "prop", 0.3, 0.8, 0, 2, -1, 1)], from, to)).toBe(true);
    // ...but the same prop in the middle of the path stops it
    expect(lineOfWalk([box("mid", "prop", 4.3, 4.8, 0, 2, -1, 1)], from, to)).toBe(false);
  });

  it("a very short step is always fine", () => {
    expect(lineOfWalk([box("w", "wall", 0, 1, 0, 3, -1, 1)], from, { x: 0.3, z: 0 })).toBe(true);
  });
});

// ───────────────────────────── settlePlacements ─────────────────────────────

const layout = (over: Partial<LayoutResult> = {}): LayoutResult => ({
  bounds: { x0: -20, x1: 20, z0: -20, z1: 20 }, killY: -60, spawn: { x: 0, y: 0, z: 18, yaw: 0 }, boxes: [], decor: [], stations: [], npcs: [],
  collectibles: [], checkpoints: [], hazards: [], gates: [], portal: null, hasVoid: false, ...over,
});
const station = (x: number, z: number) => ({ stationId: `s${x}_${z}`, kind: "challenge" as const, label: "s", x, y: 0, z, facing: 0 });
const npc = (id: string, x: number, z: number) => ({ npcId: id, name: id, color: "#fff", shape: "robot" as const, x, y: 0, z, facing: 0 });
const gem = (id: string, x: number, z: number) => ({ itemId: id, kind: "gem" as const, x, y: 0.9, z });
const cp = (id: string, x: number, z: number) => ({ checkpointId: id, x, y: 0, z });
const where = (p: { x: number; z: number }) => ({ x: p.x, z: p.z });

describe("settlePlacements: items that were fine stay exactly where they are", () => {
  it("leaves a well-placed crowd untouched (same numbers, not just close)", () => {
    const r = layout({
      stations: [station(-8, -8), station(8, -8)], npcs: [npc("n1", 0, 10), npc("n2", 4, 10)], collectibles: [gem("g1", 0, 0), gem("g2", 3, 0), gem("g3", -3, 3)],
      checkpoints: [cp("c1", 0, -3)], portal: { toAreaId: "a-2", label: "go", requiresMissionIds: [], x: 15, y: 0, z: -15 },
    });
    const before = JSON.stringify(r);
    settlePlacements(r, "npcs");
    settlePlacements(r, "items");
    expect(JSON.stringify(r)).toBe(before);
  });

  it("does nothing at all in a platformer, which places everything on its own platform", () => {
    const r = layout({ hasVoid: true, stations: [station(0, 0)], npcs: [npc("n", 0, 0)], collectibles: [gem("g", 0, 0)], checkpoints: [cp("c", 0, 0)] });
    const before = JSON.stringify(r);
    settlePlacements(r, "npcs");
    settlePlacements(r, "items");
    expect(JSON.stringify(r)).toBe(before);
  });

  it("is idempotent: a second pass has nothing left to move", () => {
    const r = layout({ stations: [station(0, 0)], npcs: [npc("n", 0.5, 0.5)], collectibles: [gem("g", 0, 1), gem("h", 0.2, 1)], checkpoints: [cp("c", 0, 0.5)] });
    settlePlacements(r, "npcs");
    settlePlacements(r, "items");
    const once = JSON.stringify(r);
    settlePlacements(r, "npcs");
    settlePlacements(r, "items");
    expect(JSON.stringify(r)).toBe(once);
  });
});

describe("settlePlacements: what is moved, and how far", () => {
  it("a character on a station moves at least 3 m from it, stays inside the walls and is not left on top of anything", () => {
    const r = layout({ stations: [station(0, 0)], npcs: [npc("n", 0.2, 0.2)] });
    settlePlacements(r, "npcs");
    const n = r.npcs[0]!;
    expect(dist2d(n, r.stations[0]!)).toBeGreaterThanOrEqual(3);
    expect(n.x).toBeGreaterThanOrEqual(r.bounds.x0 + 1);
    expect(n.x).toBeLessThanOrEqual(r.bounds.x1 - 1);
    expect(n.z).toBeGreaterThanOrEqual(r.bounds.z0 + 1);
    expect(n.z).toBeLessThanOrEqual(r.bounds.z1 - 1);
    // it moves to the NEAREST free spot, not across the map
    expect(dist2d(n, { x: 0.2, z: 0.2 })).toBeLessThan(5);
  });

  it("a character inside scenery is moved at least 0.9 m from it", () => {
    const prop = box("prop", "prop", -1, 1, 0, 2, -1, 1, { walkable: false });
    const r = layout({ boxes: [prop], npcs: [npc("n", 0, 0)] });
    settlePlacements(r, "npcs");
    expect(solidClearance(r.boxes, r.npcs[0]!.x, r.npcs[0]!.z)).toBeGreaterThanOrEqual(0.9);
  });

  it("a character at the spawn point is moved away from it", () => {
    const r = layout({ spawn: { x: 0, y: 0, z: 0, yaw: 0 }, npcs: [npc("n", 0.5, 0.5)] });
    settlePlacements(r, "npcs");
    expect(dist2d(r.npcs[0]!, r.spawn)).toBeGreaterThanOrEqual(1.6);
  });

  it("collectibles and checkpoints may stand at the spawn point (only characters keep away from it)", () => {
    const r = layout({ spawn: { x: 0, y: 0, z: 0, yaw: 0 }, collectibles: [gem("g", 0.5, 0.5)], checkpoints: [cp("c", -0.5, -0.5)] });
    settlePlacements(r, "items");
    expect(where(r.collectibles[0]!)).toEqual({ x: 0.5, z: 0.5 });
    expect(where(r.checkpoints[0]!)).toEqual({ x: -0.5, z: -0.5 });
  });

  it("two characters on one spot end up at least 2.6 m apart", () => {
    const r = layout({ npcs: [npc("a", 5, 5), npc("b", 5, 5)] });
    settlePlacements(r, "npcs");
    expect(dist2d(r.npcs[0]!, r.npcs[1]!)).toBeGreaterThanOrEqual(2.6);
  });

  it("a collectible keeps 1.6 m from stations, 1.8 m from characters and the portal, 1 m from another collectible, 0.6 m from scenery", () => {
    const r = layout({
      stations: [station(0, 0)], npcs: [npc("n", 6, 0)], portal: { toAreaId: "a-2", label: "go", requiresMissionIds: [], x: -6, y: 0, z: 0 },
      boxes: [box("p", "prop", 0, 1, 0, 2, 5, 6, { walkable: false })],
      collectibles: [gem("on-station", 0.2, 0), gem("on-npc", 6.2, 0), gem("on-portal", -6.2, 0), gem("on-prop", 0.5, 5.5), gem("a", 10, 10), gem("b", 10, 10)],
    });
    settlePlacements(r, "items");
    for (const g of r.collectibles) {
      expect(dist2d(g, r.stations[0]!), g.itemId).toBeGreaterThanOrEqual(1.6);
      expect(dist2d(g, r.npcs[0]!), g.itemId).toBeGreaterThanOrEqual(1.8);
      expect(dist2d(g, r.portal!), g.itemId).toBeGreaterThanOrEqual(1.8);
      expect(solidClearance(r.boxes, g.x, g.z), g.itemId).toBeGreaterThanOrEqual(0.6);
    }
    expect(dist2d(r.collectibles[4]!, r.collectibles[5]!)).toBeGreaterThanOrEqual(1);
  });

  it("a checkpoint keeps 1.8 m from stations and 2 m from the portal and from another checkpoint", () => {
    const r = layout({
      stations: [station(0, 0)], portal: { toAreaId: "a-2", label: "go", requiresMissionIds: [], x: 10, y: 0, z: 0 },
      checkpoints: [cp("c1", 0.3, 0), cp("c2", 10.3, 0), cp("c3", 14, 14), cp("c4", 14, 14)],
    });
    settlePlacements(r, "items");
    for (const c of r.checkpoints) {
      expect(dist2d(c, r.stations[0]!), c.checkpointId).toBeGreaterThanOrEqual(1.8);
      expect(dist2d(c, r.portal!), c.checkpointId).toBeGreaterThanOrEqual(2);
    }
    expect(dist2d(r.checkpoints[2]!, r.checkpoints[3]!)).toBeGreaterThanOrEqual(2);
  });

  it("nothing is left in lava (a 0.8 m margin around it)", () => {
    const lava = { id: "lava-0", x0: -2, x1: 2, z0: -2, z1: 2, y: 0, kind: "lava" as const };
    const r = layout({ hazards: [lava], collectibles: [gem("g", 0, 0), gem("h", 2.5, 0)], checkpoints: [cp("c", 1, 1)] });
    settlePlacements(r, "items");
    for (const p of [...r.collectibles, ...r.checkpoints]) expect(p.x > -2.8 && p.x < 2.8 && p.z > -2.8 && p.z < 2.8, JSON.stringify(p)).toBe(false);
  });

  it("an item stays on its own side of a wall: the spot it moves to is reachable in a straight line", () => {
    // a station at the origin; the gem sits on it, a long wall 1.2 m to the south must not be jumped over
    const wall = box("wall", "wall", -15, 15, 0, 3, 1.2, 1.6);
    const r = layout({ boxes: [wall], stations: [station(0, 0)], collectibles: [gem("g", 0, 0.3)] });
    settlePlacements(r, "items");
    const g = r.collectibles[0]!;
    expect(dist2d(g, r.stations[0]!)).toBeGreaterThanOrEqual(1.6);
    expect(g.z).toBeLessThan(1.2);
  });

  it("an item with nowhere to go stays where it is: it is never dropped, thrown out of the room or sent through a wall", () => {
    // the room is 3 m square: no spot is both 1 m inside the walls and 1.6 m from the station in the middle
    const r = layout({ bounds: { x0: -1.5, x1: 1.5, z0: -1.5, z1: 1.5 }, stations: [station(0, 0)], collectibles: [gem("g", 0.1, 0.1)] });
    settlePlacements(r, "items");
    expect(where(r.collectibles[0]!)).toEqual({ x: 0.1, z: 0.1 });
  });
});

describe("settlePlacements: the two passes and the bosses", () => {
  it("the character pass moves only characters, the item pass only collectibles and checkpoints", () => {
    const mk = () => layout({ stations: [station(0, 0)], npcs: [npc("n", 0.2, 0)], collectibles: [gem("g", 0.2, 0)], checkpoints: [cp("c", 0.2, 0)] });
    const a = mk();
    settlePlacements(a, "npcs");
    expect(where(a.npcs[0]!)).not.toEqual({ x: 0.2, z: 0 });
    expect(where(a.collectibles[0]!)).toEqual({ x: 0.2, z: 0 });
    expect(where(a.checkpoints[0]!)).toEqual({ x: 0.2, z: 0 });
    const b = mk();
    settlePlacements(b, "items");
    expect(where(b.npcs[0]!)).toEqual({ x: 0.2, z: 0 });
    expect(where(b.collectibles[0]!)).not.toEqual({ x: 0.2, z: 0 });
    expect(where(b.checkpoints[0]!)).not.toEqual({ x: 0.2, z: 0 });
  });

  it("collectibles and checkpoints keep clear of the bosses they are given", () => {
    const boss = { x: 8, z: 8 };
    const r = layout({ collectibles: [gem("g", 8.4, 8)], checkpoints: [cp("c", 8, 8.4)] });
    settlePlacements(r, "items", [boss]);
    expect(dist2d(r.collectibles[0]!, boss)).toBeGreaterThanOrEqual(1.8);
    expect(dist2d(r.checkpoints[0]!, boss)).toBeGreaterThanOrEqual(1.8);
    // without the boss in the list the same items are fine where they are
    const free = layout({ collectibles: [gem("g", 8.4, 8)], checkpoints: [cp("c", 8, 8.4)] });
    settlePlacements(free, "items");
    expect(where(free.collectibles[0]!)).toEqual({ x: 8.4, z: 8 });
  });
});

// ───────────────────────────── theme and scenery tables ─────────────────────────────

describe("themeFor", () => {
  it("every environment at every time of day is a complete theme with real colours", () => {
    for (const env of ENVIRONMENTS) for (const time of TIMES_OF_DAY) {
      const t = themeFor(env, time);
      for (const key of ["skyTop", "skyBottom", "fog", "ground", "groundAlt", "wall", "platform", "accent", "accent2", "sun"] as const) expect(t[key], `${env}/${time}/${key}`).toMatch(HEX);
      expect(t.sunIntensity, `${env}/${time}`).toBeGreaterThan(0);
      expect(t.ambient, `${env}/${time}`).toBeGreaterThan(0);
      expect(typeof t.stars).toBe("boolean");
      expect(typeof t.clouds).toBe("boolean");
    }
  });

  it("dusk warms and dims the sky, night darkens it and always shows the stars and never the clouds", () => {
    for (const env of ENVIRONMENTS) {
      const day = themeFor(env, "day");
      const dusk = themeFor(env, "dusk");
      const night = themeFor(env, "night");
      expect(dusk.sunIntensity, env).toBeCloseTo(day.sunIntensity * 0.8, 9);
      expect(dusk.ambient, env).toBeCloseTo(day.ambient * 0.8, 9);
      expect(dusk.skyBottom, env).not.toBe(day.skyBottom);
      expect([dusk.stars, dusk.clouds], env).toEqual([day.stars, day.clouds]); // dusk changes the light, not what is in the sky
      expect(night.stars, env).toBe(true);
      expect(night.clouds, env).toBe(false);
      expect(night.sun, env).toBe("#8fa8ff");
      expect(night.sunIntensity, env).toBeCloseTo(day.sunIntensity * 0.75, 9);
      expect(night.ambient, env).toBeCloseTo(day.ambient * 0.9, 9);
      // (the space station's sky is already darker by day than the night colour the others are mixed towards)
      expect(brightness(night.skyTop), env).toBeLessThanOrEqual(Math.max(brightness(day.skyTop), brightness("#02040f")));
      expect(brightness(night.fog), env).toBeLessThan(brightness(day.fog));
      expect(brightness(night.ground), env).toBeLessThanOrEqual(brightness(day.ground));
    }
  });

  it("the spec's palette sets the accent and tints the platforms and walls towards its primary colour, and nothing else", () => {
    for (const env of ENVIRONMENTS) {
      const plain = themeFor(env, "day");
      const dyed = themeFor(env, "day", { primary: "#000000", accent: "#123456" });
      expect(dyed.accent, env).toBe("#123456");
      // 55 % towards black for platforms, 35 % for walls (rounded per channel)
      channels(plain.platform).forEach((c, i) => expect(channels(dyed.platform)[i], env).toBe(Math.round(c * 0.45)));
      channels(plain.wall).forEach((c, i) => expect(channels(dyed.wall)[i], env).toBe(Math.round(c * 0.65)));
      expect({ ...dyed, accent: plain.accent, platform: plain.platform, wall: plain.wall }, env).toEqual(plain);
      // a primary equal to the platform changes nothing
      expect(themeFor(env, "day", { primary: plain.platform, accent: plain.accent }).platform, env).toBe(plain.platform);
    }
  });

  it("hands out a fresh object every time: changing one theme never changes the next", () => {
    const a = themeFor("forest", "day");
    a.clouds = false;
    a.accent = "#000000";
    themeFor("forest", "night"); // night flips stars and clouds on its own copy
    const b = themeFor("forest", "day");
    expect(b.clouds).toBe(true);
    expect(b.stars).toBe(false);
    expect(b.accent).not.toBe("#000000");
    expect(b).not.toBe(a);
  });

  it("keeps the environments apart in the dark too (night never makes two worlds the same)", () => {
    const skies = new Set<string>(ENVIRONMENTS.map((env) => { const t: EnvTheme = themeFor(env, "night"); return `${t.skyTop}${t.ground}${t.accent}`; }));
    expect(skies.size).toBe(ENVIRONMENTS.length);
  });
});

describe("scenery tables", () => {
  it("every environment lists solid and ambient props, and every solid prop has a collider of its own", () => {
    for (const env of ENVIRONMENTS) {
      expect(ENV_DECOR[env].solid.length, env).toBeGreaterThan(0);
      expect(ENV_DECOR[env].ambient.length, env).toBeGreaterThan(0);
      for (const kind of ENV_DECOR[env].solid) expect(COLLIDER[kind], `${env}: ${kind} would be walked through or get the fallback box`).toBeDefined();
    }
    expect(Object.keys(ENV_DECOR).sort()).toEqual([...ENVIRONMENTS].sort());
  });

  it("a collider is never wider than 0.9 m at the largest scale a layout gives it, so every gap between props stays wider than the player", () => {
    // plaza: scale = rad * 1.6 with rad at most 0.55 + 0.35 = 0.9
    const largest = 0.9 * 1.6;
    for (const [kind, c] of Object.entries(COLLIDER)) {
      expect(c!.r * largest, kind).toBeLessThanOrEqual(0.9 + 1e-9);
      expect(c!.h, kind).toBeGreaterThan(0.45); // lower than a step and it would not block anything
    }
  });
});

describe("the layout registry", () => {
  it("has a builder for every layout the spec allows, and no other", () => {
    expect(Object.keys(LAYOUT_BUILDERS).sort()).toEqual([...LAYOUTS].sort());
  });
});
