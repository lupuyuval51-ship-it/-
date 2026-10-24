import { describe, expect, it } from "vitest";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { leverBalanceDistance, leverSolvable, LEVER_SLIDER_MIN, type LeverSim } from "@/lib/game/challenges/simulations";
import { GameRuntime, wrapYaw } from "@/lib/game/engine/runtime";
import { gameEventSchema, processEvent, type GameEvent } from "@/lib/game/state/events";
import { MAX_PLAY_GAP_MS, initialState, summarize, toClientState, type PlayState } from "@/lib/game/state/progress";
import { toPublicSpec } from "@/lib/game/spec/public";
import { blockSchema, type Block, type GameSpec, type ProgramChallenge } from "@/lib/game/spec/schema";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { buildWorld } from "@/lib/game/world/build";
import { isTransientFailure, ApiFailure } from "@/components/game/transport";
import { normalizeState, checkSessionRecord } from "@/lib/offline/records";
import { reshapeFirstArea } from "./world-helpers";
import { PACK_SUBJECT, correctAnswer, validDemoSpec } from "./helpers";

const SEED = "fixes";

// ───────────────────────── 1. the avatar's yaw is wrapped where it leaves the runtime ─────────────────────────

describe("the saved position always passes the event schema, however long the avatar walks in circles", () => {
  it("wrapYaw keeps the facing and puts it in (-π, π]", () => {
    expect(wrapYaw(0.5)).toBe(0.5);
    expect(wrapYaw(-Math.PI)).toBe(-Math.PI);
    for (const turns of [-12, -3, -1, 1, 2, 9]) {
      const y = wrapYaw(1.2 + turns * 2 * Math.PI);
      expect(y).toBeGreaterThan(-Math.PI - 1e-9);
      expect(y).toBeLessThanOrEqual(Math.PI + 1e-9);
      expect(y).toBeCloseTo(1.2, 6);
    }
  });

  it("walking while the camera keeps turning winds the avatar past ±20 rad, yet snapshot() and checkpoints stay saveable", () => {
    const spec = toPublicSpec(validDemoSpec({ gameType: "exploration", mode: "FULL" }));
    const client = toClientState(initialState(spec as never, 0));
    const seen: number[] = [];
    const rt = new GameRuntime(spec, spec.areas[0]!.id, client, { onCheckpoint: (_id, pos) => seen.push(pos.yaw) });
    let cam = 0;
    for (let i = 0; i < 60 * 80; i++) { // 80 s at 60 fps, the camera turning 3 rad/s: the avatar keeps turning with it
      cam += 0.05;
      rt.update(1 / 60, { moveX: 0, moveY: 1, jump: false, sprint: false }, cam);
    }
    expect(Math.abs(rt.sim.player.yaw)).toBeGreaterThan(20); // the raw value really leaves the schema's range...
    const p = rt.sim.player;
    expect(gameEventSchema.safeParse({ type: "save", position: { x: p.x, y: p.y, z: p.z, yaw: p.yaw } }).success).toBe(false); // ...and is what used to be sent
    const snap = rt.snapshot();
    expect(Math.abs(snap.yaw)).toBeLessThanOrEqual(Math.PI + 1e-9);
    expect(gameEventSchema.safeParse({ type: "save", position: snap }).success).toBe(true);
    expect(gameEventSchema.safeParse({ type: "checkpoint", checkpointId: "x", position: snap }).success).toBe(true);
    for (const y of seen) expect(Math.abs(y)).toBeLessThanOrEqual(Math.PI + 1e-9);
  });
});

// ───────────────────────── 2. the results screen's time is time played ─────────────────────────

