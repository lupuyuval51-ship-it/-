/** What the phone's reminder schedule is told about today (platform.reminders.sync context, see PhoneReminderSync). */
import { describe, expect, it } from 'vitest';
import type { ReminderSettings } from '@shared/types';
import { reminderContext } from './phoneReminders';

const SETTINGS: ReminderSettings = { enabled: true, workoutDays: [5], workoutTime: '18:00', mealLogging: true, mealTimes: ['08:00', '13:00', '19:30'] };
const TZ = 'Asia/Jerusalem';

function day({ workouts = 0, lastLoggedAt = null as string | null } = {}) {
  return {
    today: '2026-10-30',
    weekDays: [{ date: '2026-10-30', workouts }],
    activeSession: null,
    nutritionToday: { lastLoggedAt },
  } as unknown as Parameters<typeof reminderContext>[1];
}

describe('phone reminder context', () => {
  it('nothing done yet today: every reminder stays', () => {
    expect(reminderContext(SETTINGS, day(), TZ, 'he')).toEqual({ locale: 'he', today: '2026-10-30', timeZone: TZ, workoutDoneToday: false, loggedMealTimes: [] });
  });

  it('a finished workout and a meal logged at lunch cover the workout and the meals up to lunch', () => {
    // 13:20 in Jerusalem (UTC+2 on 30 October 2026).
    const ctx = reminderContext(SETTINGS, day({ workouts: 1, lastLoggedAt: '2026-10-30T11:20:00.000Z' }), TZ, 'en');
    expect(ctx.workoutDoneToday).toBe(true);
    expect(ctx.loggedMealTimes).toEqual(['08:00', '13:00']);
  });
});
