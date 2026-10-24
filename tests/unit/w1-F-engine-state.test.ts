import { describe, expect, it } from "vitest";
import { WorldSim } from "@/lib/game/engine/sim";
import { processEvent, type EventResult, type GameEvent } from "@/lib/game/state/events";
import { findArea, initialState, recompute, stationActive, summarize, type PlayState } from "@/lib/game/state/progress";
import { practiceIds } from "@/lib/game/state/practice";
import { buildReview } from "@/lib/game/state/review";
import type { GameSpec } from "@/lib/game/spec/schema";
import type { WorldBox, WorldModel } from "@/lib/game/world/types";
import { correctAnswer, validDemoSpec, wrongAnswer } from "./helpers";

const SEED = "w1-engine-state";
const play = (spec: GameSpec, state: PlayState, event: GameEvent, now = 1_000_000): EventResult => processEvent(spec, state, event, { now, seed: SEED });

describe("the results page and the review page agree on what is worth reviewing", () => {
  const spec = validDemoSpec();
  const station = findArea(spec, "a-plaza")!.stations.find((s) => s.kind === "challenge" && stationActive(spec, initialState(spec, 0), s))!;
  const ch = spec.challenges.find((c) => c.id === station.challengeId)!;

  it("a challenge solved on the second try is in the summary's review list, the review page and the practice round alike", () => {
    let r = play(spec, initialState(spec, 0), { type: "open", stationId: station.id });
    r = play(spec, r.state, { type: "answer", stationId: station.id, answer: wrongAnswer(ch, SEED) });
    r = play(spec, r.state, { type: "answer", stationId: station.id, answer: correctAnswer(ch, SEED) });
    const summary = summarize(spec, r.state, 5_000);
    expect(summary.review).toEqual([expect.objectContaining({ challengeId: ch.id, reason: "multiple_attempts" })]);
    expect(buildReview(spec, r.state).map((x) => x.challengeId)).toEqual([ch.id]);
    expect(practiceIds(r.state)).toEqual([ch.id]);
  });

  it("a first-try success is in none of them", () => {
    let r = play(spec, initialState(spec, 0), { type: "open", stationId: station.id });
    r = play(spec, r.state, { type: "answer", stationId: station.id, answer: correctAnswer(ch, SEED) });
    expect(summarize(spec, r.state, 5_000).review).toEqual([]);
    expect(buildReview(spec, r.state)).toEqual([]);
    expect(practiceIds(r.state)).toEqual([]);
  });
});

describe("the Flawless achievement", () => {
  it("is not granted for a run that finished without answering a single challenge", () => {
    const spec = validDemoSpec();
    const state = initialState(spec, 0);
    state.missionsDone = spec.missions.map((m) => m.id);
    recompute(spec, state);
    expect(state.finished).toBe(true);
    expect(state.achievements).toContain("completed");
    expect(state.achievements).not.toContain("flawless");
  });

  it("is still granted when every answered challenge was right first time", () => {
    const spec = validDemoSpec();
    const state = initialState(spec, 0);
    const [ch] = spec.challenges;
    state.records[ch!.id] = { stationId: "x", attempts: 1, wrong: 0, hints: 0, resolved: true, correct: true, revealed: false, points: 100, timeMs: null };
    state.missionsDone = spec.missions.map((m) => m.id);
    recompute(spec, state);
    expect(state.achievements).toContain("flawless");
  });
});

const box = (id: string, kind: WorldBox["kind"], x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, opts: Partial<WorldBox> = {}): WorldBox =>
  ({ id, kind, x0, x1, y0, y1, z0, z1, visible: true, solid: kind !== "floor", walkable: kind === "floor" || kind === "platform", style: kind, ...opts }) as WorldBox;