describe("the time on the results screen is time played, not time since the run was created", () => {
  const spec = validDemoSpec();
  const ev = (state: PlayState, event: GameEvent, now: number) => processEvent(spec, state, event, { now, seed: SEED }).state;
  const MIN = 60_000;

  it("counts the gaps between events, capped, and ignores a pause of days", () => {
    let s = initialState(spec, 1_000);
    const day = 24 * 60 * MIN;
    s = ev(s, { type: "save", position: { x: 0, y: 0, z: 0, yaw: 0 } }, 1_000 + 10_000); // 10 s of play
    s = ev(s, { type: "save", position: { x: 1, y: 0, z: 0, yaw: 0 } }, 1_000 + 40_000); // 30 s more
    expect(s.playedMs).toBe(40_000);
    s = ev(s, { type: "save", position: { x: 2, y: 0, z: 0, yaw: 0 } }, 1_000 + 40_000 + 2 * day); // closed for two days, then resumed
    expect(s.playedMs).toBe(40_000 + MAX_PLAY_GAP_MS);
    expect(summarize(spec, s, 1_000 + 2 * day + 40_000).durationMs).toBe(40_000 + MAX_PLAY_GAP_MS); // not ~2,880 minutes
    expect(Math.round(summarize(spec, s, 1_000 + 2 * day + 40_000).durationMs / MIN)).toBeLessThan(10);
  });

  it("a clock that went backwards never subtracts", () => {
    let s = initialState(spec, 50_000);
    s = ev(s, { type: "save", position: { x: 0, y: 0, z: 0, yaw: 0 } }, 10_000);
    expect(s.playedMs).toBe(0);
  });

  it("older saves (no playedMs) keep the old finish-minus-start figure, and the field survives normalising and the strict check", () => {
    const old = initialState(spec, 1_000) as Partial<PlayState> & Record<string, unknown>;
    delete old.playedMs;
    expect(summarize(spec, old as PlayState, 61_000).durationMs).toBe(60_000);
    expect(normalizeState(old)!.playedMs).toBeUndefined();

    const fresh = { ...initialState(spec, 1_000), playedMs: 12_345 };
    expect(normalizeState(JSON.parse(JSON.stringify(fresh)))!.playedMs).toBe(12_345);
    const rec = checkSessionRecord({ id: "r1", gameId: "g1", revision: 1, status: "ACTIVE", state: fresh, startedAt: 1_000, finishedAt: null, updatedAt: 1_000 });
    expect(rec?.state.playedMs).toBe(12_345);
    const oldRec = checkSessionRecord({ id: "r1", gameId: "g1", revision: 1, status: "ACTIVE", state: old, startedAt: 1_000, finishedAt: null, updatedAt: 1_000 });
    expect(oldRec).not.toBeNull();
    expect(oldRec?.state.playedMs).toBeUndefined();
  });
});

// ───────────────────────── 3. an unfinished robot program is a wrong answer, not a rejected request ─────────────────────────

describe("robot programs the builder can produce are accepted and graded", () => {
  const spec = validDemoSpec();
  const ch = spec.challenges.find((c): c is ProgramChallenge => c.type === "program")!;
  const answerEvent = (program: Block[]) => ({ type: "answer", stationId: "s-1", answer: { type: "program", program } });

  it("the corpus has a program challenge to test with", () => {
    expect(ch).toBeDefined();
  });

  it("an empty Repeat (the builder adds one with no body) passes the event schema and is simply wrong", () => {
    const program: Block[] = [{ t: "repeat", n: 2, body: [] }];
    expect(blockSchema.safeParse(program[0]).success).toBe(false); // the strict (authoring) schema is what used to reject the player's answer
    expect(gameEventSchema.safeParse(answerEvent(program)).success).toBe(true);
    expect(gradeAnswer(ch, { type: "program", program }, "en").correct).toBe(false);
  });

  it("a loop body of nine blocks passes too (only the challenge's own block limit applies)", () => {
    const body: Block[] = Array.from({ length: 9 }, () => ({ t: "move" }) as Block);
    const program: Block[] = [{ t: "repeat", n: 2, body }];
    expect(gameEventSchema.safeParse(answerEvent(program)).success).toBe(true);
    const r = gradeAnswer({ ...ch, maxBlocks: 14 }, { type: "program", program }, "en");
    expect((r.detail as { blocksUsed: number }).blocksUsed).toBe(10); // it was run and counted, not rejected
    expect(gradeAnswer({ ...ch, maxBlocks: 6 }, { type: "program", program }, "en").correct).toBe(false); // over the challenge's own limit: graded wrong
  });

  it("still refuses what is not a program at all, and programs longer than the largest allowed", () => {
    expect(gameEventSchema.safeParse(answerEvent([{ t: "jump" } as never])).success).toBe(false);
    expect(gameEventSchema.safeParse(answerEvent(Array.from({ length: 15 }, () => ({ t: "move" }) as Block))).success).toBe(false);
    expect(gameEventSchema.safeParse(answerEvent([{ t: "repeat", n: 50, body: [] }])).success).toBe(false);
  });

  it("the reference solution is still graded correct", () => {
    expect(gradeAnswer(ch, correctAnswer(ch) as never, "en").correct).toBe(true);
  });

  it("authored solutions stay strict: an empty Repeat is not a valid solution", () => {
    const bad = structuredClone(spec) as GameSpec;
    const p = bad.challenges.find((c): c is ProgramChallenge => c.type === "program")!;
    p.solution = [{ t: "repeat", n: 2, body: [] }];
    expect(validateGameSpec(bad).ok).toBe(false);
  });
});

