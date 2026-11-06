import { describe, expect, it } from 'vitest';
import { EXERCISES } from '@lupu-fit/shared/content';
import { call, makeApp, PROFILE, register, type TestCtx } from './helpers.ts';
import { COACH_LIMITS } from '../src/routes/coach.ts';

const D = '2026-11-02';
const presc = { sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSec: 90, loadKg: null, durationSec: null };
async function onboard(t: TestCtx, username = 'user_a', ip = '10.0.0.1', profile: Record<string, unknown> = {}) {
  const c = await register(t, username, ip);
  expect((await call(t, c, 'PUT', '/api/profile', { ...PROFILE, ...profile })).status).toBe(200);
  return c;
}
const bench = 'barbell_bench_press';
async function workout(t: TestCtx, c: Awaited<ReturnType<typeof onboard>>, weight: number, date = D, advance = 0) {
  t.now.t = new Date(t.now.t.getTime() + advance);
  const s = await call(t, c, 'POST', '/api/sessions', { name: 'Chest', source: 'custom', localDate: date, exercises: [{ exerciseId: bench, planned: presc }, { exerciseId: 'push_up', planned: presc }] });
  expect(s.status, JSON.stringify(s.json)).toBe(201);
  const se = s.json.exercises[0].id as string;
  for (let i = 0; i < 3; i++) expect((await call(t, c, 'POST', `/api/sessions/${s.json.id}/sets`, { sessionExerciseId: se, reps: 8, weightKg: weight, rpe: 7 })).status).toBe(201);
  t.now.t = new Date(t.now.t.getTime() + 25 * 60_000);
  const f = await call(t, c, 'POST', `/api/sessions/${s.json.id}/finish`);
  expect(f.status, JSON.stringify(f.json)).toBe(200);
  return { id: s.json.id as string, finish: f.json };
}

describe('profile', () => {
  it('upserts, validates hard bounds, and returns computed targets', async () => {
    const t = await makeApp(); const c = await register(t);
    expect((await call(t, c, 'GET', '/api/profile')).status).toBe(404);
    expect((await call(t, c, 'PUT', '/api/profile', { ...PROFILE, age: 12 })).status).toBe(400);
    expect((await call(t, c, 'PUT', '/api/profile', { ...PROFILE, weightKg: 301 })).status).toBe(400);
    const r = await call(t, c, 'PUT', '/api/profile', PROFILE);
    expect(r.json.targets.kcal).toBeGreaterThan(1500); expect(r.json.targets.carbsG).toBeGreaterThanOrEqual(130);
    expect((await call(t, c, 'GET', '/api/auth/me')).json.onboarded).toBe(true);
  });
  it('a minor with fat_loss never gets a deficit', async () => {
    const t = await makeApp(); const c = await onboard(t, 'kid', '10.0.0.9', { age: 15, goal: 'fat_loss' });
    const p = await call(t, c, 'GET', '/api/profile');
    expect(p.json.targets.kcal).toBeGreaterThanOrEqual(p.json.targets.tdee); expect(p.json.targets.notes).toContain('minor_no_deficit');
  });
});