function world(boxes: WorldBox[], extra: Partial<WorldModel> = {}): WorldModel {
  return {
    areaId: "a", boxes, hazards: [], gates: [], stations: [], npcs: [], bosses: [], collectibles: [], checkpoints: [], portal: null,
    spawn: { x: 0, y: 0, z: 0, yaw: 0 }, bounds: { x0: -50, x1: 50, z0: -50, z1: 50 }, killY: -9, hasVoid: true, theme: {} as never, ...extra,
  } as WorldModel;
}

const idle = { moveX: 0, moveY: 0, jump: false, sprint: false };

describe("simulation invariants (headless WorldSim)", () => {
  it("a player on a moving platform is carried for a full period", () => {
    const w = world([box("floor", "floor", -20, 20, -1, 0, -20, 20), box("m", "platform", -2, 2, 2, 2.5, -2, 2, { mover: { axis: "x", amplitude: 5, period: 4, phase: 0 } })]);
    const sim = new WorldSim(w, { jumpEnabled: true, gateOpen: () => true });
    sim.teleport(0, 3, 0);
    for (let i = 0; i < 60 * 6; i++) sim.step(1 / 60, idle, 0);
    expect(sim.player.standingOn).toBe("m");
    expect(sim.player.y).toBeCloseTo(2.5, 3);
  });

  it("walking into a corner of two walls never pushes the player through", () => {
    const w = world([box("floor", "floor", -20, 20, -1, 0, -20, 20), box("w1", "wall", 5, 6, 0, 3, -20, 20), box("w2", "wall", -20, 20, 0, 3, -6, -5)]);
    const sim = new WorldSim(w, { jumpEnabled: true, gateOpen: () => true });
    sim.teleport(4, 0, -4);
    for (let i = 0; i < 60 * 4; i++) sim.step(1 / 60, { moveX: 1, moveY: 1, jump: false, sprint: true }, 0);
    expect(sim.player.x).toBeLessThanOrEqual(5 - 0.4 + 1e-6);
    expect(sim.player.z).toBeGreaterThanOrEqual(-5 + 0.4 - 1e-6);
    expect(sim.player.grounded).toBe(true);
  });

  it("a big frame does not tunnel through a thin platform", () => {
    const w = world([box("floor", "floor", -20, 20, -1, 0, -20, 20), box("p", "platform", -2, 2, 5, 5.2, -2, 2)]);
    const sim = new WorldSim(w, { jumpEnabled: true, gateOpen: () => true });
    sim.teleport(0, 12, 0);
    for (let i = 0; i < 10; i++) sim.step(0.5, idle, 0);
    expect(sim.player.standingOn).toBe("p");
  });

  it("jump from the ground reaches the expected height and lands", () => {
    const w = world([box("floor", "floor", -20, 20, -1, 0, -20, 20)]);
    const sim = new WorldSim(w, { jumpEnabled: true, gateOpen: () => true });
    sim.step(1 / 60, idle, 0);
    let maxY = 0;
    let landed = false;
    const ev = sim.step(1 / 60, { ...idle, jump: true }, 0);
    expect(ev.jumped).toBe(true);
    for (let i = 0; i < 120; i++) {
      const e = sim.step(1 / 60, idle, 0);
      maxY = Math.max(maxY, sim.player.y);
      if (e.landed) landed = true;
    }
    expect(maxY).toBeGreaterThan(1.5);
    expect(landed).toBe(true);
    expect(sim.player.grounded).toBe(true);
  });

  it("a jump pressed just before touching down is remembered and fires on landing", () => {
    const w = world([box("floor", "floor", -20, 20, -1, 0, -20, 20)]);
    const sim = new WorldSim(w, { jumpEnabled: true, gateOpen: () => true });
    sim.teleport(0, 0.2, 0);
    const e = sim.step(1 / 60, { ...idle, jump: true }, 0);
    expect(e.jumped).toBe(false);
    let jumped = false;
    for (let i = 0; i < 30; i++) jumped ||= sim.step(1 / 60, idle, 0).jumped;
    expect(jumped).toBe(true);
  });
});
