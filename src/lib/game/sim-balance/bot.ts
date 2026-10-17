/**
 * Deterministic bot playthroughs through the REAL server reducer (`processEvent`).
 * Used to measure balance (length, score/stars, stuck states). Pure: no I/O, no Math.random, no Date.now.
 * Nothing here ships in a bundle; it is imported by tests and by `scripts/balance-report.ts`.
 */
import { revealSolution, toPublicAnswer, type Answer } from "../challenges/grade";
import type { Challenge, GameSpec } from "../spec/schema";
import { GameEventError, processEvent, type GameEvent } from "../state/events";
import { collectibleIds, findArea, findChallenge, initialState, maxScore, portalOpen, stationActive, summarize, type PlayState } from "../state/progress";
import { thinkSeconds } from "../spec/estimate";
import { hashSeed, mulberry32 } from "../util/prng";
import { WALK_SPEED } from "../engine/constants";
import { buildWorld } from "../world/build";
import type { WorldModel } from "../world/types";

export interface Skill {
  id: string;
  /** Chance that a first attempt on a challenge is right. */
  pFirst: number;
  /** Chance that a retry (after feedback) is right. */
  pRetry: number;
  /** Chance of asking for the hint before the first attempt. */
  pHint: number;
  /** Share of collectibles picked up on the first sweep (missions that need more are completed anyway). */
  pCollect: number;
  /** Reading / thinking speed multiplier (1 = average learner). */
  pace: number;
  /** Leaves through a portal as soon as it opens, even with unfinished business behind. */
  eager?: boolean;
}

export const SKILLS: readonly Skill[] = [
  { id: "perfect", pFirst: 1, pRetry: 1, pHint: 0, pCollect: 1, pace: 0.8 },
  { id: "p70", pFirst: 0.7, pRetry: 0.85, pHint: 0.15, pCollect: 0.8, pace: 1 },
  { id: "p40", pFirst: 0.4, pRetry: 0.7, pHint: 0.35, pCollect: 0.5, pace: 1.3 },
  { id: "rusher", pFirst: 0.7, pRetry: 0.85, pHint: 0.15, pCollect: 0.2, pace: 0.9, eager: true },
];

export interface PlayResult {
  skill: string;
  finished: boolean;
  /** True when the bot ran out of legal useful moves before the game was finished. */
  stuck: boolean;
  stuckReason?: string;
  events: number;
  rejected: number;
  seconds: number;
  minutes: number;
  score: number;
  maxScore: number;
  percent: number;
  stars: 0 | 1 | 2 | 3;
  revealed: number;
  challengesPlayed: number;
  attempts: number;
  hints: number;
  achievements: string[];
}

// ───────────────────────────── time model (seconds) ─────────────────────────────

/** Players do not walk straight lines: gates, props, jumps and looking around. Measured against the real world models. */
const DETOUR = 1.5;
const AREA_TRANSIT_SECONDS = 6;
const FEEDBACK_SECONDS = 4;
const EXPLAIN_SECONDS = 6;
const COLLECT_SECONDS = 4;
const HINT_SECONDS = 3;
const LORE_SECONDS = 12;

// ───────────────────────────── answers ─────────────────────────────

export function rightAnswer(ch: Challenge): Answer {
  const r = revealSolution(ch) as Record<string, unknown>;
  switch (ch.type) {
    case "choice": return { type: "choice", optionId: r.optionId as string };
    case "numeric": return { type: "numeric", value: r.value as number };
    case "sequence": return { type: "sequence", order: r.order as string[] };
    case "match": return { type: "match", pairs: r.pairs as { leftId: string; rightId: string }[] };
    case "program": return { type: "program", program: r.program as never };
    case "simulation": return { type: "simulation", params: r.params as Record<string, number> };
  }
}

/** A plausible wrong answer (never the right one, always well-formed so the reducer grades it instead of rejecting it). */
export function wrongAnswerFor(ch: Challenge, rnd: () => number): Answer {
  switch (ch.type) {
    case "choice": {
      const wrong = ch.options.filter((o) => o.id !== ch.correctOptionId);
      return { type: "choice", optionId: wrong[Math.floor(rnd() * wrong.length)]!.id };
    }
    case "numeric": return { type: "numeric", value: ch.answer + ch.tolerance + Math.max(1, Math.abs(ch.answer) * 0.1) };
    case "sequence": {
      const order = ch.items.map((i) => i.id);
      const i = Math.floor(rnd() * (order.length - 1));
      [order[i], order[i + 1]] = [order[i + 1]!, order[i]!];
      return { type: "sequence", order };
    }
    case "match": {
      const ids = ch.pairs.map((p) => p.id);
      const i = Math.floor(rnd() * (ids.length - 1));
      return { type: "match", pairs: ids.map((id, k) => ({ leftId: id, rightId: k === i ? ids[i + 1]! : k === i + 1 ? ids[i]! : id })) };
    }
    case "program": return { type: "program", program: [{ t: "left" }] };
    case "simulation": return { type: "simulation", params: ch.sim.kind === "projectile" ? { angle: 10, speed: 1 } : { distance: 0.5 } };
  }
}

// ───────────────────────────── the bot ─────────────────────────────

const MAX_EVENTS = 1500;

