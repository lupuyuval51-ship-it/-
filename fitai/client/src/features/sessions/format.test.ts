import { describe, expect, it } from 'vitest';
import type { SessionExerciseDTO, SessionHistoryItemDTO, SessionSetDTO } from '@shared/types';
import { translate } from '../../i18n';
import { groupByWeek } from '../../pages/session/SessionHistoryPage';
import { setDefaults } from './ExerciseCard';
import { formatDuration, formatSetValues, suggestionParams } from './format';

const i18n = {
  locale: 'en' as const,
  t: (k: string, p?: Record<string, string | number>) => translate('en', k, p) ?? k,
  formatNumber: (n: number) => String(n),
} as unknown as Parameters<typeof formatDuration>[1];
const kg = (v: number | null | undefined) => (v == null ? '—' : `${v} kg`);

const set = (extra: Partial<SessionSetDTO>): SessionSetDTO => ({
  id: crypto.randomUUID(),
  setNumber: 1,
  targetReps: null,
  targetWeightKg: null,
  targetSeconds: null,
  reps: null,
  weightKg: null,
  durationSeconds: null,
  rpe: null,
  completed: false,
  completedAt: null,
  ...extra,
});

describe('session formatting', () => {
  it('formats sets per tracking type and durations', () => {
    expect(formatSetValues({ reps: 8, weightKg: 60, durationSeconds: null }, 'weight_reps', i18n, kg)).toBe('8 × 60 kg');
    expect(formatSetValues({ reps: 12, weightKg: null, durationSeconds: null }, 'reps', i18n, kg)).toBe('12 reps');
    expect(formatSetValues({ reps: 10, weightKg: 5, durationSeconds: null }, 'reps', i18n, kg)).toBe('10 × +5 kg');
    expect(formatSetValues({ reps: null, weightKg: null, durationSeconds: 45 }, 'time', i18n, kg)).toBe('45 s');
    expect(formatSetValues({ reps: null, weightKg: null, durationSeconds: 90 }, 'time', i18n, kg)).toBe('1:30');
    expect(formatDuration(52 * 60 + 10, i18n)).toBe('52 min');
    expect(formatDuration(65 * 60, i18n)).toBe('1 h 05 min');
  });

  it('converts suggestion params to display units', () => {
    const p = suggestionParams({ exerciseId: 'x', action: 'increase_weight', targetWeightKg: 62.5, repMin: 8, repMax: 10, targetSeconds: null, reasonCode: 'hit_top_of_range', params: { fromKg: 60, toKg: 62.5 } }, i18n, kg);
    expect(p).toEqual({ from: '60 kg', to: '62.5 kg' });
    expect(translate('en', 'session.progression.reasons.hit_top_of_range', p)).toContain('from 60 kg to 62.5 kg');
    const harder = suggestionParams({ exerciseId: 'x', action: 'try_harder_variation', targetWeightKg: null, repMin: 8, repMax: 15, targetSeconds: null, reasonCode: 'mastered_try_harder', params: { exerciseId: 'decline_push_up', nameEn: 'Decline Push-Up', nameHe: 'ש' } }, i18n, kg);
    expect(harder.name).toBe('Decline Push-Up');
  });

  it('carries weight from the set above and uses targets for reps', () => {
    const ex = {
      sets: [set({ weightKg: 62.5, reps: 8, targetReps: 10 }), set({ targetReps: 10 }), set({ targetReps: 10, targetWeightKg: 50 })],
      previous: { sessionId: 'p', date: '2026-10-01', sets: [{ setNumber: 1, reps: 9, weightKg: 55, durationSeconds: null }] },
    } as unknown as SessionExerciseDTO;
    expect(setDefaults(ex).map((d) => [d.weightKg, d.reps])).toEqual([
      [55, 10],
      [62.5, 10],
      [62.5, 10],
    ]);
    const fresh = { sets: [set({}), set({})], previous: { sessionId: 'p', date: 'x', sets: [{ setNumber: 1, reps: 9, weightKg: 55, durationSeconds: null }] } } as unknown as SessionExerciseDTO;
    expect(setDefaults(fresh).map((d) => [d.weightKg, d.reps])).toEqual([
      [55, 9],
      [55, null],
    ]);
  });

  it('groups history by week (Sunday or Monday start)', () => {
    const item = (startedAt: string, vol: number) => ({ id: startedAt, startedAt, totalVolumeKg: vol }) as SessionHistoryItemDTO;
    const items = [item('2026-10-08T10:00:00Z', 100), item('2026-10-05T10:00:00Z', 50), item('2026-10-04T10:00:00Z', 20)];
    expect(groupByWeek(items, 1, 'UTC').map((g) => [g.weekStart, g.items.length, g.volumeKg])).toEqual([
      ['2026-10-05', 2, 150],
      ['2026-09-28', 1, 20],
    ]);
    expect(groupByWeek(items, 0, 'UTC').map((g) => [g.weekStart, g.items.length])).toEqual([['2026-10-04', 3]]);
  });
});