describe('workout sessions, PRs, XP, achievements', () => {
  it('logs sets, finishes, awards XP once, baseline is not a PR, a later improvement is', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const a = await workout(t, c, 60);
    expect(a.finish.totalSets).toBe(3); expect(a.finish.prs).toEqual([]);
    expect(a.finish.xp.map((x: { type: string }) => x.type).sort()).toEqual(['sets', 'workout']);
    expect(a.finish.xpTotal).toBe(50 + 6);
    expect(a.finish.achievements).toContain('first_workout');
    const b = await workout(t, c, 70, '2026-11-03', 24 * 3600_000);
    expect(b.finish.prs).toHaveLength(1); expect(b.finish.prs[0].exerciseId).toBe(bench);
    expect(b.finish.xp.map((x: { type: string }) => x.type)).toContain('pr');
    expect(b.finish.achievements).toContain('first_pr');
    const total = (await call(t, c, 'GET', '/api/stats')).json.xp;
    expect(total).toBe(a.finish.xpTotal + b.finish.xpTotal);
  });
  it('a second workout on the same day earns no extra workout XP', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const a = await workout(t, c, 60);
    const b = await workout(t, c, 60);
    expect(a.finish.xp.some((x: { type: string }) => x.type === 'workout')).toBe(true);
    expect(b.finish.xp.some((x: { type: string }) => x.type === 'workout')).toBe(false);
  });
  it('only one active session; set validation; finisher rows persist their sport', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const s = await call(t, c, 'POST', '/api/sessions', { name: 'W', source: 'ready', sport: 'soccer', localDate: D, exercises: [{ exerciseId: bench, planned: presc }, { exerciseId: 'forearm_plank', planned: { ...presc, durationSec: 30 }, isFinisher: true, sport: 'soccer' }] });
    expect(s.status).toBe(201);
    expect(s.json.exercises[1].isFinisher).toBe(true); expect(s.json.exercises[1].sport).toBe('soccer'); expect(s.json.exercises[0].sport).toBeNull();
    expect((await call(t, c, 'POST', '/api/sessions', { name: 'W2', source: 'custom', localDate: D, exercises: [{ exerciseId: bench, planned: presc }] })).status).toBe(409);
    expect((await call(t, c, 'GET', '/api/sessions/active')).json.session.id).toBe(s.json.id);
    expect((await call(t, c, 'POST', `/api/sessions/${s.json.id}/sets`, { sessionExerciseId: s.json.exercises[0].id, reps: 101 })).status).toBe(400);
    expect((await call(t, c, 'POST', `/api/sessions/${s.json.id}/sets`, { sessionExerciseId: s.json.exercises[0].id })).status).toBe(400);
    expect((await call(t, c, 'POST', '/api/sessions', { name: 'x', source: 'custom', localDate: D, exercises: [{ exerciseId: 'not_real', planned: presc }] })).status).toBe(400);
  });
  it('replace is refused once a set exists; undo removes a set; order must be a permutation', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const s = await call(t, c, 'POST', '/api/sessions', { name: 'W', source: 'custom', localDate: D, exercises: [{ exerciseId: bench, planned: presc }, { exerciseId: 'push_up', planned: presc }] });
    const [e0, e1] = s.json.exercises as { id: string }[];
    const set = await call(t, c, 'POST', `/api/sessions/${s.json.id}/sets`, { sessionExerciseId: e0!.id, reps: 5, weightKg: 50 });
    expect((await call(t, c, 'PATCH', `/api/sessions/${s.json.id}/exercises/${e0!.id}`, { exerciseId: 'push_up' })).status).toBe(409);
    expect((await call(t, c, 'PATCH', `/api/sessions/${s.json.id}/exercises/${e1!.id}`, { exerciseId: 'wide_push_up' })).status).toBe(200);
    expect((await call(t, c, 'DELETE', `/api/sessions/${s.json.id}/sets/${set.json.id}`)).status).toBe(200);
    expect((await call(t, c, 'PUT', `/api/sessions/${s.json.id}/order`, { ids: [e1!.id] })).status).toBe(400);
    const re = await call(t, c, 'PUT', `/api/sessions/${s.json.id}/order`, { ids: [e1!.id, e0!.id] });
    expect(re.json.exercises[0].id).toBe(e1!.id);
  });
});

describe('exercise history', () => {
  it('returns the last sessions for an exercise (newest first) plus the stored record; 404 for unknown ids', async () => {
    const t = await makeApp(); const c = await onboard(t);
    await workout(t, c, 60); await workout(t, c, 70, '2026-11-03', 24 * 3600_000);
    const h = (await call(t, c, 'GET', `/api/exercises/${bench}/history?limit=5`)).json;
    expect(h.history).toHaveLength(2); expect(h.history[0].date).toBe('2026-11-03'); expect(h.history[0].sets[0].weightKg).toBe(70); expect(h.record.maxWeight).toBe(70);
    expect((await call(t, c, 'GET', '/api/exercises/nope/history')).status).toBe(404);
    expect((await call(t, c, 'GET', '/api/exercises/squat_nothing/history')).status).toBe(404);
  });
});

