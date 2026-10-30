import { describe, expect, it } from 'vitest';
import type { ReminderSettings } from '@shared/types';
import type { ReminderSyncContext } from '../types';
import {
  CHANNEL_ID,
  createNativeReminders,
  HORIZON_DAYS,
  isReminderId,
  MIN_LEAD_MS,
  planReminders,
  reminderId,
  reminderIdDate,
  reminderPath,
  satisfiedToday,
  SMALL_ICON,
  toPermission,
  zonedInstant,
  type LocalNotificationsApi,
  type ReminderTexts,
} from './reminders';

const SETTINGS: ReminderSettings = {
  enabled: true,
  workoutDays: [0, 2], // Sunday, Tuesday
  workoutTime: '18:00',
  mealLogging: true,
  mealTimes: ['08:00', '13:00', '19:30'],
};
const TZ = 'Asia/Jerusalem';
// Friday 30 Oct 2026, 11:00 in Jerusalem (UTC+2 since the clock change on 25 Oct).
const NOW = Date.parse('2026-10-30T09:00:00Z');
const CTX: ReminderSyncContext = { locale: 'en', today: '2026-10-30', timeZone: TZ, workoutDoneToday: false, loggedMealTimes: [] };

const iso = (ms: number) => new Date(ms).toISOString();

describe('zonedInstant: a wall-clock time in a time zone', () => {
  it('handles ordinary days on both sides of UTC, including the date line', () => {
    expect(iso(zonedInstant('2026-10-30', '18:00', 'UTC'))).toBe('2026-10-30T18:00:00.000Z');
    expect(iso(zonedInstant('2026-10-30', '18:00', 'America/Los_Angeles'))).toBe('2026-10-31T01:00:00.000Z'); // PDT, next UTC day
    expect(iso(zonedInstant('2026-01-15', '08:00', 'Pacific/Auckland'))).toBe('2026-01-14T19:00:00.000Z'); // NZDT +13, previous UTC day
    expect(iso(zonedInstant('2026-10-30', '00:30', 'Pacific/Kiritimati'))).toBe('2026-10-29T10:30:00.000Z'); // +14
    expect(iso(zonedInstant('2026-10-30', '18:00', 'Asia/Kolkata'))).toBe('2026-10-30T12:30:00.000Z'); // half-hour offset
  });

  it('follows the clock change in Israel (25 Oct 2026: 02:00 → 01:00)', () => {
    expect(iso(zonedInstant('2026-10-24', '18:00', TZ))).toBe('2026-10-24T15:00:00.000Z'); // IDT +3
    expect(iso(zonedInstant('2026-10-25', '18:00', TZ))).toBe('2026-10-25T16:00:00.000Z'); // IST +2
    // Spring: Friday 27 Mar 2026, 02:00 → 03:00.
    expect(iso(zonedInstant('2026-03-26', '08:00', TZ))).toBe('2026-03-26T06:00:00.000Z');
    expect(iso(zonedInstant('2026-03-27', '08:00', TZ))).toBe('2026-03-27T05:00:00.000Z');
  });

  it('takes the first of a repeated time and moves a skipped time past the gap', () => {
    // New York, 1 Nov 2026: 01:30 happens twice (EDT, then EST).
    expect(iso(zonedInstant('2026-11-01', '01:30', 'America/New_York'))).toBe('2026-11-01T05:30:00.000Z');
    // Berlin, 25 Oct 2026: 02:30 happens twice (CEST, then CET).
    expect(iso(zonedInstant('2026-10-25', '02:30', 'Europe/Berlin'))).toBe('2026-10-25T00:30:00.000Z');
    // Skipped hour: New York 8 Mar 2026 02:30 → 03:30 EDT; Berlin 29 Mar 2026 02:30 → 03:30 CEST.
    expect(iso(zonedInstant('2026-03-08', '02:30', 'America/New_York'))).toBe('2026-03-08T07:30:00.000Z');
    expect(iso(zonedInstant('2026-03-29', '02:30', 'Europe/Berlin'))).toBe('2026-03-29T01:30:00.000Z');
  });
});

