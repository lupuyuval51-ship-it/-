/**
 * Pure game-progress logic shared by the server (authoritative) and the client (display only):
 * mission status, station unlocking, scoring, adaptive difficulty, achievements and the learning summary.
 */
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import { mechanicsForArea } from "../spec/mechanics";
import type { Area, Boss, Challenge, GameSpec, Mission, Station } from "../spec/schema";

export const POINTS_BY_LEVEL: Readonly<Record<number, number>> = { 1: 100, 2: 150, 3: 200 };
export const COLLECT_POINTS = 10;
export const MISSION_BONUS = 50;
export const BOSS_BONUS = 150;
const ATTEMPT_MULTIPLIER = [1, 0.6, 0.3] as const;
const HINT_PENALTY = 0.15;
const MAX_HINT_PENALTY = 0.3;
const MIN_FRACTION = 0.2;
/** The longest gap between two events that still counts as play time (reading a question); a longer pause is the app being closed. */
export const MAX_PLAY_GAP_MS = 5 * 60_000;

export interface ChallengeRecord {
  stationId: string;
  attempts: number;
  wrong: number;
  hints: number;
  resolved: boolean;
  correct: boolean;
  revealed: boolean;
  points: number;
  timeMs: number | null;
}

export interface PlayState {
  v: 1;
  areaId: string;
  position: { x: number; y: number; z: number; yaw: number } | null;
  checkpoint: { id: string; areaId: string; x: number; y: number; z: number } | null;
  /** stationId → the challenge variant the server chose to serve (stable once chosen). */
  served: Record<string, string>;
  /** keyed by the served challengeId */
  records: Record<string, ChallengeRecord>;
  resolvedStations: Record<string, "correct" | "revealed">;
  collected: string[];
  talked: string[];
  visited: string[];
  openedAt: Record<string, number>;
  /** Recent outcomes (newest last) used for adaptive difficulty. */
  recent: ("good" | "bad")[];
  streak: number;
  hintsUsed: number;
  score: number;
  achievements: string[];
  missionsDone: string[];
  /** Bosses already paid out (a boss is defeated once all its phase stations are resolved). Older saves lack it. */
  bossesDefeated: string[];
  finished: boolean;
  startedAt: number;
  updatedAt: number;
  /** Time actually spent playing (gaps between events, each capped at MAX_PLAY_GAP_MS). Older saves lack it: the results then fall back to finish − start. */
  playedMs?: number;
}

export function initialState(spec: GameSpec, now = Date.now()): PlayState {
  return {
    v: 1, areaId: spec.areas[0]!.id, position: null, checkpoint: null, served: {}, records: {}, resolvedStations: {},
    collected: [], talked: [], visited: [], openedAt: {}, recent: [], streak: 0, hintsUsed: 0, score: 0, achievements: [], missionsDone: [], bossesDefeated: [],
    finished: false, startedAt: now, updatedAt: now, playedMs: 0,
  };
}

export const collectibleId = (areaId: string, index: number): string => `${areaId}:c${index}`;
export const collectibleIds = (area: Area): string[] => Array.from({ length: area.collectibles.count }, (_, i) => collectibleId(area.id, i));

// ───────────────────────────── lookups ─────────────────────────────

export function findArea(spec: GameSpec, id: string): Area | undefined {
  return spec.areas.find((a) => a.id === id);
}
export function findStation(spec: GameSpec, id: string): { station: Station; area: Area } | undefined {
  for (const area of spec.areas) {
    const station = area.stations.find((s) => s.id === id);
    if (station) return { station, area };
  }
  return undefined;
}
export function findChallenge(spec: GameSpec, id: string): Challenge | undefined {
  return spec.challenges.find((c) => c.id === id);
}

export function findBoss(spec: GameSpec, id: string): Boss | undefined {
  return (spec.bosses ?? []).find((b) => b.id === id);
}

// ───────────────────────────── bosses ─────────────────────────────

export interface BossProgress {
  /** Phases in the battle, phases already resolved, and the index of the phase to fight next (-1 once defeated). */
  total: number;
  done: number;
  nextPhase: number;
  defeated: boolean;
}

export function bossProgress(boss: Boss, state: Pick<PlayState, "resolvedStations">): BossProgress {
  const done = boss.phaseStationIds.filter((id) => state.resolvedStations[id]).length;
  const defeated = done >= boss.phaseStationIds.length;
  // Phases open in order, so the next one is the first unresolved.
  const nextPhase = defeated ? -1 : boss.phaseStationIds.findIndex((id) => !state.resolvedStations[id]);
  return { total: boss.phaseStationIds.length, done, nextPhase, defeated };
}