describe('isolation and idempotency', () => {
  it("another user's resources are 404, never 403, on every user-owned route", async () => {
    const t = await makeApp(); const a = await onboard(t, 'user_a', '10.0.0.1'); const b = await onboard(t, 'user_b', '10.0.0.2');
    const w = await workout(t, a, 60);
    const plan = await call(t, a, 'POST', '/api/plans', { name: 'P', plan: { days: [{ day: 'full_a', exercises: [{ exerciseId: 'push_up', prescription: { sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSec: 90, loadKg: null, durationSec: null } }], estimatedMinutes: 20 }] } });
    expect(plan.status).toBe(201);
    const meal = await call(t, a, 'POST', '/api/saved-meals', { name: 'M', slot: 'lunch', items: [{ name: 'Rice', grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 }] });
    const entry = await call(t, a, 'POST', '/api/food-log', { loggedDate: D, slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 });
    const thread = await call(t, a, 'POST', '/api/coach/threads', {});
    for (const [m, p] of [['GET', `/api/sessions/${w.id}`], ['DELETE', `/api/sessions/${w.id}`], ['POST', `/api/sessions/${w.id}/finish`], ['POST', `/api/plans/${plan.json.id}/activate`], ['DELETE', `/api/plans/${plan.json.id}`], ['DELETE', `/api/saved-meals/${meal.json.id}`], ['POST', `/api/saved-meals/${meal.json.id}/log`], ['DELETE', `/api/food-log/${entry.json.entry.id}`], ['GET', `/api/coach/threads/${thread.json.id}`], ['DELETE', `/api/coach/threads/${thread.json.id}`]] as const) {
      const r = await call(t, b, m, p, m === 'POST' || m === 'DELETE' ? (p.endsWith('/log') ? { loggedDate: D } : {}) : undefined);
      expect(r.status, `${m} ${p}`).toBe(404);
    }
    expect((await call(t, a, 'GET', `/api/sessions/${w.id}`)).status).toBe(200);
  });
  it('Idempotency-Key replays the stored response and never creates twice', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const body = { loggedDate: D, slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 };
    const k = { 'idempotency-key': 'abc-123' };
    const r1 = await call(t, c, 'POST', '/api/food-log', body, k); const r2 = await call(t, c, 'POST', '/api/food-log', body, k);
    expect(r1.status).toBe(201); expect(r2.status).toBe(201); expect(r2.headers?.['idempotent-replay']).toBe('true');
    expect(r2.json.entry.id).toBe(r1.json.entry.id);
    expect((await call(t, c, 'GET', `/api/food-log?date=${D}`)).json.entries).toHaveLength(1);
    expect((await call(t, c, 'POST', '/api/weights', { loggedDate: D, weightKg: 80 }, k)).status).toBe(422); // same key, different endpoint
  });
});