describe('reminder ids', () => {
  it('come from the day and slot only, so a new sync replaces the same reminder', () => {
    expect(reminderId('2026-10-30', 'workout', '18:00')).toBe(20756 * 10_000);
    expect(reminderId('2026-10-30', 'workout', '07:15')).toBe(20756 * 10_000); // one workout reminder per day
    expect(reminderId('2026-10-30', 'meal', '13:00')).toBe(20756 * 10_000 + 1301);
    expect(reminderId('2026-10-30', 'meal', '00:00')).toBe(20756 * 10_000 + 1);
    expect(reminderId('2026-10-30', 'meal', '23:59')).toBe(20756 * 10_000 + 2360);
    expect(reminderIdDate(reminderId('2026-10-30', 'meal', '19:30'))).toBe('2026-10-30');
  });

  it('fit Android’s 32-bit notification id for centuries', () => {
    expect(reminderId('2500-12-31', 'meal', '23:59')).toBeLessThan(2 ** 31);
  });

  it('are recognised by shape, and nothing else is', () => {
    expect(isReminderId(reminderId('2026-10-30', 'meal', '13:00'))).toBe(true);
    expect(isReminderId(reminderId('2026-10-30', 'workout', '18:00'))).toBe(true);
    for (const other of [1, 42, 999_999, 20756 * 10_000 + 2361, 20756 * 10_000 + 61, -5, 1.5, '207560000']) expect(isReminderId(other)).toBe(false);
  });

  it('do not depend on the time zone: the same day and slot after travelling', () => {
    const here = planReminders(SETTINGS, CTX, NOW);
    // 05:00 in New York at the same moment: today's 08:00 is still ahead there, the rest is the same.
    const abroad = planReminders(SETTINGS, { ...CTX, timeZone: 'America/New_York' }, NOW);
    expect(abroad.map((r) => r.id)).toEqual([reminderId('2026-10-30', 'meal', '08:00'), ...here.map((r) => r.id)]);
    expect(abroad[1]!.at).not.toBe(here[0]!.at);
  });
});