/** The boss a station is a phase of, with the phase's index. */
export function bossOfStation(spec: GameSpec, stationId: string): { boss: Boss; phase: number } | undefined {
  for (const boss of spec.bosses ?? []) {
    const phase = boss.phaseStationIds.indexOf(stationId);
    if (phase >= 0) return { boss, phase };
  }
  return undefined;
}

/** A boss phase can only be fought once the phase before it is resolved. */
export function bossPhaseOpen(spec: GameSpec, state: Pick<PlayState, "resolvedStations">, stationId: string): boolean {
  const hit = bossOfStation(spec, stationId);
  if (!hit || hit.phase === 0) return true;
  return Boolean(state.resolvedStations[hit.boss.phaseStationIds[hit.phase - 1]!]);
}

// ───────────────────────────── missions ─────────────────────────────

export interface ObjectiveProgress {
  done: boolean;
  current: number;
  target: number;
}

/** The slice of progress that mission/station logic needs; both PlayState and ClientState satisfy it. */
export type ProgressView = Pick<PlayState, "missionsDone" | "resolvedStations" | "collected" | "talked" | "visited">;

export function objectiveProgress(spec: GameSpec, state: ProgressView, mission: Mission, index: number): ObjectiveProgress {
  const o = mission.objectives[index]!;
  const area = findArea(spec, mission.areaId);
  switch (o.type) {
    case "solve": {
      const stations = new Set(area?.stations.filter((s) => s.kind === "challenge" && o.challengeIds.includes(s.challengeId ?? "")).map((s) => s.id));
      const n = [...stations].filter((id) => state.resolvedStations[id]).length;
      return { done: n >= o.challengeIds.length, current: n, target: o.challengeIds.length };
    }
    case "collect": {
      const n = state.collected.filter((id) => id.startsWith(`${mission.areaId}:`)).length;
      return { done: n >= o.count, current: Math.min(n, o.count), target: o.count };
    }
    case "talk":
      return { done: state.talked.includes(o.npcId), current: state.talked.includes(o.npcId) ? 1 : 0, target: 1 };
    case "visit": {
      const n = o.stationIds.filter((id) => state.visited.includes(id)).length;
      return { done: n >= o.stationIds.length, current: n, target: o.stationIds.length };
    }
    case "defeat": {
      const boss = findBoss(spec, o.bossId);
      if (!boss) return { done: false, current: 0, target: 1 };
      const p = bossProgress(boss, state);
      return { done: p.defeated, current: p.done, target: p.total };
    }
  }
}

export function missionDone(spec: GameSpec, state: ProgressView, mission: Mission): boolean {
  return mission.objectives.every((_, i) => objectiveProgress(spec, state, mission, i).done);
}

export function missionUnlocked(state: Pick<PlayState, "missionsDone">, mission: Mission): boolean {
  return mission.requires.every((id) => state.missionsDone.includes(id));
}

/** A station is playable when a mission that needs it is unlocked, or when no mission mentions it at all. */
export function stationActive(spec: GameSpec, state: Pick<PlayState, "missionsDone" | "resolvedStations">, station: Station): boolean {
  if (!bossPhaseOpen(spec, state, station.id)) return false;
  const wanted = spec.missions.filter((m) =>
    m.objectives.some((o) => (o.type === "solve" && station.kind === "challenge" && o.challengeIds.includes(station.challengeId ?? "")) || (o.type === "visit" && o.stationIds.includes(station.id))),
  );
  if (wanted.length === 0) return true;
  return wanted.some((m) => missionUnlocked(state, m));
}

/**
 * The mission a player has to finish next to open a locked station: the first unfinished mission a mission of this station
 * waits for, followed back to one that is itself open (so the hint names something the player can do now). Null when the
 * station is not locked by missions (no mission mentions it, or a boss round locks it).
 */
export function blockingMission(spec: GameSpec, state: Pick<PlayState, "missionsDone">, station: Station): Mission | null {
  const wanted = spec.missions.filter((m) =>
    m.objectives.some((o) => (o.type === "solve" && station.kind === "challenge" && o.challengeIds.includes(station.challengeId ?? "")) || (o.type === "visit" && o.stationIds.includes(station.id))),
  );
  let next = wanted.find((m) => !missionUnlocked(state, m));
  for (let hops = 0; next && hops < spec.missions.length; hops++) {
    const missing = next.requires.map((id) => spec.missions.find((m) => m.id === id)).find((m) => m && !state.missionsDone.includes(m.id));
    if (!missing) return null;
    if (missionUnlocked(state, missing)) return missing;
    next = missing;
  }
  return null;
}

