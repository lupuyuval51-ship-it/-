import { describe, expect, it } from "vitest";
import { clipCameraDistance } from "@/lib/game/engine/camera";
import { GRAVITY, INTERACT_RADIUS, JUMP_VELOCITY, MAX_JUMP_HEIGHT, PLAYER_HEIGHT, PLAYER_RADIUS, SPRINT_SPEED, STEP_UP, TERMINAL_VELOCITY, WALK_SPEED } from "@/lib/game/engine/constants";
import { GameRuntime, wrapYaw, type Interactable } from "@/lib/game/engine/runtime";
import { WorldSim, type SimInput } from "@/lib/game/engine/sim";
import { toPublicSpec } from "@/lib/game/spec/public";
import { initialState, toClientState, type ClientState } from "@/lib/game/state/progress";
import type { WorldBox, WorldModel } from "@/lib/game/world/types";
import { validDemoSpec } from "./helpers";

/**
 * The headless simulation and the runtime around it, one rule at a time, on small hand-made worlds (so a failure points at the rule)
 * and on the real worlds of a ready-made game (so the wiring is covered too).
 */
const IDLE: SimInput = { moveX: 0, moveY: 0, jump: false, sprint: false };
const FPS = 1 / 60;

const box = (id: string, kind: WorldBox["kind"], x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, over: Partial<WorldBox> = {}): WorldBox =>
  ({ id, kind, x0, x1, y0, y1, z0, z1, visible: true, solid: kind !== "floor", walkable: kind === "floor" || kind === "platform", style: kind, ...over }) as WorldBox;
const floor = () => box("floor", "floor", -30, 30, -1, 0, -30, 30);

function world(boxes: WorldBox[], over: Partial<WorldModel> = {}): WorldModel {
  return {
    areaId: "a", layout: "plaza", environment: "forest", seed: 1, boxes, decor: [], stations: [], npcs: [], bosses: [], collectibles: [], checkpoints: [], hazards: [], gates: [], portal: null,
    spawn: { x: 0, y: 0, z: 0, yaw: 0 }, bounds: { x0: -50, x1: 50, z0: -50, z1: 50 }, killY: -9, theme: {} as never, hasVoid: false, ...over,
  } as WorldModel;
}
const simOf = (w: WorldModel, opts: Partial<{ jumpEnabled: boolean; gateOpen: (id: string) => boolean }> = {}) => new WorldSim(w, { jumpEnabled: true, gateOpen: () => true, ...opts });
const run = (sim: WorldSim, frames: number, input: SimInput = IDLE, camYaw = 0) => {
  for (let i = 0; i < frames; i++) sim.step(FPS, input, camYaw);
};

