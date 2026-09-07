/**
 * XP rules. Every XP amount is derived from recorded session data – nothing is granted for free
 * beyond the fixed bonuses below, and there is no paid or premium multiplier of any kind.
 */
import type { XpEvent } from "@/lib/types";

export const XP_RULES = {
  /** 1 XP per active minute, capped at the planned duration. */
  perActiveMinute: 1,
  /** +5 per exercise result that was logged. */
  perLoggedResult: 5,
  /** +25 per new personal best. */
  perPersonalBest: 25,
  /** +15 when at least 80% of the exercises were completed. */
  completionBonus: 15,
  completionThreshold: 0.8,
  /** +20 when the workout's challenge phase was completed. */
  challengeBonus: 20,
  /** Bonus for finishing the onboarding baseline test. */
  baselineBonus: 40,
  /** Bonus for completing onboarding. */
  onboardingBonus: 20,
} as const;

export interface SessionXpInput {
  actualMinutes: number;
  plannedMinutes: number;
  exercisesCompleted: number;
  exercisesCount: number;
  resultsLogged: number;
  newPersonalBests: number;
  challengeCompleted: boolean;
}

export interface SessionXpBreakdown {
  minutes: number;
  results: number;
  personalBests: number;
  completion: number;
  challenge: number;
  total: number;
}

function nonNegInt(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function xpForCompletedSession(input: SessionXpInput): SessionXpBreakdown {
  const planned = nonNegInt(input.plannedMinutes);
  const active = nonNegInt(input.actualMinutes);
  const minutes = Math.min(active, planned > 0 ? planned : active) * XP_RULES.perActiveMinute;
  const results = nonNegInt(input.resultsLogged) * XP_RULES.perLoggedResult;
  const personalBests = nonNegInt(input.newPersonalBests) * XP_RULES.perPersonalBest;
  const count = nonNegInt(input.exercisesCount);
  const completedRatio = count > 0 ? nonNegInt(input.exercisesCompleted) / count : 0;
  const completion = completedRatio >= XP_RULES.completionThreshold ? XP_RULES.completionBonus : 0;
  const challenge = input.challengeCompleted ? XP_RULES.challengeBonus : 0;
  return { minutes, results, personalBests, completion, challenge, total: minutes + results + personalBests + completion + challenge };
}

export function totalXp(events: XpEvent[]): number {
  let sum = 0;
  for (const e of events) {
    if (!e || e.deletedAt) continue;
    if (Number.isFinite(e.amount)) sum += e.amount;
  }
  return Math.max(0, Math.round(sum));
}

export interface SessionXpEventsInput {
  sessionId: string;
  at: string;
  breakdown: SessionXpBreakdown;
  /** Keys of the personal bests set in this session (one event each). */
  newPersonalBestKeys?: string[];
  /** Daily / weekly challenges completed by this session: definition xp + record id. */
  completedChallenges?: { id: string; xp: number }[];
  /** Achievements unlocked by this session. */
  unlockedAchievements?: { id: string; xp: number }[];
}

/** Deterministic ids: finalising the same session twice never duplicates XP. */
export function xpEventId(sessionId: string, reason: XpEvent["reason"], refId?: string): string {
  return refId ? `xp:${sessionId}:${reason}:${refId}` : `xp:${sessionId}:${reason}`;
}

export function xpEventsForSession(input: SessionXpEventsInput): XpEvent[] {
  const { sessionId, at, breakdown } = input;
  const events: XpEvent[] = [];
  const sessionAmount = breakdown.minutes + breakdown.completion + breakdown.challenge;
  if (sessionAmount > 0) {
    events.push({ id: xpEventId(sessionId, "session"), amount: sessionAmount, reason: "session", refId: sessionId, at, updatedAt: at });
  }
  if (breakdown.results > 0) {
    events.push({ id: xpEventId(sessionId, "exercise_result"), amount: breakdown.results, reason: "exercise_result", refId: sessionId, at, updatedAt: at });
  }
  for (const key of input.newPersonalBestKeys ?? []) {
    events.push({ id: xpEventId(sessionId, "personal_best", key), amount: XP_RULES.perPersonalBest, reason: "personal_best", refId: key, at, updatedAt: at });
  }
  for (const c of input.completedChallenges ?? []) {
    if (c.xp > 0) events.push({ id: xpEventId(sessionId, "challenge", c.id), amount: c.xp, reason: "challenge", refId: c.id, at, updatedAt: at });
  }
  for (const a of input.unlockedAchievements ?? []) {
    if (a.xp > 0) events.push({ id: xpEventId(sessionId, "achievement", a.id), amount: a.xp, reason: "achievement", refId: a.id, at, updatedAt: at });
  }
  return events;
}