describe('nutrition log, XP rules, weights', () => {
  it('food-day XP needs ≥2 meals in the 3-day window; protein-day XP never rewards undereating', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const log = (slot: string, kcal: number, p: number, date = D) => call(t, c, 'POST', '/api/food-log', { loggedDate: date, slot, name: 'x', grams: 100, kcal, proteinG: p, carbsG: 10, fatG: 5 });
    expect((await log('lunch', 600, 40)).json.xp).toBe(0);
    expect((await log('dinner', 700, 30)).json.xp).toBe(10);
    expect((await log('snack', 50, 1)).json.xp).toBe(0); // idempotent: no double pay
    expect((await log('breakfast', 400, 30, '2026-10-20')).json.xp).toBe(0); // outside the window
    const prof = (await call(t, c, 'GET', '/api/profile')).json.targets;
    const big = await log('breakfast', 400, prof.proteinG, '2026-11-01'); // lots of protein but way under-eating
    expect(big.json.xp).toBe(0);
    await log('lunch', prof.kcal, prof.proteinG, '2026-11-01');
    expect((await call(t, c, 'GET', '/api/stats')).json.xp).toBe(10 + 10 + 10);
  });
  it('saved meals re-log in one tap; copy yesterday; range totals', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const m = await call(t, c, 'POST', '/api/saved-meals', { name: 'Usual', slot: 'breakfast', items: [{ name: 'Oats', grams: 60, kcal: 230, proteinG: 8, carbsG: 40, fatG: 4 }, { name: 'Milk', grams: 200, kcal: 120, proteinG: 7, carbsG: 10, fatG: 6 }] });
    expect((await call(t, c, 'POST', `/api/saved-meals/${m.json.id}/log`, { loggedDate: '2026-11-01' })).json.logged).toBe(2);
    expect((await call(t, c, 'POST', '/api/food-log/copy', { fromDate: '2026-11-01', toDate: D })).json.copied).toBe(2);
    const range = await call(t, c, 'GET', '/api/food-log/range?from=2026-11-01&to=2026-11-02');
    expect(range.json.days).toHaveLength(2); expect(range.json.days[0].kcal).toBe(350);
  });
  it('weigh-ins upsert per day, pay 5 XP once a week, and return a smoothed trend', async () => {
    const t = await makeApp(); const c = await onboard(t);
    expect((await call(t, c, 'POST', '/api/weights', { loggedDate: '2026-11-02', weightKg: 80.4 })).json.xp).toBe(5);
    expect((await call(t, c, 'POST', '/api/weights', { loggedDate: '2026-11-03', weightKg: 80.0 })).json.xp).toBe(0);
    await call(t, c, 'POST', '/api/weights', { loggedDate: '2026-11-02', weightKg: 80.2 });
    const w = await call(t, c, 'GET', '/api/weights?days=30');
    expect(w.json.entries).toHaveLength(2); expect(w.json.smoothed).toHaveLength(2); expect(w.json.suggestion).toBeNull();
  });
});

describe('plans, progress, readiness', () => {
  it('generates a deterministic plan respecting injuries, then saves/activates/duplicates it', async () => {
    const t = await makeApp(); const c = await onboard(t, 'user_p', '10.0.0.3', { injuries: ['knee', 'lower_back'] });
    const g1 = await call(t, c, 'POST', '/api/plans/generate', { seed: 7 }); const g2 = await call(t, c, 'POST', '/api/plans/generate', { seed: 7 }); const g3 = await call(t, c, 'POST', '/api/plans/generate', { seed: 99 });
    expect(g1.json.plan).toEqual(g2.json.plan); expect(JSON.stringify(g3.json.plan.days)).not.toBe(JSON.stringify(g1.json.plan.days));
    const byId = new Map(EXERCISES.map((e) => [e.id, e]));
    for (const d of g1.json.plan.days) for (const e of d.exercises) expect(byId.get(e.exerciseId)!.contraindications.some((x) => x === 'knee' || x === 'lower_back')).toBe(false);
    const saved = await call(t, c, 'POST', '/api/plans', { name: 'Mine', plan: g1.json.plan, activate: true });
    const dup = await call(t, c, 'POST', `/api/plans/${saved.json.id}/duplicate`);
    await call(t, c, 'POST', `/api/plans/${dup.json.id}/activate`);
    const list = (await call(t, c, 'GET', '/api/plans')).json.plans as { id: string; active: boolean }[];
    expect(list).toHaveLength(2); expect(list.filter((p) => p.active)).toHaveLength(1); expect(list.find((p) => p.active)!.id).toBe(dup.json.id);
  });
  it('readiness state is computed server-side from the shared reducer', async () => {
    const t = await makeApp(); const c = await onboard(t);
    expect((await call(t, c, 'POST', '/api/readiness', { localDate: D, sleep: 5, energy: 5, soreness: 1, pain: false })).json.state).toBe('normal');
    expect((await call(t, c, 'POST', '/api/readiness', { localDate: D, sleep: 5, energy: 5, soreness: 1, pain: true })).json.state).toBe('easier');
    expect((await call(t, c, 'GET', `/api/readiness?date=${D}`)).json.checkin.state).toBe('easier');
  });
  it('progress is honest: empty without data, real after workouts', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const empty = (await call(t, c, 'GET', '/api/progress?range=30d')).json;
    expect(empty.hasSets).toBe(false); expect(empty.consistency.sessions).toBe(0); expect(empty.strength).toEqual([]); expect(empty.nutrition.avgKcal).toBeNull();
    await workout(t, c, 60); await workout(t, c, 70, '2026-11-03', 24 * 3600_000);
    const p = (await call(t, c, 'GET', '/api/progress?range=7d')).json;
    expect(p.consistency.sessions).toBe(2); expect(p.setsByGroup.chest).toBeGreaterThan(0); expect(p.strength[0].points).toHaveLength(2); expect(p.prs.length).toBeGreaterThan(0);
  });
});

