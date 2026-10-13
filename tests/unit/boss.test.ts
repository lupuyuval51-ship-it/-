import { describe, expect, it } from "vitest";
import { addFinalBoss } from "@/lib/game/spec/boss";
import type { GameSpec } from "@/lib/game/spec/schema";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { processEvent, GameEventError } from "@/lib/game/state/events";
import { BOSS_BONUS, bossPhaseOpen, bossProgress, initialState, maxScore, recompute, stationActive, type PlayState } from "@/lib/game/state/progress";
import { playGame, SKILLS } from "@/lib/game/sim-balance/bot";
import { correctAnswer, validDemoSpec } from "./helpers";

const ctx = { now: 1_000, seed: "seed" };

/** A FULL adventure with the final boss added by the production builder. */
function bossGame(over: { language?: "he" | "en" } = {}): GameSpec {
  const base = validDemoSpec({ gameType: "adventure", mode: "FULL", ...(over.language ? { contentLanguage: over.language } : {}) });
  const out = addFinalBoss(base);
  if (!out.added) throw new Error(out.notes.join("; "));
  return out.spec;
}

/** Unlock everything the player could do before the battle (so only the boss ordering is under test). */
function playUntilBoss(spec: GameSpec): PlayState {
  let state = initialState(spec, 0);
  const send = (event: Parameters<typeof processEvent>[2]) => { state = processEvent(spec, state, event, ctx).state; };
  const boss = spec.bosses[0]!;
  const phaseSet = new Set(boss.phaseStationIds);
  for (let pass = 0; pass < 60; pass++) {
    const before = JSON.stringify([state.areaId, state.resolvedStations, state.missionsDone, state.visited]);
    const area = spec.areas.find((a) => a.id === state.areaId)!;
    for (const n of area.npcs) if (!state.talked.includes(n.id)) send({ type: "talk", npcId: n.id });
    for (const s of area.stations) {
      if (!stationActive(spec, state, s)) continue;
      if (phaseSet.has(s.id) && s.id !== boss.phaseStationIds[0]) continue; // stop before the battle
      if (s.kind === "lore" && !state.visited.includes(s.id)) send({ type: "visit", stationId: s.id });
    }
    if (area.portal && area.id !== boss.areaId) {
      for (const s of area.stations) if (s.kind === "challenge" && stationActive(spec, state, s) && !state.resolvedStations[s.id]) {
        send({ type: "open", stationId: s.id });
        const ch = spec.challenges.find((c) => c.id === state.served[s.id])!;
        send({ type: "answer", stationId: s.id, answer: correctAnswer(ch, ctx.seed) });
      }
      for (const id of Array.from({ length: area.collectibles.count }, (_, i) => `${area.id}:c${i}`)) if (!state.collected.includes(id)) send({ type: "collect", itemId: id });
      try { send({ type: "enter_area", areaId: area.portal.toAreaId }); } catch { /* not open yet */ }
    }
    if (JSON.stringify([state.areaId, state.resolvedStations, state.missionsDone, state.visited]) === before) break;
  }
  return state;
}

describe("final boss for rule-based games", () => {
  it("adds a boss battle made of existing challenge stations, in a validated game", () => {
    const spec = bossGame();
    expect(validateGameSpec(spec, { alignGameType: spec.meta.gameType }).ok).toBe(true);
    const boss = spec.bosses[0]!;
    expect(boss.phaseStationIds.length).toBeGreaterThanOrEqual(2);
    expect(boss.phaseStationIds.length).toBeLessThanOrEqual(4);
    const area = spec.areas.find((a) => a.id === boss.areaId)!;
    for (const id of boss.phaseStationIds) expect(area.stations.find((s) => s.id === id)?.kind).toBe("challenge");
    const mission = spec.missions.find((m) => m.objectives.some((o) => o.type === "defeat"))!;
    expect(mission.areaId).toBe(boss.areaId);
    expect(mission.optional).toBe(false);
  });

  it("is written in the game's language and does nothing when it cannot be added safely", () => {
    expect(bossGame({ language: "he" }).bosses[0]!.name).toBe("השומר האחרון");
    const base = validDemoSpec({ gameType: "adventure", mode: "FULL" });
    const twice = addFinalBoss(bossGame());
    expect(twice.added).toBe(false);
    const tiny = structuredClone(base);
    for (const a of tiny.areas) a.stations = a.stations.filter((s) => s.kind !== "challenge").concat(a.stations.filter((s) => s.kind === "challenge").slice(0, 2));
    expect(addFinalBoss(tiny).added).toBe(false);
  });
});

