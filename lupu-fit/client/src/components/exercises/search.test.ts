import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../data/content.ts';
import { EMPTY_FILTERS, filterExercises, matchesQuery, normalize } from './search.ts';

const byId = (id: string) => EXERCISES.find((e) => e.id === id)!;
const ids = (q: Partial<typeof EMPTY_FILTERS>, profile = null as Parameters<typeof filterExercises>[2]) => filterExercises(EXERCISES, { ...EMPTY_FILTERS, ...q }, profile).map((e) => e.id);

describe('normalize', () => {
  it('lowercases, strips niqqud, folds final letters and drops geresh/hyphens', () => {
    expect(normalize('  Push-Up ')).toBe('push up');
    expect(normalize('שְׁכִיבוֹת')).toBe(normalize('שכיבות'));
    expect(normalize('ארצ׳ר')).toBe('ארצר');
    expect(normalize('סמיכה')).toBe(normalize('סמיכה'));
    expect(normalize('חזם')).toBe(normalize('חזמ'));
  });
});

describe('exercise search', () => {
  it('finds by Hebrew name, including final-letter and niqqud variants', () => {
    expect(matchesQuery(byId('push_up'), 'שכיבות סמיכה')).toBe(true);
    expect(matchesQuery(byId('push_up'), 'שְׁכִיבוֹת')).toBe(true);
    expect(ids({ q: 'סמיכה' })).toContain('push_up');
  });
  it('matches inflected Hebrew (singular/plural, one-letter prefix)', () => {
    expect(matchesQuery(byId('push_up'), 'שכיבה')).toBe(true); // singular of שכיבות
    expect(matchesQuery(byId('push_up'), 'בשכיבות')).toBe(true); // prefix ב
    expect(matchesQuery(byId('push_up'), 'מתח')).toBe(false);
  });
  it('matches English case-insensitively and requires every token', () => {
    expect(matchesQuery(byId('push_up'), 'PUSH')).toBe(true);
    expect(matchesQuery(byId('push_up'), 'push up')).toBe(true);
    expect(matchesQuery(byId('push_up'), 'push squat')).toBe(false);
  });
  it('matches primary-muscle labels in both languages', () => {
    expect(matchesQuery(byId('push_up'), 'חזה')).toBe(true);
    expect(matchesQuery(byId('push_up'), 'chest')).toBe(true);
  });
  it('filters by muscle, equipment, category and difficulty', () => {
    const chest = ids({ muscle: 'chest' });
    expect(chest).toContain('push_up');
    expect(chest.every((id) => byId(id).primary.includes('chest'))).toBe(true);
    expect(ids({ equipment: 'kettlebell' }).every((id) => byId(id).equipment.includes('kettlebell'))).toBe(true);
    expect(ids({ category: 'stretch' }).every((id) => byId(id).category === 'stretch')).toBe(true);
    expect(ids({ difficulty: 'advanced' }).every((id) => byId(id).difficulty === 'advanced')).toBe(true);
    expect(ids({ muscle: 'chest', difficulty: 'beginner', q: 'push' }).length).toBeGreaterThan(0);
  });
  it('injury-safe toggle hides contraindicated exercises (and only when on)', () => {
    const profile = { age: 30, injuries: ['wrist' as const], equipment: [] };
    expect(byId('push_up').contraindications).toContain('wrist');
    expect(ids({ q: 'push', safe: false }, profile)).toContain('push_up');
    const safe = ids({ safe: true }, profile);
    expect(safe).not.toContain('push_up');
    expect(safe.length).toBeGreaterThan(0);
    expect(safe.every((id) => !byId(id).contraindications.includes('wrist'))).toBe(true);
  });
  it('safe toggle also respects owned equipment', () => {
    const none = ids({ safe: true }, { age: 30, injuries: [], equipment: [] });
    expect(none.every((id) => byId(id).equipment.every((q) => q === 'none'))).toBe(true);
  });
});
