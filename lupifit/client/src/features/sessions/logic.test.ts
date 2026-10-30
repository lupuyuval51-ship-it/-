import { describe, expect, it } from 'vitest';
import type { SportId } from '@shared/constants';
import type { SessionExerciseDTO } from '@shared/types';
import { completionOutcome, enteredFinisher, finisherProgress, finisherSport, groupBySport, nextOpenExercise, sportOf, unfinishedExercises, volumeKg } from './logic';
import { shortcutAction } from './shortcuts';
import { stepValue } from './SetRow';

function ex(id: string, sets: { done: boolean; reps?: number | null; weight?: number | null }[], sport: SportId | null = null): SessionExerciseDTO {
  return {
    id,
    sport,
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

describe('sport finisher sections', () => {
  const one = [{ done: false }];
  /** A ready workout as the server builds it: main exercises first, then the finisher. */
  const ready = [ex('a', one), ex('b', one), ex('c', one, 'soccer'), ex('d', one, 'soccer'), ex('e', one, 'soccer')];

  it('treats a missing sport (a session cached before the field existed) as none', () => {
    const old = { id: 'x', sets: [] } as unknown as SessionExerciseDTO;
    expect(sportOf(old)).toBeNull();
    expect(groupBySport([old, old]).map((s) => s.sport)).toEqual([null]);
  });

  it('keeps a workout without a finisher as one plain section', () => {
    const sections = groupBySport([ex('a', one), ex('b', one)]);
    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({ sport: null, afterFinisher: false });
    expect(sections[0]!.items.map((x) => x.index)).toEqual([0, 1]);
    expect(groupBySport([])).toEqual([]);
  });

  it('splits main workout and finisher without reordering, keeping the index in the whole workout', () => {
    const sections = groupBySport(ready);
    expect(sections.map((s) => [s.sport, s.items.map((x) => x.exercise.id), s.items.map((x) => x.index)])).toEqual([
      [null, ['a', 'b'], [0, 1]],
      ['soccer', ['c', 'd', 'e'], [2, 3, 4]],
    ]);
    expect(sections.map((s) => s.afterFinisher)).toEqual([false, false]);
  });

  it('shows exercises added after the finisher as their own section, not as part of it', () => {
    const sections = groupBySport([...ready, ex('f', one)]);
    expect(sections.map((s) => [s.sport, s.afterFinisher, s.items.length])).toEqual([
      [null, false, 2],
      ['soccer', false, 3],
      [null, true, 1],
    ]);
  });

  it('handles a workout that is only a finisher', () => {
    const sections = groupBySport([ex('c', one, 'running'), ex('d', one, 'running')]);
    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({ sport: 'running', afterFinisher: false });
  });

  it('reports the finisher sport and the position inside the finisher', () => {
    expect(finisherSport(ready)).toBe('soccer');
    expect(finisherSport([ex('a', one)])).toBeNull();
    expect(finisherProgress(ready, 1)).toBeNull();
    expect(finisherProgress(ready, 2)).toEqual({ sport: 'soccer', position: 1, total: 3 });
    expect(finisherProgress(ready, 4)).toEqual({ sport: 'soccer', position: 3, total: 3 });
    expect(finisherProgress(ready, 9)).toBeNull();
  });

  it('flags only the move that crosses into the finisher', () => {
    expect(enteredFinisher(ready, 1, 2)).toBe(true);
    expect(enteredFinisher(ready, 0, 4)).toBe(true);
    expect(enteredFinisher(ready, 2, 3)).toBe(false);
    expect(enteredFinisher(ready, 3, 1)).toBe(false);
    expect(enteredFinisher(ready, 0, 1)).toBe(false);
    expect(enteredFinisher(ready, 0, 99)).toBe(false);
  });

  it('does not change how the workout progresses: completion still walks the whole list in order', () => {
    const list = [ex('a', [{ done: false }]), ex('c', [{ done: false }], 'soccer'), ex('d', [{ done: false }], 'soccer')];
    expect(completionOutcome(list, 0, 'a-1').advanceTo).toBe(1);
    expect(completionOutcome(list, 1, 'c-1').advanceTo).toBe(2);
    expect(unfinishedExercises(list).map((l) => l.id)).toEqual(['a', 'c', 'd']);
  });
});
