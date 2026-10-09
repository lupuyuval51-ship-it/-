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

  it('treats minors safely (no deficit)', async () => {
    const c = await registerUser(server.baseUrl);
    const res = await c.put('/api/profile/onboarding', { ...VALID_ONBOARDING, ageYears: 15, goal: 'fat_loss' });
    expect(res.status).toBe(200);
    expect(res.body.profile.isMinor).toBe(true);
    expect(res.body.profile.targets.computed.notes).toContain('minor_no_deficit');
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
});