describe("walking over and into things", () => {
  it("a step no higher than the step-up is walked onto without jumping; a higher one is a wall", () => {
    const low = simOf(world([floor(), box("curb", "platform", 2, 6, 0, STEP_UP - 0.05, -2, 2)]));
    low.teleport(0, 0, 0);
    for (let i = 0; i < 120 && low.player.x < 4; i++) low.step(FPS, { moveX: 1, moveY: 0, jump: false, sprint: false }, 0);
    expect(low.player.x).toBeGreaterThanOrEqual(4); // well past the edge at x = 2, with no jump pressed
    expect(low.player.standingOn).toBe("curb");
    expect(low.player.y).toBeCloseTo(STEP_UP - 0.05, 3);

    const high = simOf(world([floor(), box("block", "platform", 2, 6, 0, STEP_UP + 0.15, -2, 2)]));
    high.teleport(0, 0, 0);
    run(high, 120, { moveX: 1, moveY: 0, jump: false, sprint: false });
    expect(high.player.standingOn).toBe("floor");
    expect(high.player.x).toBeLessThanOrEqual(2 - PLAYER_RADIUS + 1e-6);
    expect(high.player.y).toBeCloseTo(0, 3);
  });

  it("a ceiling stops a jump: the head never goes through the underside of a platform", () => {
    const under = 2.0;
    const sim = simOf(world([floor(), box("roof", "platform", -3, 3, under, under + 0.3, -3, 3)]));
    sim.teleport(0, 0, 0);
    let top = 0;
    sim.step(FPS, { ...IDLE, jump: true }, 0);
    for (let i = 0; i < 90; i++) {
      sim.step(FPS, IDLE, 0);
      top = Math.max(top, sim.player.y);
    }
    expect(MAX_JUMP_HEIGHT).toBeGreaterThan(under - PLAYER_HEIGHT); // the jump really does reach the ceiling
    expect(top).toBeLessThanOrEqual(under - PLAYER_HEIGHT + 1e-6);
    expect(sim.player.standingOn).toBe("floor"); // and it came back down to the floor, not onto the roof
  });

  it("a closed gate is a wall, an open one is not, and the answer is asked again as the game goes on", () => {
    const gate = box("door", "gate", 2, 2.4, 0, 3, -5, 5, { gateId: "g1" });
    let open = false;
    const sim = simOf(world([floor(), gate]), { gateOpen: () => open });
    sim.teleport(0, 0, 0);
    run(sim, 120, { moveX: 1, moveY: 0, jump: false, sprint: false });
    expect(sim.player.x).toBeLessThanOrEqual(2 - PLAYER_RADIUS + 1e-6);
    open = true;
    run(sim, 120, { moveX: 1, moveY: 0, jump: false, sprint: false });
    expect(sim.player.x).toBeGreaterThan(3);
    const closedAgain = simOf(world([floor(), gate]), { gateOpen: () => false });
    closedAgain.teleport(3, 0, 0);
    run(closedAgain, 120, { moveX: -1, moveY: 0, jump: false, sprint: false });
    expect(closedAgain.player.x).toBeGreaterThanOrEqual(2.4 + PLAYER_RADIUS - 1e-6);
    sim.setOptions({ gateOpen: () => false }); // options can be replaced on a live simulation
    sim.teleport(0, 0, 0);
    run(sim, 120, { moveX: 1, moveY: 0, jump: false, sprint: false });
    expect(sim.player.x).toBeLessThanOrEqual(2 - PLAYER_RADIUS + 1e-6);
  });

  it("the area's bounds hold the player in, whichever way it walks", () => {
    const sim = simOf(world([floor()], { bounds: { x0: -5, x1: 5, z0: -5, z1: 5 } }));
    for (const [mx, my] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      run(sim, 200, { moveX: mx!, moveY: my!, jump: false, sprint: true });
      expect(Math.abs(sim.player.x)).toBeLessThanOrEqual(5 - PLAYER_RADIUS + 1e-6);
      expect(Math.abs(sim.player.z)).toBeLessThanOrEqual(5 - PLAYER_RADIUS + 1e-6);
    }
  });
});

describe("how the input moves the avatar", () => {
  const speedOf = (input: SimInput, camYaw = 0) => {
    const sim = simOf(world([floor()]));
    sim.step(FPS, input, camYaw);
    return sim.player.speed;
  };

  it("walking is 6 m/s, sprinting 9 m/s, and a half-pushed stick gives half the speed", () => {
    expect(speedOf({ moveX: 0, moveY: 1, jump: false, sprint: false })).toBeCloseTo(WALK_SPEED, 9);
    expect(speedOf({ moveX: 0, moveY: 1, jump: false, sprint: true })).toBeCloseTo(SPRINT_SPEED, 9);
    expect(speedOf({ moveX: 0, moveY: 0.5, jump: false, sprint: false })).toBeCloseTo(WALK_SPEED / 2, 9);
    expect(speedOf(IDLE)).toBe(0);
  });

  it("a diagonal is not faster than straight ahead (the keyboard's (1, 1) is normalised), and a stick beyond its range is clamped", () => {
    expect(speedOf({ moveX: 1, moveY: 1, jump: false, sprint: false })).toBeCloseTo(WALK_SPEED, 9);
    expect(speedOf({ moveX: 3, moveY: 4, jump: false, sprint: false })).toBeCloseTo(WALK_SPEED, 9);
  });

  it("forward and right follow the camera, not the world", () => {
    const at = (camYaw: number, input: Partial<SimInput>) => {
      const sim = simOf(world([floor()]));
      run(sim, 30, { ...IDLE, ...input }, camYaw);
      return sim.player;
    };
    expect(at(0, { moveY: 1 }).z).toBeLessThan(-2); // yaw 0 faces -z
    expect(Math.abs(at(0, { moveY: 1 }).x)).toBeLessThan(1e-6);
    expect(at(0, { moveX: 1 }).x).toBeGreaterThan(2);
    const turned = at(Math.PI / 2, { moveY: 1 }); // the camera looks along -x
    expect(turned.x).toBeLessThan(-2);
    expect(Math.abs(turned.z)).toBeLessThan(1e-6);
    expect(at(Math.PI, { moveY: 1 }).z).toBeGreaterThan(2);
  });

  it("the avatar turns the short way round, also across ±π (it never spins the long way)", () => {
    const sim = simOf(world([floor()]));
    sim.player.yaw = Math.PI - 0.05;
    const camYaw = -Math.PI + 0.05; // walking forward faces the camera's yaw: just across the ±π seam, 0.1 rad away
    const seen: number[] = [];
    for (let i = 0; i < 20; i++) {
      sim.step(FPS, { moveX: 0, moveY: 1, jump: false, sprint: false }, camYaw);
      seen.push(sim.player.yaw);
    }
    for (const y of seen) {
      expect(y).toBeGreaterThanOrEqual(Math.PI - 0.05 - 1e-9); // never swings back through 0
      expect(y).toBeLessThanOrEqual(Math.PI + 0.05 + 1e-6);
    }
    expect(wrapYaw(seen.at(-1)!)).toBeCloseTo(-Math.PI + 0.05, 1);
  });

  it("does not turn when standing still", () => {
    const sim = simOf(world([floor()]));
    sim.player.yaw = 1.1;
    run(sim, 30, IDLE, 2.5);
    expect(sim.player.yaw).toBe(1.1);
  });
});

