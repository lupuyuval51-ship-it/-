import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/db/pool';
import { VALID_ONBOARDING } from './helpers/fixtures';
import { registerUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});


describe('onboarding', () => {
  it('saves every answer, computes targets and logs the starting weight', async () => {
    const c = await registerUser(server.baseUrl, { timezone: 'Asia/Jerusalem' });
    const before = await c.get('/api/profile');
    expect(before.body.profile.onboardingCompletedAt).toBeNull();
    expect(before.body.profile.targets).toBeNull();

    const res = await c.put('/api/profile/onboarding', VALID_ONBOARDING);
    expect(res.status).toBe(200);
    expect(res.body.user.onboardingCompleted).toBe(true);
    const p = res.body.profile;
    for (const [k, v] of Object.entries(VALID_ONBOARDING)) {
      if (k === 'ability') expect(p.ability).toEqual(v);
      else expect(p[k], k).toEqual(v);
    }
    expect(p.currentAge).toBe(28);
    expect(p.isMinor).toBe(false);
    expect(p.weeklyWorkoutGoal).toBe(3);
    expect(p.targets.calories).toBeGreaterThan(1200);
    expect(p.targets.custom).toBe(false);

    const again = await c.get('/api/profile');
    expect(again.body.profile.goal).toBe('general_fitness');
    const weights = await db.many('SELECT weight_kg FROM body_weight_entries WHERE user_id = $1', [c.userId]);
    expect(weights.map((w) => w.weight_kg)).toEqual([62]);
    const stored = await db.one<{ calorie_target: number }>('SELECT calorie_target FROM profiles WHERE user_id = $1', [c.userId]);
    expect(stored.calorie_target).toBe(p.targets.calories);
  });

  it('uses the preferred training days for reminders, without overriding days the user chose', async () => {
    const c = await registerUser(server.baseUrl);
    await c.put('/api/profile/onboarding', { ...VALID_ONBOARDING, preferredDays: [5, 1, 3] });
    const seeded = (await c.get('/api/profile')).body.profile.reminders;
    expect(seeded.workoutDays).toEqual([1, 3, 5]);
    expect(seeded.enabled).toBe(false); // seeding picks days only; notifications stay off until the user opts in

    const own = await registerUser(server.baseUrl);
    await own.patch('/api/settings', { reminders: { enabled: true, workoutDays: [2], workoutTime: '07:00', mealLogging: false, mealTimes: ['08:00'] } });
    await own.put('/api/profile/onboarding', { ...VALID_ONBOARDING, preferredDays: [4, 6] });
    expect((await own.get('/api/profile')).body.profile.reminders.workoutDays).toEqual([2]);
  });

  it('treats minors safely (no deficit)', async () => {
    const c = await registerUser(server.baseUrl);
    const res = await c.put('/api/profile/onboarding', { ...VALID_ONBOARDING, ageYears: 15, goal: 'fat_loss' });
    expect(res.status).toBe(200);
    expect(res.body.profile.isMinor).toBe(true);
    expect(res.body.profile.targets.computed.notes).toContain('minor_no_deficit');
  });

  it('completes for every allowed body size, even when computed targets exceed the stored-target ranges', async () => {
    // Tall, heavy, very active adult: computed target > 6000 kcal (profiles.calorie_target CHECK is 1000–6000).
    const big = await registerUser(server.baseUrl);
    const res = await big.put('/api/profile/onboarding', {
      ...VALID_ONBOARDING,
      sex: 'male',
      heightCm: 200,
      weightKg: 200,
      activityLevel: 'very_active',
      goal: 'muscle_gain',
    });
    expect(res.status).toBe(200);
    expect(res.body.profile.targets.calories).toBeGreaterThan(6000);
    // Small, sedentary 13-year-old: computed target < 1000 kcal (no deficit — it is their maintenance).
    const small = await registerUser(server.baseUrl);
    const res2 = await small.put('/api/profile/onboarding', {
      ...VALID_ONBOARDING,
      ageYears: 13,
      heightCm: 120,
      weightKg: 30,
      activityLevel: 'sedentary',
    });
    expect(res2.status).toBe(200);
    expect(res2.body.profile.targets.calories).toBeLessThan(1000);
    expect(res2.body.profile.isMinor).toBe(true);
  });

  it('rejects invalid answers', async () => {
    const c = await registerUser(server.baseUrl);
    const young = await c.put('/api/profile/onboarding', { ...VALID_ONBOARDING, ageYears: 12 });
    expect(young.status).toBe(400);
    expect(young.body.error.details.issues[0].message).toBe('age_too_young');
    expect((await c.put('/api/profile/onboarding', { ...VALID_ONBOARDING, equipment: ['laser_cannon'] })).status).toBe(400);
    expect((await c.put('/api/profile/onboarding', { ...VALID_ONBOARDING, daysPerWeek: 9 })).status).toBe(400);
    expect((await c.put('/api/profile/onboarding', { ...VALID_ONBOARDING, heightCm: 500 })).status).toBe(400);
    const { goal: _goal, ...missing } = VALID_ONBOARDING;
    expect((await c.put('/api/profile/onboarding', missing)).status).toBe(400);
    expect((await c.get('/api/profile')).body.profile.onboardingCompletedAt).toBeNull();
  });

  it('re-running keeps the completion date, drops unknown exercises and resets unsafe custom targets', async () => {
    const c = await registerUser(server.baseUrl);
    const first = await c.put('/api/profile/onboarding', VALID_ONBOARDING);
    const completedAt = first.body.profile.onboardingCompletedAt;
    const custom = await c.put('/api/profile/targets', { calories: 1500, proteinG: 100, carbsG: 163, fatG: 50 });
    expect(custom.status).toBe(200);
    const again = await c.put('/api/profile/onboarding', { ...VALID_ONBOARDING, ageYears: 16, avoidExerciseIds: ['burpee', 'no_such_exercise'] });
    expect(again.status).toBe(200);
    expect(again.body.profile.onboardingCompletedAt).toBe(completedAt);
    expect(again.body.profile.avoidExerciseIds).toEqual(['burpee']);
    expect(again.body.profile.isMinor).toBe(true);
    expect(again.body.profile.targets.custom).toBe(false);
  });
});
