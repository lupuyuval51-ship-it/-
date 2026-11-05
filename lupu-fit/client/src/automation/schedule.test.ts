import { describe, expect, it } from 'vitest';
import { computeTriggers, inQuietHours, localInstant, nextFire, notificationId, suggestWeekdays, trainingDays, type ScheduleInput } from './schedule.ts';
import { DEFAULT_SETTINGS, normalizeSettings, type AutomationSettings } from './settings.ts';

// Node re-reads TZ on assignment, so Date arithmetic below runs in a DST-observing zone regardless of the host.
process.env['TZ'] = 'Asia/Jerusalem';

const withS = (p: Partial<AutomationSettings>): AutomationSettings => ({ ...DEFAULT_SETTINGS, ...p });
const allOn = (): AutomationSettings => withS({
  workout: { on: true, time: '18:00', days: [0, 2, 4] }, meals: { ...DEFAULT_SETTINGS.meals, on: true }, weigh: { on: true, day: 5, time: '08:00' },
  streak: { on: true, time: '20:00' }, rest: { on: true, time: '10:00' },
});
// Wednesday 2026-11-04 12:00 local
const NOW = new Date(2026, 10, 4, 12, 0, 0);
const input = (o: Partial<ScheduleInput> = {}): ScheduleInput => ({ settings: allOn(), now: NOW, profile: { age: 30, daysPerWeek: 3 }, workoutDoneToday: false, ...o });
const kinds = (t: { kind: string }[]): string[] => t.map((x) => x.kind);

describe('defaults', () => {
  it('every reminder is OFF by default, so nothing is scheduled', () => {
    expect(computeTriggers({ ...input(), settings: DEFAULT_SETTINGS })).toEqual([]);
  });
  it('no profile (not onboarded) schedules nothing', () => { expect(computeTriggers(input({ profile: null }))).toEqual([]); });
  it('suggests weekdays from daysPerWeek and lets the user override', () => {
    expect(suggestWeekdays(3)).toEqual([0, 2, 4]); expect(suggestWeekdays(7)).toHaveLength(7); expect(suggestWeekdays(99)).toHaveLength(7);
    expect(trainingDays(withS({ workout: { on: true, time: '18:00', days: null } }), { age: 30, daysPerWeek: 4 })).toEqual([0, 1, 3, 4]);
    expect(trainingDays(withS({ workout: { on: true, time: '18:00', days: [6] } }), { age: 30, daysPerWeek: 4 })).toEqual([6]);
  });
  it('an explicit empty choice of training days is respected (the Settings card shows none selected): no workout or streak reminders, rest tip every day', () => {
    const s = withS({ workout: { on: true, time: '18:00', days: [] }, streak: { on: true, time: '20:00' }, rest: { on: true, time: '10:00' } });
    expect(trainingDays(s, { age: 30, daysPerWeek: 3 })).toEqual([]);
    const k = kinds(computeTriggers({ ...input(), settings: s }));
    expect(k.filter((x) => x === 'workout')).toHaveLength(0); expect(k.filter((x) => x === 'streak')).toHaveLength(0); expect(k.filter((x) => x === 'rest')).toHaveLength(7);
  });
});

