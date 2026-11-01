import { describe, expect, it } from 'vitest';
import { isPlanDayDone, type WeekSession } from './plansApi.ts';

const s = (p: Partial<WeekSession>): WeekSession => ({ id: 'x', name: 'n', localDate: '2026-11-02', finishedAt: 'x', ...p });
describe('isPlanDayDone', () => {
  it('matches by plan id and day index, not by name', () => {
    const list = [s({ name: 'renamed', source: 'plan', sourceId: 'p1:1' })];
    expect(isPlanDayDone(list, '2026-11-01', 'p1', 1, 'Plan: Push')).toBe(true);
    expect(isPlanDayDone(list, '2026-11-01', 'p1', 0, 'renamed')).toBe(false);
    expect(isPlanDayDone(list, '2026-11-01', 'p2', 1, 'renamed')).toBe(false);
  });
  it('falls back to the generated name for sessions without a sourceId, and ignores earlier weeks', () => {
    expect(isPlanDayDone([s({ name: 'Plan: Push' })], '2026-11-01', 'p1', 0, 'Plan: Push')).toBe(true);
    expect(isPlanDayDone([s({ name: 'Plan: Push', localDate: '2026-10-20' })], '2026-11-01', 'p1', 0, 'Plan: Push')).toBe(false);
  });
});
