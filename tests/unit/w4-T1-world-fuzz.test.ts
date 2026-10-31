import { describe, expect, it } from "vitest";
import { INTERACT_RADIUS } from "@/lib/game/engine/constants";
import { ENVIRONMENTS, LAYOUTS, MECHANICS, TIMES_OF_DAY, type Mechanic } from "@/lib/game/spec/constants";
import type { GameSpec } from "@/lib/game/spec/schema";
import { hashSeed, mulberry32 } from "@/lib/game/util/prng";
import { buildWorld } from "@/lib/game/world/build";
import { dist2d } from "@/lib/game/world/helpers";
import type { WorldModel } from "@/lib/game/world/types";
import { clearanceAt, reshapeFirstArea, walkable } from "./world-helpers";
import { validDemoSpec } from "./helpers";

/**
 * Random areas (wave 4, T1): the layout suites walk a fixed grid of shapes; this one draws shapes at random (any layout,
 * size, number of stations, characters and gems, any subset of the mechanics, any world and time of day, none to three
 * bosses on any stations) and checks what must hold for every one of them: the world builds, it contains what the spec
 * declares, nothing is outside it or inside scenery, and on foot (doors open) every point the player must reach can be
 * reached. The same seed gives the same shapes, so a failure names a shape that can be replayed.
 */

const base = validDemoSpec({ gameType: "adventure", mode: "FULL", subject: "Python loops" });
const SIZES = ["small", "medium", "large"] as const;
const HAZARD_LEVELS = ["none", "low", "high"] as const;

interface Drawn { tag: string; spec: GameSpec; layout: (typeof LAYOUTS)[number]; stations: number }

function draw(seed: string, count: number): Drawn[] {
  const rnd = mulberry32(hashSeed(seed));
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pick = <T,>(xs: readonly T[]): T => xs[int(0, xs.length - 1)]!;
  const out: Drawn[] = [];
  for (let k = 0; k < count; k++) {
    const layout = pick(LAYOUTS);
    const stations = int(1, 8);
    const spec = reshapeFirstArea(base, { layout, size: pick(SIZES), stations, npcs: int(0, 3), collectibles: int(0, 12), portal: rnd() < 0.7, boss: false });
    // any subset of the mechanics the world builder reads
    const keep = (MECHANICS as readonly Mechanic[]).filter((m) => !["collect", "dialogue", "checkpoints", "gates", "hazards", "moving_platforms", "jump"].includes(m) || rnd() < 0.6);
    spec.mechanics = keep as GameSpec["mechanics"];
    const area = spec.areas[0]!;
    area.hazardLevel = pick(HAZARD_LEVELS);
    spec.theme.environment = pick(ENVIRONMENTS);
    spec.theme.timeOfDay = pick(TIMES_OF_DAY);
    if (rnd() < 0.5) spec.theme.palette = { primary: `#${int(0, 0xffffff).toString(16).padStart(6, "0")}`, accent: `#${int(0, 0xffffff).toString(16).padStart(6, "0")}` };
    // none to three bosses, each fought at a run of one to five stations
    const template = { id: "b", areaId: area.id, name: "B", title: "t", intro: "i", defeatLine: "d", look: { color: "#ff0000", shape: "creature" as const }, phaseStationIds: [] as string[] };
    spec.bosses = Array.from({ length: int(0, Math.min(3, stations)) }, (_, b) => {
      const from = int(0, stations - 1);
      const phases = area.stations.slice(from, from + int(1, 5)).map((s) => s.id);
      return { ...template, id: `boss-${b}`, phaseStationIds: phases };
    });
    out.push({ tag: `#${k} ${layout}/${area.size}/st${stations}/np${area.npcs.length}/c${area.collectibles.count}/${spec.bosses.length}boss/${area.hazardLevel}/${spec.theme.environment}`, spec, layout, stations });
  }
  return out;
}

