/**
 * Pure portion math for live previews. The server recomputes everything from the stored
 * food when logging; these helpers only mirror that math so the UI can preview it.
 */
import { LIMITS } from '@shared/constants';
import { addDays, diffDays } from '@shared/dates';
import { round1, scaleNutrients, sumMacros, type Macros, type Per100g } from '@shared/nutrition';

export type AmountMode = 'grams' | 'servings';

export const SERVINGS_MAX = 100;
export const GRAMS_MAX = LIMITS.foodGramsMax;

/** Grams for an amount in grams or servings; null when the amount is missing or not positive. */
export function gramsFor(mode: AmountMode, amount: number | null | undefined, servingGrams: number): number | null {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;
  return round1(mode === 'grams' ? amount : amount * servingGrams);
}

/** Validation code for an amount (`errors.fields.<code>`), or null when valid. */
export function amountError(mode: AmountMode, amount: number | null | undefined, servingGrams: number): string | null {
  if (amount == null || !Number.isFinite(amount)) return 'required';
  if (amount <= 0) return 'too_small';
  if (mode === 'servings' && amount > SERVINGS_MAX) return 'too_big';
  const grams = gramsFor(mode, amount, servingGrams);
  if (grams == null || grams > GRAMS_MAX) return 'too_big';
  return null;
}

/** Nutrients for an amount of a food (zero macros when the amount is invalid). */
export function previewNutrients(per100g: Per100g, mode: AmountMode, amount: number | null | undefined, servingGrams: number): Macros {
  const grams = gramsFor(mode, amount, servingGrams);
  return grams == null ? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 } : scaleNutrients(per100g, grams);
}

/** Converts the current amount when the user switches between grams and servings. */
export function convertAmount(from: AmountMode, to: AmountMode, amount: number | null, servingGrams: number): number | null {
  if (amount == null || from === to || servingGrams <= 0) return amount;
  return from === 'grams' ? Math.round((amount / servingGrams) * 100) / 100 : round1(amount * servingGrams);
}

/** Quick-pick amounts shown as chips in the portion dialog. */
export function quickAmounts(mode: AmountMode, servingGrams: number): number[] {
  if (mode === 'servings') return [0.5, 1, 1.5, 2];
  const base = [50, 100, 150, 200];
  const serving = round1(servingGrams);
  return Array.from(new Set([serving, ...base])).sort((a, b) => a - b).slice(0, 5);
}

/**
 * Re-scales a suggested meal that the server already scaled by `fromScale` to `toScale`
 * (grams and nutrients of every item, and the totals).
 */
export function rescaleMeal<T extends { grams: number; nutrients: Macros }>(items: T[], fromScale: number, toScale: number): { items: T[]; totals: Macros } {
  const f = fromScale > 0 ? toScale / fromScale : 1;
  const scaled = items.map((i) => ({
    ...i,
    grams: round1(i.grams * f),
    nutrients: {
      kcal: round1(i.nutrients.kcal * f),
      proteinG: round1(i.nutrients.proteinG * f),
      carbsG: round1(i.nutrients.carbsG * f),
      fatG: round1(i.nutrients.fatG * f),
      fiberG: round1(i.nutrients.fiberG * f),
    },
  }));
  return { items: scaled, totals: sumMacros(scaled.map((i) => i.nutrients)) };
}

/** Share (0..1+) of a target reached; 0 when there is no target. */
export const progressShare = (value: number, target: number | null | undefined) => (target && target > 0 ? value / target : 0);

/** Nutrients from an AI per-100 g estimate (no database match). */
export function estimateNutrients(per100g: { kcal: number; protein: number; carbs: number; fat: number }, grams: number): Macros {
  return scaleNutrients({ ...per100g, fiber: 0 }, grams);
}

/** Latest date the user may log for (planning tomorrow is allowed). */
export const maxLogDate = (today: string) => addDays(today, 1);

/** Clamps a requested date to the loggable range (falls back to today for invalid input). */
export function clampLogDate(date: string | null | undefined, today: string): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return today;
  return diffDays(date, maxLogDate(today)) > 0 ? maxLogDate(today) : date;
}
