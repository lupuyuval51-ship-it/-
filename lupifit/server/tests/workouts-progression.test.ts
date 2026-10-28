/**
 * "Apply progression" with a stand-in for the sessions module's suggestProgressions
 * contract (the real implementation derives suggestions from recorded sets).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrescriptionInput } from '../src/modules/sessions/progression';

vi.mock('../src/modules/sessions/progression', () => ({
  suggestProgressions: vi.fn(async (_sql: unknown, _userId: string, inputs: PrescriptionInput[]) =>
    inputs.map((i, idx) => {
      if (idx === 0) return { exerciseId: i.exerciseId, action: 'increase_weight', targetWeightKg: (i.targetWeightKg ?? 20) + 2.5, repMin: i.repMin, repMax: i.repMax, targetSeconds: i.targetSeconds, reasonCode: 'hit_top_of_range' };
      if (idx === 1) return { exerciseId: i.exerciseId, action: 'increase_reps', targetWeightKg: i.targetWeightKg, repMin: (i.repMin ?? 8) + 1, repMax: (i.repMax ?? 12) + 1, targetSeconds: i.targetSeconds, reasonCode: 'add_reps' };
      // Invalid suggestion (rep range inverted) must be ignored.
      if (idx === 2) return { exerciseId: i.exerciseId, action: 'increase_reps', targetWeightKg: null, repMin: 12, repMax: 4, targetSeconds: null, reasonCode: 'bogus' };
      return { exerciseId: i.exerciseId, action: 'maintain', targetWeightKg: i.targetWeightKg, repMin: i.repMin, repMax: i.repMax, targetSeconds: i.targetSeconds, reasonCode: 'maintain' };
    }),
  ),
}));

const { db } = await import('../src/db/pool');
const { onboardedUser, startTestServer } = await import('./helpers/server');

let server: Awaited<ReturnType<typeof startTestServer>>;
beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

describe('apply progression', () => {
  it('updates changed targets only, validates suggestions and reports before/after', async () => {
    const c = await onboardedUser(server.baseUrl, { ability: { squat1rmKg: 100, bench1rmKg: 80, deadlift1rmKg: 120 } });
    const gen = await c.post('/api/plans/generate', { daysPerWeek: 1 });
    expect(gen.status).toBe(201);
    const plan = gen.body.plan;
    const rows = plan.workouts[0].exercises;
    const res = await c.post(`/api/plans/${plan.id}/apply-progression`);
    expect(res.status).toBe(200);
    const { changes, plan: updated } = res.body;
    expect(changes).toHaveLength(2);
    expect(changes[0]).toMatchObject({
      planExerciseId: rows[0].id,
      exerciseId: rows[0].exerciseId,
      action: 'increase_weight',
      before: { targetWeightKg: rows[0].targetWeightKg },
      after: { targetWeightKg: (rows[0].targetWeightKg ?? 20) + 2.5 },
    });
    expect(changes[1]).toMatchObject({ action: 'increase_reps', after: { repMin: rows[1].repMin + 1, repMax: rows[1].repMax + 1 } });
    const after = updated.workouts[0].exercises;
    expect(after[0].targetWeightKg).toBe((rows[0].targetWeightKg ?? 20) + 2.5);
    expect(after[1].repMin).toBe(rows[1].repMin + 1);
    expect(after[2]).toEqual(rows[2]);
    expect(after.slice(3)).toEqual(rows.slice(3));
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(plan.updatedAt));
  });
});