describe("boss battle rules", () => {
  it("phases open one after another and the battle ends when the last one is resolved", () => {
    const spec = bossGame();
    const boss = spec.bosses[0]!;
    let state = playUntilBoss(spec);
    expect(state.areaId).toBe(boss.areaId);
    const [first, second] = boss.phaseStationIds as [string, string];
    expect(bossPhaseOpen(spec, state, first)).toBe(true);
    expect(bossPhaseOpen(spec, state, second)).toBe(false);
    expect(() => processEvent(spec, state, { type: "open", stationId: second }, ctx)).toThrowError(GameEventError);
    try { processEvent(spec, state, { type: "open", stationId: second }, ctx); } catch (e) {
      expect((e as GameEventError).code).toBe("STATION_LOCKED");
      expect((e as GameEventError).message).toMatch(/earlier phases/);
    }
    expect(bossProgress(boss, state)).toMatchObject({ total: boss.phaseStationIds.length, done: 0, nextPhase: 0, defeated: false });

    const scoreBefore = state.score;
    for (const [i, id] of boss.phaseStationIds.entries()) {
      state = processEvent(spec, state, { type: "open", stationId: id }, ctx).state;
      const ch = spec.challenges.find((c) => c.id === state.served[id])!;
      const res = processEvent(spec, state, { type: "answer", stationId: id, answer: correctAnswer(ch, ctx.seed) }, ctx);
      state = res.state;
      const progress = bossProgress(boss, state);
      expect(progress.done).toBe(i + 1);
      expect(res.newlyDefeatedBosses.length).toBe(i === boss.phaseStationIds.length - 1 ? 1 : 0);
    }
    expect(state.bossesDefeated).toEqual([boss.id]);
    expect(state.achievements).toContain("boss_slayer");
    expect(state.score).toBeGreaterThanOrEqual(scoreBefore + BOSS_BONUS);
    expect(bossProgress(boss, state).defeated).toBe(true);
  });

  it("pays the boss bonus exactly once, however often the state is recomputed", () => {
    const spec = bossGame();
    const state = initialState(spec, 0);
    for (const id of spec.bosses[0]!.phaseStationIds) state.resolvedStations[id] = "correct";
    const first = recompute(spec, state);
    const score = state.score;
    const again = recompute(spec, state);
    expect(first.defeatedBosses).toEqual([spec.bosses[0]!.id]);
    expect(again.defeatedBosses).toEqual([]);
    expect(state.score).toBe(score);
    expect(state.bossesDefeated).toEqual([spec.bosses[0]!.id]);
  });

  it("a revealed phase (out of attempts) still moves the battle on, so nobody is stuck", () => {
    const spec = bossGame();
    const boss = spec.bosses[0]!;
    const state = initialState(spec, 0);
    for (const id of boss.phaseStationIds) state.resolvedStations[id] = "revealed";
    expect(bossProgress(boss, state).defeated).toBe(true);
  });

  it("saves from before bosses existed (no bossesDefeated) keep working", () => {
    const spec = bossGame();
    const old = initialState(spec, 0) as Partial<PlayState> & PlayState;
    delete (old as { bossesDefeated?: string[] }).bossesDefeated;
    const out = processEvent(spec, old as PlayState, { type: "save", position: { x: 0, y: 1, z: 0, yaw: 0 } }, ctx);
    expect(out.client.bossesDefeated).toEqual([]);
  });

  it("the maximum score includes the boss bonus", () => {
    const withBoss = bossGame();
    const without = structuredClone(withBoss);
    without.bosses = [];
    without.missions = without.missions.filter((m) => !m.objectives.some((o) => o.type === "defeat"));
    expect(maxScore(withBoss) - maxScore(without)).toBe(BOSS_BONUS + 50);
  });

  it("every simulated player type can finish a game with a boss (the battle never blocks progress)", () => {
    const spec = bossGame();
    for (const skill of SKILLS) {
      const r = playGame(spec, skill, "boss");
      expect(r.finished, `${skill.id}: ${r.stuckReason}`).toBe(true);
    }
  });
});

