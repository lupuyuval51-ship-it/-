import { describe, expect, it } from "vitest";
import { GameRuntime } from "@/lib/game/engine/runtime";
import { WorldSim, type SimInput } from "@/lib/game/engine/sim";
import { INTERACT_RADIUS, MAX_JUMP_HEIGHT, PLAYER_RADIUS } from "@/lib/game/engine/constants";
import { toPublicSpec } from "@/lib/game/spec/public";
import { initialState, toClientState } from "@/lib/game/state/progress";
import { buildWorld } from "@/lib/game/world/build";
import type { WorldModel } from "@/lib/game/world/types";
import { ENVIRONMENTS, type GameType } from "@/lib/game/spec/constants";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { buildDemoSpec } from "@/lib/game/demo";
import { request, validDemoSpec } from "./helpers";

// ───────────────────────── helpers ─────────────────────────

/** Flood-fill over a 0.4 m grid: which points can a player of real radius reach from the spawn? */
function reachable(world: WorldModel, openGates = true): (x: number, z: number, within: number) => boolean {
  const res = 0.4;
  const { x0, x1, z0, z1 } = world.bounds;
  const W = Math.ceil((x1 - x0) / res) + 1;
  const H = Math.ceil((z1 - z0) / res) + 1;
  const blocked = new Uint8Array(W * H);
  const solids = world.boxes.filter((b) => b.solid && !(openGates && b.kind === "gate") && b.y1 > 0.45);
  for (let i = 0; i < W; i++) {
    for (let j = 0; j < H; j++) {
      const x = x0 + i * res;
      const z = z0 + j * res;
      const hit = solids.some((b) => {
        const nx = Math.max(b.x0, Math.min(x, b.x1));
        const nz = Math.max(b.z0, Math.min(z, b.z1));
        return Math.hypot(x - nx, z - nz) < PLAYER_RADIUS;
      });
      const lava = world.hazards.some((h) => x > h.x0 - 0.3 && x < h.x1 + 0.3 && z > h.z0 - 0.3 && z < h.z1 + 0.3);
      if (hit || lava || x < x0 + PLAYER_RADIUS || x > x1 - PLAYER_RADIUS || z < z0 + PLAYER_RADIUS || z > z1 - PLAYER_RADIUS) blocked[i * H + j] = 1;
    }
  }
  const seen = new Uint8Array(W * H);
  const si = Math.round((world.spawn.x - x0) / res);
  const sj = Math.round((world.spawn.z - z0) / res);
  const stack = [[si, sj]] as [number, number][];
  seen[si * H + sj] = 1;
  while (stack.length) {
    const [i, j] = stack.pop()!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= W || nj >= H || seen[ni * H + nj] || blocked[ni * H + nj]) continue;
      seen[ni * H + nj] = 1;
      stack.push([ni, nj]);
    }
  }
  return (x, z, within) => {
    const r = Math.ceil(within / res);
    const ci = Math.round((x - x0) / res);
    const cj = Math.round((z - z0) / res);
    for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) {
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= W || j >= H) continue;
      if (Math.hypot(di * res, dj * res) <= within && seen[i * H + j]) return true;
    }
    return false;
  };
}

const IDLE: SimInput = { moveX: 0, moveY: 0, jump: false, sprint: false };

const specFor = (gameType: GameType) => validDemoSpec({ gameType, mode: "FULL" });

// ───────────────────────── world generation ─────────────────────────

