import { describe, expect, it } from 'vitest';
import { chooseSplit } from './split';

describe('chooseSplit', () => {
  it('uses push/pull/legs for 3 days only for experienced muscle-gain or strength goals', () => {
    expect(chooseSplit(3, 'intermediate', 'muscle_gain').focuses).toEqual(['push', 'pull', 'legs']);
    expect(chooseSplit(3, 'beginner', 'muscle_gain').splitType).toBe('full_body');
    expect(chooseSplit(3, 'advanced', 'fat_loss').splitType).toBe('full_body');
  });

  it('clamps the number of days to 1–7 and caps training days at six', () => {
    expect(chooseSplit(0, 'beginner', 'general_fitness').focuses).toHaveLength(1);
    expect(chooseSplit(7, 'advanced', 'strength').focuses).toHaveLength(6);
    expect(chooseSplit(4, 'beginner', 'general_fitness').splitType).toBe('upper_lower');
  });
});