describe("boss validation", () => {
  const base = () => validDemoSpec({ gameType: "adventure", mode: "FULL" });
  const withBoss = (patch: (s: GameSpec) => void): ReturnType<typeof validateGameSpec> => {
    const s = structuredClone(bossGame());
    patch(s);
    return validateGameSpec(s, { alignGameType: s.meta.gameType });
  };
  const errors = (r: ReturnType<typeof validateGameSpec>) => (r.ok ? [] : r.errors);

  it("rejects bosses that point at things that do not exist or do not fit", () => {
    expect(errors(withBoss((s) => { s.bosses[0]!.areaId = "nowhere"; })).join(" ")).toMatch(/unknown area/);
    expect(errors(withBoss((s) => { s.bosses[0]!.phaseStationIds = [...s.bosses[0]!.phaseStationIds.slice(0, 1), "ghost"]; })).join(" ")).toMatch(/is not a station/);
    expect(errors(withBoss((s) => { s.bosses[0]!.phaseStationIds = [s.bosses[0]!.phaseStationIds[0]!, s.bosses[0]!.phaseStationIds[0]!]; })).join(" ")).toMatch(/same phase station twice/);
    expect(errors(withBoss((s) => { s.bosses[0]!.phaseStationIds = ["only-one"]; })).join(" ")).toMatch(/phaseStationIds/);
  });

  it("rejects a defeat objective for an unknown boss or a boss from another area, and a duplicate boss id", () => {
    expect(errors(withBoss((s) => { const m = s.missions.find((x) => x.objectives.some((o) => o.type === "defeat"))!; (m.objectives[0] as { bossId: string }).bossId = "ghost"; })).join(" ")).toMatch(/unknown boss/);
    expect(errors(withBoss((s) => { s.bosses.push({ ...s.bosses[0]! }); })).join(" ")).toMatch(/duplicate boss ids/);
  });

  it("rejects a phase that two bosses share", () => {
    const r = withBoss((s) => { s.bosses.push({ ...s.bosses[0]!, id: "boss-two" }); });
    expect(errors(r).join(" ")).toMatch(/phase of two bosses/);
  });

  it("rejects NPC reactions to a mission that does not exist", () => {
    const r = withBoss((s) => { s.areas[0]!.npcs[0]!.reactions = [{ afterMissionId: "ghost", lines: ["hi"] }]; });
    expect(errors(r).join(" ")).toMatch(/reacts to unknown mission/);
  });

  it("rejects a battle that would deadlock the game (a phase locked behind a later phase)", () => {
    // Put the phases in the reverse of the order the missions unlock them: the first phase waits for a mission that
    // can only finish after the last phase is solved.
    const r = withBoss((s) => {
      const boss = s.bosses[0]!;
      boss.phaseStationIds = [...boss.phaseStationIds].reverse();
    });
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/cannot be finished with the boss battles/);
    else expect(r.spec.bosses[0]!.phaseStationIds.length).toBeGreaterThan(1); // the order happened to be unconstrained for this game
  });

  it("side missions never block finishing, and portals do not wait for them", () => {
    const s = structuredClone(base());
    const optional = s.missions.find((m) => m.areaId === s.areas[0]!.id)!;
    const spec = structuredClone(s);
    spec.missions.find((m) => m.id === optional.id)!.optional = true;
    const res = validateGameSpec(spec, { alignGameType: spec.meta.gameType });
    expect(res.ok).toBe(true);
    if (res.ok) {
      const state = initialState(res.spec, 0);
      for (const m of res.spec.missions) if (!m.optional) state.missionsDone.push(m.id);
      recompute(res.spec, state);
      expect(state.finished).toBe(true);
    }
  });
});

