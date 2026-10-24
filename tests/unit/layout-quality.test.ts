import { describe, expect, it } from "vitest";
import { INTERACT_RADIUS } from "@/lib/game/engine/constants";
import type { GameSpec } from "@/lib/game/spec/schema";
import { buildWorld } from "@/lib/game/world/build";
import { collectibleRoom } from "@/lib/game/world/flow";
import type { WorldModel } from "@/lib/game/world/types";
import { clearanceAt, reshapeFirstArea, walkable } from "./world-helpers";
import { validDemoSpec } from "./helpers";

const base = validDemoSpec({ gameType: "adventure", mode: "FULL", subject: "Python loops" });
const LAYOUTS = ["plaza", "corridor", "rooms", "lab"] as const;
const SIZES = ["small", "medium", "large"] as const;

interface Config { layout: (typeof LAYOUTS)[number]; size: (typeof SIZES)[number]; stations: number; npcs: number; collectibles: number; portal: boolean; boss: boolean }
const tag = (c: Config) => `${c.layout}/${c.size}/st${c.stations}/np${c.npcs}/c${c.collectibles}/${c.portal ? "portal" : "no-portal"}/${c.boss ? "boss" : "no-boss"}`;

const configs: Config[] = [];
for (const layout of LAYOUTS) for (const size of SIZES) for (const stations of [1, 2, 4, 8]) for (const npcs of [0, 3]) for (const collectibles of [0, 12]) for (const portal of [false, true]) for (const boss of [false, true]) {
  if (boss && stations < 2) continue;
  configs.push({ layout, size, stations, npcs, collectibles, portal, boss });
}

const build = (c: Config): { spec: GameSpec; world: WorldModel } => {
  const spec = reshapeFirstArea(base, c);
  return { spec, world: buildWorld(spec, spec.areas[0]!.id) };
};