describe("worlds are built from the spec and respect it", () => {
  it("every layout contains exactly the stations, NPCs, collectibles and portal the spec declares", () => {
    for (const gameType of ["adventure", "exploration", "puzzle", "simulation", "platformer"] as const) {
      const spec = specFor(gameType);
      for (const area of spec.areas) {
        const w = buildWorld(spec, area.id);
        expect(w.layout).toBe(area.layout);
        expect(w.stations.map((s) => s.stationId)).toEqual(area.stations.map((s) => s.id));
        expect(w.npcs.map((n) => n.npcId)).toEqual(area.npcs.map((n) => n.id));
        expect(w.collectibles).toHaveLength(area.collectibles.count);
        expect(Boolean(w.portal)).toBe(Boolean(area.portal));
        if (w.portal) expect(w.portal.toAreaId).toBe(area.portal!.toAreaId);
      }
    }
  });

  it("is deterministic for a spec, and differs between layouts and between specs", () => {
    const spec = specFor("adventure");
    const a = buildWorld(spec, "a-plaza");
    const b = buildWorld(spec, "a-plaza");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const platformer = specFor("platformer");
    const t = buildWorld(platformer, "a-plaza");
    expect(t.layout).toBe("terraces");
    expect(t.hasVoid).toBe(true);
    expect(a.hasVoid).toBe(false);
    expect(JSON.stringify(t.boxes)).not.toBe(JSON.stringify(a.boxes));
    const other = validDemoSpec({ subject: "fractions", gameType: "adventure" });
    expect(buildWorld(other, "a-hall").seed).not.toBe(a.seed);
  });

  it("uses the spec's theme: every environment yields a distinct palette", () => {
    const spec = specFor("adventure");
    const skies = new Set<string>();
    for (const env of ENVIRONMENTS) {
      const w = buildWorld({ ...spec, theme: { ...spec.theme, environment: env, timeOfDay: "day" } }, "a-plaza");
      skies.add(w.theme.skyTop + w.theme.ground);
    }
    expect(skies.size).toBe(ENVIRONMENTS.length);
  });
});

describe("every key point is reachable on foot (open layouts)", () => {
  const cases: { gameType: "adventure" | "exploration" | "puzzle" | "simulation"; subject: string }[] = [];
  for (const gameType of ["adventure", "exploration", "puzzle", "simulation"] as const) for (const subject of ["python", "fractions"]) cases.push({ gameType, subject });
  for (const c of cases) {
    for (const size of ["small", "medium", "large"] as const) {
      it(`${c.subject}/${c.gameType}/${size}`, () => {
        const req = request({ subject: c.subject, gameType: c.gameType });
        const res = validateGameSpec(buildDemoSpec(req).raw, { alignGameType: c.gameType });
        if (!res.ok) throw new Error(res.errors.join("\n"));
        const spec = res.spec;
        spec.areas.forEach((a) => (a.size = size));
        for (const area of spec.areas) {
          const w = buildWorld(spec, area.id);
          const can = reachable(w);
          for (const s of w.stations) expect(can(s.x, s.z, INTERACT_RADIUS - 0.4), `station ${s.stationId} in ${area.id}/${area.layout}`).toBe(true);
          for (const n of w.npcs) expect(can(n.x, n.z, INTERACT_RADIUS - 0.4), `npc ${n.npcId}`).toBe(true);
          for (const c2 of w.collectibles) expect(can(c2.x, c2.z, 1.0), `collectible ${c2.itemId}`).toBe(true);
          if (w.portal) expect(can(w.portal.x, w.portal.z, INTERACT_RADIUS - 0.4), "portal").toBe(true);
          for (const cp of w.checkpoints) expect(can(cp.x, cp.z, 1.5), `checkpoint ${cp.checkpointId}`).toBe(true);
        }
      });
    }
  }

  it("gates really block until their station is done, and open afterwards", () => {
    const spec = toPublicSpec(specFor("puzzle"));
    const client = toClientState(initialState(spec as never, 0));
    const rt = new GameRuntime(spec, spec.areas[0]!.id, client);
    const gate = rt.world.gates[0]!;
    expect(rt.gateOpen(gate.id)).toBe(false);
    const box = rt.world.boxes.find((b) => b.gateId === gate.id)!;
    // Walk THROUGH the door along its thin axis (doors between rooms in a row are vertical walls).
    const thinInX = box.x1 - box.x0 < box.z1 - box.z0;
    const cx = (box.x0 + box.x1) / 2;
    const cz = (box.z0 + box.z1) / 2;
    const walk = (seconds: number) => {
      rt.sim.teleport(thinInX ? box.x1 + 3 : cx, 0, thinInX ? cz : box.z1 + 3);
      rt.sim.player.grounded = true;
      for (let i = 0; i < seconds * 60; i++) rt.update(1 / 60, thinInX ? { moveX: -1, moveY: 0, jump: false, sprint: false } : { moveX: 0, moveY: 1, jump: false, sprint: false }, 0);
    };
    walk(4);
    expect(gate.opensWhenStationsDone).toHaveLength(1);
    if (thinInX) expect(rt.sim.player.x).toBeGreaterThan(box.x1 - 0.01);
    else expect(rt.sim.player.z).toBeGreaterThan(box.z1 - 0.01);
    rt.setClientState({ ...client, resolvedStations: { [gate.opensWhenStationsDone[0]!]: "correct" } });
    expect(rt.gateOpen(gate.id)).toBe(true);
    walk(4);
    if (thinInX) expect(rt.sim.player.x).toBeLessThan(box.x0);
    else expect(rt.sim.player.z).toBeLessThan(box.z0);
  });
});

