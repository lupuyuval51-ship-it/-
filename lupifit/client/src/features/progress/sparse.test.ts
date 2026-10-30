import { describe, expect, it } from 'vitest';
import { sparseGuidance } from './sparse';

const base = {
  period: 30 as const,
  workouts: { count: 5 },
  nutrition: { daysLogged: 10 },
  bodyWeight: { entries: [{ date: '2025-01-01', weightKg: 80 }, { date: '2025-01-08', weightKg: 79.5 }] },
};
const make = (patch: Record<string, unknown>) => sparseGuidance({ ...base, ...patch } as unknown as Parameters<typeof sparseGuidance>[0]);

describe('sparseGuidance', () => {
  it('has nothing to say when there is enough data', () => {
    expect(make({})).toEqual({ hints: [], longerPeriod: null });
  });

  it('flags an empty period and suggests a longer one', () => {
    const g = make({ workouts: { count: 0 }, period: 7 });
    expect(g.hints).toContain('no_workouts');
    expect(g.longerPeriod).toBe(30);
  });

  it('does not suggest a longer period beyond the longest', () => {
    expect(make({ workouts: { count: 0 }, period: 90 }).longerPeriod).toBeNull();
  });

  it('warns that one or two workouts are too few for comparisons', () => {
    expect(make({ workouts: { count: 2 } }).hints).toEqual(['few_workouts']);
  });

  it('flags missing meals and weigh-ins', () => {
    const g = make({ nutrition: { daysLogged: 0 }, bodyWeight: { entries: [] } });
    expect(g.hints).toEqual(['no_meals', 'no_weigh_ins']);
    expect(make({ bodyWeight: { entries: [{ date: '2025-01-01', weightKg: 80 }] } }).hints).toEqual(['one_weigh_in']);
  });
});
