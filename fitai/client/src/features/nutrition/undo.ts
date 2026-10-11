import type { RestoreLogEntryInput } from '@shared/schemas/nutrition';
import type { FoodLogEntryDTO } from '@shared/types';

/** Everything needed to put a just-deleted entry back exactly as it was (amount, values, correction flag). */
export function entryToRestoreInput(e: FoodLogEntryDTO): RestoreLogEntryInput {
  return {
    date: e.date,
    mealType: e.mealType,
    foodId: e.foodId,
    foodName: e.foodName,
    grams: e.grams,
    servings: e.servings,
    kcal: e.kcal,
    proteinG: e.proteinG,
    carbsG: e.carbsG,
    fatG: e.fatG,
    fiberG: e.fiberG,
    isCorrected: e.isCorrected,
    source: e.source,
    note: e.note,
  };
}
