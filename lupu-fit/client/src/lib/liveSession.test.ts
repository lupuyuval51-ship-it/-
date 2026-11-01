import { describe, expect, it } from 'vitest';
import { ageBucket } from '@lupu-fit/shared';
import { EXERCISE_BY_ID, exById } from '../data/content.ts';
import {
  clampRpe, defaultsFor, deletedSetIds, finisherMinutes, isTimedExercise, lastPerformance, maxRpeFor, nextUp, pendingSets, progressionFor, replacementOptions, rpeOptions, safeBucket, swapContextFor,
  type HistoryEntry, type LiveExercise, type Planned,
} from './liveSession.ts';
import type { OutboxItem } from './outbox.ts';

const planned: Planned = { sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSec: 90, loadKg: 60, durationSec: null };
const h = (id: string, w: number, reps: number[]): HistoryEntry => ({ sessionId: id, date: '2026-01-01', sets: reps.map((r, i) => ({ setNo: i + 1, reps: r, weightKg: w, durationSec: null, rpe: 8 })) });
const topTwice = [h('b', 60, [10, 10, 10]), h('a', 60, [10, 10, 10])]; // newest first

describe('progression badge', () => {
  it('suggests +2.5 kg for adults after two top-of-range sessions at the same load', () => {
    const p = progressionFor({ history: topTwice, planned, readiness: 'normal', bucket: 'adult', timed: false });
    expect(p.badge).toEqual({ kind: 'increase', kg: 2.5 }); expect(p.loadKg).toBe(62.5);
  });
  it('is frozen (load held) on easier / rest readiness', () => {
    for (const r of ['easier', 'rest'] as const) {
      const p = progressionFor({ history: topTwice, planned, readiness: r, bucket: 'adult', timed: false });
      expect(p.badge.kind).toBe('frozen'); expect(p.loadKg).toBe(60);
    }
  });
  it('deloads after missing the bottom of the range twice', () => {
    const p = progressionFor({ history: [h('b', 60, [6, 6, 5]), h('a', 60, [7, 6, 6])], planned, readiness: 'normal', bucket: 'adult', timed: false });
    expect(p.badge.kind).toBe('deload'); expect(p.loadKg).toBe(55);
  });
  it('never suggests a load increase for minors or an unknown age (rep progression only)', () => {
    const minor = progressionFor({ history: topTwice, planned, readiness: 'normal', bucket: 'minor', timed: false });
    expect(minor.badge.kind).toBe('minorKeep'); expect(minor.loadKg).toBe(60);
    const reps = progressionFor({ history: [h('a', 40, [8, 9, 8])], planned, readiness: 'normal', bucket: 'minor', timed: false });
    expect(reps.badge).toEqual({ kind: 'minorReps', max: 10 });
    expect(progressionFor({ history: topTwice, planned, readiness: 'normal', bucket: null, timed: false }).badge.kind).toBe('hold');
  });
  it('shows nothing without history and holds otherwise', () => {
    expect(progressionFor({ history: [], planned, readiness: 'normal', bucket: 'adult', timed: false }).badge.kind).toBe('none');
    expect(progressionFor({ history: [h('a', 60, [9, 9, 9])], planned, readiness: 'normal', bucket: 'adult', timed: false }).badge.kind).toBe('hold');
  });
});