// ───────────────────────── physics ─────────────────────────

describe("character physics", () => {
  const spec = toPublicSpec(specFor("exploration"));
  const client = toClientState(initialState(spec as never, 0));

  it("stands on the floor, falls under gravity and jumps to a believable height", () => {
    const rt = new GameRuntime(spec, "a-plaza", client);
    const sim = new WorldSim(rt.world, { jumpEnabled: true, gateOpen: () => true });
    for (let i = 0; i < 30; i++) sim.step(1 / 60, IDLE, 0);
    expect(sim.player.grounded).toBe(true);
    expect(sim.player.y).toBeCloseTo(0, 3);
    sim.step(1 / 60, { ...IDLE, jump: true }, 0);
    let peak = 0;
    for (let i = 0; i < 90; i++) {
      sim.step(1 / 60, IDLE, 0);
      peak = Math.max(peak, sim.player.y);
    }
    expect(peak).toBeGreaterThan(MAX_JUMP_HEIGHT * 0.9);
    expect(peak).toBeLessThan(MAX_JUMP_HEIGHT * 1.1);
    expect(sim.player.grounded).toBe(true);
  });

  it("cannot jump when the jump mechanic is off", () => {
    const rt = new GameRuntime(spec, "a-plaza", client);
    const sim = new WorldSim(rt.world, { jumpEnabled: false, gateOpen: () => true });
    sim.step(1 / 60, { ...IDLE, jump: true }, 0);
    for (let i = 0; i < 20; i++) sim.step(1 / 60, IDLE, 0);
    expect(sim.player.y).toBeCloseTo(0, 3);
  });

  it("walls and the area bounds stop the player (no tunnelling at sprint speed)", () => {
    const rt = new GameRuntime(spec, "a-plaza", client);
    const sim = new WorldSim(rt.world, { jumpEnabled: true, gateOpen: () => true });
    for (let i = 0; i < 60 * 12; i++) sim.step(1 / 30, { moveX: 1, moveY: 0, jump: false, sprint: true }, 0);
    expect(sim.player.x).toBeLessThanOrEqual(rt.world.bounds.x1 - PLAYER_RADIUS + 1e-6);
    for (let i = 0; i < 60 * 12; i++) sim.step(1 / 30, { moveX: 0, moveY: 1, jump: false, sprint: true }, 0);
    expect(sim.player.z).toBeGreaterThanOrEqual(rt.world.bounds.z0 + PLAYER_RADIUS - 1e-6);
  });

  it("solid props block movement", () => {
    const rt = new GameRuntime(spec, "a-plaza", client);
    const prop = rt.world.boxes.find((b) => b.kind === "prop" && b.solid)!;
    const sim = new WorldSim(rt.world, { jumpEnabled: true, gateOpen: () => true });
    sim.teleport((prop.x0 + prop.x1) / 2, 0, prop.z1 + 2);
    for (let i = 0; i < 180; i++) sim.step(1 / 60, { moveX: 0, moveY: 1, jump: false, sprint: false }, 0);
    expect(sim.player.z).toBeGreaterThanOrEqual(prop.z1 + PLAYER_RADIUS - 0.05);
  });

  it("interaction target appears near a station and is reported through the callback", () => {
    let seen: string | null = null;
    const rt = new GameRuntime(spec, "a-plaza", client, { onNearbyChange: (t) => (seen = t ? `${t.kind}:${t.id}` : null) });
    const s = rt.world.stations[0]!;
    rt.sim.teleport(s.x, 0, s.z + 1.2);
    rt.update(1 / 60);
    expect(rt.nearby).toMatchObject({ kind: "station", id: s.stationId, status: "active" });
    expect(seen).toBe(`station:${s.stationId}`);
  });

  it("collectibles are picked up once and reported to the server layer", () => {
    const picked: string[] = [];
    const rt = new GameRuntime(spec, "a-plaza", client, { onCollect: (id) => picked.push(id) });
    const c = rt.world.collectibles[0]!;
    rt.sim.teleport(c.x, 0, c.z);
    rt.update(1 / 60);
    rt.update(1 / 60);
    expect(picked).toEqual([c.itemId]);
  });
});