describe("falling, landing, respawning", () => {
  it("never falls faster than the terminal velocity", () => {
    const sim = simOf(world([], { killY: -1e9, bounds: { x0: -50, x1: 50, z0: -50, z1: 50 } }));
    sim.teleport(0, 5000, 0);
    let slowest = 0;
    for (let i = 0; i < 600; i++) {
      sim.step(FPS, IDLE, 0);
      slowest = Math.min(slowest, sim.player.vy);
    }
    expect(slowest).toBeCloseTo(TERMINAL_VELOCITY, 6);
    expect(GRAVITY * 0.1).toBeLessThan(Math.abs(TERMINAL_VELOCITY)); // a single frame can never overshoot it by much
  });

  it("'landed' is reported for a real fall and not for stepping off a curb", () => {
    const w = world([floor(), box("curb", "platform", -2, 2, 0, 0.3, -2, 2)]);
    const small = simOf(w);
    small.teleport(0, 0.3, 0);
    small.step(FPS, IDLE, 0);
    let landedSmall = false;
    small.teleport(1.9, 0.3, 0);
    for (let i = 0; i < 60; i++) landedSmall ||= small.step(FPS, { moveX: 1, moveY: 0, jump: false, sprint: false }, 0).landed;
    expect(landedSmall).toBe(false);
    const big = simOf(w);
    big.teleport(10, 3, 10);
    let landedBig = false;
    for (let i = 0; i < 90; i++) landedBig ||= big.step(FPS, IDLE, 0).landed;
    expect(landedBig).toBe(true);
    expect(big.player.grounded).toBe(true);
  });

  it("falling below the world sends the player back to the spawn, or to the checkpoint once there is one; the facing stays", () => {
    const w = world([floor()], { spawn: { x: 1, y: 0, z: 2, yaw: 0 }, killY: -9 });
    const sim = simOf(w);
    sim.teleport(10, -3, 10);
    sim.player.yaw = 1.7;
    let reason: string | null = null;
    for (let i = 0; i < 60 && !reason; i++) reason = sim.step(FPS, IDLE, 0).respawned;
    expect(reason).toBe("fell");
    expect([sim.player.x, sim.player.y, sim.player.z]).toEqual([1, 0, 2]);
    expect(sim.player.yaw).toBe(1.7);
    expect(sim.player.vy).toBe(0);

    sim.setCheckpoint({ x: -6, y: 0, z: -7 });
    sim.teleport(20, -20, 20);
    for (let i = 0; i < 60; i++) sim.step(FPS, IDLE, 0);
    expect([sim.player.x, sim.player.z]).toEqual([-6, -7]);

    sim.setCheckpoint(null); // forgetting it returns to the spawn
    sim.teleport(20, -20, 20);
    for (let i = 0; i < 60; i++) sim.step(FPS, IDLE, 0);
    expect([sim.player.x, sim.player.z]).toEqual([1, 2]);
  });

  it("a hazard sends the player back to the start of the walk as soon as its feet are in it", () => {
    const lava = { id: "lava", x0: 3, x1: 6, z0: -3, z1: 3, y: 0, kind: "lava" as const };
    const sim = simOf(world([floor()], { hazards: [lava] }));
    sim.teleport(0, 0, 0);
    let reason: string | null = null;
    let frames = 0;
    let lastX = 0;
    while (!reason && frames++ < 120) {
      lastX = sim.player.x;
      reason = sim.step(FPS, { moveX: 1, moveY: 0, jump: false, sprint: false }, 0).respawned;
    }
    expect(reason).toBe("hazard");
    expect(lastX).toBeGreaterThan(3 - PLAYER_RADIUS); // it was really at the lava's edge (within a frame of it) when it was sent back
    expect([sim.player.x, sim.player.y, sim.player.z, sim.player.vy]).toEqual([0, 0, 0, 0]); // the spawn
  });

  it("a jump over a hazard is safe, a step into it is not (the damage zone ends 0.35 m above the lava's surface)", () => {
    const lava = { id: "lava", x0: -1, x1: 1, z0: -1, z1: 1, y: 0, kind: "lava" as const };
    const high = simOf(world([floor()], { hazards: [lava] }));
    high.teleport(0, 0.5, 0);
    expect(high.step(FPS, IDLE, 0).respawned).toBeNull();
    const low = simOf(world([floor()], { hazards: [lava] }));
    low.teleport(0, 0.2, 0);
    expect(low.step(FPS, IDLE, 0).respawned).toBe("hazard");
  });
});

