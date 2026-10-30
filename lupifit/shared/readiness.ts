/**
 * Pre-workout readiness (pure, shared by server and client).
 *
 * Three optional taps decide whether today's session should be a little easier. The check-in can only
 * make a session easier: it never raises load, for anyone. The plan itself is never rewritten.
 */
export const READINESS_ENERGY = ['low', 'normal', 'high'] as const;
export const READINESS_SORENESS = ['none', 'some', 'high'] as const;
export const READINESS_SLEEP = ['poor', 'ok', 'good'] as const;

export type ReadinessEnergy = (typeof READINESS_ENERGY)[number];
export type ReadinessSoreness = (typeof READINESS_SORENESS)[number];
export type ReadinessSleep = (typeof READINESS_SLEEP)[number];

export interface ReadinessCheckin {
  energy: ReadinessEnergy;
  soreness: ReadinessSoreness;
  sleep: ReadinessSleep;
}

export type ReadinessLevel = 'easier' | 'normal';

/** Two or more negative signals (low energy, high soreness, poor sleep) make the session easier. */
export function readinessLevel(c: ReadinessCheckin): ReadinessLevel {
  const negatives = Number(c.energy === 'low') + Number(c.soreness === 'high') + Number(c.sleep === 'poor');
  return negatives >= 2 ? 'easier' : 'normal';
}

/** One set fewer, but never below two sets and never more than planned. */
export function easierSets(sets: number): number {
  return Math.min(sets, Math.max(2, sets - 1));
}

/** One RPE point lower, but never below 5 and never above the planned value. */
export function easierRpe(rpe: number | null): number | null {
  return rpe == null ? null : Math.min(rpe, Math.max(5, rpe - 1));
}
