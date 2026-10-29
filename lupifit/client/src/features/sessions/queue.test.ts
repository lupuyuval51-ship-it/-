import { describe, expect, it } from 'vitest';
import { startTimer } from '@shared/timer';
import type { SessionExerciseDTO, SessionSetDTO, WorkoutSessionDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import {
  applyOp,
  backoffMs,
  classifyFailure,
  enqueue,
  isQueueEntry,
  msUntilNextReady,
  nextReady,
  reconcile,
  replaceSet,
  requestFor,
  retryLater,
  type PendingOp,
  type QueueEntry,
} from './queue';

let n = 0;
const ids = { newId: () => `id-${++n}`, newKey: () => `key-${++n}` };
const opts = (now: number, delayMs = 0, inFlightId: string | null = null) => ({ now, delayMs, inFlightId, ...ids });

const set = (id: string, extra: Partial<SessionSetDTO> = {}): SessionSetDTO => ({
  id,
  setNumber: 1,
  targetReps: 10,
  targetWeightKg: null,
  targetSeconds: null,
  reps: null,
  weightKg: null,
  durationSeconds: null,
  rpe: null,
  completed: false,
  completedAt: null,
  ...extra,
});

function session(sets: SessionSetDTO[], extra: Partial<WorkoutSessionDTO> = {}): WorkoutSessionDTO {
  const exercise = { id: 'se1', exerciseId: 'push_up', restSeconds: 60, notes: '', sets } as unknown as SessionExerciseDTO;
  const second = { id: 'se2', exerciseId: 'plank', restSeconds: 45, notes: '', sets: [] } as unknown as SessionExerciseDTO;
  return {
    id: 's1',
    planId: null,
    planWorkoutId: null,
    name: 'W',
    status: 'in_progress',
    startedAt: '2026-10-09T10:00:00.000Z',
    pausedAt: null,
    pausedSeconds: 0,
    endedAt: null,
    durationSeconds: null,
    currentExerciseIndex: 0,
    restTimer: null,
    notes: '',
    perceivedExertion: null,
    readiness: null,
    exercises: [exercise, second],
    serverTime: '2026-10-09T10:00:00.000Z',
    ...extra,
  };
}

const setOp = (setId: string, patch: PendingOp['patch']): PendingOp => ({ type: 'set', sessionId: 's1', setId, patch } as PendingOp);

describe('pending update queue', () => {
  it('appends ops for different targets and merges ops for the same target with a fresh key', () => {
    let q: QueueEntry[] = [];
    q = enqueue(q, setOp('a', { reps: 5 }), opts(1000));
    q = enqueue(q, setOp('b', { reps: 6 }), opts(1000));
    expect(q).toHaveLength(2);
    const firstKey = q[0]!.key;
    q = enqueue(q, setOp('a', { weightKg: 60, completed: true }), opts(1200));
    expect(q).toHaveLength(2);
    expect(q[0]!.op.patch).toEqual({ reps: 5, weightKg: 60, completed: true });
    expect(q[0]!.key).not.toBe(firstKey);
    expect(q[0]!.id).toBe(q[0]!.id);
  });

  it('never merges into the entry that is in flight', () => {
    let q = enqueue([], setOp('a', { reps: 5 }), opts(0));
    const inFlight = q[0]!.id;
    q = enqueue(q, setOp('a', { reps: 7 }), opts(10, 0, inFlight));
    expect(q).toHaveLength(2);
    expect(q[0]!.op.patch).toEqual({ reps: 5 });
    expect(q[1]!.op.patch).toEqual({ reps: 7 });
    // Further edits merge into the queued (not in-flight) entry.
    q = enqueue(q, setOp('a', { rpe: 8 }), opts(20, 0, inFlight));
    expect(q).toHaveLength(2);
    expect(q[1]!.op.patch).toEqual({ reps: 7, rpe: 8 });
  });

  it('folds newer edits into a failed entry so an older value is never sent last', () => {
    let q = enqueue([], setOp('a', { reps: 5 }), opts(0));
    const inFlight = q[0]!.id;
    // While "reps 5" is in flight the user types 6, and edits another set.
    q = enqueue(q, setOp('a', { reps: 6 }), opts(10, 700, inFlight));
    q = enqueue(q, setOp('b', { reps: 3 }), opts(10, 0, inFlight));
    // The in-flight request fails and is retried later: only one entry for `a` remains, with the newest value.
    const keyBefore = q[0]!.key;
    q = retryLater(q, inFlight, 1000, ids.newKey);
    expect(q.filter((e) => e.op.type === 'set' && e.op.setId === 'a')).toHaveLength(1);
    expect(q[0]).toMatchObject({ id: inFlight, attempts: 1, op: { patch: { reps: 6 } } });
    expect(q[0]!.key).not.toBe(keyBefore);
    expect(q[0]!.notBefore).toBe(2000);
    expect(q[1]!.op).toMatchObject({ setId: 'b' });
    // Without newer edits the entry just backs off (same key: same payload).
    const single = enqueue([], setOp('c', { reps: 1 }), opts(0));
    const retried = retryLater(single, single[0]!.id, 0, ids.newKey);
    expect(retried[0]).toMatchObject({ key: single[0]!.key, attempts: 1, notBefore: 1000 });
    expect(retryLater(retried, 'missing', 0, ids.newKey)).toBe(retried);
  });

  it('merges a new edit into the newest pending entry of the target', () => {
    const older: QueueEntry = { id: 'o', key: 'k1', op: setOp('a', { reps: 5 }), attempts: 2, notBefore: 5000, createdAt: 0 };
    const newer: QueueEntry = { id: 'n', key: 'k2', op: setOp('a', { reps: 6 }), attempts: 0, notBefore: 700, createdAt: 10 };
    const q = enqueue([older, newer], setOp('a', { reps: 7 }), opts(20));
    expect(q.map((e) => e.op.patch)).toEqual([{ reps: 5 }, { reps: 7 }]);
    expect(reconcile(session([set('a')]), q).exercises[0]!.sets[0]!.reps).toBe(7);
  });

  it('debounces with notBefore and picks ready entries in order', () => {
    let q = enqueue([], setOp('a', { reps: 5 }), opts(1000, 700));
    q = enqueue(q, { type: 'state', sessionId: 's1', patch: { currentExerciseIndex: 1 } }, opts(1000, 0));
    expect(nextReady(q, 1000)?.op.type).toBe('state');
    expect(msUntilNextReady(q.slice(0, 1), 1000)).toBe(700);
    expect(nextReady(q.slice(0, 1), 1500)).toBeNull();
    expect(nextReady(q, 1700)?.op.type).toBe('set');
    expect(msUntilNextReady([], 0)).toBeNull();
  });

  it('backs off exponentially up to 30 s and classifies failures', () => {
    expect([1, 2, 3, 4, 10].map(backoffMs)).toEqual([1000, 2000, 4000, 8000, 30_000]);
    expect(classifyFailure(new ApiError(0, 'network_error', 'x'))).toBe('retry');
    expect(classifyFailure(new ApiError(0, 'timeout', 'x'))).toBe('retry');
    expect(classifyFailure(new ApiError(503, 'service_unavailable', 'x'))).toBe('retry');
    expect(classifyFailure(new ApiError(429, 'rate_limited', 'x'))).toBe('retry');
    expect(classifyFailure(new ApiError(409, 'request_in_progress', 'x'))).toBe('retry');
    expect(classifyFailure(new ApiError(401, 'unauthorized', 'x'))).toBe('auth');
    expect(classifyFailure(new ApiError(409, 'session_not_active', 'x'))).toBe('drop');
    expect(classifyFailure(new ApiError(400, 'validation_error', 'x'))).toBe('drop');
    expect(classifyFailure(new TypeError('boom'))).toBe('retry');
  });

  it('maps ops to API requests', () => {
    expect(requestFor(setOp('a', { reps: 5 }))).toEqual({ path: '/sessions/s1/sets/a', body: { reps: 5 } });
    expect(requestFor({ type: 'exercise', sessionId: 's1', sessionExerciseId: 'se1', patch: { restSeconds: 90 } })).toEqual({
      path: '/sessions/s1/exercises/se1',
      body: { restSeconds: 90 },
    });
    expect(requestFor({ type: 'state', sessionId: 's1', patch: { restTimer: null } })).toEqual({ path: '/sessions/s1/state', body: { action: 'update', restTimer: null } });
  });
});

describe('optimistic application', () => {
  it('applies set, exercise and state patches', () => {
    const s = session([set('a'), set('b')]);
    const now = Date.parse('2026-10-09T10:05:00.000Z');
    const done = applyOp(s, setOp('a', { reps: 8, weightKg: 60, completed: true }), now);
    expect(done.exercises[0]!.sets[0]).toMatchObject({ reps: 8, weightKg: 60, completed: true, completedAt: '2026-10-09T10:05:00.000Z' });
    expect(done.exercises[0]!.sets[1]).toBe(s.exercises[0]!.sets[1]);
    const undone = applyOp(done, setOp('a', { completed: false }), now);
    expect(undone.exercises[0]!.sets[0]).toMatchObject({ completed: false, completedAt: null, reps: 8 });
    const ex = applyOp(s, { type: 'exercise', sessionId: 's1', sessionExerciseId: 'se1', patch: { restSeconds: 120, notes: 'x' } });
    expect(ex.exercises[0]).toMatchObject({ restSeconds: 120, notes: 'x' });
    const timer = startTimer(60, now, 'se1');
    const st = applyOp(s, { type: 'state', sessionId: 's1', patch: { currentExerciseIndex: 9, restTimer: timer } });
    expect(st.currentExerciseIndex).toBe(1); // clamped to the last exercise
    expect(st.restTimer).toEqual(timer);
  });

  it('ignores ops for other sessions or missing sets', () => {
    const s = session([set('a')]);
    expect(applyOp(s, { ...setOp('zzz', { reps: 1 }) })).toBe(s);
    expect(applyOp(s, { type: 'set', sessionId: 'other', setId: 'a', patch: { reps: 1 } })).toBe(s);
  });

  it('re-applies unsynced edits on top of fresh server data (recovery after reload)', () => {
    const server = session([set('a', { reps: 5 }), set('b')], { currentExerciseIndex: 0, restTimer: null });
    let q: QueueEntry[] = [];
    q = enqueue(q, setOp('b', { reps: 9, completed: true }), opts(0));
    q = enqueue(q, { type: 'state', sessionId: 's1', patch: { currentExerciseIndex: 1, restTimer: startTimer(90, 0, 'se1') } }, opts(0));
    const merged = reconcile(server, q);
    expect(merged.exercises[0]!.sets[0]!.reps).toBe(5);
    expect(merged.exercises[0]!.sets[1]).toMatchObject({ reps: 9, completed: true });
    expect(merged.currentExerciseIndex).toBe(1);
    expect(merged.restTimer?.durationSeconds).toBe(90);
    // Finished sessions are never modified.
    const finished = { ...server, status: 'completed' as const };
    expect(reconcile(finished, q)).toBe(finished);
  });

  it('replaces a set with the server version', () => {
    const s = session([set('a'), set('b')]);
    const r = replaceSet(s, set('b', { reps: 3, completed: true, completedAt: 'x' }));
    expect(r.exercises[0]!.sets[1]).toMatchObject({ reps: 3, completed: true });
    expect(replaceSet(s, set('missing'))).toBe(s);
  });

  it('validates entries read back from storage', () => {
    const [entry] = enqueue([], setOp('a', { reps: 1 }), opts(0));
    expect(isQueueEntry(entry)).toBe(true);
    expect(isQueueEntry(JSON.parse(JSON.stringify(entry)))).toBe(true);
    expect(isQueueEntry({ ...entry, op: { type: 'set', sessionId: 's1', patch: {} } })).toBe(false);
    expect(isQueueEntry({ ...entry, key: 1 })).toBe(false);
    expect(isQueueEntry(null)).toBe(false);
  });
});
