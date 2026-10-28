/**
 * Plate loading for barbell lifts: which plates go on each side of the bar for a target weight.
 * Pure math in the display unit (kg or lb), so imperial users get lb plates and bars.
 */
export type PlateUnit = 'kg' | 'lb';

export const PLATE_SETS: Record<PlateUnit, readonly number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};

/** Common bar weights per unit (first = default). */
export const BAR_WEIGHTS: Record<PlateUnit, readonly number[]> = {
  kg: [20, 15, 10],
  lb: [45, 35, 25],
};

export interface PlateLoad {
  /** Plates for ONE side, heaviest first. */
  perSide: { plate: number; count: number }[];
  /** Total bar weight that this loading really gives. */
  total: number;
  /** Target minus total when the plates cannot make the exact weight (0 when exact). */
  remainder: number;
  /** The target is lighter than the empty bar. */
  belowBar: boolean;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Greedy loading with the heaviest plates first (what lifters actually do). When the exact
 * weight is not reachable with the available plates, it loads the closest weight below it and
 * reports the remainder instead of silently rounding up.
 */
export function platesFor(target: number, unit: PlateUnit, barWeight: number = BAR_WEIGHTS[unit][0]!, plates: readonly number[] = PLATE_SETS[unit]): PlateLoad {
  if (!Number.isFinite(target) || target < barWeight) {
    return { perSide: [], total: round(barWeight), remainder: 0, belowBar: Number.isFinite(target) && target < barWeight };
  }
  let left = round((target - barWeight) / 2);
  const perSide: PlateLoad['perSide'] = [];
  for (const plate of [...plates].sort((a, b) => b - a)) {
    const count = Math.floor(round(left / plate));
    if (count > 0) {
      perSide.push({ plate, count });
      left = round(left - count * plate);
    }
  }
  const total = round(barWeight + 2 * perSide.reduce((s, p) => s + p.plate * p.count, 0));
  return { perSide, total, remainder: round(target - total), belowBar: false };
}