/**
 * What to do next to open a locked station, in the words of the game: the first unfinished objective of `blockingMission`
 * ("Talk to the guide"), or that mission's title when every objective is somehow done. Null when missions do not lock it.
 */
export function blockingStep(spec: GameSpec, state: ProgressView, station: Station): string | null {
  const m = blockingMission(spec, state, station);
  if (!m) return null;
  const i = m.objectives.findIndex((_, k) => !objectiveProgress(spec, state, m, k).done);
  return i >= 0 ? m.objectives[i]!.text : m.title;
}

export function portalOpen(_spec: GameSpec, state: Pick<PlayState, "missionsDone">, area: Area): boolean {
  if (!area.portal) return false;
  return area.portal.requiresMissionIds.every((id) => state.missionsDone.includes(id));
}

// ───────────────────────────── scoring ─────────────────────────────

export function challengePoints(level: number): number {
  return POINTS_BY_LEVEL[level] ?? POINTS_BY_LEVEL[1]!;
}

/**
 * The most a placed challenge can pay: its own level, or its "harder" variant's when adaptive difficulty can serve it.
 * Only the first variant counts: `chooseVariant` serves one step, never the harder variant of a harder variant.
 */
function bestLevelFor(spec: GameSpec, challenge: Challenge, adaptive: boolean): number {
  const harder = adaptive ? findChallenge(spec, challenge.harderId ?? "") : undefined;
  return Math.max(challenge.level, harder?.level ?? 0);
}

/**
 * The most a player can earn WITHOUT the timed bonus. A harder variant (served after a streak) pays more than the
 * challenge it replaces, so it counts here: otherwise a flawless run would score above 100%.
 */
export function maxScore(spec: GameSpec): number {
  const placed = new Set(spec.areas.flatMap((a) => a.stations.map((s) => s.challengeId).filter(Boolean)));
  const adaptive = spec.areas.some((a) => mechanicsForArea(spec, a.id).has("adaptive_difficulty"));
  const challengeMax = spec.challenges.filter((c) => placed.has(c.id)).reduce((sum, c) => sum + challengePoints(bestLevelFor(spec, c, adaptive)), 0);
  const collectMax = spec.areas.reduce((sum, a) => sum + a.collectibles.count * COLLECT_POINTS, 0);
  return challengeMax + collectMax + spec.missions.length * MISSION_BONUS + (spec.bosses ?? []).length * BOSS_BONUS;
}

export function starsFor(percent: number, completed: boolean): 0 | 1 | 2 | 3 {
  if (!completed) return 0;
  return percent >= 0.85 ? 3 : percent >= 0.6 ? 2 : 1;
}

export function pointsAwarded(args: { level: number; wrongBefore: number; hints: number; elapsedMs: number | null; timeLimitSec?: number; timedBonus: boolean }): number {
  const base = challengePoints(args.level);
  const attemptFactor = ATTEMPT_MULTIPLIER[Math.min(args.wrongBefore, ATTEMPT_MULTIPLIER.length - 1)]!;
  const hintFactor = 1 - Math.min(MAX_HINT_PENALTY, args.hints * HINT_PENALTY);
  let points = Math.max(base * MIN_FRACTION, base * attemptFactor * hintFactor);
  if (args.timedBonus && args.timeLimitSec && args.elapsedMs !== null) {
    const limit = args.timeLimitSec * 1000;
    if (args.elapsedMs <= limit) points += 0.25 * base * (1 - args.elapsedMs / limit);
  }
  return Math.round(points);
}

// ───────────────────────────── adaptive difficulty ─────────────────────────────

/** Which variant of the station's challenge to serve (only when the adaptive_difficulty mechanic is active). */
export function chooseVariant(spec: GameSpec, state: PlayState, station: Station): string {
  const baseId = station.challengeId!;
  const base = findChallenge(spec, baseId);
  if (!base || !mechanicsForArea(spec, findStation(spec, station.id)!.area.id).has("adaptive_difficulty")) return baseId;
  const last2 = state.recent.slice(-2);
  if (last2.length === 2 && last2.every((r) => r === "bad") && base.easierId) return base.easierId;
  if (state.streak >= 3 && base.harderId) return base.harderId;
  return baseId;
}

// ───────────────────────────── mutations (operate on a clone) ─────────────────────────────

