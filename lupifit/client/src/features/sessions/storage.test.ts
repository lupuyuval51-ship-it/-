import { afterEach, describe, expect, it } from 'vitest';
import { isValidTimerState, startTimer, pauseTimer, timerRemainingSeconds, timerStatus } from '@shared/timer';
import type { WorkoutSessionDTO } from '@shared/types';
import { enqueue } from './queue';
import {
  ACTIVE_SESSION_KEY,
  PENDING_UPDATES_KEY,
  clearWorkoutStorage,
  readCachedSession,
  readQueue,
  readTimerMuted,
  writeCachedSession,
  writeQueue,
  writeTimerMuted,
} from './storage';

const NOW = Date.parse('2026-10-09T10:00:00.000Z');
const session = (extra: Partial<WorkoutSessionDTO> = {}): WorkoutSessionDTO => ({
  id: 's1',
  planId: null,
  planWorkoutId: null,
  name: 'W',
  status: 'in_progress',
  startedAt: '2026-10-09T09:30:00.000Z',
  pausedAt: null,
  pausedSeconds: 0,
  endedAt: null,
  durationSeconds: null,
  currentExerciseIndex: 1,
  restTimer: startTimer(90, NOW, 'se1'),
  notes: '',
  perceivedExertion: null,
  exercises: [],
  serverTime: '2026-10-09T10:00:00.000Z',
  ...extra,
});

afterEach(() => window.localStorage.clear());

describe('workout persistence', () => {
  it('round-trips the active session with the timer, scoped to the user', () => {
    writeCachedSession('u1', session(), 1500, NOW);
    const cached = readCachedSession('u1', NOW + 1000);
    expect(cached?.session.currentExerciseIndex).toBe(1);
    expect(cached?.skewMs).toBe(1500);
    // The restored timer keeps counting from its timestamps.
    const timer = cached!.session.restTimer!;
    expect(isValidTimerState(timer)).toBe(true);
    expect(timerStatus(timer, NOW + 30_000)).toBe('running');
    expect(timerRemainingSeconds(timer, NOW + 30_000)).toBe(60);
    expect(readCachedSession('someone-else', NOW)).toBeNull();
  });

  it('keeps paused timers frozen across a reload', () => {
    const paused = pauseTimer(startTimer(90, NOW, null), NOW + 20_000);
    writeCachedSession('u1', session({ restTimer: paused }), 0, NOW);
    const t = readCachedSession('u1', NOW)!.session.restTimer!;
    expect(timerStatus(t, NOW + 600_000)).toBe('paused');
    expect(timerRemainingSeconds(t, NOW + 600_000)).toBe(70);
  });

  it('rejects stale, finished or corrupted caches', () => {
    writeCachedSession('u1', session(), 0, NOW);
    expect(readCachedSession('u1', NOW + 3 * 24 * 3600_000)).toBeNull();
    writeCachedSession('u1', session({ status: 'completed' }), 0, NOW);
    expect(window.localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull();
    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ v: 1, userId: 'u1', savedAt: NOW, skewMs: 0, session: { id: 's1' } }));
    expect(readCachedSession('u1', NOW)).toBeNull();
    window.localStorage.setItem(ACTIVE_SESSION_KEY, '{not json');
    expect(readCachedSession('u1', NOW)).toBeNull();
    writeCachedSession('u1', session({ restTimer: { durationSeconds: 9999, endsAt: null, remainingSeconds: null, exerciseId: null } }), 0, NOW);
    expect(readCachedSession('u1', NOW)).toBeNull();
  });

  it('persists the pending queue per user and drops malformed entries', () => {
    const q = enqueue([], { type: 'set', sessionId: 's1', setId: 'a', patch: { reps: 5, completed: true } }, {
      now: NOW,
      delayMs: 0,
      newId: () => 'id1',
      newKey: () => 'key-000001',
    });
    writeQueue('u1', q);
    expect(readQueue('u1')).toEqual(q);
    expect(readQueue('u2')).toEqual([]);
    const raw = JSON.parse(window.localStorage.getItem(PENDING_UPDATES_KEY)!);
    raw.entries.push({ bogus: true });
    window.localStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(raw));
    expect(readQueue('u1')).toEqual(q);
    writeQueue('u1', []);
    expect(window.localStorage.getItem(PENDING_UPDATES_KEY)).toBeNull();
  });

  it('clears workout data and remembers the mute preference', () => {
    writeCachedSession('u1', session(), 0, NOW);
    writeQueue('u1', enqueue([], { type: 'state', sessionId: 's1', patch: { restTimer: null } }, { now: 0, delayMs: 0, newId: () => 'i', newKey: () => 'k-0000001' }));
    clearWorkoutStorage();
    expect(readCachedSession('u1', NOW)).toBeNull();
    expect(readQueue('u1')).toEqual([]);
    expect(readTimerMuted()).toBe(false);
    writeTimerMuted(true);
    expect(readTimerMuted()).toBe(true);
  });
});
