import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/db/pool';
import { TestClient, onboardedUser, registerUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

const REMINDERS = {
  enabled: true,
  workoutDays: [5, 1, 3, 3],
  workoutTime: '07:30',
  mealLogging: true,
  mealTimes: ['19:00', '08:15', '19:00', '12:45'],
};

describe('PATCH /api/settings — workout settings', () => {
  it('starts as null and keeps what each device sends, merged into the account', async () => {
    const c = await onboardedUser(server.baseUrl);
    expect((await c.get('/api/auth/me')).body.user.workoutPrefs).toBeNull();

    const first = await c.patch('/api/settings', { workoutPrefs: { wakeLock: false } });
    expect(first.status).toBe(200);
    expect(first.body.user.workoutPrefs).toEqual({ wakeLock: false, vibrate: true, autoAdvance: true, restSound: true });

    const second = await c.patch('/api/settings', { workoutPrefs: { restSound: false, autoAdvance: false } });
    expect(second.body.user.workoutPrefs).toEqual({ wakeLock: false, vibrate: true, autoAdvance: false, restSound: false });
    expect((await c.get('/api/auth/me')).body.user.workoutPrefs).toEqual(second.body.user.workoutPrefs);
  });

  it('rejects empty, unknown-typed and non-boolean values', async () => {
    const c = await onboardedUser(server.baseUrl);
    for (const bad of [{}, { wakeLock: 'yes' }, { vibrate: null }]) {
      const res = await c.patch('/api/settings', { workoutPrefs: bad });
      expect(res.status, JSON.stringify(bad)).toBe(400);
    }
  });

  it('is private to the account', async () => {
    const a = await onboardedUser(server.baseUrl);
    const b = await onboardedUser(server.baseUrl);
    await a.patch('/api/settings', { workoutPrefs: { vibrate: false } });
    expect((await b.get('/api/auth/me')).body.user.workoutPrefs).toBeNull();
  });
});

describe('PATCH /api/settings', () => {
  it('updates account preferences and returns the user and profile', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.patch('/api/settings', {
      displayName: '  Noa  ',
      locale: 'he',
      theme: 'light',
      units: 'imperial',
      timezone: 'Asia/Jerusalem',
    });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ displayName: 'Noa', locale: 'he', theme: 'light', units: 'imperial', timezone: 'Asia/Jerusalem', onboardingCompleted: true });
    expect(res.body.profile.goal).toBe('muscle_gain');
    const me = await c.get('/api/auth/me');
    expect(me.body.user).toMatchObject({ displayName: 'Noa', locale: 'he', theme: 'light', units: 'imperial', timezone: 'Asia/Jerusalem' });
  });

  it('changes only the provided fields', async () => {
    const c = await registerUser(server.baseUrl, { displayName: 'Original', locale: 'en' });
    await c.patch('/api/settings', { theme: 'dark' });
    const me = (await c.get('/api/auth/me')).body.user;
    expect(me).toMatchObject({ displayName: 'Original', locale: 'en', theme: 'dark', units: 'metric', timezone: 'UTC' });
    const profile = (await c.get('/api/profile')).body.profile;
    expect(profile.reminders.enabled).toBe(false);
  });

  it('stores reminders with sorted, de-duplicated days and meal times', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.patch('/api/settings', { reminders: REMINDERS });
    expect(res.status).toBe(200);
    expect(res.body.profile.reminders).toEqual({
      enabled: true,
      workoutDays: [1, 3, 5],
      workoutTime: '07:30',
      mealLogging: true,
      mealTimes: ['08:15', '12:45', '19:00'],
    });
    expect((await c.get('/api/profile')).body.profile.reminders.mealTimes).toEqual(['08:15', '12:45', '19:00']);
  });

  it('rejects invalid time zones, times and values', async () => {
    const c = await onboardedUser(server.baseUrl);
    const tz = await c.patch('/api/settings', { timezone: 'Mars/Olympus_Mons' });
    expect(tz.status).toBe(400);
    expect(tz.body.error.details.issues[0]).toMatchObject({ path: 'timezone', message: 'invalid_timezone' });

    const time = await c.patch('/api/settings', { reminders: { ...REMINDERS, workoutTime: '25:00' } });
    expect(time.status).toBe(400);
    expect(time.body.error.details.issues[0]).toMatchObject({ path: 'reminders.workoutTime', message: 'invalid_time' });

    const mealTime = await c.patch('/api/settings', { reminders: { ...REMINDERS, mealTimes: ['8:00'] } });
    expect(mealTime.status).toBe(400);
    expect(mealTime.body.error.details.issues[0].message).toBe('invalid_time');

    for (const bad of [
      { locale: 'fr' },
      { theme: 'neon' },
      { units: 'cubits' },
      { displayName: '   ' },
      { displayName: 'x'.repeat(61) },
      { reminders: { ...REMINDERS, workoutDays: [7] } },
      { reminders: { ...REMINDERS, mealTimes: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00'] } },
      { reminders: { enabled: true } },
    ]) {
      const res = await c.patch('/api/settings', bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
    const me = (await c.get('/api/auth/me')).body.user;
    expect(me).toMatchObject({ locale: 'en', theme: 'system', units: 'metric', timezone: 'UTC', displayName: 'Test User' });
  });

  it('only changes the caller’s own account', async () => {
    const a = await onboardedUser(server.baseUrl, {}, { displayName: 'Alice' });
    const b = await onboardedUser(server.baseUrl, {}, { displayName: 'Bob' });
    await b.patch('/api/settings', { displayName: 'Bobby', reminders: REMINDERS });
    expect((await a.get('/api/auth/me')).body.user.displayName).toBe('Alice');
    expect((await a.get('/api/profile')).body.profile.reminders.enabled).toBe(false);
  });

  it('requires authentication', async () => {
    const anon = new TestClient(server.baseUrl);
    const res = await anon.patch('/api/settings', { theme: 'dark' });
    expect(res.status).toBe(401);
  });
});
