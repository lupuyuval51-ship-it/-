import type { TFn } from '../../i18n/index.tsx';
import { fmt } from '../../i18n/index.tsx';

export interface SetValues { reps?: number | null; weightKg?: number | null; durationSec?: number | null; rpe?: number | null }

/** Plain-text summary of a set, e.g. "60 kg × 8" or "30 sec" (used for outbox labels). */
export function setSummary(v: SetValues, t: TFn): string {
  const timed = (v.reps === null || v.reps === undefined) && v.durationSec !== null && v.durationSec !== undefined;
  if (timed) return `${fmt.num(v.durationSec ?? 0)} ${t('unit.sec')}`;
  const w = v.weightKg ? `${fmt.num(v.weightKg, 2)} ${t('unit.kg')} × ` : '';
  return `${w}${fmt.num(v.reps ?? 0)}`;
}
