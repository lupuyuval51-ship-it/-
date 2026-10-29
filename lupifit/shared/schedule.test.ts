import { describe, expect, it } from 'vitest';
import { futureDatesOfWeek, recommendToday, type ScheduleInput } from './schedule';

// 2026-10-28 is a Wednesday (dow 3); week starts Sunday 2026-10-25.
const base: ScheduleInput = {
  today: '2026-10-28',
  preferredDays: [],
  days: [{ focus: 'upper_a' }, { focus: 'lower_a' }, { focus: 'upper_b' }, { focus: 'lower_b' }],
  nextIndex: 1,
  last: null,
  weekRemaining: 2,
  futureWeekDates: futureDatesOfWeek('2026-10-28', '2026-10-25'),
  trainedToday: false,
};

describe('futureDatesOfWeek', () => {
  it('lists the days after today up to the end of the week', () => {
    expect(futureDatesOfWeek('2026-10-28', '2026-10-25')).toEqual(['2026-10-29', '2026-10-30', '2026-10-31']);
    expect(futureDatesOfWeek('2026-10-31', '2026-10-25')).toEqual([]);
  });
});

describe('recommendToday', () => {
  it('follows the rotation when there is no preference and no overlap', () => {
    expect(recommendToday(base)).toMatchObject({ workoutIndex: 1, code: 'rotation' });
  });

  it('marks a preferred day as such and keeps the rotation', () => {
    expect(recommendToday({ ...base, preferredDays: [3, 5] })).toMatchObject({ workoutIndex: 1, code: 'preferred_day' });
  });

  it('suggests a scheduled rest day when the week stays reachable on preferred days', () => {
    // Wed is not preferred; Fri + Sat are left and 2 workouts remain.
    const r = recommendToday({ ...base, preferredDays: [5, 6] });
    expect(r).toMatchObject({ code: 'rest_day_scheduled', nextTrainingDate: '2026-10-30', workoutIndex: 1 });
  });

  it('recommends training today when the goal would otherwise slip', () => {
    const r = recommendToday({ ...base, preferredDays: [5], weekRemaining: 2 });
    expect(r.code).toBe('preferred_day');
  });

  it('never calls it a rest day after training today or when the goal is met', () => {
    expect(recommendToday({ ...base, preferredDays: [5, 6], trainedToday: true }).code).not.toBe('rest_day_scheduled');
    expect(recommendToday({ ...base, preferredDays: [5, 6], weekRemaining: 0 }).code).not.toBe('rest_day_scheduled');
  });

  it('skips a day that loads the same regions as yesterday', () => {
    // Yesterday upper; next in rotation is upper_b (index 2) → skip to lower_b (index 3).
    const r = recommendToday({ ...base, nextIndex: 2, last: { date: '2026-10-27', focus: 'upper_a' } });
    expect(r).toMatchObject({ workoutIndex: 3, code: 'avoid_back_to_back', skippedFocus: 'upper_b' });
  });

  it('keeps the rotation when yesterday was two days ago or nothing differs', () => {
    expect(recommendToday({ ...base, nextIndex: 2, last: { date: '2026-10-26', focus: 'upper_a' } }).workoutIndex).toBe(2);
    const allFull: ScheduleInput = { ...base, days: [{ focus: 'full_body_a' }, { focus: 'full_body_b' }], nextIndex: 0, last: { date: '2026-10-27', focus: 'full_body_b' } };
    expect(recommendToday(allFull)).toMatchObject({ workoutIndex: 0, code: 'rotation' });
  });

  it('handles an empty plan and wraps a stale index', () => {
    expect(recommendToday({ ...base, days: [] }).workoutIndex).toBe(0);
    expect(recommendToday({ ...base, nextIndex: 9 }).workoutIndex).toBe(1);
  });
});
