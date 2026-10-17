import { describe, expect, it } from "vitest";
import { gameEventSchema, GameEventError, processEvent, type GameEvent } from "@/lib/game/state/events";
import { mechanicsForArea } from "@/lib/game/spec/mechanics";
import type { GameSpec } from "@/lib/game/spec/schema";
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import { collectibleIds, initialState, maxScore, type PlayState } from "@/lib/game/state/progress";
import { generateOffline } from "@/lib/offline/generate";
import { rng } from "./random-play";
import { ALL_GAME_TYPES, correctAnswer, request, validDemoSpec, wrongAnswer } from "./helpers";

/** A full adventure as the offline app builds it: two areas, missions, and the quiz boss at the end. */
const bossAdventure = (): GameSpec => generateOffline(request({ subject: "Fractions", mode: "FULL" }), new Date(), "A").spec;

/**
 * Model-based fuzz of the server reducer (the thing that decides score, progress and completion for the website AND the offline app).
 * Random, fixed-seed sequences mix sensible moves with hostile ones (unknown ids, other areas, wrong answer types, repeats, early
 * `finish`), and after EVERY event the invariants below must hold. A failure prints the seed, the step and the event.
 */

const ctxAt = (now: number) => ({ now, seed: "fuzz-session" });
const dup = (xs: readonly unknown[]) => xs.length !== new Set(xs).size;

function pickEvent(spec: GameSpec, state: PlayState, rand: () => number): GameEvent {
  const roll = (n: number) => Math.floor(rand() * n);
  const pick = <T,>(xs: readonly T[]): T => xs[roll(xs.length)]!;
  const allStations = spec.areas.flatMap((a) => a.stations);
  const area = spec.areas.find((a) => a.id === state.areaId) ?? spec.areas[0]!;
  const station = (anywhere: boolean) => pick(anywhere ? allStations : area.stations);
  const answerFor = (stationId: string, good: boolean) => {
    const served = state.served[stationId];
    const ch = spec.challenges.find((c) => c.id === (served ?? allStations.find((s) => s.id === stationId)?.challengeId));
    return ch ? (good ? correctAnswer(ch) : wrongAnswer(ch)) : ({ type: "choice", optionId: "nope" } as const);
  };
  const position = { x: rand() * 20 - 10, y: 1, z: rand() * 20 - 10, yaw: rand() * 6 - 3 };
  const kind = roll(100);
  if (kind < 22) return { type: "open", stationId: station(rand() < 0.2).id };
  if (kind < 45) { const s = station(rand() < 0.15); return { type: "answer", stationId: s.id, answer: answerFor(s.id, rand() < 0.6) }; }
  if (kind < 50) { const s = station(false); const wrongType = rand() < 0.5 ? ({ type: "numeric", value: 3 } as const) : ({ type: "choice", optionId: "zzz" } as const); return { type: "answer", stationId: s.id, answer: wrongType }; }
  if (kind < 55) return { type: "hint", stationId: station(false).id };
  if (kind < 68) { const ids = collectibleIds(area); return { type: "collect", itemId: rand() < 0.85 && ids.length ? pick(ids) : pick(["made-up", `${pick(spec.areas).id}:c0`, `${area.id}:c999`]) }; }
  if (kind < 76) return { type: "talk", npcId: rand() < 0.9 && area.npcs.length ? pick(area.npcs).id : "nobody" };
  if (kind < 82) return { type: "visit", stationId: station(rand() < 0.2).id };
  if (kind < 88) return { type: "enter_area", areaId: rand() < 0.7 ? (area.portal?.toAreaId ?? pick(spec.areas).id) : pick(spec.areas).id };
  if (kind < 92) return { type: "checkpoint", checkpointId: `cp-${roll(4)}`, position };
  if (kind < 96) return { type: "save", position };
  return { type: "finish" };
}

function checkInvariants(spec: GameSpec, before: PlayState, after: PlayState, event: GameEvent, ctx: string, scoreSlack: number) {
  const stationIds = new Set(spec.areas.flatMap((a) => a.stations.map((s) => s.id)));
  const allCollectibles = new Set(spec.areas.flatMap((a) => collectibleIds(a)));
  const missionIds = new Set(spec.missions.map((m) => m.id));

  expect(after.score, `${ctx} score never goes down`).toBeGreaterThanOrEqual(before.score);
  expect(after.score, `${ctx} score is bounded by the best possible run`).toBeLessThanOrEqual(maxScore(spec) + scoreSlack);
  for (const [name, list] of Object.entries({ collected: after.collected, talked: after.talked, visited: after.visited, missionsDone: after.missionsDone, achievements: after.achievements, bossesDefeated: after.bossesDefeated })) {
    expect(dup(list), `${ctx} ${name} has no duplicates (no double counting)`).toBe(false);
  }
  expect(after.collected.every((id) => allCollectibles.has(id)), `${ctx} only real collectibles are recorded`).toBe(true);
  expect(after.missionsDone.every((id) => missionIds.has(id)), `${ctx} only real missions are recorded`).toBe(true);
  expect(Object.keys(after.resolvedStations).every((id) => stationIds.has(id)), `${ctx} only real stations are resolved`).toBe(true);
  expect(after.collected.length, `${ctx} collected can only grow`).toBeGreaterThanOrEqual(before.collected.length);
  expect(after.missionsDone.length, `${ctx} missions never un-complete`).toBeGreaterThanOrEqual(before.missionsDone.length);
  for (const [id, was] of Object.entries(before.resolvedStations)) expect(after.resolvedStations[id], `${ctx} a resolved station stays resolved`).toBe(was);
  for (const rec of Object.values(after.records)) {
    expect(rec.attempts, ctx).toBeGreaterThanOrEqual(rec.wrong);
    expect(rec.wrong, `${ctx} attempts are capped: the answer is revealed after ${MAX_ATTEMPTS_PER_CHALLENGE} misses`).toBeLessThanOrEqual(MAX_ATTEMPTS_PER_CHALLENGE);
    expect(rec.points, ctx).toBeGreaterThanOrEqual(0);
    if (rec.revealed) expect(rec.correct && rec.points > 0, `${ctx} a revealed answer earns nothing`).toBe(false);
  }
  // completion is a pure function of the missions, never of what the client says
  const required = spec.missions.filter((m) => !m.optional);
  expect(after.finished, `${ctx} finished iff every required mission is done`).toBe(required.every((m) => after.missionsDone.includes(m.id)));
  if (event.type === "finish") expect(after.finished, `${ctx} finish only works when the game is complete`).toBe(true);
  expect(after.hintsUsed, `${ctx} hints only increase`).toBeGreaterThanOrEqual(before.hintsUsed);
  expect(Number.isFinite(after.score) && Number.isInteger(after.score), `${ctx} score is a whole number`).toBe(true);
}

