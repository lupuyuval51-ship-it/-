/** Pure helpers for the live workout (kept free of React so they are easy to test). */
import type { SessionExerciseDTO } from '@shared/types';

export function countSets(exercises: SessionExerciseDTO[]): { total: number; done: number } {
  return {
    total: exercises.reduce((n, e) => n + e.sets.length, 0),
    done: exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0),
  };
}

/** Total lifted volume (reps × weight) of completed sets, in kg. */
export function volumeKg(exercises: SessionExerciseDTO[]): number {
  let sum = 0;
  for (const e of exercises) {
    for (const s of e.sets) {
      if (s.completed && s.reps != null && s.weightKg != null) sum += s.reps * s.weightKg;
    }
  }
  return Math.round(sum * 10) / 10;
}

/** Exercises that still have sets not marked done (empty exercises are ignored). */
export function unfinishedExercises(exercises: SessionExerciseDTO[]): { id: string; exercise: SessionExerciseDTO; done: number; total: number }[] {
  return exercises
    .map((exercise) => ({ id: exercise.id, exercise, done: exercise.sets.filter((s) => s.completed).length, total: exercise.sets.length }))
    .filter((l) => l.total > 0 && l.done < l.total);
}

/** First exercise after `index` (then wrapping to earlier ones) that still has sets to do. */
export function nextOpenExercise(exercises: SessionExerciseDTO[], index: number, isDone: (e: SessionExerciseDTO) => boolean = (e) => e.sets.every((s) => s.completed)): number | null {
  const others = [...exercises.keys()].filter((i) => i !== index);
  const ordered = [...others.filter((i) => i > index), ...others.filter((i) => i < index)];
  return ordered.find((i) => exercises[i]!.sets.length > 0 && !isDone(exercises[i]!)) ?? null;
}

export interface CompletionOutcome {
  /** Whether logging this set completes its exercise. */
  exerciseDone: boolean;
  /** Whether it completes the whole workout. */
  workoutDone: boolean;
  /** Index of the exercise to jump to, if any (the next one that still has open sets). */
  advanceTo: number | null;
}

/**
 * What logging `setId` of the exercise at `index` leads to: whether to rest, and where to
 * go next. The next exercise is the first one after the current that still has open sets
 * (wrapping to earlier skipped ones), so a skipped exercise is never forgotten.
 */
export function completionOutcome(exercises: SessionExerciseDTO[], index: number, setId: string): CompletionOutcome {
  const doneAfter = (e: SessionExerciseDTO) => e.sets.every((s) => s.completed || s.id === setId);
  const current = exercises[index];
  const exerciseDone = !!current && current.sets.length > 0 && doneAfter(current);
  const workoutDone = exercises.every((e) => e.sets.length === 0 || doneAfter(e));
  let advanceTo: number | null = null;
  if (exerciseDone && !workoutDone) advanceTo = nextOpenExercise(exercises, index, doneAfter);
  return { exerciseDone, workoutDone, advanceTo };
}
