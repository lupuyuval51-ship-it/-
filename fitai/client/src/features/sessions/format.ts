/** Display helpers for sets, prescriptions, records and durations (unit- and locale-aware). */
import type { PrType, TrackingType } from '@shared/constants';
import { formatClock } from '@shared/training';
import type { PreviousPerformanceDTO, ProgressionSuggestionDTO, SessionExerciseDTO, SessionSetDTO } from '@shared/types';
import type { I18nValue } from '../../i18n';

type T = Pick<I18nValue, 't' | 'locale' | 'formatNumber'>;
type FormatWeight = (kg: number | null | undefined) => string;

/** "52 min" / "1 h 05 min" (rounded to whole minutes, at least 1 min once started). */
export function formatDuration(totalSeconds: number, i18n: T): string {
  const minutesTotal = Math.max(0, Math.round(totalSeconds / 60));
  if (minutesTotal < 60) return i18n.t('session.format.minutes', { minutes: totalSeconds > 0 ? Math.max(1, minutesTotal) : 0 });
  const hours = Math.floor(minutesTotal / 60);
  const minutes = String(minutesTotal % 60).padStart(2, '0');
  return i18n.t('session.format.hoursMinutes', { hours, minutes });
}

export function formatSeconds(seconds: number, i18n: T): string {
  return seconds >= 60 ? formatClock(seconds) : i18n.t('session.format.seconds', { seconds });
}

type SetValues = Pick<SessionSetDTO, 'reps' | 'weightKg' | 'durationSeconds'>;

/** One performed set: "8 × 60 kg", "12 reps", "12 × +10 kg", "0:45". */
export function formatSetValues(s: SetValues, tracking: TrackingType, i18n: T, formatWeight: FormatWeight): string {
  if (tracking === 'time') {
    const time = s.durationSeconds != null ? formatSeconds(s.durationSeconds, i18n) : '—';
    return s.weightKg ? i18n.t('session.format.timeWithWeight', { time, weight: formatWeight(s.weightKg) }) : time;
  }
  const reps = s.reps ?? 0;
  if (tracking === 'reps') {
    if (s.weightKg) return i18n.t('session.format.weightReps', { reps, weight: i18n.t('session.format.addedWeight', { weight: formatWeight(s.weightKg) }) });
    return i18n.t('session.format.repsOnly', { count: reps });
  }
  return s.weightKg ? i18n.t('session.format.weightReps', { reps, weight: formatWeight(s.weightKg) }) : i18n.t('session.format.repsOnly', { count: reps });
}

export function formatPrevious(prev: PreviousPerformanceDTO, tracking: TrackingType, i18n: T, formatWeight: FormatWeight): string {
  return prev.sets.map((s) => formatSetValues(s, tracking, i18n, formatWeight)).join(', ');
}

function repTarget(min: number | null, max: number | null, i18n: T): string | null {
  if (min != null && max != null && min !== max) return i18n.t('session.format.repRange', { min, max });
  const n = max ?? min;
  return n != null ? i18n.t('session.format.repsOnly', { count: n }) : null;
}

/** Target line of an exercise: "3 sets · 8–10 reps · 60 kg". */
export function formatPrescription(ex: SessionExerciseDTO, i18n: T, formatWeight: FormatWeight): string {
  const parts = [i18n.t('session.exercise.setsCount', { count: ex.sets.length })];
  if (ex.exercise.trackingType === 'time') {
    if (ex.targetSeconds != null) parts.push(formatSeconds(ex.targetSeconds, i18n));
  } else {
    const reps = repTarget(ex.repMin, ex.repMax, i18n);
    if (reps) parts.push(reps);
  }
  if (ex.targetWeightKg) parts.push(formatWeight(ex.targetWeightKg));
  if (ex.targetRpe != null) parts.push(i18n.t('session.exercise.targetRpe', { rpe: i18n.formatNumber(ex.targetRpe) }));
  return parts.join(' · ');
}

/** Short per-set target used as an input placeholder hint. */
export function formatSetTarget(s: SessionSetDTO, tracking: TrackingType, i18n: T, formatWeight: FormatWeight): string | null {
  if (tracking === 'time') return s.targetSeconds != null ? formatSeconds(s.targetSeconds, i18n) : null;
  if (s.targetReps == null) return null;
  return s.targetWeightKg ? i18n.t('session.format.weightReps', { reps: s.targetReps, weight: formatWeight(s.targetWeightKg) }) : i18n.t('session.format.repsOnly', { count: s.targetReps });
}

/** Interpolation params for `session.progression.reasons.*` (kg values → user units, localized names). */
export function suggestionParams(s: ProgressionSuggestionDTO, i18n: T, formatWeight: FormatWeight): Record<string, string | number> {
  const p = s.params ?? {};
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(p)) {
    if (k.endsWith('Kg') && typeof v === 'number') out[k.slice(0, -2)] = formatWeight(v);
    else if (k.endsWith('Seconds') && typeof v === 'number') out[k.slice(0, -7)] = formatSeconds(v, i18n);
    else out[k] = v;
  }
  if (typeof p.seconds === 'number') out.seconds = formatSeconds(p.seconds, i18n);
  if (p.nameEn || p.nameHe) out.name = String((i18n.locale === 'he' ? p.nameHe || p.nameEn : p.nameEn || p.nameHe) ?? '');
  return out;
}

export function formatRecordValue(type: PrType, value: number | null, i18n: T, formatWeight: FormatWeight): string {
  if (value == null) return '—';
  switch (type) {
    case 'max_reps':
      return i18n.t('session.format.repsOnly', { count: value });
    case 'max_duration':
      return formatSeconds(value, i18n);
    default:
      return formatWeight(value);
  }
}