// ───────────────────────── 4. a collect that did not reach the server can be tried again ─────────────────────────

describe("a pickup whose event failed", () => {
  const spec = toPublicSpec(validDemoSpec({ gameType: "exploration", mode: "FULL" }));
  const client = toClientState(initialState(spec as never, 0));

  it("stays hidden while the event is in flight, and is picked up again once the failure is forgotten", () => {
    const picked: string[] = [];
    const rt = new GameRuntime(spec, spec.areas[0]!.id, client, { onCollect: (id) => picked.push(id) });
    const gem = rt.world.collectibles[0]!;
    rt.sim.teleport(gem.x, gem.y - 0.8, gem.z);
    rt.update(1 / 60);
    expect(picked).toEqual([gem.itemId]);
    expect(rt.isCollected(gem.itemId)).toBe(true); // hidden at once
    rt.update(1 / 60);
    expect(picked).toEqual([gem.itemId]); // not asked twice while in flight
    rt.forgetPending(gem.itemId); // the event failed
    expect(rt.isCollected(gem.itemId)).toBe(false);
    rt.sim.teleport(gem.x, gem.y - 0.8, gem.z);
    rt.update(1 / 60);
    expect(picked).toEqual([gem.itemId, gem.itemId]);
    rt.setClientState({ ...client, collected: [gem.itemId] }); // the server took it this time
    rt.forgetPending(gem.itemId);
    expect(rt.isCollected(gem.itemId)).toBe(true);
  });

  it("only failures a retry could fix are retried; a refused event is never repeated", () => {
    expect(isTransientFailure(new TypeError("Failed to fetch"))).toBe(true);
    expect(isTransientFailure(new ApiFailure(500, "GAME_DAMAGED", "x"))).toBe(true);
    expect(isTransientFailure(new ApiFailure(507, "STORAGE_FULL", "x"))).toBe(true);
    expect(isTransientFailure(new ApiFailure(503, "STORAGE_UNAVAILABLE", "x"))).toBe(true);
    expect(isTransientFailure(new ApiFailure(429, "RATE_LIMITED", "x"))).toBe(true);
    for (const refused of [new ApiFailure(409, "ALREADY_COLLECTED", "x"), new ApiFailure(400, "UNKNOWN_ITEM", "x"), new ApiFailure(400, "NO_COLLECTIBLES", "x"), new ApiFailure(401, "UNAUTHENTICATED", "x"), new ApiFailure(409, "SESSION_STALE", "x")]) {
      expect(isTransientFailure(refused), refused.code).toBe(false);
    }
  });
});

// ───────────────────────── 5. a platformer area holds every collectible it declares ─────────────────────────