describe("big frames", () => {
  it("a frame is never simulated for longer than 0.1 s (a stalled tab does not teleport the player)", () => {
    const sim = simOf(world([floor()]));
    sim.step(30, { moveX: 0, moveY: 1, jump: false, sprint: false }, 0);
    expect(sim.time).toBeCloseTo(0.1, 6);
    expect(Math.abs(sim.player.z)).toBeLessThanOrEqual(WALK_SPEED * 0.1 + 1e-6);
  });

  it("a zero or negative frame changes nothing", () => {
    const sim = simOf(world([floor()]));
    const before = { ...sim.player };
    sim.step(0, { moveX: 1, moveY: 1, jump: true, sprint: true }, 0);
    sim.step(-1, { moveX: 1, moveY: 1, jump: true, sprint: true }, 0);
    expect(sim.player).toEqual(before);
    expect(sim.time).toBe(0);
  });

  it("the jump's peak and flight time are the constants the platform builder plans with", () => {
    const sim = simOf(world([floor()]));
    run(sim, 2); // settle
    sim.step(FPS, { ...IDLE, jump: true }, 0);
    let peak = 0;
    for (let i = 0; i < 120; i++) {
      sim.step(FPS, IDLE, 0);
      peak = Math.max(peak, sim.player.y);
    }
    expect(peak).toBeGreaterThan(MAX_JUMP_HEIGHT * 0.95);
    expect(peak).toBeLessThan(MAX_JUMP_HEIGHT * 1.05);
    expect(JUMP_VELOCITY ** 2 / (2 * GRAVITY)).toBeCloseTo(MAX_JUMP_HEIGHT, 9);
  });
});

