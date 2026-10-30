import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays, todayInTimeZone } from '@shared/dates';
import { db } from '../src/db/pool';
import { VALID_ONBOARDING } from './helpers/fixtures';
import { TestClient, onboardedUser, registerUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

const weights = (userId: string) =>
  db.many<{ measured_on: string; weight_kg: number }>('SELECT measured_on, weight_kg FROM body_weight_entries WHERE user_id = $1 ORDER BY measured_on', [userId]);

describe('PATCH /api/profile', () => {
  it('updates only the provided fields and sanitizes text', async () => {
    const c = await registerUser(server.baseUrl);
    await c.put('/api/profile/onboarding', VALID_ONBOARDING);
    const res = await c.patch('/api/profile', {
      goal: 'strength',
      equipment: ['barbell', 'barbell', 'squat_rack'],
      preferredDays: [5, 1, 3],
      exerciseLikes: '  deadlifts <b>and</b> rows  ',
      ability: { pushUpsMax: 20, pullUpsMax: 5, plankSeconds: 90, squat1rmKg: 100, bench1rmKg: 70, deadlift1rmKg: 120 },
      sleepHours: 6.5,
      stressLevel: null,
    });
    expect(res.status).toBe(200);
    const p = res.body.profile;
    expect(p.goal).toBe('strength');
    expect(p.equipment).toEqual(['barbell', 'squat_rack']);
    expect(p.preferredDays).toEqual([1, 3, 5]);
    expect(p.exerciseLikes).toBe('deadlifts band/b rows');
    expect(p.ability.squat1rmKg).toBe(100);
    expect(p.sleepHours).toBe(6.5);
    expect(p.stressLevel).toBeNull();
    expect(res.body.customTargetsReset).toBe(false);
    // Untouched fields keep their onboarding answers.
    expect(p.dietType).toBe('vegetarian');
    expect(p.injuries).toEqual(['knee']);
    expect(p.weightKg).toBe(62);
    expect(p.onboardingCompletedAt).not.toBeNull();
    const again = await c.get('/api/profile');
    expect(again.body.profile).toEqual(p);
  });

  it('logs a changed weight as today’s body-weight entry and recomputes targets', async () => {
    const tz = 'Pacific/Kiritimati'; // UTC+14: "today" usually differs from the UTC date
    const c = await registerUser(server.baseUrl, { timezone: tz });
    await c.put('/api/profile/onboarding', VALID_ONBOARDING);
    const before = (await c.get('/api/profile')).body.profile;
    // Pretend the onboarding weight was logged two days ago so today's entry is new.
    const today = todayInTimeZone(tz);
    await db.exec('UPDATE body_weight_entries SET measured_on = $2 WHERE user_id = $1', [c.userId, addDays(today, -2)]);

    const res = await c.patch('/api/profile', { weightKg: 70.04 });
    expect(res.status).toBe(200);
    expect(res.body.profile.weightKg).toBe(70);
    expect(res.body.profile.targets.calories).toBeGreaterThan(before.targets.calories);
    expect(res.body.profile.targets.custom).toBe(false);
    expect(await weights(c.userId!)).toEqual([
      { measured_on: addDays(today, -2), weight_kg: 62 },
      { measured_on: today, weight_kg: 70 },
    ]);
    const stored = await db.one<{ calorie_target: number; protein_target_g: number }>(
      'SELECT calorie_target, protein_target_g FROM profiles WHERE user_id = $1',
      [c.userId],
    );
    expect(stored.calorie_target).toBe(res.body.profile.targets.calories);
    expect(stored.protein_target_g).toBe(res.body.profile.targets.proteinG);

    // Same weight again → no new entry; a second change the same day updates today's entry.
    await c.patch('/api/profile', { weightKg: 70 });
    expect(await weights(c.userId!)).toHaveLength(2);
    await c.patch('/api/profile', { weightKg: 69.5 });
    const list = await weights(c.userId!);
    expect(list).toHaveLength(2);
    expect(list[1]).toEqual({ measured_on: today, weight_kg: 69.5 });
  });

  it('restarts the age clock only when the age answer changes', async () => {
    const c = await onboardedUser(server.baseUrl, { age_years: 30 });
    const twoYearsAgo = addDays(todayInTimeZone('UTC'), -731);
    await db.exec('UPDATE profiles SET age_recorded_on = $2 WHERE user_id = $1', [c.userId, twoYearsAgo]);
    const before = (await c.get('/api/profile')).body.profile;
    expect(before.currentAge).toBe(32);

    // Submitting the displayed (current) age changes nothing.
    await c.patch('/api/profile', { ageYears: 32 });
    let row = await db.one<{ age_years: number; age_recorded_on: string }>('SELECT age_years, age_recorded_on FROM profiles WHERE user_id = $1', [c.userId]);
    expect(row).toEqual({ age_years: 30, age_recorded_on: twoYearsAgo });

    const res = await c.patch('/api/profile', { ageYears: 35 });
    expect(res.body.profile.ageYears).toBe(35);
    expect(res.body.profile.currentAge).toBe(35);
    row = await db.one('SELECT age_years, age_recorded_on FROM profiles WHERE user_id = $1', [c.userId]);
    expect(row).toEqual({ age_years: 35, age_recorded_on: todayInTimeZone('UTC') });
  });

  it('drops unknown exercise ids from the avoid list', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.patch('/api/profile', { avoidExerciseIds: ['burpee', 'not_a_real_exercise', 'pull_up'] });
    expect(res.status).toBe(200);
    expect(res.body.profile.avoidExerciseIds).toEqual(['burpee', 'pull_up']);
  });

  it('resets custom targets that become unsafe after the change', async () => {
    const c = await onboardedUser(server.baseUrl); // 30 y, male, 180 cm, 80 kg → minimum 1780 kcal, protein ≥ 64 g
    const custom = await c.put('/api/profile/targets', { calories: 2000, proteinG: 70, carbsG: 255, fatG: 60 });
    expect(custom.status).toBe(200);
    expect(custom.body.profile.targets.custom).toBe(true);

    // A safe change keeps the custom targets.
    const safe = await c.patch('/api/profile', { goal: 'fat_loss' });
    expect(safe.body.customTargetsReset).toBe(false);
    expect(safe.body.profile.targets).toMatchObject({ custom: true, calories: 2000, proteinG: 70 });

    // 100 kg raises the protein minimum to 80 g → custom targets are replaced by the recommended ones.
    const res = await c.patch('/api/profile', { weightKg: 100 });
    expect(res.body.customTargetsReset).toBe(true);
    expect(res.body.profile.targets.custom).toBe(false);
    expect(res.body.profile.targets.calories).toBe(res.body.profile.targets.computed.calories);
  });

  it('never keeps a calorie deficit for someone who becomes a minor', async () => {
    const c = await onboardedUser(server.baseUrl);
    await c.put('/api/profile/targets', { calories: 2000, proteinG: 160, carbsG: 205, fatG: 60 });
    const res = await c.patch('/api/profile', { ageYears: 16 });
    expect(res.body.profile.isMinor).toBe(true);
    expect(res.body.customTargetsReset).toBe(true);
    expect(res.body.profile.targets.custom).toBe(false);
    expect(res.body.profile.targets.calories).toBeGreaterThanOrEqual(res.body.profile.targets.computed.minimumCalories);
  });

  it('validates every field and changes nothing on error', async () => {
    const c = await onboardedUser(server.baseUrl);
    const before = (await c.get('/api/profile')).body.profile;
    for (const bad of [
      { goal: 'get_huge' },
      { ageYears: 12 },
      { heightCm: 300 },
      { weightKg: 'heavy' },
      { daysPerWeek: 0 },
      { equipment: ['laser_cannon'] },
      { preferredDays: [7] },
      { avoidExerciseIds: ['Bad Id!'] },
      { exerciseLikes: 'x'.repeat(1200) },
      { mealsPerDay: 9 },
      { weeklyWorkoutGoal: 8 },
      { sleepHours: 30 },
    ]) {
      const res = await c.patch('/api/profile', bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
    const young = await c.patch('/api/profile', { ageYears: 12 });
    expect(young.body.error.details.issues[0]).toMatchObject({ path: 'ageYears', message: 'age_too_young' });
    expect((await c.get('/api/profile')).body.profile).toEqual(before);
  });

  it('accepts an empty update and returns the profile unchanged', async () => {
    const c = await onboardedUser(server.baseUrl);
    const before = (await c.get('/api/profile')).body.profile;
    const res = await c.patch('/api/profile', {});
    expect(res.status).toBe(200);
    expect(res.body.profile.goal).toBe(before.goal);
  });

  it('only ever touches the caller’s own profile', async () => {
    const a = await onboardedUser(server.baseUrl, { goal: 'muscle_gain' });
    const b = await onboardedUser(server.baseUrl, { goal: 'muscle_gain' });
    const aBefore = (await a.get('/api/profile')).body.profile;
    await b.patch('/api/profile', { goal: 'fat_loss', weightKg: 95, injuries: ['wrist'] });
    expect((await a.get('/api/profile')).body.profile).toEqual(aBefore);
    expect((await b.get('/api/profile')).body.profile.goal).toBe('fat_loss');
    expect(await weights(a.userId!)).toEqual([]);
  });

  it('requires authentication and a CSRF token', async () => {
    const anon = new TestClient(server.baseUrl);
    expect((await anon.patch('/api/profile', { goal: 'strength' })).status).toBe(401);
    expect((await anon.get('/api/profile')).status).toBe(401);
    const c = await onboardedUser(server.baseUrl);
    const noCsrf = await c.patch('/api/profile', { goal: 'strength' }, { csrf: false });
    expect(noCsrf.status).toBe(403);
    expect(noCsrf.body.error.code).toBe('csrf_invalid');
  });
});
