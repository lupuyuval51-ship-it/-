import { describe, expect, it } from 'vitest';
import type { ExerciseSummaryDTO, PlanWorkoutDTO } from '@shared/types';
import {
  draftFromWorkout,
  isDraftDirty,
  moveItem,
  newDraftExercise,
  replaceDraftExercise,
  setMode,
  toUpdateInput,
  validateDraft,
} from './draft';

const summary = (id: string, trackingType: ExerciseSummaryDTO['trackingType'] = 'weight_reps'): ExerciseSummaryDTO => ({
  id,
  name: { en: id, he: id },
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: [],
  category: 'free_weight',
  movementPattern: 'horizontal_push',
  difficulty: 'beginner',
  trackingType,
  unilateral: false,
  hasMedia: false,
});

const workout: PlanWorkoutDTO = {
  id: 'w1',
  position: 0,
  name: 'Upper body A',
  focus: 'upper_a',
  notes: '',
  estimatedMinutes: 50,
  exercises: [
    { id: 'a', exerciseId: 'bench', exercise: summary('bench'), position: 0, sets: 4, repMin: 6, repMax: 10, targetSeconds: null, restSeconds: 120, targetRpe: 8, targetWeightKg: 60, notes: '' },
    { id: 'b', exerciseId: 'plank', exercise: summary('plank', 'time'), position: 1, sets: 3, repMin: null, repMax: null, targetSeconds: 40, restSeconds: 45, targetRpe: null, targetWeightKg: null, notes: 'Brace' },
  ],
};

describe('workout day draft', () => {
  it('round-trips a saved day into the update payload', () => {
    const d = draftFromWorkout(workout);
    expect(d.exercises.map((x) => x.mode)).toEqual(['reps', 'time']);
    expect(toUpdateInput(d)).toEqual({
      name: 'Upper body A',
      focus: 'upper_a',
      notes: '',
      exercises: [
        { id: 'a', exerciseId: 'bench', sets: 4, repMin: 6, repMax: 10, targetSeconds: null, restSeconds: 120, targetRpe: 8, targetWeightKg: 60, notes: '' },
        { id: 'b', exerciseId: 'plank', sets: 3, repMin: null, repMax: null, targetSeconds: 40, restSeconds: 45, targetRpe: null, targetWeightKg: null, notes: 'Brace' },
      ],
    });
    expect(isDraftDirty(d, draftFromWorkout(workout))).toBe(false);
    expect(validateDraft(d).valid).toBe(true);
  });

  it('detects edits, moves rows and keeps ids for replacements', () => {
    const original = draftFromWorkout(workout);
    const moved = { ...original, exercises: moveItem(original.exercises, 1, 0) };
    expect(moved.exercises.map((x) => x.id)).toEqual(['b', 'a']);
    expect(isDraftDirty(moved, original)).toBe(true);
    expect(moveItem(original.exercises, 0, -1)).toBe(original.exercises);

    const replaced = replaceDraftExercise(original.exercises[0]!, summary('dumbbell_press'));
    expect(replaced).toMatchObject({ id: 'a', exerciseId: 'dumbbell_press', originalExerciseId: 'bench', targetWeightKg: null, repMin: 6, repMax: 10 });
    // Replacing back with the original exercise clears the "replaced" marker.
    expect(replaceDraftExercise(replaced, summary('bench')).originalExerciseId).toBeUndefined();
    // Switching between rep- and time-tracked exercises switches the target.
    const timed = replaceDraftExercise(original.exercises[0]!, summary('wall_sit', 'time'));
    expect(timed).toMatchObject({ mode: 'time', targetSeconds: 30, repMin: null });
    expect(replaceDraftExercise(original.exercises[1]!, summary('crunch', 'reps'))).toMatchObject({ mode: 'reps', repMin: 8, repMax: 12, targetSeconds: null });
  });

  it('creates new rows without ids and with tracking-appropriate defaults', () => {
    const reps = newDraftExercise(summary('curl'));
    expect(reps.id).toBeUndefined();
    expect(reps).toMatchObject({ mode: 'reps', sets: 3, repMin: 8, repMax: 12, restSeconds: 90 });
    const timed = newDraftExercise(summary('plank', 'time'));
    expect(timed).toMatchObject({ mode: 'time', targetSeconds: 30, repMin: null });
    expect(reps.key).not.toBe(timed.key);
    expect(toUpdateInput({ name: 'x', focus: '', notes: '', exercises: [reps] }).exercises[0]).not.toHaveProperty('id');
  });

  it('validates rep ranges, reps-or-time, bounds and the day name like the server', () => {
    const d = draftFromWorkout(workout);
    const [a, b] = d.exercises;
    const bad = validateDraft({
      ...d,
      name: '  ',
      exercises: [
        { ...a!, repMin: 12, repMax: 8 },
        { ...b!, targetSeconds: null },
        { ...a!, key: 'c', sets: null, restSeconds: 900 },
        { ...a!, key: 'd', targetRpe: 11 },
      ],
    });
    expect(bad.valid).toBe(false);
    expect(bad.name).toBe('required');
    expect(bad.rows.a).toEqual({ repMax: 'rep_range_invalid' });
    expect(bad.rows.b).toEqual({ targetSeconds: 'required' });
    expect(bad.rows.c).toMatchObject({ sets: 'required', restSeconds: 'too_big' });
    expect(bad.rows.d).toEqual({ targetRpe: 'too_big' });
    const timeMode = setMode(a!, 'time');
    expect(timeMode).toMatchObject({ mode: 'time', targetSeconds: 30 });
    expect(toUpdateInput({ ...d, exercises: [timeMode] }).exercises[0]).toMatchObject({ repMin: null, repMax: null, targetSeconds: 30 });
    expect(setMode(timeMode, 'reps')).toMatchObject({ mode: 'reps', repMin: 6, repMax: 10 });
  });
});
