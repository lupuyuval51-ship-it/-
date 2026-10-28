import { describe, expect, it } from 'vitest';
import { formatList, formatLoggedSet, localizedList, type SetFormatter } from './format';

const f: SetFormatter = {
  formatWeight: (kg) => `${kg} kg`,
  reps: (n) => `${n} reps`,
  repsTimesWeight: (reps, weight) => `${reps} × ${weight}`,
  seconds: (n) => `${n} s`,
};

describe('formatLoggedSet', () => {
  it('formats weight × reps, reps only, holds and empty sets', () => {
    expect(formatLoggedSet({ reps: 8, weightKg: 60, durationSeconds: null }, f)).toBe('8 × 60 kg');
    expect(formatLoggedSet({ reps: 12, weightKg: null, durationSeconds: null }, f)).toBe('12 reps');
    expect(formatLoggedSet({ reps: 12, weightKg: 0, durationSeconds: null }, f)).toBe('12 reps');
    expect(formatLoggedSet({ reps: null, weightKg: null, durationSeconds: 45 }, f)).toBe('45 s');
    expect(formatLoggedSet({ reps: null, weightKg: null, durationSeconds: 90 }, f)).toBe('1:30');
    expect(formatLoggedSet({ reps: null, weightKg: 20, durationSeconds: null }, f)).toBe('20 kg');
    expect(formatLoggedSet({ reps: null, weightKg: null, durationSeconds: null }, f)).toBeNull();
  });
});

describe('localizedList', () => {
  it('uses the UI language and falls back to the other one', () => {
    const list = { en: ['Stand tall'], he: ['עמדו זקוף'] };
    expect(localizedList(list, 'he')).toEqual(['עמדו זקוף']);
    expect(localizedList(list, 'en')).toEqual(['Stand tall']);
    expect(localizedList({ en: ['Only English'], he: [] }, 'he')).toEqual(['Only English']);
    expect(localizedList(null, 'en')).toEqual([]);
  });
});

describe('formatList', () => {
  it('joins with the language conjunction', () => {
    expect(formatList([], 'en-US')).toBe('');
    expect(formatList(['Knee'], 'en-US')).toBe('Knee');
    expect(formatList(['Knee', 'Hip', 'Ankle'], 'en-US')).toBe('Knee, Hip, and Ankle');
    expect(formatList(['ברך', 'ירך'], 'he-IL')).toBe('ברך וירך');
  });
});