describe('coach', () => {
  it('safety shield answers crisis messages BEFORE quota or AI, and never calls the provider', async () => {
    let called = 0;
    const t = await makeApp({ ai: { name: 'fake', complete: async () => { called++; return 'AI says hi'; } } }); const c = await onboard(t);
    const th = (await call(t, c, 'POST', '/api/coach/threads', {})).json.id;
    for (let i = 0; i < COACH_LIMITS.perMinute + 2; i++) {
      const r = await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'אני רוצה למות', lang: 'he' });
      expect(r.status).toBe(201); expect(r.json.assistant.safetyCategory).toBe('self_harm'); expect(r.json.assistant.content).toContain('1201');
    }
    expect(called).toBe(0);
  });
  it('rules coach answers from data when no AI; honest empty state; quota 6/min then 429', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const th = (await call(t, c, 'POST', '/api/coach/threads', { title: 'q' })).json.id;
    const a = await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'how is my protein?', lang: 'en' });
    expect(a.json.assistant.provider).toBe('rules'); expect(a.json.assistant.content).toMatch(/not enough data/i);
    for (let i = 1; i < COACH_LIMITS.perMinute; i++) expect((await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'hi', lang: 'en' })).status).toBe(201);
    const over = await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'hi', lang: 'en' });
    expect(over.status).toBe(429); expect(over.json.error).toBe('quota_exceeded');
    t.now.t = new Date(t.now.t.getTime() + 61_000);
    expect((await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'hi', lang: 'en' })).status).toBe(201);
  });
  it('uses the AI provider with an anonymised snapshot (no username, no exact age) and falls back when it fails', async () => {
    let seen = ''; let fail = false;
    const t = await makeApp({ ai: { name: 'fake', complete: async (i) => { if (fail) throw new Error('down'); seen = i.system; return 'AI answer'; } } });
    const c = await onboard(t, 'secret.person', '10.0.0.4', { age: 33 });
    const th = (await call(t, c, 'POST', '/api/coach/threads', {})).json.id;
    expect((await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'plan my week', lang: 'en' })).json.assistant.provider).toBe('fake');
    expect(seen).not.toContain('secret.person'); expect(seen).not.toContain('"age"'); expect(seen).toContain('"ageBucket":"adult"');
    fail = true;
    expect((await call(t, c, 'POST', `/api/coach/threads/${th}/messages`, { text: 'plan my week', lang: 'en' })).json.assistant.provider).toBe('rules');
  });
});

