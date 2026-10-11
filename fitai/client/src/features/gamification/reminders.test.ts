import { beforeEach, describe, expect, it } from 'vitest';
import type { ReminderSettings } from '@shared/types';
import { dayStateFromDashboard, dueCandidates, loadHandled, localClock, mealSlots, resolveReminders, saveHandled, toMinutes, type LocalClock } from './reminders';

const settings = (over: Partial<ReminderSettings> = {}): ReminderSettings => ({
  enabled: true,
  workoutDays: [1, 3, 5],
  workoutTime: '18:00',
  mealLogging: true,
  mealTimes: ['08:00', '13:00', '19:30'],
  ...over,
});
// 2026-10-07 is a Wednesday (weekday 3).
const at = (hhmm: string, date = '2026-10-07'): LocalClock => ({ date, minutes: toMinutes(hhmm), weekday: new Date(`${date}T00:00:00Z`).getUTCDay() });
const keys = (list: { key: string }[]) => list.map((r) => r.key);
const none = new Set<string>();

describe('reminder scheduling', () => {
  it('reads the wall clock in the user time zone', () => {
    const c = localClock(new Date('2026-10-09T22:30:00Z'), 'Asia/Jerusalem');
    expect(c).toEqual({ date: '2026-10-10', minutes: 90, weekday: 6 });
    expect(localClock(new Date('2026-10-09T22:30:00Z'), 'UTC')).toEqual({ date: '2026-10-09', minutes: 22 * 60 + 30, weekday: 5 });
    expect(localClock(new Date('2026-10-09T00:05:00Z'), 'Not/AZone').minutes).toBe(5);
  });

  it('splits the day into meal periods around each meal time', () => {
    expect(mealSlots(['19:30', '08:00', '13:00', 'bad', '13:00'])).toEqual([
      { time: '08:00', at: 480, start: 0, end: 630 },
      { time: '13:00', at: 780, start: 630, end: 975 },
      { time: '19:30', at: 1170, start: 975, end: 1440 },
    ]);
  });

  it('does nothing when disabled', () => {
    expect(dueCandidates(settings({ enabled: false }), at('20:00'), none)).toEqual([]);
  });

  it('workout reminder only on selected days, at or after the workout time', () => {
    expect(keys(dueCandidates(settings({ mealLogging: false }), at('17:59'), none))).toEqual([]);
    expect(keys(dueCandidates(settings({ mealLogging: false }), at('18:00'), none))).toEqual(['workout']);
    expect(keys(dueCandidates(settings({ mealLogging: false }), at('21:00', '2026-10-08'), none))).toEqual([]); // Thursday
  });

  it('meal reminder only while its meal period is current', () => {
    const s = settings({ workoutDays: [] });
    expect(keys(dueCandidates(s, at('07:59'), none))).toEqual([]);
    expect(keys(dueCandidates(s, at('08:00'), none))).toEqual(['meal:08:00']);
    expect(keys(dueCandidates(s, at('10:29'), none))).toEqual(['meal:08:00']);
    expect(keys(dueCandidates(s, at('10:30'), none))).toEqual([]); // breakfast period over, lunch not yet
    expect(keys(dueCandidates(s, at('13:30'), none))).toEqual(['meal:13:00']);
    expect(keys(dueCandidates(s, at('23:59'), none))).toEqual(['meal:19:30']);
    expect(keys(dueCandidates(settings({ workoutDays: [], mealLogging: false }), at('13:30'), none))).toEqual([]);
  });

  it('skips reminders already handled today', () => {
    expect(keys(dueCandidates(settings(), at('19:45'), new Set(['workout'])))).toEqual(['meal:19:30']);
  });

  it('fires only when the condition is still unmet, otherwise marks it done', () => {
    const s = settings();
    const candidates = dueCandidates(s, at('19:45'), none);
    expect(keys(candidates)).toEqual(['workout', 'meal:19:30']);
    const idle = resolveReminders(candidates, s, { workoutsToday: 0, sessionActive: false, lastFoodLogMinutes: toMinutes('12:40') });
    expect(keys(idle.fire)).toEqual(['workout', 'meal:19:30']);
    const busy = resolveReminders(candidates, s, { workoutsToday: 1, sessionActive: false, lastFoodLogMinutes: toMinutes('19:00') });
    expect(keys(busy.fire)).toEqual([]);
    expect(keys(busy.done)).toEqual(['workout', 'meal:19:30']);
    // A session in progress: no workout reminder yet, decide again later.
    const training = resolveReminders(candidates, s, { workoutsToday: 0, sessionActive: true, lastFoodLogMinutes: null });
    expect(keys(training.fire)).toEqual(['meal:19:30']);
    expect(keys(training.done)).toEqual([]);
  });

  it('derives the day state from the dashboard', () => {
    const state = dayStateFromDashboard(
      {
        today: '2026-10-07',
        weekDays: [
          { date: '2026-10-06', workouts: 1 },
          { date: '2026-10-07', workouts: 2 },
        ],
        activeSession: null,
        nutritionToday: { totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }, targets: null, entryCount: 1, lastLoggedAt: '2026-10-07T10:15:00.000Z' },
      },
      'Asia/Jerusalem',
    );
    expect(state).toEqual({ workoutsToday: 2, sessionActive: false, lastFoodLogMinutes: 13 * 60 + 15 });
    const early = dayStateFromDashboard(
      {
        today: '2026-10-07',
        weekDays: [],
        activeSession: { id: 's', name: 'x', status: 'paused', startedAt: '2026-10-07T09:00:00.000Z' },
        nutritionToday: { totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }, targets: null, entryCount: 1, lastLoggedAt: '2026-10-06T20:00:00.000Z' },
      },
      'UTC',
    );
    expect(early).toEqual({ workoutsToday: 0, sessionActive: true, lastFoodLogMinutes: 0 });
  });

  describe('handled keys storage', () => {
    beforeEach(() => window.localStorage.clear());
    it('keeps keys per user for the current day only', () => {
      saveHandled('u1', '2026-10-07', new Set(['workout']));
      expect(Array.from(loadHandled('u1', '2026-10-07'))).toEqual(['workout']);
      expect(loadHandled('u1', '2026-10-08').size).toBe(0);
      expect(loadHandled('u2', '2026-10-07').size).toBe(0);
    });
  });
});