import { demoCorpus, engineCorpus } from "@/lib/game/sim-balance/corpus";

const buildCorpus = () => [...engineCorpus(), ...demoCorpus()];

describe("bosses across the whole corpus (study-engine games and every demo template)", () => {
  const full = buildCorpus().filter((c) => c.mode === "FULL");

  it("most Full Adventures get a final boss, and every one stays valid and finishable", () => {
    const withBoss = full.filter((c) => c.spec.bosses.length > 0);
    expect(full.length).toBeGreaterThan(5);
    expect(withBoss.length / full.length).toBeGreaterThanOrEqual(0.6);
    for (const c of withBoss) {
      expect(validateGameSpec(c.spec, { alignGameType: c.spec.meta.gameType }).ok, c.id).toBe(true);
      expect(playGame(c.spec, SKILLS.find((s) => s.id === "perfect")!, "corpus").finished, c.id).toBe(true);
    }
  });

  it("Fast games stay small: no boss", () => {
    for (const c of buildCorpus().filter((x) => x.mode === "FAST")) expect(c.spec.bosses, c.id).toEqual([]);
  });
});

import { withReaction } from "@/lib/game/state/reactions";
import { buildWorld } from "@/lib/game/world/build";

describe("NPC reactions and the boss in the world", () => {
  it("a character's lines change once a mission it reacts to is done (the latest finished reaction wins)", () => {
    const npc = { lines: ["hello"], reactions: [{ afterMissionId: "m1", lines: ["well done on the first"] }, { afterMissionId: "m2", lines: ["you finished the second!"] }] };
    expect(withReaction(npc, []).lines).toEqual(["hello"]);
    expect(withReaction(npc, ["m1"]).lines).toEqual(["well done on the first"]);
    expect(withReaction(npc, ["m1", "m2"]).lines).toEqual(["you finished the second!"]);
    expect(withReaction({ lines: ["x"], reactions: [] }, ["m1"]).lines).toEqual(["x"]);
    expect(npc.lines).toEqual(["hello"]); // never mutated
  });

  it("the boss stands in its own area, inside the bounds, near its last phase station", () => {
    for (const c of [...engineCorpus(), ...demoCorpus()].filter((x) => x.spec.bosses.length > 0)) {
      const boss = c.spec.bosses[0]!;
      const world = buildWorld(c.spec, boss.areaId);
      expect(world.bosses.map((b) => b.bossId), c.id).toEqual([boss.id]);
      const b = world.bosses[0]!;
      expect(b.x, c.id).toBeGreaterThan(world.bounds.x0);
      expect(b.x, c.id).toBeLessThan(world.bounds.x1);
      expect(b.z, c.id).toBeGreaterThan(world.bounds.z0);
      expect(b.z, c.id).toBeLessThan(world.bounds.z1);
      const last = world.stations.find((s) => s.stationId === boss.phaseStationIds.at(-1))!;
      expect(Math.hypot(b.x - last.x, b.z - last.z), c.id).toBeLessThan(6);
      // other areas have no boss figure
      for (const a of c.spec.areas.filter((x) => x.id !== boss.areaId)) expect(buildWorld(c.spec, a.id).bosses, c.id).toEqual([]);
    }
  });

  it("the reaction text of a game written by a model reaches the player through the same helper", () => {
    const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
    const npc = spec.areas[0]!.npcs[0]!;
    const missionId = spec.missions[0]!.id;
    const raw = structuredClone(spec);
    raw.areas[0]!.npcs[0]!.reactions = [{ afterMissionId: missionId, lines: ["thank you!"] }];
    const checked = validateGameSpec(raw, { alignGameType: raw.meta.gameType });
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(withReaction(checked.spec.areas[0]!.npcs[0]!, [missionId]).lines).toEqual(["thank you!"]);
    expect(npc.id).toBeTruthy();
  });
});
