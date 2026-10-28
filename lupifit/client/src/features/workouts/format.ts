/** Pure display helpers for plans (prescriptions, rest, focus labels, generator notes). */
import { MUSCLE_TO_GROUP, type MuscleGroup } from '@shared/constants';
import type { GenerationNote, WorkoutPlanDTO } from '@shared/types';
import type { I18nValue } from '../../i18n';

type T = Pick<I18nValue, 't' | 'tx' | 'formatNumber'>;

type Fmt = Pick<I18nValue, 't' | 'formatNumber'>;

/** "45 s" or "1:30 min" (numbers via Intl). */
export function formatRest(seconds: number, i18n: Fmt): string {
  if (seconds < 60) return i18n.t('workouts.exercise.seconds', { seconds: i18n.formatNumber(seconds) });
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return i18n.t('workouts.exercise.minutesSeconds', { minutes: i18n.formatNumber(m), seconds: i18n.formatNumber(s, { minimumIntegerDigits: 2 }) });
}

/** "3 × 8–12", "5 × 5" or "3 × 45 s" (numbers via Intl). */
export function formatPrescription(x: { sets: number; repMin: number | null; repMax: number | null; targetSeconds: number | null }, i18n: Fmt): string {
  const n = (v: number) => i18n.formatNumber(v);
  if (x.targetSeconds != null && x.repMin == null) return i18n.t('workouts.exercise.time', { sets: n(x.sets), seconds: n(x.targetSeconds) });
  const min = x.repMin ?? x.repMax;
  const max = x.repMax ?? x.repMin;
  if (min == null || max == null) return n(x.sets);
  if (min === max) return i18n.t('workouts.exercise.repsSingle', { sets: n(x.sets), reps: n(min) });
  return i18n.t('workouts.exercise.repsRange', { sets: n(x.sets), min: n(min), max: n(max) });
}

/** Label for a stored focus: a known training-engine code, or the user's own text. */
export function focusLabel(focus: string, i18n: Pick<I18nValue, 'tx'>): string {
  if (!focus) return '';
  return i18n.tx(`workouts.focus.${focus}`, undefined, focus);
}

/** Generator note params that hold enum codes and must be shown as localized labels. */
const PARAM_ENUMS: Record<string, string> = {
  pattern: 'enums.movementPattern',
  group: 'enums.muscleGroup',
  area: 'enums.injury',
  split: 'enums.splitType',
};

/** Localized text of a generator note (unknown codes are skipped by returning null). */
export function noteText(note: GenerationNote, i18n: T): string | null {
  const params: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(note.params ?? {})) {
    const group = PARAM_ENUMS[k];
    params[k] = group && typeof v === 'string' ? i18n.tx(`${group}.${v}`, undefined, v) : typeof v === 'number' ? i18n.formatNumber(v) : v;
  }
  const text = i18n.tx(`workouts.notes.${note.code}`, params, '');
  return text || null;
}

/** Weekly sets per muscle group from the plan as it currently is (edits included). */
export function weeklySets(plan: Pick<WorkoutPlanDTO, 'workouts'>): Record<MuscleGroup, number> {
  const out: Record<MuscleGroup, number> = { chest: 0, back: 0, shoulders: 0, arms: 0, core: 0, legs: 0 };
  for (const w of plan.workouts) {
    for (const x of w.exercises) {
      if (x.exercise.movementPattern === 'conditioning' || x.exercise.movementPattern === 'mobility') continue;
      const groups = new Set(x.exercise.primaryMuscles.map((m) => MUSCLE_TO_GROUP[m]));
      for (const g of groups) out[g] += x.sets;
    }
  }
  return out;
}

/** Index of the next workout in the plan rotation (safe for any length). */
export function nextWorkoutIndex(plan: Pick<WorkoutPlanDTO, 'workouts' | 'nextWorkoutIndex'>): number {
  const n = plan.workouts.length;
  return n ? ((plan.nextWorkoutIndex % n) + n) % n : 0;
}

/** Base of a training-focus code ("push_a" → "push"); "" for custom text. */
export function focusBase(focus: string): string {
  const m = /^(full_body|upper|lower|push|pull|legs)(_[abc])?$/.exec(focus);
  return m?.[1] ?? '';
}

/** Weekly-volume math for a single day. */
export function dayMuscleSets(workout: WorkoutPlanDTO['workouts'][number]): Record<MuscleGroup, number> {
  return weeklySets({ workouts: [workout] });
}
