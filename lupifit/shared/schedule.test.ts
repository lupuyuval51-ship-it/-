import { describe, expect, it } from 'vitest';
import { addDays, dayOfWeek } from './dates';
import { advanceRotation, futureDatesOfWeek, recommendToday, type ScheduleInput } from './schedule';

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
/** 5-day split: full body loads every region, so it overlaps the leg day before it and the upper day after it. */
const FIVE_DAY = ['upper_a', 'lower_a', 'full_body', 'upper_b', 'lower_b'].map((focus) => ({ focus }));

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

  it('picks the stand-in that waited longest while the rotation day waits', () => {
    // Full body (index 2) is waiting; Upper B already stood in for it two days ago, Upper A last ran a week ago.
    const done = (focus: string, lastDoneAt: string | null) => ({ focus, lastDoneAt });
    const days = [done('upper_a', '2026-10-21T18:00:00.000Z'), done('lower_a', '2026-10-24T18:00:00.000Z'), done('full_body', '2026-10-17T18:00:00.000Z'), done('upper_b', '2026-10-26T18:00:00.000Z'), done('lower_b', '2026-10-27T18:00:00.000Z')];
    const waiting: ScheduleInput = { ...base, days, nextIndex: 2, last: { date: '2026-10-27', focus: 'lower_b' } };
    expect(recommendToday(waiting)).toMatchObject({ workoutIndex: 0, code: 'avoid_back_to_back', skippedFocus: 'full_body' });
    // Never done counts as longest ago; equal history keeps the rotation order after the waiting day.
    expect(recommendToday({ ...waiting, days: days.map((d, i) => (i === 3 ? done(d.focus, null) : d)) }).workoutIndex).toBe(3);
    expect(recommendToday({ ...waiting, days: FIVE_DAY }).workoutIndex).toBe(3);
  });
});

describe('advanceRotation', () => {
  it('moves past the rotation day once it is done, wrapping around', () => {
    expect(advanceRotation(1, 1, 4)).toBe(2);
    expect(advanceRotation(3, 3, 4)).toBe(0);
    expect(advanceRotation(9, 1, 4)).toBe(2); // stale index is wrapped first
  });

  it('keeps the rotation day next when a different day was done instead', () => {
    expect(advanceRotation(2, 3, 5)).toBe(2);
    expect(advanceRotation(2, 0, 5)).toBe(2);
    expect(advanceRotation(7, 3, 5)).toBe(2);
  });

  it('handles an empty plan', () => {
    expect(advanceRotation(3, 0, 0)).toBe(0);
  });
});

describe('rotation over several weeks (recommendToday + advanceRotation)', () => {
  /** Trains the suggested day on the given weekdays, starting on Sunday 2026-11-01; returns the focuses per week. */
  function simulate(plan: { focus: string }[], weekdays: number[], weeks: number): string[][] {
    const days: ScheduleInput['days'] = plan.map(({ focus }) => ({ focus, lastDoneAt: null }));
    let nextIndex = 0;
    let last: ScheduleInput['last'] = null;
    let date = '2026-11-01';
    const out: string[][] = [];
    for (let w = 0; w < weeks; w++) {
      const week: string[] = [];
      for (let i = 0; i < 7; i++, date = addDays(date, 1)) {
        if (!weekdays.includes(dayOfWeek(date))) continue;
        const { workoutIndex } = recommendToday({ ...base, today: date, days, nextIndex, last, futureWeekDates: [] });
        const day = days[workoutIndex]!;
        week.push(day.focus);
        nextIndex = advanceRotation(nextIndex, workoutIndex, days.length);
        day.lastDoneAt = `${date}T18:00:00.000Z`;
        last = { date, focus: day.focus };
      }
      out.push(week);
    }
    return out;
  }
  const count = (weeks: string[][], focus: string) => weeks.flat().filter((f) => f === focus).length;

  it('a day swapped in to avoid back-to-back muscles does not skip the rotation day for good', () => {
    // Sunday–Thursday: full body would follow the leg day, so other days stand in until the rest days.
    const weeks = simulate(FIVE_DAY, [0, 1, 2, 3, 4], 4);
    expect(weeks[0]).toEqual(['upper_a', 'lower_a', 'upper_b', 'lower_b', 'upper_a']);
    // After the weekend the skipped full-body day comes first and the rotation runs in order.
    expect(weeks[1]).toEqual(['full_body', 'upper_b', 'lower_b', 'upper_a', 'lower_a']);
    expect(weeks[2]).toEqual(weeks[1]);
    expect(weeks[3]).toEqual(weeks[1]);
  });

  it('six training days a week still include every plan day each week', () => {
    const weeks = simulate(FIVE_DAY, [0, 1, 2, 3, 4, 5], 4);
    for (const week of weeks.slice(1)) for (const { focus } of FIVE_DAY) expect(week).toContain(focus);
  });

  it('training every day keeps the other days in turn while the full-body day waits', () => {
    // Full body overlaps every other day, so on consecutive days it is always deferred (advice only).
    const weeks = simulate(FIVE_DAY, [0, 1, 2, 3, 4, 5, 6], 4);
    for (const focus of ['upper_a', 'lower_a', 'upper_b', 'lower_b']) expect(count(weeks, focus)).toBe(7);
  });

  it('keeps a plain rotation unchanged when no day overlaps the one before it', () => {
    const upperLower = [{ focus: 'upper_a' }, { focus: 'lower_a' }, { focus: 'upper_b' }, { focus: 'lower_b' }];
    expect(simulate(upperLower, [0, 1, 2, 3, 4, 5, 6], 1)[0]).toEqual(['upper_a', 'lower_a', 'upper_b', 'lower_b', 'upper_a', 'lower_a', 'upper_b']);
  });
});