describe('planReminders', () => {
  it('plans the next 14 days of workout and meal reminders, skipping times already past', () => {
    const plan = planReminders(SETTINGS, CTX, NOW);
    const workouts = plan.filter((r) => r.kind === 'workout');
    expect(workouts.map((r) => r.date)).toEqual(['2026-11-01', '2026-11-03', '2026-11-08', '2026-11-10']);
    // 14 days × 3 meals, minus today's 08:00 (already past at 11:00).
    expect(plan.filter((r) => r.kind === 'meal')).toHaveLength(14 * 3 - 1);
    expect(plan.some((r) => r.date === '2026-10-30' && r.time === '08:00')).toBe(false);
    expect(plan[0]).toMatchObject({ kind: 'meal', date: '2026-10-30', time: '13:00', at: Date.parse('2026-10-30T11:00:00Z') });
    expect(plan.at(-1)!.date).toBe('2026-11-12');
    expect(new Set(plan.map((r) => r.id)).size).toBe(plan.length);
    // Oldest first.
    expect(plan.map((r) => r.at)).toEqual([...plan.map((r) => r.at)].sort((a, b) => a - b));
  });

  it('puts each reminder at its local time on every day, across a clock change', () => {
    const plan = planReminders({ ...SETTINGS, mealLogging: false, workoutDays: [0, 1, 2, 3, 4, 5, 6] }, { ...CTX, today: '2026-10-23' }, Date.parse('2026-10-23T00:00:00Z'));
    const at = Object.fromEntries(plan.map((r) => [r.date, iso(r.at)]));
    expect(at['2026-10-24']).toBe('2026-10-24T15:00:00.000Z'); // 18:00 IDT
    expect(at['2026-10-25']).toBe('2026-10-25T16:00:00.000Z'); // 18:00 IST
    expect(plan).toHaveLength(HORIZON_DAYS);
  });

  it('uses the phone’s time zone when none is given', () => {
    // The test runner's zone; the result must equal an explicit plan in that zone.
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(planReminders(SETTINGS, { ...CTX, timeZone: undefined }, NOW)).toEqual(planReminders(SETTINGS, { ...CTX, timeZone: zone }, NOW));
    expect(planReminders(SETTINGS, { ...CTX, timeZone: 'Not/AZone' }, NOW)).toEqual(planReminders(SETTINGS, { ...CTX, timeZone: zone }, NOW));
  });

  it('leaves out today’s satisfied reminders but keeps tomorrow’s', () => {
    const sunday = { ...CTX, today: '2026-11-01' };
    const sundayMorning = Date.parse('2026-11-01T05:00:00Z'); // 07:00
    const open = planReminders(SETTINGS, sunday, sundayMorning);
    expect(open.some((r) => r.kind === 'workout' && r.date === '2026-11-01')).toBe(true);

    const done = planReminders(SETTINGS, { ...sunday, workoutDoneToday: true, loggedMealTimes: ['08:00', '13:00'] }, sundayMorning);
    expect(done.some((r) => r.kind === 'workout' && r.date === '2026-11-01')).toBe(false);
    expect(done.filter((r) => r.date === '2026-11-01').map((r) => r.time)).toEqual(['19:30']);
    expect(done.some((r) => r.kind === 'workout' && r.date === '2026-11-03')).toBe(true);
    expect(done.filter((r) => r.date === '2026-11-02').map((r) => r.time)).toEqual(['08:00', '13:00', '19:30']);
  });

  it('plans nothing when reminders are off; only workouts without meal logging', () => {
    expect(planReminders({ ...SETTINGS, enabled: false }, CTX, NOW)).toEqual([]);
    expect(planReminders({ ...SETTINGS, mealLogging: false }, CTX, NOW).every((r) => r.kind === 'workout')).toBe(true);
    expect(planReminders({ ...SETTINGS, workoutDays: [], mealLogging: false }, CTX, NOW)).toEqual([]);
  });

  it('ignores invalid and repeated times', () => {
    const plan = planReminders({ ...SETTINGS, workoutTime: '25:00', mealTimes: ['13:00', '13:00', 'noon', '7:5'] }, CTX, NOW);
    expect(plan.every((r) => r.kind === 'meal' && r.time === '13:00')).toBe(true);
    expect(plan).toHaveLength(HORIZON_DAYS);
  });

  it('never plans a time that is due within the next minute (the plugin would fire it at once)', () => {
    const justBefore = Date.parse('2026-10-30T11:00:00Z') - MIN_LEAD_MS + 1; // 12:59:00.001
    expect(planReminders(SETTINGS, CTX, justBefore).some((r) => r.date === '2026-10-30' && r.time === '13:00')).toBe(false);
    expect(planReminders(SETTINGS, CTX, justBefore - 1).some((r) => r.date === '2026-10-30' && r.time === '13:00')).toBe(true);
  });
});

describe('small helpers', () => {
  it('lists today’s satisfied reminders', () => {
    const ids = satisfiedToday(SETTINGS, { ...CTX, workoutDoneToday: true, loggedMealTimes: ['08:00', 'bad'] });
    expect([...ids].sort()).toEqual([reminderId('2026-10-30', 'workout', '18:00'), reminderId('2026-10-30', 'meal', '08:00')].sort());
  });

  it('opens only our own pages from a tapped notification', () => {
    expect(reminderPath({ lupufit: 'reminder', path: '/nutrition/log' })).toBe('/nutrition/log');
    expect(reminderPath({ lupufit: 'reminder', path: '/' })).toBe('/');
    expect(reminderPath({ lupufit: 'reminder', path: 'https://evil.example' })).toBeNull();
    expect(reminderPath({ path: '/' })).toBeNull();
    expect(reminderPath(null)).toBeNull();
  });

  it('maps the plugin’s permission states', () => {
    expect(toPermission({ display: 'granted' })).toBe('granted');
    expect(toPermission({ display: 'denied' })).toBe('denied');
    expect(toPermission({ display: 'prompt' })).toBe('prompt');
    expect(toPermission({ display: 'prompt-with-rationale' })).toBe('prompt');
    expect(toPermission(undefined)).toBe('prompt');
  });
});

// ------------------------------------------------------------------------------- native sync, faked plugin