describe('nutrition lookups', () => {
  it('barcode: parses Open Food Facts, validates input, 404 on unknown, 502 on network failure', async () => {
    const ok = async () => new Response(JSON.stringify({ status: 1, product: { product_name: 'Hummus', nutriments: { 'energy-kcal_100g': 300, proteins_100g: 7, carbohydrates_100g: 12, fat_100g: 25 }, serving_quantity: 30 } }), { status: 200 });
    const t = await makeApp({ fetch: ok as unknown as typeof fetch }); const c = await onboard(t);
    const r = await call(t, c, 'GET', '/api/nutrition/barcode/7290000000001');
    expect(r.json.per100g).toEqual({ kcal: 300, proteinG: 7, carbsG: 12, fatG: 25 }); expect(r.json.servingG).toBe(30);
    expect((await call(t, c, 'GET', '/api/nutrition/barcode/abc')).status).toBe(400);
    const t2 = await makeApp({ fetch: (async () => new Response('{}', { status: 404 })) as unknown as typeof fetch }); const c2 = await onboard(t2);
    expect((await call(t2, c2, 'GET', '/api/nutrition/barcode/7290000000001')).status).toBe(404);
    const t3 = await makeApp({ fetch: (async () => { throw new Error('offline'); }) as unknown as typeof fetch }); const c3 = await onboard(t3);
    expect((await call(t3, c3, 'GET', '/api/nutrition/barcode/7290000000001')).status).toBe(502);
  });
  it('photo estimate: 503 without a vision provider; validated + labelled estimate with one; garbage is rejected', async () => {
    const jpeg = `/9j/${'A'.repeat(200)}`;
    const t0 = await makeApp(); const c0 = await onboard(t0);
    expect((await call(t0, c0, 'POST', '/api/nutrition/photo-estimate', { jpegBase64: jpeg })).status).toBe(503);
    let reply = '{"items":[{"name":"Rice","grams":150,"kcal":200,"proteinG":4,"carbsG":44,"fatG":1}]}';
    const t = await makeApp({ ai: { name: 'fake', complete: async () => '', describeImage: async () => reply } }); const c = await onboard(t);
    const r = await call(t, c, 'POST', '/api/nutrition/photo-estimate', { jpegBase64: jpeg });
    expect(r.json.estimated).toBe(true); expect(r.json.requiresConfirmation).toBe(true); expect(r.json.items).toHaveLength(1);
    expect((await call(t, c, 'GET', `/api/food-log?date=${D}`)).json.entries).toHaveLength(0); // nothing logged until the user confirms
    reply = 'not json'; expect((await call(t, c, 'POST', '/api/nutrition/photo-estimate', { jpegBase64: jpeg })).status).toBe(502);
  });
});