describe("random areas", () => {
  const shapes = draw("t1-world-fuzz", 220);

  it("build, and hold what the spec declares", () => {
    const problems: string[] = [];
    for (const { tag, spec, layout } of shapes) {
      let w: WorldModel;
      try {
        w = buildWorld(spec, spec.areas[0]!.id);
      } catch (e) {
        problems.push(`${tag}: threw ${(e as Error).message}`);
        continue;
      }
      const area = spec.areas[0]!;
      if (w.stations.length !== area.stations.length) problems.push(`${tag}: ${w.stations.length} stations`);
      if (w.npcs.length !== area.npcs.length) problems.push(`${tag}: ${w.npcs.length} characters`);
      if (w.collectibles.length !== area.collectibles.count) problems.push(`${tag}: ${w.collectibles.length} gems`);
      if (Boolean(w.portal) !== Boolean(area.portal)) problems.push(`${tag}: portal ${Boolean(w.portal)}`);
      if (w.bosses.length !== spec.bosses.length) problems.push(`${tag}: ${w.bosses.length} bosses`);
      if (w.hasVoid !== (layout === "terraces")) problems.push(`${tag}: hasVoid ${w.hasVoid}`);
      const ids = w.boxes.map((b) => b.id);
      if (new Set(ids).size !== ids.length) problems.push(`${tag}: duplicate box ids`);
      const numbers = [...w.stations, ...w.npcs, ...w.bosses, ...w.collectibles, ...w.checkpoints, w.spawn, ...(w.portal ? [w.portal] : [])].flatMap((p) => [p.x, p.y, p.z]);
      if (!numbers.every(Number.isFinite)) problems.push(`${tag}: a position is not finite`);
      if (!Number.isFinite(w.killY) || !Object.values(w.bounds).every(Number.isFinite)) problems.push(`${tag}: bounds or kill height not finite`);
      // the same spec builds the same world
      if (JSON.stringify(buildWorld(spec, area.id)) !== JSON.stringify(w)) problems.push(`${tag}: not deterministic`);
    }
    expect(problems).toEqual([]);
  });

  it("everything stands inside the walls and out of the scenery, and on foot (doors open) everything the player must reach can be reached", () => {
    const problems: string[] = [];
    let walked = 0;
    for (const { tag, spec, layout } of shapes) {
      if (layout === "terraces") continue; // platformers are crossed by jumping: `world.test.ts` plays them with the real physics
      const w = buildWorld(spec, spec.areas[0]!.id);
      const b = w.bounds;
      const everything = [
        ...w.stations.map((p) => ({ k: `station ${p.stationId}`, p, within: INTERACT_RADIUS - 0.4, clear: 0.3 })),
        ...w.npcs.map((p) => ({ k: `npc ${p.npcId}`, p, within: INTERACT_RADIUS - 0.4, clear: 0.3 })),
        ...w.bosses.map((p) => ({ k: `boss ${p.bossId}`, p, within: INTERACT_RADIUS - 0.4, clear: 1.2 })),
        ...w.collectibles.map((p) => ({ k: `gem ${p.itemId}`, p, within: 1.0, clear: 0.55 })),
        ...w.checkpoints.map((p) => ({ k: `checkpoint ${p.checkpointId}`, p, within: 1.5, clear: 0.3 })),
        ...(w.portal ? [{ k: "portal", p: w.portal, within: INTERACT_RADIUS - 0.4, clear: 0.3 }] : []),
      ];
      const can = walkable(w);
      walked++;
      for (const { k, p, within, clear } of everything) {
        if (p.x < b.x0 || p.x > b.x1 || p.z < b.z0 || p.z > b.z1) problems.push(`${tag}: ${k} is outside the walls`);
        else if (clearanceAt(w, p.x, p.z) < clear) problems.push(`${tag}: ${k} is inside scenery or a wall`);
        if (!can(p.x, p.z, within)) problems.push(`${tag}: ${k} cannot be reached on foot`);
      }
      // nothing the player can talk to stands closer than 2.4 m to anything else they can talk to
      const talk = [...w.stations.map((p) => ({ k: p.stationId, p })), ...w.npcs.map((p) => ({ k: p.npcId, p })), ...w.bosses.map((p) => ({ k: p.bossId, p })), ...(w.portal ? [{ k: "portal", p: w.portal }] : [])];
      for (let i = 0; i < talk.length; i++) for (let j = i + 1; j < talk.length; j++) {
        const gap = dist2d(talk[i]!.p, talk[j]!.p);
        // (a boss stands 2.4 m from its own station on a tight platform; the open layouts keep more)
        if (gap < 2.4 - 1e-6) problems.push(`${tag}: ${talk[i]!.k} and ${talk[j]!.k} are ${gap.toFixed(2)} m apart`);
      }
    }
    expect(walked).toBeGreaterThan(100);
    expect(problems).toEqual([]);
  }, 120_000);

  it("in a platformer nothing the player must reach lies over lava, whatever the hazard level and the mechanics", () => {
    const problems: string[] = [];
    let checked = 0;
    for (const { tag, spec, layout } of shapes) {
      if (layout !== "terraces") continue;
      checked++;
      const w = buildWorld(spec, spec.areas[0]!.id);
      const onLava = (x: number, z: number) => w.hazards.some((h) => x > h.x0 - 0.2 && x < h.x1 + 0.2 && z > h.z0 - 0.2 && z < h.z1 + 0.2);
      for (const p of [...w.stations, ...w.collectibles, ...w.checkpoints, ...w.bosses, ...(w.portal ? [w.portal] : [])]) if (onLava(p.x, p.z)) problems.push(`${tag}: something stands over lava at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
      if (spec.areas[0]!.hazardLevel === "none" || !spec.mechanics.includes("hazards")) expect(w.hazards, tag).toEqual([]);
    }
    expect(checked).toBeGreaterThan(20);
    expect(problems).toEqual([]);
  });
});
