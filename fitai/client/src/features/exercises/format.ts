/** Pure display helpers for exercise content and logged sets (no React, unit-tested). */
import type { Locale } from '@shared/constants';
import type { LocalizedList } from '@shared/content';
import type { ExerciseHistoryEntryDTO } from '@shared/types';
import { formatClock } from '@shared/training';

/** The list in the UI language, falling back to the other language when it is empty. */
export function localizedList(list: LocalizedList | null | undefined, locale: Locale): string[] {
  if (!list) return [];
  const own = locale === 'he' ? list.he : list.en;
  const other = locale === 'he' ? list.en : list.he;
  return own && own.length > 0 ? own : (other ?? []);
}

/** "a, b and c" in the UI language. */
export function formatList(items: string[], intlLocale: string): string {
  if (items.length <= 1) return items[0] ?? '';
  try {
    return new Intl.ListFormat(intlLocale, { style: 'long', type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

type LoggedSet = ExerciseHistoryEntryDTO['sets'][number];

export interface SetFormatter {
  /** Weight with unit in the user's units, e.g. "60 kg" / "132.3 lb". */
  formatWeight(kg: number): string;
  /** "8 reps" (pluralized). */
  reps(count: number): string;
  /** "8 × 60 kg". */
  repsTimesWeight(reps: number, weight: string): string;
  /** "45 s". */
  seconds(count: number): string;
}

/**
 * One logged set as short text: "8 × 60 kg", "12 reps", "45 s" or "1:30".
 * Returns null for a set without any recorded value.
 */
export function formatLoggedSet(set: LoggedSet, f: SetFormatter): string | null {
  if (set.durationSeconds != null && set.durationSeconds > 0 && !set.reps) {
    return set.durationSeconds < 60 ? f.seconds(set.durationSeconds) : formatClock(set.durationSeconds);
  }
  if (set.reps != null && set.reps > 0) {
    return set.weightKg != null && set.weightKg > 0 ? f.repsTimesWeight(set.reps, f.formatWeight(set.weightKg)) : f.reps(set.reps);
  }
  if (set.weightKg != null && set.weightKg > 0) return f.formatWeight(set.weightKg);
  return null;
}
