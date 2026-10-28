import { describe, expect, it } from 'vitest';
import type { DashboardDTO } from '@shared/types';
import { gettingStarted, todayPlan, weekOutlook } from './today';

const goal = (target: number, completed: number, met: boolean) => ({ target, completed, met, weekStart: '2026-10-04' }) as DashboardDTO['weeklyGoal'];
const days = (today: string, trained: string[] = []) =>
  ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'].map((date) => ({ date, workouts: trained.includes(date) ? 1 : 0 }));

function dash(over: Partial<Pick<DashboardDTO, 'today' | 'activePlan' | 'nextWorkout' | 'activeSession' | 'weeklyGoal' | 'weekDays'>> = {}) {
  return {
    today: '2026-10-06',
    activePlan: { id: 'p', name: 'Plan' },
    nextWorkout: { planId: 'p', workoutId: 'w', name: 'Push', focus: 'push', exerciseCount: 5, estimatedMinutes: 45 },
    activeSession: null,
    weeklyGoal: goal(3, 0, false),
    weekDays: days('2026-10-06'),
    ...over,
  } as Pick<DashboardDTO, 'today' | 'activePlan' | 'nextWorkout' | 'activeSession' | 'weeklyGoal' | 'weekDays'>;
}

describe('weekOutlook', () => {
  it('counts the days left including today', () => {
    expect(weekOutlook(dash()).daysLeft).toBe(5);
  });
  it('does not count today once it was trained', () => {
    const o = weekOutlook(dash({ weekDays: days('2026-10-06', ['2026-10-06']), weeklyGoal: goal(3, 1, false) }));
    expect(o).toMatchObject({ trainedToday: true, daysLeft: 4, remaining: 2, status: 'relaxed' });
  });
  it('flags a tight and an out-of-reach week', () => {
    const late = { today: '2026-10-09', weekDays: days('2026-10-09') };
    expect(weekOutlook(dash({ ...late, weeklyGoal: goal(3, 1, false) })).status).toBe('tight');
    expect(weekOutlook(dash({ ...late, weeklyGoal: goal(4, 1, false) })).status).toBe('out_of_reach');
  });
  it('is met when the goal is reached', () => {
    expect(weekOutlook(dash({ weeklyGoal: goal(3, 3, true) })).status).toBe('met');
  });
});

describe('todayPlan', () => {
  it('prefers resuming an open workout', () => {
    expect(todayPlan(dash({ activeSession: { id: 's', name: 'x', status: 'paused', startedAt: '2026-10-06T08:00:00Z' } })).kind).toBe('resume');
  });
  it('asks for a plan when there is none, and handles an empty plan', () => {
    expect(todayPlan(dash({ activePlan: null, nextWorkout: null })).kind).toBe('no_plan');
    expect(todayPlan(dash({ nextWorkout: null })).kind).toBe('empty_plan');
  });
  it('suggests recovery after a workout today', () => {
    const t = todayPlan(dash({ weekDays: days('2026-10-06', ['2026-10-06']), weeklyGoal: goal(3, 1, false) }));
    expect(t).toMatchObject({ kind: 'trained', reason: 'trainedToday' });
    const met = todayPlan(dash({ weekDays: days('2026-10-06', ['2026-10-06']), weeklyGoal: goal(1, 1, true) }));
    expect(met.reason).toBe('trainedTodayMet');
  });
  it('starts the next workout with a reason matching the weekly pace', () => {
    expect(todayPlan(dash()).reason).toBe('relaxed');
    expect(todayPlan(dash({ today: '2026-10-09', weekDays: days('2026-10-09'), weeklyGoal: goal(3, 1, false) })).reason).toBe('tight');
    expect(todayPlan(dash({ weeklyGoal: goal(2, 2, true) })).reason).toBe('goalMet');
  });
});

describe('gettingStarted', () => {
  const base = { activePlan: null, lastWorkout: null, nutritionToday: { totals: {} as never, targets: null, entryCount: 0, lastLoggedAt: null } };
  it('lists the first steps for a new user and ticks what is done', () => {
    expect(gettingStarted(base)?.map((s) => s.done)).toEqual([false, false, false]);
    expect(gettingStarted({ ...base, activePlan: { id: 'p', name: 'x' }, nutritionToday: { ...base.nutritionToday, entryCount: 2 } })?.map((s) => s.done)).toEqual([true, false, true]);
  });
  it('disappears after the first workout', () => {
    expect(gettingStarted({ ...base, lastWorkout: { id: 'w', name: 'x', endedAt: '2026-10-05T10:00:00Z', durationSeconds: 100 } })).toBeNull();
  });
});