export function cloneState(state: PlayState): PlayState {
  return structuredClone(state);
}

export function recompute(spec: GameSpec, state: PlayState): { newlyCompleted: string[]; newAchievements: string[]; defeatedBosses: string[] } {
  const newlyCompleted: string[] = [];
  state.bossesDefeated ??= [];
  const defeatedBosses: string[] = [];
  for (const boss of spec.bosses ?? []) {
    if (!state.bossesDefeated.includes(boss.id) && bossProgress(boss, state).defeated) {
      state.bossesDefeated.push(boss.id);
      state.score += BOSS_BONUS;
      defeatedBosses.push(boss.id);
    }
  }
  // Missions can complete in chains within one event, so iterate to a fixed point.
  for (let i = 0; i < spec.missions.length; i++) {
    let changed = false;
    for (const m of spec.missions) {
      if (!state.missionsDone.includes(m.id) && missionUnlocked(state, m) && missionDone(spec, state, m)) {
        state.missionsDone.push(m.id);
        state.score += MISSION_BONUS;
        newlyCompleted.push(m.id);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const wasFinished = state.finished;
  // Side missions pay their bonus but never block the end of the game.
  state.finished = spec.missions.every((m) => m.optional || state.missionsDone.includes(m.id));

  const have = new Set(state.achievements);
  const grant = (id: string, cond: boolean) => {
    if (cond && !have.has(id)) have.add(id);
  };
  const recs = Object.values(state.records).filter((r) => r.resolved);
  grant("first_try", recs.some((r) => r.correct && r.wrong === 0));
  grant("streak_3", state.streak >= 3 || state.achievements.includes("streak_3"));
  grant("persistent", recs.some((r) => r.correct && r.wrong >= 2));
  const totalCollectibles = spec.areas.reduce((n, a) => n + a.collectibles.count, 0);
  grant("explorer", totalCollectibles > 0 && state.collected.length >= totalCollectibles);
  grant("boss_slayer", state.bossesDefeated.length > 0);
  grant("side_quester", spec.missions.some((m) => m.optional) && spec.missions.filter((m) => m.optional).every((m) => state.missionsDone.includes(m.id)));
  if (state.finished) {
    grant("completed", true);
    grant("no_hints", state.hintsUsed === 0);
    // "Every challenge right on the first try" needs at least one answered challenge: a game finished through talk,
    // visit or collect objectives alone has nothing to be flawless at (`[].every` is true).
    grant("flawless", recs.length > 0 && recs.every((r) => r.correct && r.wrong === 0));
  }
  const newAchievements = [...have].filter((a) => !state.achievements.includes(a));
  state.achievements = [...have];
  void wasFinished;
  return { newlyCompleted, newAchievements, defeatedBosses };
}

export interface AnswerOutcome {
  resolved: boolean;
  correct: boolean;
  revealed: boolean;
  pointsAwarded: number;
  attemptsLeft: number;
}

/** Record a graded attempt. The grader result is supplied by the caller (pure state transition). */
export function recordAttempt(spec: GameSpec, state: PlayState, stationId: string, correct: boolean, now: number): AnswerOutcome {
  const challengeId = state.served[stationId]!;
  const challenge = findChallenge(spec, challengeId)!;
  const station = findStation(spec, stationId)!;
  const rec: ChallengeRecord =
    state.records[challengeId] ?? { stationId, attempts: 0, wrong: 0, hints: 0, resolved: false, correct: false, revealed: false, points: 0, timeMs: null };
  rec.attempts += 1;
  let points = 0;
  let revealed = false;
  if (correct) {
    const opened = state.openedAt[stationId];
    const elapsed = opened ? Math.max(0, now - opened) : null;
    points = pointsAwarded({
      level: challenge.level, wrongBefore: rec.wrong, hints: rec.hints, elapsedMs: elapsed, timeLimitSec: challenge.timeLimitSec,
      timedBonus: mechanicsForArea(spec, station.area.id).has("timed_bonus"),
    });
    rec.resolved = true;
    rec.correct = true;
    rec.points = points;
    rec.timeMs = elapsed;
    state.resolvedStations[stationId] = "correct";
    state.score += points;
    const good = rec.wrong === 0;
    state.recent = [...state.recent, (good ? "good" : "bad") as "good" | "bad"].slice(-6);
    state.streak = good ? state.streak + 1 : 0;
  } else {
    rec.wrong += 1;
    state.streak = 0;
    if (rec.wrong >= MAX_ATTEMPTS_PER_CHALLENGE) {
      rec.resolved = true;
      revealed = true;
      rec.revealed = true;
      state.resolvedStations[stationId] = "revealed";
      state.recent = [...state.recent, "bad" as const].slice(-6);
    }
  }
  state.records[challengeId] = rec;
  state.updatedAt = now;
  return { resolved: rec.resolved, correct, revealed, pointsAwarded: points, attemptsLeft: Math.max(0, MAX_ATTEMPTS_PER_CHALLENGE - rec.wrong) };
}

// ───────────────────────────── summaries ─────────────────────────────

export interface LearningSummary {
  score: number;
  maxScore: number;
  percent: number;
  stars: 0 | 1 | 2 | 3;
  completed: boolean;
  achievements: string[];
  collected: number;
  collectiblesTotal: number;
  durationMs: number;
  concepts: { concept: string; correct: number; total: number; firstTry: number }[];
  objectives: { id: string; text: string; mastery: number | null }[];
  review: { challengeId: string; title: string; concept: string; reason: "revealed" | "multiple_attempts" }[];
}

export function summarize(spec: GameSpec, state: PlayState, now = Date.now()): LearningSummary {
  // The timed bonus is on top of the base maximum: never report a score above its own maximum.
  const max = Math.max(maxScore(spec), state.score);
  const percent = max > 0 ? Math.min(1, state.score / max) : 0;
  const entries = Object.entries(state.records).filter(([, r]) => r.resolved);
  const concepts = new Map<string, { concept: string; correct: number; total: number; firstTry: number }>();
  const objectiveScores = new Map<string, number[]>();
  const review: LearningSummary["review"] = [];
  for (const [cid, rec] of entries) {
    const ch = findChallenge(spec, cid);
    if (!ch) continue;
    const c = concepts.get(ch.concept) ?? { concept: ch.concept, correct: 0, total: 0, firstTry: 0 };
    c.total += 1;
    if (rec.correct) c.correct += 1;
    if (rec.correct && rec.wrong === 0) c.firstTry += 1;
    concepts.set(ch.concept, c);
    if (ch.objectiveId) {
      const mastery = rec.correct ? Math.max(0.25, 1 - 0.25 * rec.wrong - 0.1 * rec.hints) : 0;
      objectiveScores.set(ch.objectiveId, [...(objectiveScores.get(ch.objectiveId) ?? []), mastery]);
    }
    // The same set as `buildReview` and the practice round (any miss): the results page lists these next to its "review
    // my mistakes" button, so a challenge solved on the second try must not read "nothing to review" beside that button.
    if (rec.revealed) review.push({ challengeId: cid, title: ch.title, concept: ch.concept, reason: "revealed" });
    else if (rec.wrong > 0) review.push({ challengeId: cid, title: ch.title, concept: ch.concept, reason: "multiple_attempts" });
  }
  return {
    score: state.score, maxScore: max, percent, stars: starsFor(percent, state.finished), completed: state.finished,
    achievements: state.achievements, collected: state.collected.length, collectiblesTotal: spec.areas.reduce((n, a) => n + a.collectibles.count, 0),
    durationMs: Math.max(0, state.playedMs ?? (now - state.startedAt)), concepts: [...concepts.values()],
    objectives: spec.learning.objectives.map((o) => {
      const s = objectiveScores.get(o.id);
      return { id: o.id, text: o.text, mastery: s ? s.reduce((a, b) => a + b, 0) / s.length : null };
    }),
    review,
  };
}

/** The slice of state the browser receives (no timestamps of other stations, no server bookkeeping). */
export type ClientState = Pick<PlayState, "areaId" | "position" | "checkpoint" | "resolvedStations" | "collected" | "talked" | "visited" | "missionsDone" | "bossesDefeated" | "streak" | "hintsUsed" | "score" | "achievements" | "finished">;

export function toClientState(state: PlayState): ClientState {
  return {
    areaId: state.areaId, position: state.position, checkpoint: state.checkpoint, resolvedStations: state.resolvedStations, collected: state.collected,
    talked: state.talked, visited: state.visited, missionsDone: state.missionsDone, bossesDefeated: state.bossesDefeated ?? [], streak: state.streak, hintsUsed: state.hintsUsed, score: state.score,
    achievements: state.achievements, finished: state.finished,
  };
}

/** A station counts as done once its challenge is resolved or its lore card was visited. */
export function stationDone(state: Pick<PlayState, "resolvedStations" | "visited">, stationId: string): boolean {
  return Boolean(state.resolvedStations[stationId]) || state.visited.includes(stationId);
}
