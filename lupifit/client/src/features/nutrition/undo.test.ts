import { describe, expect, it } from 'vitest';
import { restoreLogEntrySchema } from '@shared/schemas/nutrition';
import type { FoodLogEntryDTO } from '@shared/types';
import { defaultCopyTarget } from './CopyMealModal';
import { entryToRestoreInput } from './undo';

const entry: FoodLogEntryDTO = {
  id: 'e1',
  date: '2025-03-10',
  mealType: 'lunch',
  foodId: '11111111-1111-4111-8111-111111111111',
  foodName: { en: 'Chicken', he: 'עוף' },
  grams: 150,
  servings: 1.25,
  kcal: 226.5,
  proteinG: 45.8,
  carbsG: 0,
  fatG: 4.8,
  fiberG: 0,
  isCorrected: true,
  source: 'manual',
  note: '',
  createdAt: '2025-03-10T10:00:00.000Z',
  foodRef: null,
};

describe('entryToRestoreInput', () => {
  it('keeps the exact amount, values and correction flag, and is accepted by the server schema', () => {
    const input = entryToRestoreInput(entry);
    expect(input).toMatchObject({ grams: 150, servings: 1.25, kcal: 226.5, isCorrected: true, mealType: 'lunch', date: '2025-03-10' });
    expect(restoreLogEntrySchema.safeParse(input).success).toBe(true);
  });

  it('handles quick-add entries (no food, no amount)', () => {
    const input = entryToRestoreInput({ ...entry, foodId: null, grams: null, servings: null, source: 'quick_add', isCorrected: false });
    expect(restoreLogEntrySchema.safeParse(input).success).toBe(true);
  });
});

describe('defaultCopyTarget', () => {
  it('suggests the next day', () => {
    expect(defaultCopyTarget('2025-03-10', '2025-03-10')).toBe('2025-03-11');
  });

  it('falls back to the previous day when the next is beyond the allowed range', () => {
    expect(defaultCopyTarget('2025-03-11', '2025-03-10')).toBe('2025-03-10');
  });
});
