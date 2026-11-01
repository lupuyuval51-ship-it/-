import { describe, expect, it } from 'vitest';
import { call, makeApp, PROFILE, register, type TestCtx } from './helpers.ts';

const presc = { sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSec: 90, loadKg: null, durationSec: null };
const plan = (loadKg: number | null = null) => ({ days: [{ day: 'full_a', exercises: [{ exerciseId: 'push_up', prescription: { ...presc, loadKg } }], estimatedMinutes: 20 }], notes: [] });

async function onboard(t: TestCtx, email: string, ip: string) {
  const c = await register(t, email, ip);
  expect((await call(t, c, 'PUT', '/api/profile', PROFILE)).status).toBe(200);
  return c;
}

describe('PUT /api/plans/:id/plan', () => {
  it('replaces the stored plan JSON and keeps name/active', async () => {
    const t = await makeApp(); const c = await onboard(t, 'a@example.com', '10.0.0.1');
    const id = (await call(t, c, 'POST', '/api/plans', { name: 'Mine', plan: plan(), activate: true })).json.id as string;
    const edited = { days: [{ day: 'full_a', exercises: [{ exerciseId: 'push_up', prescription: { ...presc, sets: 4 } }], estimatedMinutes: 25 }], notes: [] };
    const r = await call(t, c, 'PUT', `/api/plans/${id}/plan`, { plan: edited });
    expect(r.status, JSON.stringify(r.json)).toBe(200);
    const list = (await call(t, c, 'GET', '/api/plans')).json.plans as { id: string; name: string; active: boolean; plan: typeof edited }[];
    const row = list.find((x) => x.id === id)!;
    expect(row.name).toBe('Mine'); expect(row.active).toBe(true);
    expect(row.plan.days[0]!.exercises[0]!.prescription.sets).toBe(4); expect(row.plan.days[0]!.estimatedMinutes).toBe(25);
  });
  it('rejects unknown exercises and invalid prescriptions', async () => {
    const t = await makeApp(); const c = await onboard(t, 'a@example.com', '10.0.0.1');
    const id = (await call(t, c, 'POST', '/api/plans', { name: 'Mine', plan: plan() })).json.id as string;
    const bad = plan(); bad.days[0]!.exercises[0]!.exerciseId = 'not_an_exercise';
    expect((await call(t, c, 'PUT', `/api/plans/${id}/plan`, { plan: bad })).status).toBe(400);
    const bad2 = plan(); bad2.days[0]!.exercises[0]!.prescription.sets = 99;
    expect((await call(t, c, 'PUT', `/api/plans/${id}/plan`, { plan: bad2 })).status).toBe(400);
    expect((await call(t, c, 'PUT', `/api/plans/${id}/plan`, { plan: { days: [], notes: [] } })).status).toBe(400);
  });
  it('another user gets 404 and the plan is untouched; unknown id is 404', async () => {
    const t = await makeApp(); const a = await onboard(t, 'a@example.com', '10.0.0.1'); const b = await onboard(t, 'b@example.com', '10.0.0.2');
    const id = (await call(t, a, 'POST', '/api/plans', { name: 'Mine', plan: plan(20) })).json.id as string;
    expect((await call(t, b, 'PUT', `/api/plans/${id}/plan`, { plan: plan(99) })).status).toBe(404);
    expect((await call(t, a, 'PUT', '/api/plans/nope/plan', { plan: plan() })).status).toBe(404);
    const row = ((await call(t, a, 'GET', '/api/plans')).json.plans as { id: string; plan: ReturnType<typeof plan> }[]).find((x) => x.id === id)!;
    expect(row.plan.days[0]!.exercises[0]!.prescription.loadKg).toBe(20);
  });
});