interface Rect { x0: number; x1: number; z0: number; z1: number }
const clampTo = (r: Rect, x: number, z: number) => ({ x: Math.max(r.x0, Math.min(x, r.x1)), z: Math.max(r.z0, Math.min(z, r.z1)) });
const gapBetweenRects = (a: Rect, b: Rect) => {
  const pa = clampTo(a, (b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
  const pb = clampTo(b, pa.x, pa.z);
  const pa2 = clampTo(a, pb.x, pb.z);
  return { pa: pa2, pb, gap: Math.hypot(pa2.x - pb.x, pa2.z - pb.z) };
};

/** A skilled jump: start at A's edge, aim at a point well inside B, hold forward until over it, release, wait to land. */
function skilledJump(world: WorldModel, A: { x0: number; x1: number; z0: number; z1: number; y1: number }, B: { id: string; x0: number; x1: number; z0: number; z1: number }, setup?: (sim: WorldSim) => void) {
  const sim = new WorldSim(world, { jumpEnabled: true, gateOpen: () => true });
  setup?.(sim);
  const { pa } = gapBetweenRects(A, B);
  const inset = Math.min(0.9, (B.x1 - B.x0) / 2 - 0.2, (B.z1 - B.z0) / 2 - 0.2);
  const tgt = clampTo({ x0: B.x0 + inset, x1: B.x1 - inset, z0: B.z0 + inset, z1: B.z1 - inset }, pa.x, pa.z);
  const dist = Math.hypot(tgt.x - pa.x, tgt.z - pa.z);
  const ux = (tgt.x - pa.x) / Math.max(dist, 1e-6), uz = (tgt.z - pa.z) / Math.max(dist, 1e-6);
  sim.teleport(pa.x - ux * 0.05, A.y1, pa.z - uz * 0.05);
  sim.step(1 / 60, IDLE, 0); // settle on A
  const hold = dist / 6;
  let jumped = false;
  for (let t = 0; t < 1.8; t += 1 / 60) {
    const moving = t < hold;
    const ev = sim.step(1 / 60, { moveX: moving ? ux : 0, moveY: moving ? -uz : 0, jump: !jumped, sprint: false }, 0);
    jumped = true;
    if (ev.respawned) return { landed: false, onB: false, sim };
    if (t > 0.2 && sim.player.grounded) break;
  }
  return { landed: sim.player.grounded, onB: sim.player.standingOn === B.id, sim };
}

describe("platformer: the level geometry is always crossable with the real jump physics", () => {
  const configs: { subject: string; size: "small" | "medium" | "large" }[] = [];
  for (const subject of ["python", "fractions"]) for (const size of ["small", "medium", "large"] as const) configs.push({ subject, size });
  for (const cfg of configs) {
    it(`${cfg.subject}/${cfg.size}: every consecutive platform pair (including moving platforms at their worst phase)`, () => {
      const res = validateGameSpec(buildDemoSpec(request({ subject: cfg.subject, gameType: "platformer" })).raw, { alignGameType: "platformer" });
      if (!res.ok) throw new Error(res.errors.join("\n"));
      const spec = res.spec;
      spec.mechanics = [...new Set([...spec.mechanics, "moving_platforms" as const, "hazards" as const])];
      spec.areas.forEach((a) => ((a.size = cfg.size), (a.hazardLevel = "high")));
      const w = buildWorld(spec, spec.areas[0]!.id);
      expect(w.hasVoid).toBe(true);
      const pads = w.boxes.filter((b) => b.kind === "platform" || b.id === "pad-start");
      const order = w.boxes.filter((b) => b.id.startsWith("pad-"));
      expect(order.length).toBeGreaterThan(w.stations.length);
      const fixed = order.filter((b) => !b.mover);
      expect(pads.length).toBeGreaterThan(0);

      // 1) geometric invariants: gap and rise stay within what the physics allows
      const maxGap = 2.6;
      for (let i = 0; i + 1 < order.length; i++) {
        const A = order[i]!, B = order[i + 1]!;
        if (A.mover || B.mover) continue;
        expect(gapBetweenRects(A, B).gap, `${A.id} → ${B.id} gap`).toBeLessThanOrEqual(maxGap + 1e-6);
        expect(B.y1 - A.y1, `${A.id} → ${B.id} rise`).toBeLessThanOrEqual(0.95 + 1e-6);
      }
      // 2) the real simulation agrees: a skilled jump lands on the next fixed platform
      for (let i = 0; i + 1 < order.length; i++) {
        const A = order[i]!, B = order[i + 1]!;
        if (A.mover || B.mover) continue;
        const r = skilledJump(w, A, B);
        expect(r.onB, `${A.id} → ${B.id} (landed=${r.landed})`).toBe(true);
      }
      // 3) moving platforms: at ANY phase the gap on both sides is jumpable, and the player is carried
      for (let i = 1; i + 1 < order.length; i++) {
        const M = order[i]!;
        if (!M.mover) continue;
        const A = order[i - 1]!, B = order[i + 1]!;
        const m = M.mover!;
        for (let k = 0; k < 24; k++) {
          const off = m.amplitude * Math.sin((2 * Math.PI * (k / 24 * m.period)) / m.period);
          const moved = { x0: M.x0, x1: M.x1, z0: M.z0 + off, z1: M.z1 + off };
          expect(gapBetweenRects(A, moved).gap, `${M.id} phase ${k} vs previous`).toBeLessThanOrEqual(maxGap);
          expect(gapBetweenRects(moved, B).gap, `${M.id} phase ${k} vs next`).toBeLessThanOrEqual(maxGap);
        }
        // worst phase for the jump from A: mover as far from A as it gets
        const worstFromA = (sim: WorldSim) => { sim.time = ((-Math.PI / 2 - m.phase) / (2 * Math.PI)) * m.period + m.period * 3 - 0.02; };
        const jumpOnto = skilledJump(w, A, M, worstFromA);
        expect(jumpOnto.onB, `${A.id} → ${M.id} worst phase`).toBe(true);
        void B;
      }
      // the void is deadly and platforms exist at different heights (it is a real platformer)
      expect(Math.max(...fixed.map((b) => b.y1)) - Math.min(...fixed.map((b) => b.y1))).toBeGreaterThan(0.5);
    });
  }

  it("a player standing on a moving platform is carried with it", () => {
    const res = validateGameSpec(buildDemoSpec(request({ gameType: "platformer" })).raw, { alignGameType: "platformer" });
    if (!res.ok) throw new Error("invalid");
    res.spec.mechanics = [...new Set([...res.spec.mechanics, "moving_platforms" as const])];
    const w = buildWorld(res.spec, res.spec.areas[0]!.id);
    const m = w.boxes.find((b) => b.mover)!;
    const sim = new WorldSim(w, { jumpEnabled: true, gateOpen: () => true });
    sim.teleport((m.x0 + m.x1) / 2, m.y1, (m.z0 + m.z1) / 2);
    sim.step(1 / 60, IDLE, 0);
    expect(sim.player.standingOn).toBe(m.id);
    const z0 = sim.player.z;
    for (let i = 0; i < 100; i++) sim.step(1 / 60, IDLE, 0);
    expect(Math.abs(sim.player.z - z0)).toBeGreaterThan(0.2);
    expect(sim.player.standingOn).toBe(m.id);
  });

  it("fairness: nothing the player must reach (stations, collectibles, checkpoints, portal, entry/exit lanes) lies over lava", () => {
    for (const size of ["small", "medium", "large"] as const) {
      for (const subject of ["python", "fractions"]) {
        const res = validateGameSpec(buildDemoSpec(request({ subject, gameType: "platformer" })).raw, { alignGameType: "platformer" });
        if (!res.ok) throw new Error("invalid");
        res.spec.mechanics = [...new Set([...res.spec.mechanics, "hazards" as const, "moving_platforms" as const])];
        res.spec.areas.forEach((a) => ((a.size = size), (a.hazardLevel = "high")));
        for (const area of res.spec.areas) {
          const w = buildWorld(res.spec, area.id);
          expect(w.hazards.length).toBeGreaterThan(0);
          const onLava = (x: number, z: number) => w.hazards.some((h) => x > h.x0 - 0.2 && x < h.x1 + 0.2 && z > h.z0 - 0.2 && z < h.z1 + 0.2);
          for (const s of w.stations) expect(onLava(s.x, s.z), `station ${s.stationId}`).toBe(false);
          for (const c of w.collectibles) expect(onLava(c.x, c.z), `collectible ${c.itemId} (${size}/${subject})`).toBe(false);
          for (const c of w.checkpoints) expect(onLava(c.x, c.z), `checkpoint ${c.checkpointId}`).toBe(false);
          if (w.portal) expect(onLava(w.portal.x, w.portal.z), "portal").toBe(false);
        }
      }
    }
  });

  it("falling into the void respawns at the last checkpoint", () => {
    const spec = toPublicSpec(specFor("platformer"));
    const rt = new GameRuntime(spec, "a-plaza", toClientState(initialState(spec as never, 0)));
    const sim = rt.sim;
    const cp = rt.world.checkpoints[0]!;
    sim.setCheckpoint({ x: cp.x, y: cp.y, z: cp.z });
    sim.teleport(rt.world.bounds.x1 - 1, 3, rt.world.bounds.z0 + 1);
    let respawned: string | null = null;
    for (let i = 0; i < 400 && !respawned; i++) respawned = sim.step(1 / 60, IDLE, 0).respawned;
    expect(respawned).toBe("fell");
    expect(sim.player.x).toBeCloseTo(cp.x, 3);
    expect(sim.player.y).toBeCloseTo(cp.y, 3);
  });

  it("hazards (lava) send the player back", () => {
    const res = validateGameSpec(buildDemoSpec(request({ gameType: "platformer" })).raw, { alignGameType: "platformer" });
    if (!res.ok) throw new Error("invalid");
    res.spec.mechanics = [...new Set([...res.spec.mechanics, "hazards" as const])];
    res.spec.areas.forEach((a) => (a.hazardLevel = "high"));
    const w = buildWorld(res.spec, res.spec.areas[0]!.id);
    expect(w.hazards.length).toBeGreaterThan(0);
    const hz = w.hazards[0]!;
    const sim = new WorldSim(w, { jumpEnabled: true, gateOpen: () => true });
    sim.teleport((hz.x0 + hz.x1) / 2, hz.y + 0.2, (hz.z0 + hz.z1) / 2);
    expect(sim.step(1 / 60, IDLE, 0).respawned).toBe("hazard");
  });
});