type Stored = { id: number; title: string; body: string; extra?: unknown; at: number };

/** In-memory stand-in for @capacitor/local-notifications (Android behaviour that the sync relies on). */
function fakePlugin(opts: { permission?: 'granted' | 'denied' | 'prompt'; requestResult?: 'granted' | 'denied' } = {}) {
  let permission = opts.permission ?? 'granted';
  const stored = new Map<number, Stored>();
  const delivered = new Map<number, { id: number; title: string }>();
  const calls: string[] = [];
  const channels: unknown[] = [];
  const plugin: LocalNotificationsApi = {
    checkPermissions: async () => {
      calls.push('checkPermissions');
      return { display: permission };
    },
    requestPermissions: async () => {
      calls.push('requestPermissions');
      permission = opts.requestResult ?? 'granted';
      return { display: permission };
    },
    getPending: async () => {
      calls.push('getPending');
      // Like the plugin: everything it stored, including one-shots that already fired.
      return { notifications: [...stored.values()].map((n) => ({ id: n.id, title: n.title, body: n.body, extra: n.extra })) };
    },
    schedule: async ({ notifications }) => {
      calls.push(`schedule:${notifications.length}`);
      for (const n of notifications) stored.set(n.id, { id: n.id, title: n.title, body: n.body, extra: n.extra, at: n.schedule!.at!.getTime() });
      return { notifications: notifications.map((n) => ({ id: n.id })) };
    },
    cancel: async ({ notifications }) => {
      calls.push(`cancel:${notifications.length}`);
      for (const n of notifications) stored.delete(n.id);
    },
    getDeliveredNotifications: async () => {
      calls.push('getDelivered');
      // Delivered notifications come back without `extra` (Android gives `data`).
      return { notifications: [...delivered.values()].map((n) => ({ id: n.id, title: n.title, body: '', data: {} })) };
    },
    removeDeliveredNotifications: async ({ notifications }) => {
      calls.push(`removeDelivered:${notifications.length}`);
      for (const n of notifications) delivered.delete(n.id);
    },
    createChannel: async (channel) => {
      calls.push('createChannel');
      channels.push(channel);
    },
  };
  /** Fires everything due by `time`: moves it to the shade (it stays in the plugin's storage). */
  const fireUntil = (time: number) => {
    for (const n of stored.values()) if (n.at <= time) delivered.set(n.id, { id: n.id, title: n.title });
  };
  return { plugin, stored, delivered, calls, channels, fireUntil };
}

const TEXTS = (locale: 'he' | 'en'): ReminderTexts =>
  locale === 'he'
    ? { workout: { title: 'זמן להתאמן', body: 'ב' }, meal: { title: 'זמן לתעד ארוחה', body: 'ב' }, channel: { name: 'תזכורות', description: 'ת' } }
    : { workout: { title: 'Time to train', body: 'b' }, meal: { title: 'Time to log your meal', body: 'b' }, channel: { name: 'Reminders', description: 'd' } };