describe('triggers', () => {
  it('workout: one weekly trigger per chosen weekday with stable ids', () => {
    const t = computeTriggers(input({ settings: withS({ workout: { on: true, time: '18:30', days: [0, 2, 4] } }) }));
    expect(t.map((x) => [x.id, x.weekday, x.hour, x.minute, x.repeats, x.route])).toEqual([[101, 0, 18, 30, true, '/workouts'], [103, 2, 18, 30, true, '/workouts'], [105, 4, 18, 30, true, '/workouts']]);
    expect(notificationId('workout', 0)).toBe(101);
  });
  it('is idempotent: same input, same output', () => { expect(computeTriggers(input())).toEqual(computeTriggers(input())); });
  it('ids are unique across kinds and weekdays', () => {
    const ids = computeTriggers(input()).map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('meals are daily and routed to /nutrition; weigh-in is weekly on /progress', () => {
    const t = computeTriggers(input());
    const lunch = t.find((x) => x.kind === 'lunch');
    expect(lunch).toMatchObject({ weekday: null, hour: 13, minute: 0, repeats: true, route: '/nutrition' });
    expect(t.find((x) => x.kind === 'weigh')).toMatchObject({ weekday: 5, route: '/progress' });
  });
  it('only selected meals are scheduled', () => {
    const t = computeTriggers(input({ settings: withS({ meals: { ...DEFAULT_SETTINGS.meals, on: true, kinds: ['dinner'] } }) }));
    expect(kinds(t)).toEqual(['dinner']);
  });
  it('rest-day tip lands exactly on the non-training weekdays', () => {
    const rest = computeTriggers(input()).filter((x) => x.kind === 'rest').map((x) => x.weekday);
    expect(rest).toEqual([1, 3, 5, 6]);
  });
});

describe('minors', () => {
  it('under 18: no meal, calorie or weigh-in reminders; workout and rest still allowed', () => {
    const k = kinds(computeTriggers(input({ profile: { age: 15, daysPerWeek: 3 } })));
    expect(k).not.toContain('breakfast'); expect(k).not.toContain('lunch'); expect(k).not.toContain('dinner'); expect(k).not.toContain('weigh');
    expect(k).toContain('workout'); expect(k).toContain('rest');
  });
  it('18 is an adult', () => { expect(kinds(computeTriggers(input({ profile: { age: 18, daysPerWeek: 3 } })))).toContain('weigh'); });
});

describe('quiet hours', () => {
  it('window wraps midnight', () => {
    const q = { on: true, start: '22:00', end: '07:00' };
    expect(inQuietHours(23 * 60, q)).toBe(true); expect(inQuietHours(6 * 60 + 59, q)).toBe(true);
    expect(inQuietHours(7 * 60, q)).toBe(false); expect(inQuietHours(21 * 60 + 59, q)).toBe(false); expect(inQuietHours(22 * 60, q)).toBe(true);
  });
  it('same-day window and disabled / empty windows', () => {
    expect(inQuietHours(13 * 60, { on: true, start: '12:00', end: '14:00' })).toBe(true);
    expect(inQuietHours(14 * 60, { on: true, start: '12:00', end: '14:00' })).toBe(false);
    expect(inQuietHours(23 * 60, { on: false, start: '22:00', end: '07:00' })).toBe(false);
    expect(inQuietHours(23 * 60, { on: true, start: '22:00', end: '22:00' })).toBe(false);
  });
  it('drops reminders whose time is inside quiet hours', () => {
    const s = withS({ workout: { on: true, time: '06:30', days: [0] }, weigh: { on: true, day: 1, time: '22:30' }, rest: { on: true, time: '10:00' } });
    const k = kinds(computeTriggers(input({ settings: s })));
    expect(k).not.toContain('workout'); expect(k).not.toContain('weigh'); expect(k).toContain('rest');
  });
  it('quiet hours switched off allows late times', () => {
    const s = withS({ quiet: { on: false, start: '22:00', end: '07:00' }, weigh: { on: true, day: 1, time: '22:30' } });
    expect(kinds(computeTriggers(input({ settings: s })))).toEqual(['weigh']);
  });
});

describe('streak at risk', () => {
  const s = withS({ workout: { on: false, time: '18:00', days: [0, 2, 4] }, streak: { on: true, time: '20:00' } });
  it('one-shots for upcoming training days only (Wed 12:00 -> Wed, Sun)', () => {
    const t = computeTriggers(input({ settings: s }));
    expect(t.map((x) => [x.weekday, x.repeats, new Date(x.at as number).getDate()])).toEqual([[0, false, 8], [2, false, 10], [4, false, 5]]);
  });
  it('is skipped for today when a workout is already logged', () => {
    const wed = withS({ workout: { on: false, time: '18:00', days: [3] }, streak: { on: true, time: '20:00' } });
    expect(computeTriggers(input({ settings: wed }))).toHaveLength(1);
    expect(computeTriggers(input({ settings: wed, workoutDoneToday: true }))).toHaveLength(0); // next Wednesday is outside the 7-day window
  });
  it('is skipped for today once the evening time has passed', () => {
    const wed = withS({ workout: { on: false, time: '18:00', days: [3] }, streak: { on: true, time: '11:00' }, quiet: { on: false, start: '22:00', end: '07:00' } });
    expect(computeTriggers(input({ settings: wed }))).toHaveLength(0);
  });
});

describe('workout done today', () => {
  it('replaces today\'s repeating reminder by a one-shot next week, keeping the id', () => {
    const s = withS({ workout: { on: true, time: '18:00', days: [3, 5] } });
    const t = computeTriggers(input({ settings: s, workoutDoneToday: true }));
    const wed = t.find((x) => x.weekday === 3)!;
    expect(wed.repeats).toBe(false); expect(wed.id).toBe(notificationId('workout', 3));
    expect(new Date(wed.at as number).getDate()).toBe(11);
    expect(t.find((x) => x.weekday === 5)!.repeats).toBe(true);
  });
});

describe('DST-safe local times', () => {
  it('Israel DST ends 2026-10-25: a 20:00 one-shot stays 20:00 local on both sides', () => {
    const before = new Date(2026, 9, 24, 12, 0);
    const s = withS({ workout: { on: false, time: '18:00', days: [0, 6] }, streak: { on: true, time: '20:00' } });
    const t = computeTriggers({ settings: s, now: before, profile: { age: 30, daysPerWeek: 3 }, workoutDoneToday: false });
    expect(t).toHaveLength(2);
    for (const x of t) { const d = new Date(x.at as number); expect([d.getHours(), d.getMinutes()]).toEqual([20, 0]); }
    const sun = new Date(t.find((x) => x.weekday === 0)!.at as number);
    expect(sun.getDate()).toBe(25);
    // 24h apart in wall time but 25h in real time across the change
    expect(sun.getTime() - new Date(t.find((x) => x.weekday === 6)!.at as number).getTime()).toBe(25 * 3_600_000);
  });
  it('localInstant keeps wall time over the spring change (2026-03-27 02:00 Israel)', () => {
    const d = localInstant(new Date(2026, 2, 26, 10, 0), 2, 18, 0);
    expect([d.getDate(), d.getHours()]).toEqual([28, 18]);
  });
  it('nextFire returns the next local occurrence of a weekly trigger', () => {
    const [mon] = computeTriggers(input({ settings: withS({ workout: { on: true, time: '09:00', days: [1] } }) }));
    const at = nextFire(mon!, NOW)!;
    expect([at.getDay(), at.getHours(), at.getDate()]).toEqual([1, 9, 9]);
    const [daily] = computeTriggers(input({ settings: withS({ meals: { ...DEFAULT_SETTINGS.meals, on: true, kinds: ['lunch'] } }) }));
    expect(nextFire(daily!, NOW)!.getDate()).toBe(4); // 13:00 today is still ahead of 12:00
  });
});

describe('normalizeSettings', () => {
  it('repairs malformed storage and keeps everything OFF', () => {
    const s = normalizeSettings({ workout: { on: 'yes', time: '25:99', days: [1, 1, 9, 'x'] }, quiet: 5, meals: { kinds: ['dinner', 'tea'] } });
    expect(s.workout).toEqual({ on: false, time: '18:00', days: [1] });
    expect(s.meals.kinds).toEqual(['dinner']); expect(s.quiet.on).toBe(true);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});