describe("reducer fuzz: invariants hold after every event of random hostile sequences", () => {
  const SEEDS = 24;
  const STEPS = 160;
  const subjects: [string, () => GameSpec][] = [...ALL_GAME_TYPES.map((t): [string, () => GameSpec] => [t, () => validDemoSpec({ gameType: t })]), ["adventure with a boss", bossAdventure]];
  for (const [gameType, build] of subjects) {
    it(`${gameType}: ${SEEDS} seeded runs of ${STEPS} events`, () => {
      const spec = build();
      const timedBonus = spec.areas.some((a) => mechanicsForArea(spec, a.id).has("timed_bonus"));
      const scoreSlack = timedBonus ? Math.ceil(0.25 * 200 * spec.challenges.length) : 0;
      let accepted = 0;
      let rejected = 0;
      let resolved = 0;
      let missions = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const rand = rng(seed * 7919);
        let state = initialState(spec, 0);
        const log: { event: GameEvent; clock: number }[] = [];
        let clock = 1_000;
        for (let step = 0; step < STEPS; step++) {
          clock += 500 + Math.floor(rand() * 4000);
          const event = pickEvent(spec, state, rand);
          const where = `[${gameType} seed ${seed} step ${step} ${JSON.stringify(event).slice(0, 120)}]`;
          expect(gameEventSchema.safeParse(event).success, `${where} generator made a schema-valid event`).toBe(true);
          const snapshot = structuredClone(state);
          try {
            const res = processEvent(spec, state, event, ctxAt(clock));
            expect(state, `${where} the previous state object is never mutated`).toEqual(snapshot);
            checkInvariants(spec, state, res.state, event, where, scoreSlack);
            state = res.state;
            log.push({ event, clock });
            accepted++;
          } catch (e) {
            // a refused event is normal, but only ever as a typed error and never with a half-applied state
            expect(e, `${where} ${String(e)}`).toBeInstanceOf(GameEventError);
            expect(state, `${where} a refused event leaves the state alone`).toEqual(snapshot);
            rejected++;
          }
        }
        resolved += Object.keys(state.resolvedStations).length;
        missions += state.missionsDone.length;

        // Replaying the accepted events with the same clock gives the identical state: the reducer is deterministic and has no hidden input.
        let replay = initialState(spec, 0);
        for (const { event, clock: at } of log) replay = processEvent(spec, replay, event, ctxAt(at)).state;
        expect(replay, `[${gameType} seed ${seed}] replaying the accepted events reproduces the state exactly`).toEqual(state);
      }
      // the generator must really exercise both sides, otherwise the invariants prove nothing
      expect(accepted, "some events are accepted").toBeGreaterThan(SEEDS * 20);
      expect(rejected, "some events are refused").toBeGreaterThan(SEEDS * 10);
      expect(resolved, "runs really get stations resolved").toBeGreaterThan(SEEDS);
      expect(missions, "runs really complete missions (so bonuses and completion are exercised)").toBeGreaterThan(0);
    });
  }
});

describe("older saves: PlayState.bossesDefeated may be missing", () => {
  it("a save without bossesDefeated behaves exactly like one with an empty list, for every event, and never throws a TypeError", () => {
    const spec = bossAdventure();
    expect((spec.bosses ?? []).length, "this fixture has a boss, otherwise the test proves nothing").toBeGreaterThan(0);
    for (let seed = 1; seed <= 12; seed++) {
      const rand = rng(seed * 104729);
      let state = initialState(spec, 0);
      let clock = 1_000;
      for (let step = 0; step < 140; step++) {
        clock += 700;
        const event = pickEvent(spec, state, rand);
        const legacy = structuredClone(state) as Partial<PlayState>;
        if (state.bossesDefeated.length === 0) delete legacy.bossesDefeated; // an old save that never paid a boss out
        let modern: PlayState | null = null;
        let modernError: unknown = null;
        try { modern = processEvent(spec, state, event, ctxAt(clock)).state; } catch (e) { modernError = e; }
        let old: PlayState | null = null;
        let oldError: unknown = null;
        try { old = processEvent(spec, legacy as PlayState, event, ctxAt(clock)).state; } catch (e) { oldError = e; }
        if (modernError || oldError) {
          expect(oldError, `seed ${seed} step ${step}: legacy and modern refuse the same events`).toBeInstanceOf(GameEventError);
          expect(modernError).toBeInstanceOf(GameEventError);
          expect((oldError as GameEventError).code).toBe((modernError as GameEventError).code);
        } else {
          expect(old, `seed ${seed} step ${step}`).toEqual(modern);
          state = modern!;
        }
      }
    }
  });
});