describe('createNativeReminders (fake plugin)', () => {
  it('schedules the plan as inexact, idle-allowed notifications on its own channel and icon', async () => {
    const f = fakePlugin();
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await reminders.sync(SETTINGS, CTX);
    expect(f.stored.size).toBe(planReminders(SETTINGS, CTX, NOW).length);
    expect(f.channels).toEqual([expect.objectContaining({ id: CHANNEL_ID, name: 'Reminders', importance: 3 })]);
    expect(f.calls).not.toContain('requestPermissions');
    expect(f.calls.filter((c) => c.startsWith('schedule:'))).toEqual([`schedule:${f.stored.size}`]);
    expect(reminders.lastSync()).toMatchObject({ scheduled: f.stored.size, cancelled: 0 });
  });

  it('touches nothing on a repeat sync, and schedules everything again after invalidate()', async () => {
    const f = fakePlugin();
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await reminders.sync(SETTINGS, CTX);
    f.calls.length = 0;
    await reminders.sync(SETTINGS, CTX);
    expect(f.calls.filter((c) => c.startsWith('schedule') || c.startsWith('cancel'))).toEqual([]);
    expect(reminders.lastSync()).toMatchObject({ scheduled: 0, unchanged: f.stored.size });
    reminders.invalidate();
    await reminders.sync(SETTINGS, CTX);
    expect(f.calls).toContain(`schedule:${f.stored.size}`);
  });

  it('cancels a reminder once it is satisfied and clears it from the shade if it already showed', async () => {
    const f = fakePlugin();
    let now = NOW; // 11:00
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => now });
    await reminders.sync(SETTINGS, CTX);
    const lunch = reminderId('2026-10-30', 'meal', '13:00');
    const dinner = reminderId('2026-10-30', 'meal', '19:30');
    expect(f.stored.has(lunch)).toBe(true);

    // 13:05: lunch reminder showed; the person logs lunch.
    now = Date.parse('2026-10-30T11:05:00Z');
    f.fireUntil(now);
    expect(f.delivered.has(lunch)).toBe(true);
    await reminders.sync(SETTINGS, { ...CTX, loggedMealTimes: ['08:00', '13:00'] });
    expect(f.stored.has(lunch)).toBe(false);
    expect(f.delivered.has(lunch)).toBe(false);
    expect(f.stored.has(dinner)).toBe(true);
  });

  it('keeps an unsatisfied reminder that already showed, and removes ones from earlier days', async () => {
    const f = fakePlugin();
    let now = NOW;
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => now });
    await reminders.sync(SETTINGS, CTX);
    const lunch = reminderId('2026-10-30', 'meal', '13:00');
    now = Date.parse('2026-10-30T11:05:00Z');
    f.fireUntil(now);
    await reminders.sync(SETTINGS, CTX); // nothing logged
    expect(f.delivered.has(lunch)).toBe(true);

    // Next morning, before anything was logged: yesterday's reminder leaves the shade.
    now = Date.parse('2026-10-31T05:00:00Z');
    await reminders.sync(SETTINGS, { ...CTX, today: '2026-10-31' });
    expect(f.delivered.has(lunch)).toBe(false);
    expect(f.stored.has(lunch)).toBe(false); // tidied from the plugin's storage too
    expect(f.stored.has(reminderId('2026-11-13', 'meal', '19:30'))).toBe(true); // the horizon moved on
  });

  it('cancels today’s workout reminder once a workout is done', async () => {
    const f = fakePlugin();
    const sunday = { ...CTX, today: '2026-11-01' };
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => Date.parse('2026-11-01T08:00:00Z') });
    await reminders.sync(SETTINGS, sunday);
    const workout = reminderId('2026-11-01', 'workout', '18:00');
    expect(f.stored.has(workout)).toBe(true);
    await reminders.sync(SETTINGS, { ...sunday, workoutDoneToday: true });
    expect(f.stored.has(workout)).toBe(false);
    expect(f.stored.has(reminderId('2026-11-03', 'workout', '18:00'))).toBe(true);
  });

  it('replaces reminders when the settings change and cancels all when they are turned off', async () => {
    const f = fakePlugin();
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await reminders.sync(SETTINGS, CTX);
    await reminders.sync({ ...SETTINGS, mealTimes: ['08:00', '12:30', '19:30'] }, CTX);
    expect([...f.stored.values()].some((n) => n.id % 10_000 === 1301)).toBe(false);
    expect([...f.stored.values()].filter((n) => n.id % 10_000 === 1231)).toHaveLength(HORIZON_DAYS);
    await reminders.sync({ ...SETTINGS, enabled: false }, CTX);
    expect(f.stored.size).toBe(0);
  });

  it('moves the workout reminder when its time changes (same id, new time)', async () => {
    const f = fakePlugin();
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await reminders.sync(SETTINGS, CTX);
    const id = reminderId('2026-11-01', 'workout', '18:00');
    await reminders.sync({ ...SETTINGS, workoutTime: '07:00' }, CTX);
    expect(new Date(f.stored.get(id)!.at).toISOString()).toBe('2026-11-01T05:00:00.000Z');
  });

  it('writes the texts in the app language and rewrites them when it changes', async () => {
    const f = fakePlugin();
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await reminders.sync(SETTINGS, { ...CTX, locale: 'he' });
    expect(f.stored.get(reminderId('2026-11-01', 'workout', '18:00'))!.title).toBe('זמן להתאמן');
    await reminders.sync(SETTINGS, CTX);
    expect(f.stored.get(reminderId('2026-11-01', 'workout', '18:00'))!.title).toBe('Time to train');
    expect(reminders.lastSync()!.scheduled).toBe(f.stored.size);
  });

  it('never schedules (which would make Android ask) without permission, and clears what was there', async () => {
    const f = fakePlugin();
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await reminders.sync(SETTINGS, CTX);
    expect(f.stored.size).toBeGreaterThan(0);
    const denied = fakePlugin({ permission: 'denied' });
    for (const [id, n] of f.stored) denied.stored.set(id, n);
    const r2 = createNativeReminders({ plugin: denied.plugin, texts: TEXTS, now: () => NOW });
    await r2.sync(SETTINGS, CTX);
    expect(denied.calls.some((c) => c.startsWith('schedule'))).toBe(false);
    expect(denied.calls).not.toContain('requestPermissions');
    expect(denied.stored.size).toBe(0);

    const prompt = fakePlugin({ permission: 'prompt' });
    const r3 = createNativeReminders({ plugin: prompt.plugin, texts: TEXTS, now: () => NOW });
    await r3.sync(SETTINGS, CTX);
    expect(prompt.calls).not.toContain('requestPermissions');
    expect(prompt.stored.size).toBe(0);
  });

  it('asks for permission only through request()', async () => {
    const f = fakePlugin({ permission: 'prompt', requestResult: 'granted' });
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await expect(reminders.permission()).resolves.toBe('prompt');
    await expect(reminders.request()).resolves.toBe('granted');
    expect(f.calls.filter((c) => c === 'requestPermissions')).toHaveLength(1);
    await reminders.sync(SETTINGS, CTX);
    expect(f.stored.size).toBeGreaterThan(0);
  });

  it('leaves notifications that are not reminders alone', async () => {
    const f = fakePlugin();
    f.stored.set(42, { id: 42, title: 'other', body: '', at: NOW + 1000 });
    f.delivered.set(7, { id: 7, title: 'other' });
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await reminders.sync({ ...SETTINGS, enabled: false }, CTX);
    expect(f.stored.has(42)).toBe(true);
    expect(f.delivered.has(7)).toBe(true);
  });

  it('runs overlapping syncs one after another', async () => {
    const f = fakePlugin();
    const reminders = createNativeReminders({ plugin: f.plugin, texts: TEXTS, now: () => NOW });
    await Promise.all([reminders.sync(SETTINGS, CTX), reminders.sync({ ...SETTINGS, enabled: false }, CTX), reminders.sync(SETTINGS, CTX)]);
    expect(f.stored.size).toBe(planReminders(SETTINGS, CTX, NOW).length);
    // Each sync read the plugin's list after the previous one had finished writing.
    const reads = f.calls.map((c, i) => (c === 'getPending' ? i : -1)).filter((i) => i >= 0);
    expect(reads).toHaveLength(3);
  });

  it('marks every scheduled notification as ours with the page to open', async () => {
    const f = fakePlugin();
    const scheduled: unknown[] = [];
    const plugin: LocalNotificationsApi = {
      ...f.plugin,
      schedule: async (o) => {
        scheduled.push(...o.notifications);
        return f.plugin.schedule(o);
      },
    };
    await createNativeReminders({ plugin, texts: TEXTS, now: () => NOW }).sync(SETTINGS, CTX);
    for (const n of scheduled as { isExactNotification: boolean; schedule: { allowWhileIdle: boolean }; smallIcon: string; channelId: string; extra: { lupufit: string; path: string; kind: string } }[]) {
      expect(n.isExactNotification).toBe(false);
      expect(n.schedule.allowWhileIdle).toBe(true);
      expect(n.smallIcon).toBe(SMALL_ICON);
      expect(n.channelId).toBe(CHANNEL_ID);
      expect(n.extra.lupufit).toBe('reminder');
      expect(n.extra.path).toBe(n.extra.kind === 'workout' ? '/' : '/nutrition/log');
    }
  });
});