describe("worlds keep everything apart, inside the walls and out of the scenery (all layouts, sizes and crowds)", () => {
  it(`${configs.length} crowded and sparse areas`, () => {
    const problems: string[] = [];
    for (const c of configs) {
      const { world: w } = build(c);
      const t = tag(c);
      const b = w.bounds;
      const talk = [
        ...w.stations.map((s) => ({ id: s.stationId, k: "station", x: s.x, z: s.z })),
        ...w.npcs.map((n) => ({ id: n.npcId, k: "npc", x: n.x, z: n.z })),
        ...w.bosses.map((o) => ({ id: o.bossId, k: "boss", x: o.x, z: o.z })),
        ...(w.portal ? [{ id: "portal", k: "portal", x: w.portal.x, z: w.portal.z }] : []),
      ];
      for (const p of [...talk, ...w.collectibles.map((q) => ({ id: q.itemId, k: "collectible", x: q.x, z: q.z })), ...w.checkpoints.map((q) => ({ id: q.checkpointId, k: "checkpoint", x: q.x, z: q.z }))]) {
        if (p.x < b.x0 || p.x > b.x1 || p.z < b.z0 || p.z > b.z1) problems.push(`${t}: ${p.k} ${p.id} is outside the walls`);
        const need = p.k === "boss" ? 1.2 : p.k === "collectible" ? 0.55 : 0.3;
        if (clearanceAt(w, p.x, p.z) < need) problems.push(`${t}: ${p.k} ${p.id} is inside scenery or a wall`);
      }
      for (let i = 0; i < talk.length; i++) {
        for (let j = i + 1; j < talk.length; j++) {
          const d = Math.hypot(talk[i]!.x - talk[j]!.x, talk[i]!.z - talk[j]!.z);
          if (d < 2.4) problems.push(`${t}: ${talk[i]!.k} ${talk[i]!.id} and ${talk[j]!.k} ${talk[j]!.id} are only ${d.toFixed(2)} m apart`);
        }
      }
      for (const q of w.collectibles) {
        for (const p of talk) if (Math.hypot(q.x - p.x, q.z - p.z) < 1.1) problems.push(`${t}: collectible ${q.itemId} sits on ${p.k} ${p.id}`);
      }
      expect(w.collectibles.length, t).toBe(c.collectibles);
    }
    expect(problems).toEqual([]);
  });

  it("every station, character, boss, collectible, checkpoint and the portal can be walked to (doors open)", () => {
    const problems: string[] = [];
    let walked = 0;
    // every crowded area, plus every sixth of the rest
    configs.forEach((c, i) => {
      if (!(c.stations >= 8 || c.collectibles === 12 && c.stations === 1 || i % 6 === 0)) return;
      const { world: w } = build(c);
      const can = walkable(w);
      walked += 1;
      const t = tag(c);
      for (const s of w.stations) if (!can(s.x, s.z, INTERACT_RADIUS - 0.4)) problems.push(`${t}: station ${s.stationId} unreachable`);
      for (const n of w.npcs) if (!can(n.x, n.z, INTERACT_RADIUS - 0.4)) problems.push(`${t}: npc ${n.npcId} unreachable`);
      for (const o of w.bosses) if (!can(o.x, o.z, INTERACT_RADIUS - 0.4)) problems.push(`${t}: boss unreachable`);
      for (const q of w.collectibles) if (!can(q.x, q.z, 1.0)) problems.push(`${t}: collectible ${q.itemId} unreachable`);
      for (const q of w.checkpoints) if (!can(q.x, q.z, 1.5)) problems.push(`${t}: checkpoint ${q.checkpointId} unreachable`);
      if (w.portal && !can(w.portal.x, w.portal.z, INTERACT_RADIUS - 0.4)) problems.push(`${t}: portal unreachable`);
    });
    expect(walked).toBeGreaterThan(50);
    expect(problems).toEqual([]);
  }, 120_000);

  it("the boss stands in the same room as its last phase station, never behind a closed door", () => {
    const problems: string[] = [];
    for (const layout of ["rooms", "corridor"] as const) {
      for (const size of SIZES) {
        for (const stations of [2, 4, 8]) {
          const c: Config = { layout, size, stations, npcs: 0, collectibles: 0, portal: false, boss: true };
          const { world: w } = build(c);
          const boss = w.bosses[0]!;
          const last = w.stations.find((s) => s.stationId === boss.phaseStationIds.at(-1))!;
          // with every door shut, whatever can be reached from the boss's spot must include the station (and the other way round)
          const shut = walkable({ ...w, spawn: { ...w.spawn, x: last.x, z: last.z } }, () => false);
          if (!shut(boss.x, boss.z, 0.8)) problems.push(`${tag(c)}: the boss is not in its station's room`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("a platformer boss stands on the platform of its last phase station, clear of lava", () => {
  it("for every size and number of stations", () => {
    for (const size of SIZES) {
      for (const stations of [2, 3, 6]) {
        const spec = reshapeFirstArea(base, { layout: "terraces", size, stations, npcs: 1, collectibles: 4, portal: true, boss: true });
        const w = buildWorld(spec, spec.areas[0]!.id);
        const boss = w.bosses[0]!;
        const last = w.stations.find((s) => s.stationId === boss.phaseStationIds.at(-1))!;
        const pad = w.boxes.find((p) => p.kind === "platform" && last.x >= p.x0 && last.x <= p.x1 && last.z >= p.z0 && last.z <= p.z1)!;
        const label = `${size}/${stations}`;
        expect(boss.x, label).toBeGreaterThan(pad.x0);
        expect(boss.x, label).toBeLessThan(pad.x1);
        expect(boss.z, label).toBeGreaterThan(pad.z0);
        expect(boss.z, label).toBeLessThan(pad.z1);
        expect(boss.y, label).toBeCloseTo(pad.y1, 5);
        expect(w.hazards.some((h) => boss.x > h.x0 && boss.x < h.x1 && boss.z > h.z0 && boss.z < h.z1), `${label}: boss over lava`).toBe(false);
      }
    }
  });
});

describe("rooms and corridors with doors: where things are matches the order the doors open", () => {
  for (const layout of ["rooms", "corridor"] as const) {
    it(`${layout}: with the doors shut one by one, exactly the characters, stations, collectibles and portal the flow model promises can be reached`, () => {
      for (const stations of [2, 3, 5]) {
        const c: Config = { layout, size: "medium", stations, npcs: 2, collectibles: stations + 4, portal: true, boss: false };
        const { spec, world: w } = build(c);
        const area = spec.areas[0]!;
        const gateIds = w.gates.map((g) => g.id);
        expect(gateIds.length, `${layout}/${stations} doors`).toBe(stations - 1);
        // gate k waits for station k (the door after it)
        w.gates.forEach((g, k) => expect(g.opensWhenStationsDone, `${layout} door ${k}`).toEqual([area.stations[k]!.id]));
        for (let opened = 0; opened < stations; opened++) {
          const can = walkable(w, (id) => w.gates.findIndex((g) => g.id === id) < opened);
          const label = `${layout}/${stations} stations, ${opened} doors open`;
          for (const n of w.npcs) expect(can(n.x, n.z, INTERACT_RADIUS - 0.4), `${label}: npc`).toBe(true);
          w.stations.forEach((s, k) => expect(can(s.x, s.z, INTERACT_RADIUS - 0.4), `${label}: station ${k}`).toBe(k <= opened));
          w.collectibles.forEach((q, j) => expect(can(q.x, q.z, 1.0), `${label}: collectible ${j}`).toBe(collectibleRoom(area, j) <= opened));
          expect(can(w.portal!.x, w.portal!.z, INTERACT_RADIUS - 0.4), `${label}: portal`).toBe(opened >= stations - 1);
        }
      }
    });
  }
});
