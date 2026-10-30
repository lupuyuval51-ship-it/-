import { subtractMacros, sumMacros } from '@shared/nutrition';
import type { DayNutritionDTO, FoodLogEntryDTO } from '@shared/types';
import type { PendingFood } from './outbox';

export const PENDING_PREFIX = 'pending:';
export const isPendingEntry = (e: Pick<FoodLogEntryDTO, 'id'>) => e.id.startsWith(PENDING_PREFIX);

/**
 * Shows food-log entries that are still waiting in the offline outbox as part of the day, so what the user
 * logged without a connection is on screen (and in the totals) immediately. They are marked by their id and
 * disappear from the outbox, and reappear as real entries, once the server has them.
 */
export function mergePendingIntoDay(day: DayNutritionDTO, pending: PendingFood[]): DayNutritionDTO {
  const mine = pending.filter((p) => p.date === day.date);
  if (mine.length === 0) return day;
  const meals = { ...day.meals };
  for (const p of mine) {
    const macros = { kcal: p.preview.kcal, proteinG: p.preview.proteinG, carbsG: p.preview.carbsG, fatG: p.preview.fatG, fiberG: p.preview.fiberG };
    const entry: FoodLogEntryDTO = {
      id: `${PENDING_PREFIX}${p.id}`,
      date: p.date,
      mealType: p.mealType,
      foodId: null,
      foodName: p.preview.name,
      grams: p.preview.grams,
      servings: p.preview.servings,
      ...macros,
      isCorrected: false,
      source: 'manual',
      note: '',
      createdAt: new Date().toISOString(),
    };
    const group = meals[p.mealType];
    meals[p.mealType] = { entries: [...group.entries, entry], totals: sumMacros([group.totals, macros]) };
  }
  const added = sumMacros(mine.map((p) => ({ kcal: p.preview.kcal, proteinG: p.preview.proteinG, carbsG: p.preview.carbsG, fatG: p.preview.fatG, fiberG: p.preview.fiberG })));
  return {
    ...day,
    meals,
    totals: sumMacros([day.totals, added]),
    remaining: day.remaining ? subtractMacros(day.remaining, added) : null,
  };
}
