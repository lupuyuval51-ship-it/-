import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays, todayInTimeZone } from '@shared/dates';
import { db } from '../src/db/pool';
import { seedBodyWeight } from './helpers/progressSeed';
import { TestClient, onboardedUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

const TODAY = todayInTimeZone('UTC');

/** A fat-loss user whose weight has been flat at 80 kg for four weeks (every 3 days). */
async function stalledUser(extra: Record<string, unknown> = {}) {
  const c = await onboardedUser(server.baseUrl, { goal: 'fat_loss', weight_kg: 80, ...extra }, { timezone: 'UTC' });
  for (let d = -27; d <= 0; d += 3) await seedBodyWeight(c.userId!, addDays(TODAY, d), 80);
  return c;
}

describe('weight-trend calorie suggestion', () => {
  it('has nothing to say without enough weigh-ins', async () => {
    const c = await onboardedUser(server.baseUrl, { goal: 'fat_loss' }, { timezone: 'UTC' });
    const res = await c.get('/api/profile/targets/suggestion');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ suggestion: null, reason: 'not_enough_data', adjustmentKcal: 0 });
  });

  it('offers a small cut when fat loss has stalled, and applies exactly that offer', async () => {
    const c = await stalledUser();
    const before = (await c.get('/api/profile')).body.profile.targets.calories;
    const offer = (await c.get('/api/profile/targets/suggestion')).body;
    expect(offer.reason).toBeNull();
    expect(offer.suggestion).toMatchObject({ code: 'loss_too_slow', offsetKcal: -100, deltaKcal: -100, currentCalories: before, proposedCalories: before - 100 });
    expect(offer.suggestion.proposedTargets.calories).toBe(before - 100);

    // Nothing changed yet; a different amount than the offer is refused.
    expect((await c.get('/api/profile')).body.profile.targets.calories).toBe(before);
    const wrong = await c.post('/api/profile/targets/adjustment', { offsetKcal: -150 });
    expect(wrong.status).toBe(409);
    expect(wrong.body.error.code).toBe('suggestion_changed');
    expect((await c.post('/api/profile/targets/adjustment', { offsetKcal: 400 })).status).toBe(400);

    const ok = await c.post('/api/profile/targets/adjustment', { offsetKcal: -100 });
    expect(ok.status).toBe(200);
    expect(ok.body.profile.targets).toMatchObject({ calories: before - 100, adjustmentKcal: -100, custom: false });
    expect(ok.body.profile.targets.computed.notes).toContain('user_adjustment');
    const stored = await db.one<{ calorie_target: number }>('SELECT calorie_target FROM profiles WHERE user_id = $1', [c.userId]);
    expect(stored.calorie_target).toBe(before - 100);

    // At most one suggestion per four weeks.
    expect((await c.get('/api/profile/targets/suggestion')).body).toEqual({ suggestion: null, reason: 'recently_adjusted', adjustmentKcal: -100 });

    const reset = await c.delete('/api/profile/targets/adjustment');
    expect(reset.body.profile.targets).toMatchObject({ calories: before, adjustmentKcal: 0 });
  });

  it('"not now" postpones the suggestion', async () => {
    const c = await stalledUser();
    expect((await c.post('/api/profile/targets/adjustment/dismiss', {})).body).toEqual({ ok: true });
    expect((await c.get('/api/profile/targets/suggestion')).body.reason).toBe('dismissed');
  });

  it('is never offered for custom targets', async () => {
    const c = await stalledUser();
    const t = (await c.get('/api/profile')).body.profile.targets;
    await c.put('/api/profile/targets', { calories: t.calories, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG });
    expect((await c.get('/api/profile/targets/suggestion')).body.reason).toBe('custom_targets');
  });

  it('is scoped to the signed-in user and requires authentication', async () => {
    const owner = await stalledUser();
    const other = await onboardedUser(server.baseUrl, { goal: 'fat_loss' }, { timezone: 'UTC' });
    expect((await other.get('/api/profile/targets/suggestion')).body.reason).toBe('not_enough_data');
    expect((await other.post('/api/profile/targets/adjustment', { offsetKcal: -100 })).status).toBe(409);
    expect((await owner.get('/api/profile/targets/suggestion')).body.suggestion).not.toBeNull();
    expect((await new TestClient(server.baseUrl).get('/api/profile/targets/suggestion')).status).toBe(401);
  });
});
