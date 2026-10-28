/**
 * Unit conversions for profile forms. Everything is stored metric (cm, kg); imperial users
 * see and type feet/inches and pounds.
 */
import { kgToLb, lbToKg } from '@shared/training';

export const CM_PER_INCH = 2.54;

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Whole feet and inches (rounded to the nearest inch, carrying 12″ into the next foot). */
export function cmToFeetInches(cm: number): { ft: number; in: number } {
  const totalIn = Math.round(cm / CM_PER_INCH);
  return { ft: Math.floor(totalIn / 12), in: totalIn % 12 };
}

/** Centimetres (0.1 cm precision) for a feet + inches answer; null when feet is missing. */
export function feetInchesToCm(ft: number | null, inches: number | null): number | null {
  if (ft == null) return null;
  return round1((ft * 12 + (inches ?? 0)) * CM_PER_INCH);
}

/** Display value of a stored kg weight. */
export const kgToDisplay = (kg: number | null | undefined, imperial: boolean): number | null =>
  kg == null ? null : imperial ? kgToLb(kg) : round1(kg);

/** Stored kg for a typed weight (kept unrounded while editing; payloads round to 0.1 kg). */
export const displayToKg = (value: number | null | undefined, imperial: boolean): number | null =>
  value == null || Number.isNaN(value) ? null : imperial ? lbToKg(value) : value;

/** Formats a height for summaries: `180 cm` or `5′11″`. */
export function formatHeight(cm: number | null | undefined, imperial: boolean, cmUnit: string): string {
  if (cm == null) return '—';
  if (!imperial) return `${round1(cm)} ${cmUnit}`;
  const { ft, in: inches } = cmToFeetInches(cm);
  return `${ft}′${inches}″`;
}
