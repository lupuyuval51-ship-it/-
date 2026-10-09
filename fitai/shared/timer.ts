/**
 * Rest timer state machine. The timer is defined by timestamps rather than a ticking
 * counter, so it stays correct across background tabs, throttled intervals, page
 * refreshes and navigation: `remaining = endsAt - now` while running, or the frozen
 * `remainingSeconds` while paused. The same state is persisted on the server
 * (workout_sessions.rest_timer) and in localStorage.
 */

export interface RestTimerState {
  /** Configured length of this rest period in seconds. */
  durationSeconds: number;
  /** ISO time at which the rest ends while running; null when paused or idle. */
  endsAt: string | null;
  /** Seconds left when paused; null while running or idle. */
  remainingSeconds: number | null;
  /** Exercise the rest belongs to (for UI context). */
  exerciseId: string | null;
}

export type RestTimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export const MAX_REST_SECONDS = 600;

const clampDuration = (s: number) => Math.min(MAX_REST_SECONDS, Math.max(0, Math.round(s)));

export function idleTimer(durationSeconds: number, exerciseId: string | null = null): RestTimerState {
  return { durationSeconds: clampDuration(durationSeconds), endsAt: null, remainingSeconds: null, exerciseId };
}

export function startTimer(durationSeconds: number, nowMs: number, exerciseId: string | null = null): RestTimerState {
  const d = clampDuration(durationSeconds);
  return { durationSeconds: d, endsAt: new Date(nowMs + d * 1000).toISOString(), remainingSeconds: null, exerciseId };
}

export function timerRemainingSeconds(state: RestTimerState | null, nowMs: number): number {
  if (!state) return 0;
  if (state.remainingSeconds != null) return Math.max(0, state.remainingSeconds);
  if (state.endsAt) return Math.max(0, Math.ceil((Date.parse(state.endsAt) - nowMs) / 1000));
  return state.durationSeconds;
}

export function timerStatus(state: RestTimerState | null, nowMs: number): RestTimerStatus {
  if (!state) return 'idle';
  if (state.remainingSeconds != null) return state.remainingSeconds > 0 ? 'paused' : 'finished';
  if (state.endsAt) return Date.parse(state.endsAt) > nowMs ? 'running' : 'finished';
  return 'idle';
}

export function pauseTimer(state: RestTimerState, nowMs: number): RestTimerState {
  if (timerStatus(state, nowMs) !== 'running') return state;
  return { ...state, endsAt: null, remainingSeconds: timerRemainingSeconds(state, nowMs) };
}

export function resumeTimer(state: RestTimerState, nowMs: number): RestTimerState {
  if (state.remainingSeconds == null || state.remainingSeconds <= 0) return state;
  return { ...state, endsAt: new Date(nowMs + state.remainingSeconds * 1000).toISOString(), remainingSeconds: null };
}

export function resetTimer(state: RestTimerState): RestTimerState {
  return idleTimer(state.durationSeconds, state.exerciseId);
}

/** Adds (or with a negative value removes) time from a running/paused timer. */
export function adjustTimer(state: RestTimerState, deltaSeconds: number, nowMs: number): RestTimerState {
  const status = timerStatus(state, nowMs);
  if (status === 'running') {
    const remaining = Math.max(0, timerRemainingSeconds(state, nowMs) + deltaSeconds);
    return { ...state, endsAt: new Date(nowMs + remaining * 1000).toISOString() };
  }
  if (status === 'paused') return { ...state, remainingSeconds: Math.max(0, (state.remainingSeconds ?? 0) + deltaSeconds) };
  return { ...state, durationSeconds: clampDuration(state.durationSeconds + deltaSeconds) };
}

export function isValidTimerState(v: unknown): v is RestTimerState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.durationSeconds === 'number' &&
    s.durationSeconds >= 0 &&
    s.durationSeconds <= MAX_REST_SECONDS &&
    (s.endsAt === null || (typeof s.endsAt === 'string' && !Number.isNaN(Date.parse(s.endsAt)))) &&
    (s.remainingSeconds === null || (typeof s.remainingSeconds === 'number' && s.remainingSeconds >= 0 && s.remainingSeconds <= MAX_REST_SECONDS)) &&
    (s.exerciseId === null || typeof s.exerciseId === 'string')
  );
}
