/**
 * Server-side event processing. The browser reports what the player did; this module validates each event
 * against the spec and the CURRENT server state, then derives the new state, score and rewards.
 * Nothing the client says about points, correctness or completion is ever trusted.
 */
import { z } from "zod";
import { answerSchema, gradeAnswer, revealSolution, toPublicChallenge, type PublicChallenge } from "../challenges/grade";
import { idSchema } from "../spec/schema";
import type { GameSpec } from "../spec/schema";
import { mechanicsForArea } from "../spec/mechanics";
import {
  COLLECT_POINTS, bossPhaseOpen, chooseVariant, cloneState, collectibleIds, findArea, findChallenge, findStation, portalOpen, recordAttempt, recompute, stationActive,
  summarize, toClientState, type ClientState, type LearningSummary, type PlayState,
} from "./progress";

const position = z.object({ x: z.number().min(-500).max(500), y: z.number().min(-30).max(200), z: z.number().min(-500).max(500), yaw: z.number().min(-20).max(20) });

export const gameEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("open"), stationId: idSchema }),
  z.object({ type: z.literal("answer"), stationId: idSchema, answer: answerSchema }),
  z.object({ type: z.literal("hint"), stationId: idSchema }),
  z.object({ type: z.literal("collect"), itemId: z.string().min(1).max(80) }),
  z.object({ type: z.literal("talk"), npcId: idSchema }),
  z.object({ type: z.literal("visit"), stationId: idSchema }),
  z.object({ type: z.literal("enter_area"), areaId: idSchema }),
  z.object({ type: z.literal("checkpoint"), checkpointId: z.string().min(1).max(80), position }),
  z.object({ type: z.literal("save"), position }),
  z.object({ type: z.literal("finish") }),
]);
export type GameEvent = z.infer<typeof gameEventSchema>;

export class GameEventError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export interface EventContext {
  now: number;
  /** Per-session seed so shuffles are stable for a session but differ between sessions. */
  seed: string;
}

export interface EventResult {
  state: PlayState;
  client: ClientState;
  /** Event-specific payload for the response. */
  data: Record<string, unknown>;
  newlyCompletedMissions: string[];
  newlyDefeatedBosses: string[];
  newAchievements: string[];
  summary?: LearningSummary;
}

const reject = (code: string, message: string): never => {
  throw new GameEventError(code, message);
};

