import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/db/pool';
import { onboardedUser, registerUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let gymUser: TestClient;
let homeUser: TestClient;

beforeAll(async () => {
  server = await startTestServer();
  gymUser = await onboardedUser(server.baseUrl);
  homeUser = await onboardedUser(server.baseUrl, { training_location: 'home', equipment: [], injuries: ['shoulder'] });
});
afterAll(async () => {
  await server.close();
  await db.close();
});

describe('exercise library API', () => {
  it('lists, paginates and filters by muscle group, difficulty and category', async () => {
    const all = await gymUser.get('/api/exercises?pageSize=10');
    expect(all.status).toBe(200);
    expect(all.body.items).toHaveLength(10);
    expect(all.body.total).toBeGreaterThan(50);
    const chest = await gymUser.get('/api/exercises?muscleGroup=chest&pageSize=100');
    expect(chest.body.items.length).toBeGreaterThan(3);
    for (const e of chest.body.items) expect(e.primaryMuscles.some((m: string) => ['chest'].includes(m))).toBe(true);
    const adv = await gymUser.get('/api/exercises?difficulty=advanced&category=calisthenics&pageSize=100');
    for (const e of adv.body.items) {
      expect(e.difficulty).toBe('advanced');
      expect(e.category).toBe('calisthenics');
    }
  });

  it('searches in English and Hebrew', async () => {
    const en = await gymUser.get('/api/exercises?q=squat');
    expect(en.body.items.some((e: { id: string }) => e.id === 'barbell_back_squat')).toBe(true);
    const he = await gymUser.get(`/api/exercises?q=${encodeURIComponent('סקוואט')}`);
    expect(he.body.items.length).toBeGreaterThan(0);
    const none = await gymUser.get('/api/exercises?q=zzzzqqq');
    expect(none.body.total).toBe(0);
  });

  it('availableOnly respects the user equipment', async () => {
    const res = await homeUser.get('/api/exercises?availableOnly=true&pageSize=100');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(5);
    for (const e of res.body.items) expect(e.equipment).toEqual([]);
  });

  it('returns detail with alternatives, user context and honest media flag', async () => {
    const res = await homeUser.get('/api/exercises/barbell_overhead_press');
    expect(res.status).toBe(200);
    const ex = res.body.exercise;
    expect(ex.instructions.en.length).toBeGreaterThanOrEqual(4);
    expect(ex.instructions.he.length).toBe(ex.instructions.en.length);
    expect(ex.media).toBeNull();
    // No video asset is attached, but every exercise ships a built-in animated demonstration.
    expect(ex.hasMedia).toBe(true);
    expect(ex.userContext.hasRequiredEquipment).toBe(false);
    expect(ex.userContext.missingEquipment).toContain('barbell');
    expect(ex.userContext.injuryConflicts).toContain('shoulder');
    expect(ex.recentHistory).toEqual([]);
  });

  it('validates params and 404s unknown exercises', async () => {
    expect((await gymUser.get('/api/exercises/not_a_real_exercise')).status).toBe(404);
    expect((await gymUser.get('/api/exercises/BAD-ID!')).status).toBe(400);
    expect((await gymUser.get('/api/exercises?difficulty=expert')).status).toBe(400);
    const fresh = await registerUser(server.baseUrl);
    const detail = await fresh.get('/api/exercises/push_up');
    expect(detail.status).toBe(200);
    expect(detail.body.exercise.userContext).toBeNull();
  });
});
