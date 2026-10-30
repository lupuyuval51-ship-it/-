/** Pure helpers for the live workout (kept free of React so they are easy to test). */
import type { SportId } from '@shared/constants';
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

// ------------------------------------------------------------------ sport finisher

/**
 * Sport of the finisher an exercise belongs to, or null for an ordinary exercise. A session cached on the
 * device before the field existed has no `sport` at all, which counts as none.
 */
export function sportOf(exercise: Pick<SessionExerciseDTO, 'sport'>): SportId | null {
  return exercise.sport ?? null;
}

/** A run of neighbouring exercises that belong together: the main workout, or one sport finisher. */
export interface ExerciseSection {
  /** Sport of the finisher, or null for ordinary exercises. */
  sport: SportId | null;
  /** Ordinary exercises that come after a finisher (added during the workout), so they are not mistaken for it. */
  afterFinisher: boolean;
  /** The exercises with their index in the whole workout (the stepper works with that index). */
  items: { exercise: SessionExerciseDTO; index: number }[];
}

/**
 * Splits the workout into sections without reordering anything: neighbours with the same `sport` form one
 * section, so a ready workout gives "main workout" then "sport finisher". Exercises added later land at the
 * end and become a trailing ordinary section. A workout without a finisher is one section.
 */
export function groupBySport(exercises: SessionExerciseDTO[]): ExerciseSection[] {
  const sections: ExerciseSection[] = [];
  let seenFinisher = false;
  exercises.forEach((exercise, index) => {
    const sport = sportOf(exercise);
    const last = sections[sections.length - 1];
    if (last && last.sport === sport) {
      last.items.push({ exercise, index });
      return;
    }
    sections.push({ sport, afterFinisher: sport == null && seenFinisher, items: [{ exercise, index }] });
    if (sport != null) seenFinisher = true;
  });
  return sections;
}

/** Sport of the first finisher exercise, or null when the workout has none. */
export function finisherSport(exercises: Pick<SessionExerciseDTO, 'sport'>[]): SportId | null {
  for (const e of exercises) {
    const sport = sportOf(e);
    if (sport) return sport;
  }
  return null;
}

/** Where the exercise at `index` sits inside its finisher ("2 of 5"), or null when it is not a finisher exercise. */
export function finisherProgress(exercises: SessionExerciseDTO[], index: number): { sport: SportId; position: number; total: number } | null {
  const target = exercises[index];
  const sport = target ? sportOf(target) : null;
  if (!sport) return null;
  const section = groupBySport(exercises).find((s) => s.sport === sport && s.items.some((x) => x.index === index));
  if (!section) return null;
  return { sport, position: section.items.findIndex((x) => x.index === index) + 1, total: section.items.length };
}

/** True when moving from `from` to `to` crosses into a sport finisher (so the move is worth announcing). */
export function enteredFinisher(exercises: Pick<SessionExerciseDTO, 'sport'>[], from: number, to: number): boolean {
  const target = exercises[to];
  const sport = target ? sportOf(target) : null;
  if (!sport) return false;
  const before = exercises[from];
  return !before || sportOf(before) !== sport;
}