describe('account: export, restore, delete', () => {
  it('exports everything, restores it into a fresh account, and deletes cascade', async () => {
    const t = await makeApp(); const c = await onboard(t);
    await workout(t, c, 60); await call(t, c, 'POST', '/api/weights', { loggedDate: D, weightKg: 80 });
    await call(t, c, 'POST', '/api/food-log', { loggedDate: D, slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 });
    const ex = (await call(t, c, 'GET', '/api/export')).json;
    expect(ex.backup.version).toBe(2); expect(ex.backup.sessions).toHaveLength(1); expect(ex.backup.bodyWeight).toHaveLength(1); expect(ex.backup.foodLog).toHaveLength(1);
    const c2 = await onboard(t, 'fresh', '10.0.0.7');
    const rs = await call(t, c2, 'POST', '/api/device/restore', ex.backup);
    expect(rs.status, JSON.stringify(rs.json)).toBe(200); expect(rs.json.restored.workouts).toBe(1);
    expect((await call(t, c2, 'GET', `/api/food-log?date=${D}`)).json.entries).toHaveLength(1);
    expect((await call(t, c2, 'GET', '/api/progress?range=30d')).json.prs.length).toBeGreaterThan(0);
    expect((await call(t, c, 'DELETE', '/api/account', { confirm: 'nope' })).status).toBe(400);
    expect((await call(t, c, 'DELETE', '/api/account', { confirm: 'DELETE' })).status).toBe(200);
    const gone: [string, string][] = [
      ['users', "SELECT COUNT(*)::int AS c FROM users WHERE username = 'user_a'"],
      ['profiles', "SELECT COUNT(*)::int AS c FROM profiles WHERE user_id NOT IN (SELECT id FROM users)"],
      ['workout_sessions', "SELECT COUNT(*)::int AS c FROM workout_sessions WHERE user_id NOT IN (SELECT id FROM users)"],
      ['session_sets', "SELECT COUNT(*)::int AS c FROM session_sets WHERE session_exercise_id NOT IN (SELECT id FROM session_exercises)"],
      ['food_log_entries', "SELECT COUNT(*)::int AS c FROM food_log_entries WHERE user_id NOT IN (SELECT id FROM users)"],
      ['body_weight_entries', "SELECT COUNT(*)::int AS c FROM body_weight_entries WHERE user_id NOT IN (SELECT id FROM users)"],
      ['xp_events', "SELECT COUNT(*)::int AS c FROM xp_events WHERE user_id NOT IN (SELECT id FROM users)"],
      ['auth_sessions', "SELECT COUNT(*)::int AS c FROM auth_sessions WHERE user_id NOT IN (SELECT id FROM users)"],
    ];
    for (const [name, sql] of gone) expect(Number((await t.db.query<{ c: number }>(sql))[0]?.c), name).toBe(0);
    const owned = await t.db.query<{ c: number }>("SELECT COUNT(*)::int AS c FROM workout_sessions s JOIN users u ON u.id = s.user_id WHERE u.username = 'user_a'");
    expect(Number(owned[0]?.c)).toBe(0);
    expect((await call(t, c, 'GET', '/api/auth/me')).status).toBe(401);
  });
  it('restore cap is mode dependent: hosted 8 MB (413), device accepts larger; schema caps reject absurd collections', async () => {
    const hosted = await makeApp(); const c = await onboard(hosted);
    const big = await hosted.app.handle({ method: 'POST', path: '/api/device/restore', query: {}, headers: { cookie: c.cookie, 'x-csrf-token': c.csrf }, body: {}, ip: '1.1.1.1', bodyBytes: 9 * 1024 * 1024 });
    expect(big.status).toBe(413);
    const device = await makeApp({ mode: 'device' }); const d = await onboard(device);
    const ok = await device.app.handle({ method: 'POST', path: '/api/device/restore', query: {}, headers: { cookie: d.cookie, 'x-csrf-token': d.csrf }, body: { version: 1, exportedAt: 'x', profile: null, bodyWeight: [], foodLog: [], sessions: [] }, ip: '1.1.1.1', bodyBytes: 50 * 1024 * 1024 });
    expect(ok.status).toBe(200);
    const absurd = await call(hosted, c, 'POST', '/api/device/restore', { version: 1, exportedAt: 'x', profile: null, bodyWeight: Array.from({ length: 20_001 }, () => ({ loggedDate: D, weightKg: 80 })), foodLog: [], sessions: [] });
    expect(absurd.status).toBe(400);
  });
});

describe('media: hasMedia only for validated + reviewed records', () => {
  it('non-admins cannot attach; invalid mp4 is rejected', async () => {
    const t = await makeApp({ adminUsernames: ['boss'] });
    const user = await onboard(t, 'user_u', '10.0.0.1'); const admin = await onboard(t, 'boss', '10.0.0.2');
    expect((await call(t, user, 'POST', '/api/admin/exercises/push_up/media', { mp4Base64: 'A'.repeat(200), url: '/media/exercises/push_up.mp4' })).status).toBe(404);
    const bad = await call(t, admin, 'POST', '/api/admin/exercises/push_up/media', { mp4Base64: btoa('x'.repeat(200)), url: '/media/exercises/push_up.mp4' });
    expect(bad.status).toBe(422);
    expect((await call(t, user, 'GET', '/api/exercises/media')).json.media).toEqual([]);
  });
});