describe("clipCameraDistance", () => {
  const wall = box("w", "wall", -5, 5, 0, 4, 4, 5);
  it("a closed gate hides the camera's view like a wall; an open one does not; floors and invisible-to-the-player boxes never do", () => {
    const gate = box("d", "gate", -5, 5, 0, 4, 4, 5, { gateId: "g" });
    const from = { x: 0, y: 1, z: 0 };
    const dir = { x: 0, y: 0, z: 1 };
    expect(clipCameraDistance([gate], from, dir, 7, () => false)).toBeCloseTo(4 - 0.35, 9);
    expect(clipCameraDistance([gate], from, dir, 7, () => true)).toBe(7 - 0.35);
    expect(clipCameraDistance([box("f", "floor", -5, 5, 0, 4, 4, 5)], from, dir, 7, () => false)).toBe(7 - 0.35);
    expect(clipCameraDistance([box("p", "prop", -5, 5, 0, 4, 4, 5, { solid: false })], from, dir, 7, () => false)).toBe(7 - 0.35);
  });

  it("the nearest of several boxes wins, and the answer never goes below the minimum distance or above the maximum", () => {
    const nearer = box("nearer", "wall", -5, 5, 0, 4, 2, 3);
    expect(clipCameraDistance([wall, nearer], { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 7, () => false)).toBeCloseTo(2 - 0.35, 9); // the wall at 2 m, not the one at 4 m
    const tooClose = box("tooClose", "wall", -5, 5, 0, 4, 1.5, 2.5);
    expect(clipCameraDistance([wall, nearer, tooClose], { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 7, () => false)).toBeCloseTo(1.6, 9); // 1.5 - 0.35 is under the 1.6 minimum
    expect(clipCameraDistance([wall], { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 1, () => false)).toBe(1); // the minimum never exceeds the requested distance
    expect(clipCameraDistance([], { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, 7, () => false)).toBe(7 - 0.35);
  });

  it("a ray pointing away from a wall does not hit it", () => {
    expect(clipCameraDistance([wall], { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: -1 }, 7, () => false)).toBe(7 - 0.35);
  });
});

// ───────────────────────────── the runtime around the simulation ─────────────────────────────

describe("GameRuntime", () => {
  const platformer = toPublicSpec(validDemoSpec({ gameType: "platformer", mode: "FULL" }));
  const plaza = toPublicSpec(validDemoSpec({ gameType: "exploration", mode: "FULL" }));
  const startOf = (spec: typeof plaza): ClientState => toClientState(initialState(spec as never, 0));
  const forward: SimInput = { moveX: 0, moveY: 1, jump: false, sprint: false };

  it("jumping is on in a platformer (there is a void to cross) and only when the game asks for it elsewhere", () => {
    const platformRt = new GameRuntime(platformer, platformer.areas[0]!.id, startOf(platformer));
    expect(platformRt.world.hasVoid).toBe(true);
    expect(platformRt.jumpEnabled).toBe(true);
    const flat = structuredClone(plaza);
    flat.mechanics = flat.mechanics.filter((m) => m !== "jump");
    const plainRt = new GameRuntime(flat, flat.areas[0]!.id, startOf(flat));
    expect(plainRt.jumpEnabled).toBe(false);
    plainRt.update(FPS); // settle on the floor
    let jumped = false;
    const rt = new GameRuntime(flat, flat.areas[0]!.id, startOf(flat), { onJump: () => { jumped = true; } });
    for (let i = 0; i < 30; i++) rt.update(FPS, { ...IDLE, jump: true });
    expect(jumped).toBe(false);
    const withJump = structuredClone(plaza);
    withJump.mechanics = [...new Set([...withJump.mechanics, "jump" as const])];
    expect(new GameRuntime(withJump, withJump.areas[0]!.id, startOf(withJump)).jumpEnabled).toBe(true);
  });

  it("resumes where the player was in this area, facing the way they faced, and starts at the spawn in any other", () => {
    const client = startOf(plaza);
    const saved = { x: 3, y: 0, z: 2, yaw: 1.2 };
    const here = new GameRuntime(plaza, plaza.areas[0]!.id, { ...client, areaId: plaza.areas[0]!.id, position: saved });
    expect([here.sim.player.x, here.sim.player.y, here.sim.player.z, here.sim.player.yaw]).toEqual([3, 0, 2, 1.2]);
    expect(here.sim.player.grounded).toBe(false); // it lands on whatever is under it
    const elsewhere = new GameRuntime(plaza, plaza.areas[1]!.id, { ...client, areaId: plaza.areas[0]!.id, position: saved });
    expect([elsewhere.sim.player.x, elsewhere.sim.player.z]).toEqual([elsewhere.world.spawn.x, elsewhere.world.spawn.z]);
    const none = new GameRuntime(plaza, plaza.areas[0]!.id, { ...client, position: null });
    expect([none.sim.player.x, none.sim.player.z]).toEqual([none.world.spawn.x, none.world.spawn.z]);
  });

  it("a checkpoint of this area is where a fall ends; one of another area is ignored", () => {
    const client = startOf(platformer);
    const areaId = platformer.areas[0]!.id;
    const probe = new GameRuntime(platformer, areaId, client);
    const cp = probe.world.checkpoints[0]!;
    const falls = (checkpoint: ClientState["checkpoint"]) => {
      const reasons: string[] = [];
      const rt = new GameRuntime(platformer, areaId, { ...client, checkpoint }, { onRespawn: (r) => reasons.push(r) });
      rt.sim.teleport(rt.world.spawn.x, rt.world.killY - 5, rt.world.spawn.z);
      for (let i = 0; i < 10; i++) rt.update(FPS);
      return { rt, reasons };
    };
    const mine = falls({ id: cp.checkpointId, areaId, x: cp.x, y: cp.y, z: cp.z });
    expect(mine.reasons).toEqual(["fell"]);
    expect([mine.rt.sim.player.x, mine.rt.sim.player.z]).toEqual([cp.x, cp.z]);
    const other = falls({ id: cp.checkpointId, areaId: "a-somewhere-else", x: cp.x, y: cp.y, z: cp.z });
    expect([other.rt.sim.player.x, other.rt.sim.player.z]).toEqual([other.rt.world.spawn.x, other.rt.world.spawn.z]);
  });

  it("reaching a checkpoint is reported once, not every frame, and the one already saved is not reported again", () => {
    const client = startOf(platformer);
    const areaId = platformer.areas[0]!.id;
    const seen: string[] = [];
    const rt = new GameRuntime(platformer, areaId, client, { onCheckpoint: (id) => seen.push(id) });
    expect(rt.world.checkpoints.length).toBeGreaterThan(1);
    const [a, b] = rt.world.checkpoints as [typeof rt.world.checkpoints[number], typeof rt.world.checkpoints[number]];
    for (let i = 0; i < 3; i++) {
      rt.sim.teleport(a.x, a.y, a.z);
      rt.update(FPS);
    }
    expect(seen).toEqual([a.checkpointId]);
    rt.sim.teleport(b.x, b.y, b.z);
    rt.update(FPS);
    expect(seen).toEqual([a.checkpointId, b.checkpointId]);

    const again: string[] = [];
    const resumed = new GameRuntime(platformer, areaId, { ...client, checkpoint: { id: a.checkpointId, areaId, x: a.x, y: a.y, z: a.z } }, { onCheckpoint: (id) => again.push(id) });
    resumed.sim.teleport(a.x, a.y, a.z);
    resumed.update(FPS);
    expect(again).toEqual([]);
  });

  it("a paused game does not move, collect, jump or call anything back", () => {
    const calls: string[] = [];
    const rt = new GameRuntime(plaza, plaza.areas[0]!.id, startOf(plaza), { onJump: () => calls.push("jump"), onCollect: (id) => calls.push(`collect ${id}`), onNearbyChange: () => calls.push("nearby"), onStep: () => calls.push("step") });
    const gem = rt.world.collectibles[0]!;
    rt.sim.teleport(gem.x, gem.y - 0.8, gem.z);
    const before = { ...rt.sim.player };
    rt.paused = true;
    for (let i = 0; i < 30; i++) rt.update(FPS, { moveX: 1, moveY: 1, jump: true, sprint: true });
    expect(rt.sim.player).toEqual(before);
    expect(rt.sim.time).toBe(0);
    expect(calls).toEqual([]);
    rt.paused = false;
    rt.update(FPS);
    expect(calls).toContain(`collect ${gem.itemId}`);
  });

  it("footsteps: one per stride on the ground (walking 1.6 m, running 2.2 m), none in the air or standing still", () => {
    const stepsFor = (input: SimInput, frames: number) => {
      const steps: boolean[] = [];
      const rt = new GameRuntime(plaza, plaza.areas[0]!.id, startOf(plaza), { onStep: (fast) => steps.push(fast) });
      rt.sim.player.grounded = true;
      for (let i = 0; i < frames; i++) rt.update(FPS, input);
      return steps;
    };
    const walk = stepsFor(forward, 60); // 1 s at 6 m/s: 6 m of stride -> 3 steps (the 4th would need 6.4 m)
    expect(walk).toEqual([false, false, false]);
    const run9 = stepsFor({ ...forward, sprint: true }, 60); // 9 m / 2.2 m -> 4 steps
    expect(run9).toEqual([true, true, true, true]);
    expect(stepsFor(IDLE, 60)).toEqual([]);
    const rt = new GameRuntime(plaza, plaza.areas[0]!.id, startOf(plaza), { onStep: () => { throw new Error("a step in the air"); } });
    rt.sim.teleport(rt.sim.player.x, 40, rt.sim.player.z); // falling: not grounded
    expect(() => { for (let i = 0; i < 20; i++) rt.update(FPS, forward); }).not.toThrow();
  });

  it("what is in reach is reported when it changes, and again when the same station's state changes, not on every frame", () => {
    const client = startOf(plaza);
    const reports: Interactable[] = [];
    const rt = new GameRuntime(plaza, plaza.areas[0]!.id, client, { onNearbyChange: (t) => { if (t) reports.push(t); } });
    const s = rt.world.stations.find((x) => x.kind === "challenge")!;
    rt.sim.teleport(s.x, s.y, s.z + 1);
    for (let i = 0; i < 5; i++) rt.update(FPS);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ kind: "station", id: s.stationId });
    rt.setClientState({ ...client, resolvedStations: { [s.stationId]: "correct" } });
    for (let i = 0; i < 5; i++) rt.update(FPS);
    expect(reports).toHaveLength(2);
    expect(reports[1]).toMatchObject({ kind: "station", id: s.stationId, status: "done" });
    rt.sim.teleport(rt.world.bounds.x0 + 1, 0, rt.world.bounds.z0 + 1); // out of reach of everything
    rt.update(FPS);
    expect(rt.nearby).toBeNull();
    expect(INTERACT_RADIUS).toBeGreaterThan(1); // the station really was within reach at 1 m
  });

  it("the server confirming a pick-up ends the wait, and the runtime keeps the pick-up counted until then", () => {
    const client = startOf(plaza);
    const picked: string[] = [];
    const rt = new GameRuntime(plaza, plaza.areas[0]!.id, client, { onCollect: (id) => picked.push(id) });
    const gem = rt.world.collectibles[0]!;
    rt.sim.teleport(gem.x, gem.y - 0.8, gem.z);
    rt.update(FPS);
    expect(rt.isCollected(gem.itemId)).toBe(true); // hidden at once, while the event is on its way
    rt.setClientState({ ...client, collected: [gem.itemId] });
    expect(rt.isCollected(gem.itemId)).toBe(true); // confirmed: still collected, now by the server's word
    expect(picked).toEqual([gem.itemId]);
    // a restart gives a fresh run: the confirmed pick-up is no longer pending, so the item is there to be picked up again
    rt.setClientState({ ...client, collected: [] });
    expect(rt.isCollected(gem.itemId)).toBe(false);
  });

  it("the position snapshot is the avatar's, with the yaw wrapped into (-π, π]", () => {
    const rt = new GameRuntime(plaza, plaza.areas[0]!.id, startOf(plaza));
    rt.sim.teleport(1, 2, 3);
    rt.sim.player.yaw = 7;
    const snap = rt.snapshot();
    expect([snap.x, snap.y, snap.z]).toEqual([1, 2, 3]);
    expect(snap.yaw).toBeCloseTo(7 - 2 * Math.PI, 9);
    rt.sim.player.yaw = -3;
    expect(rt.snapshot().yaw).toBe(-3);
  });
});

describe("wrapYaw", () => {
  it("leaves what is already in range alone (including both ends) and wraps the rest the short way", () => {
    for (const y of [0, 1, -1, Math.PI, -Math.PI]) expect(wrapYaw(y)).toBe(y);
    expect(wrapYaw(Math.PI + 0.5)).toBeCloseTo(-Math.PI + 0.5, 9);
    expect(wrapYaw(-Math.PI - 0.5)).toBeCloseTo(Math.PI - 0.5, 9);
    expect(wrapYaw(100 * Math.PI + 0.25)).toBeCloseTo(0.25, 6);
  });
});