describe("terraces (platformer) worlds place every declared collectible", () => {
  const base = validDemoSpec({ gameType: "adventure", mode: "FULL", subject: "Python loops" });

  it("for every size, number of stations and crowd, a declared count of 12 is all in the world, on solid ground, off the lava", () => {
    const problems: string[] = [];
    for (const size of ["small", "medium", "large"] as const) {
      for (const stations of [1, 2, 3, 5, 8]) {
        for (const npcs of [0, 3]) {
          for (const boss of stations < 2 ? [false] : [false, true]) {
            for (const portal of [false, true]) {
              const spec = reshapeFirstArea(base, { layout: "terraces", size, stations, npcs, collectibles: 12, portal, boss });
              const w = buildWorld(spec, spec.areas[0]!.id);
              const tag = `${size}/st${stations}/np${npcs}/${portal ? "portal" : "no-portal"}/${boss ? "boss" : "no-boss"}`;
              if (w.collectibles.length !== 12) problems.push(`${tag}: ${w.collectibles.length} of 12 placed`);
              const ids = new Set(w.collectibles.map((c) => c.itemId));
              if (ids.size !== w.collectibles.length) problems.push(`${tag}: duplicate ids`);
              for (const c of w.collectibles) {
                const pad = w.boxes.find((b) => b.kind === "platform" && c.x >= b.x0 && c.x <= b.x1 && c.z >= b.z0 && c.z <= b.z1 && Math.abs(c.y - 0.9 - b.y1) < 0.01);
                if (!pad) problems.push(`${tag}: ${c.itemId} floats over the void`);
                if (w.hazards.some((h) => c.x > h.x0 - 0.3 && c.x < h.x1 + 0.3 && c.z > h.z0 - 0.3 && c.z < h.z1 + 0.3)) problems.push(`${tag}: ${c.itemId} is over lava`);
                for (const o of [...w.stations, ...w.npcs, ...w.bosses, ...(w.portal ? [w.portal] : [])]) if (Math.hypot(c.x - o.x, c.z - o.z) < 1.1) problems.push(`${tag}: ${c.itemId} sits on something you talk to`);
              }
              for (let i = 0; i < w.collectibles.length; i++) for (let j = i + 1; j < w.collectibles.length; j++) {
                if (Math.hypot(w.collectibles[i]!.x - w.collectibles[j]!.x, w.collectibles[i]!.z - w.collectibles[j]!.z) < 1.2) problems.push(`${tag}: ${w.collectibles[i]!.itemId} and ${w.collectibles[j]!.itemId} overlap`);
              }
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("an area that already fitted keeps exactly the positions it had", () => {
    const small = reshapeFirstArea(base, { layout: "terraces", size: "small", stations: 3, npcs: 1, collectibles: 4, portal: true, boss: false });
    const more = reshapeFirstArea(base, { layout: "terraces", size: "small", stations: 3, npcs: 1, collectibles: 12, portal: true, boss: false });
    const a = buildWorld(small, small.areas[0]!.id).collectibles;
    const b = buildWorld(more, more.areas[0]!.id).collectibles;
    expect(a).toHaveLength(4);
    expect(b.slice(0, 4)).toEqual(a);
  });
});

// ───────────────────────── 6. a lever puzzle the slider can answer ─────────────────────────

describe("the lever puzzle can be answered with the slider", () => {
  const lever = (over: Partial<LeverSim>): LeverSim => ({ kind: "lever", leftWeight: 6, leftDistance: 4, rightWeight: 3, maxDistance: 10, tolerance: 0.25, ...over });

  it("rejects a balance point closer to the pivot than the slider can get within the tolerance", () => {
    const sim = lever({ leftWeight: 4, leftDistance: 1, rightWeight: 20 }); // balance 0.2 m, slider starts at 0.5 m, tolerance 0.25
    expect(leverBalanceDistance(sim)).toBeCloseTo(0.2, 9);
    expect(leverSolvable(sim)).toBe(false);
    // the grader agrees: the closest slider value is too far away
    expect(Math.abs(LEVER_SLIDER_MIN - leverBalanceDistance(sim))).toBeGreaterThan(sim.tolerance);
  });

  it("accepts it when the tolerance reaches the slider, and every ordinary lever", () => {
    expect(leverSolvable(lever({ leftWeight: 4, leftDistance: 1, rightWeight: 20, tolerance: 0.3 }))).toBe(true); // |0.5 - 0.2| = 0.3
    expect(leverSolvable(lever({ leftWeight: 5, leftDistance: 1, rightWeight: 10 }))).toBe(true); // balance 0.5
    expect(leverSolvable(lever({}))).toBe(true); // balance 8
    expect(leverSolvable(lever({ leftWeight: 6, leftDistance: 4, rightWeight: 3, maxDistance: 7 }))).toBe(false); // beyond the end of the lever
    expect(leverSolvable(lever({ leftWeight: 1, leftDistance: 1, rightWeight: 10, tolerance: 2 }))).toBe(false); // below 0.2 m is never allowed
  });

  it("the validator reports it for a whole spec", () => {
    const spec = structuredClone(validDemoSpec({ subject: PACK_SUBJECT.science })) as GameSpec;
    const sim = spec.challenges.find((c) => c.type === "simulation" && c.sim.kind === "lever");
    if (!sim || sim.type !== "simulation" || sim.sim.kind !== "lever") throw new Error("the science sample carries a lever challenge");
    expect(validateGameSpec(spec).ok).toBe(true);
    Object.assign(sim.sim, { leftWeight: 4, leftDistance: 1, rightWeight: 20, tolerance: 0.25 });
    const res = validateGameSpec(spec);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/balance point/);
  });
});