export function processEvent(spec: GameSpec, prev: PlayState, event: GameEvent, ctx: EventContext): EventResult {
  const state = cloneState(prev);
  state.updatedAt = ctx.now;
  let data: Record<string, unknown> = {};
  const lang = spec.meta.language;

  const stationInArea = (stationId: string) => {
    const found = findStation(spec, stationId);
    if (!found) return reject("UNKNOWN_STATION", "That station does not exist.");
    if (found.area.id !== state.areaId) return reject("WRONG_AREA", "That station is in a different area.");
    if (!stationActive(spec, state, found.station)) {
      return reject("STATION_LOCKED", bossPhaseOpen(spec, state, found.station.id) ? "Complete the earlier missions to unlock this station." : "Win the earlier phases of this battle first.");
    }
    return found;
  };

  switch (event.type) {
    case "open": {
      const { station } = stationInArea(event.stationId);
      if (station.kind !== "challenge") return reject("NOT_A_CHALLENGE", "That station has no challenge.");
      if (state.resolvedStations[station.id]) return reject("ALREADY_RESOLVED", "You already completed this challenge.");
      if (!state.served[station.id]) {
        state.served[station.id] = chooseVariant(spec, state, station);
        state.openedAt[station.id] = ctx.now;
      }
      const challenge = findChallenge(spec, state.served[station.id]!)!;
      data = { challenge: toPublicChallenge(challenge, ctx.seed) satisfies PublicChallenge, record: state.records[challenge.id] ?? null };
      break;
    }
    case "answer": {
      const { station } = stationInArea(event.stationId);
      const challengeId = state.served[station.id];
      if (!challengeId) return reject("NOT_OPENED", "Open the challenge before answering.");
      if (state.resolvedStations[station.id]) return reject("ALREADY_RESOLVED", "You already completed this challenge.");
      const challenge = findChallenge(spec, challengeId)!;
      const grade = gradeAnswer(challenge, event.answer, lang);
      const invalid = event.answer.type !== challenge.type;
      if (invalid) return reject("BAD_ANSWER", "That answer does not match this challenge.");
      const outcome = recordAttempt(spec, state, station.id, grade.correct, ctx.now);
      data = {
        result: {
          correct: grade.correct,
          feedback: grade.feedback,
          detail: grade.detail,
          resolved: outcome.resolved,
          revealed: outcome.revealed,
          pointsAwarded: outcome.pointsAwarded,
          attemptsLeft: outcome.attemptsLeft,
          explanation: outcome.resolved ? challenge.explanation : undefined,
          reveal: outcome.revealed ? revealSolution(challenge) : undefined,
        },
      };
      break;
    }
    case "hint": {
      const { station } = stationInArea(event.stationId);
      const challengeId = state.served[station.id];
      if (!challengeId) return reject("NOT_OPENED", "Open the challenge first.");
      const challenge = findChallenge(spec, challengeId)!;
      const rec = state.records[challengeId] ?? { stationId: station.id, attempts: 0, wrong: 0, hints: 0, resolved: false, correct: false, revealed: false, points: 0, timeMs: null };
      if (!challenge.hint) return reject("NO_HINT", "This challenge has no hint.");
      if (rec.hints === 0 && !rec.resolved) {
        rec.hints = 1;
        state.hintsUsed += 1;
        state.records[challengeId] = rec;
      }
      data = { hint: challenge.hint, penalty: rec.hints > 0 };
      break;
    }
    case "collect": {
      const area = findArea(spec, state.areaId)!;
      if (!mechanicsForArea(spec, area.id).has("collect")) return reject("NO_COLLECTIBLES", "There is nothing to collect here.");
      if (!collectibleIds(area).includes(event.itemId)) return reject("UNKNOWN_ITEM", "That item does not exist in this area.");
      if (state.collected.includes(event.itemId)) return reject("ALREADY_COLLECTED", "Already collected.");
      state.collected.push(event.itemId);
      state.score += COLLECT_POINTS;
      data = { points: COLLECT_POINTS };
      break;
    }
    case "talk": {
      const area = findArea(spec, state.areaId)!;
      if (!area.npcs.some((n) => n.id === event.npcId)) return reject("UNKNOWN_NPC", "Nobody by that name is here.");
      if (!state.talked.includes(event.npcId)) state.talked.push(event.npcId);
      break;
    }
    case "visit": {
      const { station } = stationInArea(event.stationId);
      if (station.kind !== "lore") return reject("NOT_LORE", "That station is not an information point.");
      if (!state.visited.includes(station.id)) state.visited.push(station.id);
      break;
    }
    case "enter_area": {
      const current = findArea(spec, state.areaId)!;
      if (!current.portal || current.portal.toAreaId !== event.areaId) return reject("NO_PORTAL", "There is no portal to that area from here.");
      if (!portalOpen(spec, state, current)) return reject("PORTAL_LOCKED", "Finish the required missions to open this portal.");
      state.areaId = event.areaId;
      state.position = null;
      state.checkpoint = null;
      break;
    }
    case "checkpoint": {
      const area = findArea(spec, state.areaId)!;
      if (!mechanicsForArea(spec, area.id).has("checkpoints")) return reject("NO_CHECKPOINTS", "Checkpoints are not enabled here.");
      state.checkpoint = { id: event.checkpointId, areaId: area.id, ...event.position };
      state.position = event.position;
      break;
    }
    case "save":
      state.position = event.position;
      break;
    case "finish": {
      recompute(spec, state);
      if (!state.finished) return reject("NOT_COMPLETE", "There are still missions to complete.");
      break;
    }
  }

  const { newlyCompleted, newAchievements, defeatedBosses } = recompute(spec, state);
  const result: EventResult = { state, client: toClientState(state), data, newlyCompletedMissions: newlyCompleted, newlyDefeatedBosses: defeatedBosses, newAchievements };
  if (state.finished) result.summary = summarize(spec, state, ctx.now);
  return result;
}