/** Play one full session. `seed` makes the whole run (shuffles, mistakes, skipped gems) reproducible. */
export function playGame(spec: GameSpec, skill: Skill, seed: string): PlayResult {
  const rnd = mulberry32(hashSeed(`${seed}|${skill.id}|${spec.meta.title}`));
  let now = 1_700_000_000_000;
  let state: PlayState = initialState(spec, now);
  let events = 0;
  let rejected = 0;
  let seconds = 0;
  let attempts = 0;
  let revealed = 0;

  // Real walking distances from the generated world of each area (spawn, stations, NPCs, gems, portal).
  const worlds = new Map<string, WorldModel>();
  const world = (areaId: string) => {
    let w = worlds.get(areaId);
    if (!w) worlds.set(areaId, (w = buildWorld(spec, areaId)));
    return w;
  };
  let at: { x: number; z: number } = world(state.areaId).spawn;
  const walkTo = (target: { x: number; z: number } | undefined): number => {
    if (!target) return 8;
    const secs = (Math.hypot(target.x - at.x, target.z - at.z) * DETOUR) / WALK_SPEED;
    at = { x: target.x, z: target.z };
    return secs;
  };
  const spotOf = (event: GameEvent): { x: number; z: number } | undefined => {
    const w = world(state.areaId);
    switch (event.type) {
      case "open": case "visit": return w.stations.find((s) => s.stationId === event.stationId);
      case "talk": return w.npcs.find((n) => n.npcId === event.npcId);
      case "collect": return w.collectibles.find((c) => c.itemId === event.itemId);
      case "enter_area": return w.portal ?? undefined;
      default: return undefined;
    }
  };

  const spend = (s: number) => {
    const t = s * skill.pace;
    seconds += t;
    now += Math.round(t * 1000);
  };

  const send = (event: GameEvent, cost: number): ReturnType<typeof processEvent> | null => {
    if (events >= MAX_EVENTS) return null;
    events += 1;
    spend(cost + walkTo(spotOf(event)) / skill.pace);
    try {
      const res = processEvent(spec, state, event, { now, seed });
      state = res.state;
      if (event.type === "enter_area") at = world(state.areaId).spawn;
      return res;
    } catch (e) {
      if (e instanceof GameEventError) {
        rejected += 1;
        return null;
      }
      throw e;
    }
  };

  const playChallenge = (stationId: string) => {
    if (!send({ type: "open", stationId }, 0)) return;
    const ch = findChallenge(spec, state.served[stationId]!) as Challenge;
    spend(thinkSeconds(ch));
    if (ch.hint && rnd() < skill.pHint) send({ type: "hint", stationId }, HINT_SECONDS);
    for (let tries = 0; !state.resolvedStations[stationId] && tries < 10; tries++) {
      const answer = toPublicAnswer(ch, rnd() < (tries === 0 ? skill.pFirst : skill.pRetry) ? rightAnswer(ch) : wrongAnswerFor(ch, rnd), seed);
      const res = send({ type: "answer", stationId, answer }, FEEDBACK_SECONDS);
      attempts += 1;
      if (!res) break;
      const r = res.data.result as { resolved: boolean; revealed: boolean };
      if (r.revealed) revealed += 1;
      spend(r.resolved ? EXPLAIN_SECONDS : thinkSeconds(ch) * 0.4);
    }
  };

  const signature = () => JSON.stringify([state.areaId, state.resolvedStations, state.collected, state.talked, state.visited, state.missionsDone]);
  const needsGems = (areaId: string) =>
    spec.missions.some((m) => m.areaId === areaId && !state.missionsDone.includes(m.id) && m.objectives.some((o) => o.type === "collect"));

  // Each pass does everything currently possible in the current area; stop when a pass changes nothing.
  for (let pass = 0; pass < 200 && !state.finished && events < MAX_EVENTS; pass++) {
    const before = signature();
    const area = findArea(spec, state.areaId)!;

    for (const n of area.npcs) if (!state.talked.includes(n.id)) send({ type: "talk", npcId: n.id }, n.lines.length * 3);

    for (const s of area.stations) {
      // A rusher walks through the portal the moment it opens, whatever is left behind (the way back never opens).
      if (skill.eager && portalOpen(spec, state, area)) break;
      if (!stationActive(spec, state, s)) continue;
      if (s.kind === "lore" && !state.visited.includes(s.id)) send({ type: "visit", stationId: s.id }, LORE_SECONDS);
      if (s.kind === "challenge" && !state.resolvedStations[s.id]) playChallenge(s.id);
    }

    // The skill's habit decides the first sweep; a mission that still needs gems makes the player collect the rest.
    const ids = collectibleIds(area);
    ids.slice(0, Math.round(ids.length * skill.pCollect)).forEach((id) => {
      if (!state.collected.includes(id)) send({ type: "collect", itemId: id }, COLLECT_SECONDS);
    });
    for (const id of ids) if (!state.collected.includes(id) && needsGems(area.id)) send({ type: "collect", itemId: id }, COLLECT_SECONDS);

    if (area.portal && (skill.eager ? portalOpen(spec, state, area) : spec.missions.filter((m) => m.areaId === area.id).every((m) => state.missionsDone.includes(m.id)))) {
      send({ type: "enter_area", areaId: area.portal.toAreaId }, AREA_TRANSIT_SECONDS);
    }
    if (spec.missions.every((m) => state.missionsDone.includes(m.id))) send({ type: "finish" }, 2);

    if (signature() === before) break;
  }

  let stuckReason: string | undefined;
  if (!state.finished) {
    const open = spec.missions.filter((m) => !state.missionsDone.includes(m.id)).map((m) => m.id);
    stuckReason = events >= MAX_EVENTS ? "event cap reached" : `open missions: ${open.join(", ")}`;
  }
  const summary = summarize(spec, state, now);
  return {
    skill: skill.id, finished: state.finished, stuck: !state.finished, stuckReason, events, rejected, seconds: Math.round(seconds),
    minutes: Math.round((seconds / 60) * 10) / 10, score: state.score, maxScore: maxScore(spec), percent: Math.round(summary.percent * 1000) / 1000,
    stars: summary.stars, revealed, challengesPlayed: Object.keys(state.served).length, attempts, hints: state.hintsUsed, achievements: state.achievements,
  };
}
