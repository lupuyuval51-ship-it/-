/**
 * Local draft of one workout day while it is being edited. Pure functions only, so the
 * editing rules (reps-or-time, rep ranges, ordering, replacements) are unit-tested.
 * Weights are kept in kg; the editor converts for display.
 */
import { LIMITS } from '@shared/constants';
import { planExerciseInputSchema, updateWorkoutSchema } from '@shared/schemas/workouts';
import type { ExerciseSummaryDTO, PlanExerciseDTO, PlanWorkoutDTO, UpdateWorkoutInput } from '@shared/types';

export type TargetMode = 'reps' | 'time';

export interface DraftExercise {
  /** Stable client key (row id for saved rows). */
  key: string;
  /** Saved plan_exercises id (absent for new rows). */
  id?: string;
  exerciseId: string;
  exercise: ExerciseSummaryDTO;
  /** Exercise the saved row had before a replacement (for the "replaced" badge). */
  originalExerciseId?: string;
  mode: TargetMode;
  sets: number | null;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number | null;
  targetRpe: number | null;
  targetWeightKg: number | null;
  notes: string;
}

export interface DayDraft {
  name: string;
  focus: string;
  notes: string;
  exercises: DraftExercise[];
}

export type DraftField = 'sets' | 'repMin' | 'repMax' | 'targetSeconds' | 'restSeconds' | 'targetRpe' | 'targetWeightKg' | 'notes';

export interface DraftValidation {
  valid: boolean;
  name?: string;
  /** row key → field → error code (i18n `errors.fields.<code>`). */
  rows: Record<string, Partial<Record<DraftField, string>>>;
}

let counter = 0;
const newKey = () => `new-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function draftExerciseFrom(x: PlanExerciseDTO): DraftExercise {
  return {
    key: x.id,
    id: x.id,
    exerciseId: x.exerciseId,
    exercise: x.exercise,
    mode: x.targetSeconds != null && x.repMin == null ? 'time' : 'reps',
    sets: x.sets,
    repMin: x.repMin,
    repMax: x.repMax,
    targetSeconds: x.targetSeconds,
    restSeconds: x.restSeconds,
    targetRpe: x.targetRpe,
    targetWeightKg: x.targetWeightKg,
    notes: x.notes,
  };
}

export function draftFromWorkout(w: PlanWorkoutDTO): DayDraft {
  return { name: w.name, focus: w.focus, notes: w.notes, exercises: w.exercises.map(draftExerciseFrom) };
}

/** Sensible starting prescription for an exercise added from the library. */
export function newDraftExercise(e: ExerciseSummaryDTO): DraftExercise {
  const timed = e.trackingType === 'time';
  return {
    key: newKey(),
    exerciseId: e.id,
    exercise: e,
    mode: timed ? 'time' : 'reps',
    sets: 3,
    repMin: timed ? null : 8,
    repMax: timed ? null : 12,
    targetSeconds: timed ? 30 : null,
    restSeconds: timed ? 60 : 90,
    targetRpe: null,
    targetWeightKg: null,
    notes: '',
  };
}

/** Swaps the exercise of a row, keeping its identity and (where compatible) its prescription. */
export function replaceDraftExercise(row: DraftExercise, e: ExerciseSummaryDTO): DraftExercise {
  const timed = e.trackingType === 'time';
  const next: DraftExercise = {
    ...row,
    exerciseId: e.id,
    exercise: e,
    originalExerciseId: row.originalExerciseId ?? (row.id ? row.exerciseId : undefined),
    // A different exercise needs its own load: never carry a weight over.
    targetWeightKg: null,
  };
  if (next.originalExerciseId === e.id) delete next.originalExerciseId;
  if (timed && row.mode !== 'time') return { ...next, mode: 'time', repMin: null, repMax: null, targetSeconds: 30 };
  if (!timed && row.mode === 'time') return { ...next, mode: 'reps', repMin: 8, repMax: 12, targetSeconds: null };
  return next;
}

export function setMode(row: DraftExercise, mode: TargetMode): DraftExercise {
  if (row.mode === mode) return row;
  return mode === 'time'
    ? { ...row, mode, targetSeconds: row.targetSeconds ?? 30 }
    : { ...row, mode, repMin: row.repMin ?? 8, repMax: row.repMax ?? 12 };
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item!);
  return copy;
}

/** Request body for PUT …/workouts/:id. The target mode decides which fields are sent. */
export function toUpdateInput(d: DayDraft): UpdateWorkoutInput {
  return {
    name: d.name,
    focus: d.focus,
    notes: d.notes,
    exercises: d.exercises.map((x) => ({
      ...(x.id ? { id: x.id } : {}),
      exerciseId: x.exerciseId,
      sets: x.sets ?? 0,
      repMin: x.mode === 'reps' ? x.repMin : null,
      repMax: x.mode === 'reps' ? x.repMax : null,
      targetSeconds: x.mode === 'time' ? x.targetSeconds : null,
      restSeconds: x.restSeconds ?? -1,
      targetRpe: x.targetRpe,
      targetWeightKg: x.targetWeightKg,
      notes: x.notes,
    })),
  };
}

const FIELD_OF: Record<string, DraftField> = {
  sets: 'sets',
  repMin: 'repMin',
  repMax: 'repMax',
  targetSeconds: 'targetSeconds',
  restSeconds: 'restSeconds',
  targetRpe: 'targetRpe',
  targetWeightKg: 'targetWeightKg',
  notes: 'notes',
};

function codeFor(issue: { code: string; message: string }): string {
  if (issue.code === 'custom') return issue.message;
  if (issue.code === 'too_small') return 'too_small';
  if (issue.code === 'too_big') return 'too_big';
  return 'invalid';
}

/** Client-side validation with the shared zod schema (same rules as the server). */
export function validateDraft(d: DayDraft): DraftValidation {
  const out: DraftValidation = { valid: true, rows: {} };
  const input = toUpdateInput(d);
  const day = updateWorkoutSchema.pick({ name: true }).safeParse({ name: input.name });
  if (!day.success) {
    out.valid = false;
    out.name = day.error.issues[0]?.message === 'required' ? 'required' : codeFor(day.error.issues[0]!);
  }
  input.exercises.forEach((x, i) => {
    const row = d.exercises[i]!;
    const errors: Partial<Record<DraftField, string>> = {};
    if (row.sets == null) errors.sets = 'required';
    if (row.restSeconds == null) errors.restSeconds = 'required';
    if (row.mode === 'reps' && row.repMin == null) errors.repMin = 'required';
    if (row.mode === 'time' && row.targetSeconds == null) errors.targetSeconds = 'required';
    const parsed = planExerciseInputSchema.safeParse(x);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = FIELD_OF[String(issue.path[0])];
        // "reps or time" is reported on the field the user is editing.
        const field = issue.message === 'reps_or_time_required' && row.mode === 'time' ? 'targetSeconds' : path;
        if (!field || errors[field]) continue;
        errors[field] = codeFor(issue);
      }
    }
    if (Object.keys(errors).length) {
      out.valid = false;
      out.rows[row.key] = errors;
    }
  });
  if (d.exercises.length > LIMITS.exercisesPerWorkoutMax) out.valid = false;
  return out;
}

export function isDraftDirty(draft: DayDraft, original: DayDraft): boolean {
  return JSON.stringify(toUpdateInput(draft)) !== JSON.stringify(toUpdateInput(original));
}

export const REST_PRESETS = [30, 45, 60, 90, 120, 150, 180, 240] as const;
