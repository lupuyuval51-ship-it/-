import { describe, expect, it } from 'vitest';
import type { DashboardDTO, ReminderSettings } from '@shared/types';
import { onReminderSyncRequest, reminderContext, requestReminderSync } from './phoneReminders';

const SETTINGS: ReminderSettings = { enabled: true, workoutDays: [5], workoutTime: '18:00', mealLogging: true, mealTimes: ['08:00', '13:00', '19:30'] };
const TZ = 'Asia/Jerusalem'; // UTC+2 on 30 Oct 2026

type Day = Pick<DashboardDTO, 'today' | 'weekDays' | 'activeSession' | 'nutritionToday'>;
const day = (patch: Partial<Day> = {}): Day => ({
  today: '2026-10-30',
  weekDays: [{ date: '2026-10-30', workouts: 0 }],
  activeSession: null,
  nutritionToday: { totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }, targets: null, entryCount: 0, lastLoggedAt: null },
  ...patch,
});

describe('reminderContext', () => {
  it('nothing done yet', () => {
    expect(reminderContext(SETTINGS, day(), TZ, 'he')).toEqual({ locale: 'he', today: '2026-10-30', timeZone: TZ, workoutDoneToday: false, loggedMealTimes: [] });
  });

  it('a finished workout today, or one started today and still open, satisfies the workout reminder', () => {
    expect(reminderContext(SETTINGS, day({ weekDays: [{ date: '2026-10-30', workouts: 1 }] }), TZ, 'en').workoutDoneToday).toBe(true);
    const open = (startedAt: string) => day({ activeSession: { id: 's', name: 'Push', status: 'in_progress', startedAt } });
    expect(reminderContext(SETTINGS, open('2026-10-30T15:00:00Z'), TZ, 'en').workoutDoneToday).toBe(true);
    // Left open since yesterday: does not count for today.
    expect(reminderContext(SETTINGS, open('2026-10-29T15:00:00Z'), TZ, 'en').workoutDoneToday).toBe(false);
  });

  it('food logged in a meal’s period covers that meal (and the ones before it)', () => {
    const logged = (at: string) => reminderContext(SETTINGS, day({ nutritionToday: { ...day().nutritionToday, entryCount: 1, lastLoggedAt: at } }), TZ, 'en').loggedMealTimes;
    expect(logged('2026-10-30T06:10:00Z')).toEqual(['08:00']); // 08:10
    // Lunch period starts halfway between 08:00 and 13:00 (10:30).
    expect(logged('2026-10-30T08:20:00Z')).toEqual(['08:00']); // 10:20
    expect(logged('2026-10-30T08:40:00Z')).toEqual(['08:00', '13:00']); // 10:40
    expect(logged('2026-10-30T17:00:00Z')).toEqual(['08:00', '13:00', '19:30']); // 19:00
  });
});

describe('requestReminderSync', () => {
  it('reaches every listener until it unsubscribes', () => {
    let calls = 0;
    const off = onReminderSyncRequest(() => calls++);
    requestReminderSync();
    off();
    requestReminderSync();
    expect(calls).toBe(1);
  });
});
