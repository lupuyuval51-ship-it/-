import { describe, expect, it } from 'vitest';
import type { SessionExerciseDTO } from '@shared/types';
import { completionOutcome, nextOpenExercise, unfinishedExercises, volumeKg } from './logic';
import { shortcutAction } from './shortcuts';
import { stepValue } from './SetRow';

function ex(id: string, sets: { done: boolean; reps?: number | null; weight?: number | null }[]): SessionExerciseDTO {
  return {
    id,
    sets: sets.map((s, i) => ({ id: `${id}-${i + 1}`, setNumber: i + 1, completed: s.done, reps: s.reps ?? null, weightKg: s.weight ?? null })),
  } as unknown as SessionExerciseDTO;
}

describe('volumeKg', () => {
  it('sums reps x weight of completed sets only', () => {
    expect(volumeKg([ex('a', [{ done: true, reps: 8, weight: 60 }, { done: false, reps: 8, weight: 100 }, { done: true, reps: 5, weight: null }])])).toBe(480);
  });
});

describe('unfinishedExercises', () => {
  it('lists exercises with open sets with their counts', () => {
    const list = unfinishedExercises([ex('a', [{ done: true }, { done: true }]), ex('b', [{ done: true }, { done: false }]), ex('c', [])]);
    expect(list.map((l) => [l.id, l.done, l.total])).toEqual([['b', 1, 2]]);
  });
});

describe('completionOutcome', () => {
  const list = [ex('a', [{ done: true }, { done: false }]), ex('b', [{ done: false }]), ex('c', [{ done: false }])];
  it('does not advance while the exercise still has open sets', () => {
    expect(completionOutcome(list, 1, 'b-1')).toMatchObject({ exerciseDone: true });
    expect(completionOutcome([ex('a', [{ done: false }, { done: false }])], 0, 'a-1')).toEqual({ exerciseDone: false, workoutDone: false, advanceTo: null });
  });
  it('advances to the next exercise with open sets and wraps to skipped ones', () => {
    expect(completionOutcome(list, 1, 'b-1').advanceTo).toBe(2);
    expect(completionOutcome(list, 2, 'c-1').advanceTo).toBe(0);
  });
  it('flags the end of the workout and never advances then', () => {
    const last = [ex('a', [{ done: true }]), ex('b', [{ done: false }])];
    expect(completionOutcome(last, 1, 'b-1')).toEqual({ exerciseDone: true, workoutDone: true, advanceTo: null });
  });
});

describe('nextOpenExercise', () => {
  it('returns null when everything is done', () => {
    expect(nextOpenExercise([ex('a', [{ done: true }]), ex('b', [{ done: true }])], 0)).toBeNull();
  });
});

describe('stepValue', () => {
  it('steps without floating point noise and never goes below zero', () => {
    expect(stepValue(60, 2.5)).toBe(62.5);
    expect(stepValue(0.1, 0.2)).toBe(0.3);
    expect(stepValue(1, -5)).toBe(0);
    expect(stepValue(null, 1)).toBe(1);
  });
});

describe('shortcutAction', () => {
  const key = (k: string, target: Record<string, unknown> | null = { tagName: 'BODY' }, mods: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean }> = {}) =>
    shortcutAction({ key: k, ctrlKey: false, metaKey: false, altKey: false, target, ...mods });
  it('maps keys to actions', () => {
    expect([key('c'), key('U'), key('['), key(']'), key('r'), key('p'), key('x')]).toEqual(['complete', 'undo', 'previous', 'next', 'rest', 'pause', null]);
  });
  it('ignores typing, modifiers and dialogs', () => {
    expect(key('c', { tagName: 'INPUT' })).toBeNull();
    expect(key('c', { tagName: 'TEXTAREA' })).toBeNull();
    expect(key('c', { tagName: 'DIV', isContentEditable: true })).toBeNull();
    expect(key('c', { tagName: 'BUTTON', closest: () => ({}) })).toBeNull();
    expect(key('c', { tagName: 'BODY' }, { ctrlKey: true })).toBeNull();
  });
});