describe('helpers', () => {
  it('caps RPE at 7 for minors and offers 0.5 steps', () => {
    expect(maxRpeFor('minor')).toBe(7); expect(maxRpeFor('adult')).toBe(10); expect(maxRpeFor(null)).toBe(10);
    expect(rpeOptions(7)).toHaveLength(13); expect(rpeOptions(7).at(-1)).toBe(7); expect(rpeOptions(10)).toHaveLength(19);
    expect(clampRpe(9, 7)).toBe(7); expect(clampRpe(7.3, 10)).toBe(7.5);
  });
  it('detects timed exercises by category or planned duration', () => {
    expect(isTimedExercise('isometric', planned)).toBe(true); expect(isTimedExercise('weight_reps', planned)).toBe(false);
    expect(isTimedExercise('weight_reps', { ...planned, durationSec: 30 })).toBe(true);
  });
  it('prefills weight from own last set, then progression, then last session, then plan', () => {
    const base = { planned, last: lastPerformance(topTwice), maxRpe: 10 };
    const prog = progressionFor({ history: topTwice, planned, readiness: 'normal', bucket: 'adult', timed: false });
    expect(defaultsFor({ ...base, progression: prog, ownSets: [] }).weightKg).toBe(62.5);
    expect(defaultsFor({ ...base, progression: prog, ownSets: [{ reps: 9, weightKg: 65, durationSec: null, rpe: 8.5 }] })).toMatchObject({ weightKg: 65, reps: 9, rpe: 8.5 });
    expect(defaultsFor({ planned, last: null, progression: { badge: { kind: 'none' }, loadKg: null }, ownSets: [], maxRpe: 10 }).weightKg).toBe(60);
    expect(defaultsFor({ planned: { ...planned, rpe: 9 }, last: null, progression: { badge: { kind: 'none' }, loadKg: null }, ownSets: [], maxRpe: 7 }).rpe).toBe(7);
  });
  it('estimates finisher minutes from its own prescriptions', () => {
    expect(finisherMinutes([{ ...planned, sets: 3, durationSec: 30, restSec: 30 }])).toBe(3);
    expect(finisherMinutes([])).toBe(1);
  });
  it('derives queued sets and queued deletions from the outbox', () => {
    const mk = (o: Partial<OutboxItem>): OutboxItem => ({ id: 'i', method: 'POST', path: '', body: {}, idempotencyKey: 'k', createdAt: 1, label: 'x', status: 'pending', ...o });
    const items = [mk({ id: '1', path: '/api/sessions/s1/sets', body: { sessionExerciseId: 'e1', reps: 8, weightKg: 60 } }), mk({ id: '2', method: 'DELETE', path: '/api/sessions/s1/sets/abc' }), mk({ id: '3', path: '/api/sessions/s2/sets' })];
    expect(pendingSets(items, 's1')).toEqual([{ itemId: '1', status: 'pending', sessionExerciseId: 'e1', reps: 8, weightKg: 60, durationSec: null, rpe: null }]);
    expect([...deletedSetIds(items, 's1')]).toEqual(['abc']);
  });
  it('filters replacement options through the safety engine', () => {
    const profile = { equipment: [], injuries: [], experience: 'beginner', age: 30 } as never;
    const ctx = swapContextFor(profile, 'adult');
    const push = exById('push_up'); if (!push) throw new Error('fixture');
    const ids = replacementOptions(push, ctx, EXERCISE_BY_ID).map((e) => e.id);
    expect(ids).toContain('incline_push_up'); expect(ids).not.toContain('push_up'); expect(ids).not.toContain('decline_push_up'); // intermediate > beginner
    const hurt = swapContextFor({ equipment: [], injuries: ['wrist', 'shoulder'], experience: 'advanced', age: 30 } as never, 'adult');
    expect(replacementOptions(push, hurt, EXERCISE_BY_ID).map((e) => e.id)).toEqual(['wall_push_up']);
    expect(safeBucket(15, ageBucket)).toBe('minor'); expect(safeBucket(3, ageBucket)).toBeNull(); expect(safeBucket(undefined, ageBucket)).toBeNull();
  });
});

describe('nextUp', () => {
  const ex = (id: string, isFinisher = false, sets = 2): LiveExercise => ({ id, exerciseId: 'push_up', isFinisher, sport: null, planned: { ...planned, sets }, sets: [] });
  const list = [ex('a'), ex('b'), ex('f', true)];
  it('stays on the same exercise while planned sets remain', () => {
    expect(nextUp(list, 'a', new Map([['a', 1]]))).toMatchObject({ kind: 'set', setNo: 2, exercise: { id: 'a' } });
  });
  it('moves to the next unfinished exercise, then to finishers', () => {
    expect(nextUp(list, 'a', new Map([['a', 2]]))).toMatchObject({ kind: 'exercise', setNo: 1, exercise: { id: 'b' } });
    expect(nextUp(list, 'b', new Map([['a', 2], ['b', 2]]))).toMatchObject({ kind: 'exercise', exercise: { id: 'f' } });
  });
  it('wraps back to an earlier unfinished exercise and returns null when everything is done', () => {
    expect(nextUp(list, 'b', new Map([['b', 2], ['f', 2]]))).toMatchObject({ exercise: { id: 'a' } });
    expect(nextUp(list, 'f', new Map([['a', 2], ['b', 2], ['f', 2]]))).toBeNull();
  });
});
