import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DIFFICULTIES, EQUIPMENT, EXERCISE_CATEGORIES, MUSCLE_GROUPS, MUSCLES } from '@shared/constants';
import type { ExerciseFacetsDTO, ExerciseListItemDTO, ExerciseListResponse } from '@shared/types';
import { db } from '../src/db/pool';
import { onboardedUser, registerUser, setProfile, startTestServer, TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let gymUser: TestClient;
let dumbbellUser: TestClient;

beforeAll(async () => {
  server = await startTestServer();
  gymUser = await onboardedUser(server.baseUrl);
  dumbbellUser = await onboardedUser(server.baseUrl, { training_location: 'home', equipment: ['dumbbells'], injuries: ['knee'] });
});
afterAll(async () => {
  await server.close();
  await db.close();
});

const list = async (client: TestClient, qs: string) => {
  const res = await client.get<ExerciseListResponse>(`/api/exercises?${qs}`);
  expect(res.status, qs).toBe(200);
  return res.body;
};
const facets = async (client: TestClient, qs: string) => {
  const res = await client.get<{ facets: ExerciseFacetsDTO }>(`/api/exercises/facets?${qs}`);
  expect(res.status, qs).toBe(200);
  return res.body.facets;
};
const ids = (items: ExerciseListItemDTO[]) => items.map((e) => e.id);

describe('GET /api/exercises — search, filters and ordering', () => {
  it('searches English and Hebrew names, partial words and plurals', async () => {
    for (const q of ['squat', 'squ', 'squats', 'סקוואט', 'סקוו', 'סקוואטים']) {
      const body = await list(gymUser, `q=${encodeURIComponent(q)}&pageSize=100`);
      expect(ids(body.items), q).toContain('barbell_back_squat');
      expect(body.approximate, q).toBe(false);
    }
  });

  it('searches muscle and equipment labels in both languages', async () => {
    expect(ids((await list(gymUser, `q=${encodeURIComponent('חזה')}&pageSize=100`)).items)).toContain('barbell_bench_press');
    expect(ids((await list(gymUser, 'q=quads&pageSize=100')).items)).toContain('leg_press');
  });

  it('flags spelling-tolerant results as approximate', async () => {
    const typo = await list(gymUser, 'q=sqaut&pageSize=100');
    expect(typo.approximate).toBe(true);
    expect(ids(typo.items)).toContain('barbell_back_squat');
    const none = await list(gymUser, 'q=zzzzqqq');
    expect(none).toMatchObject({ items: [], total: 0, approximate: false });
  });

  it('filters by specific muscle (primary or secondary) and by "no equipment"', async () => {
    const biceps = await list(gymUser, 'muscle=biceps&pageSize=100');
    expect(biceps.total).toBeGreaterThan(3);
    for (const e of biceps.items) expect([...e.primaryMuscles, ...e.secondaryMuscles]).toContain('biceps');
    expect(ids(biceps.items)).toContain('pull_up'); // biceps is secondary for pull-ups

    const none = await list(gymUser, 'equipment=none&pageSize=100');
    expect(none.total).toBeGreaterThan(10);
    for (const e of none.items) expect(e.equipment).toEqual([]);

    const kb = await list(gymUser, 'equipment=kettlebell&pageSize=100');
    expect(ids(kb.items).sort()).toEqual(['kettlebell_overhead_press', 'kettlebell_swing']);
  });

  it('combines filters with AND semantics', async () => {
    const body = await list(gymUser, 'muscleGroup=legs&difficulty=beginner&category=bodyweight&pageSize=100');
    expect(body.total).toBeGreaterThan(0);
    for (const e of body.items) {
      expect(e.difficulty).toBe('beginner');
      expect(e.category).toBe('bodyweight');
    }
  });

  it('orders equally relevant results alphabetically in the requested language', async () => {
    for (const lang of ['he', 'en'] as const) {
      const body = await list(gymUser, `difficulty=advanced&pageSize=100&lang=${lang}`);
      const names = body.items.map((e) => e.name[lang]);
      expect(names, lang).toEqual([...names].sort(new Intl.Collator(lang, { sensitivity: 'base' }).compare));
    }
  });

  it('paginates without overlap', async () => {
    const all = await list(gymUser, 'pageSize=100');
    const p1 = await list(gymUser, 'pageSize=20&page=1');
    const p2 = await list(gymUser, 'pageSize=20&page=2');
    expect(p1.total).toBe(all.total);
    expect([...ids(p1.items), ...ids(p2.items)]).toEqual(ids(all.items).slice(0, 40));
    const beyond = await list(gymUser, 'pageSize=20&page=50');
    expect(beyond.items).toEqual([]);
    expect(beyond.total).toBe(all.total);
  });

  it('includes how each exercise fits the user (null before onboarding)', async () => {
    const body = await list(dumbbellUser, `q=${encodeURIComponent('back squat')}&pageSize=5`);
    const squat = body.items.find((e) => e.id === 'barbell_back_squat')!;
    expect(squat.userContext).toEqual({ hasRequiredEquipment: false, missingEquipment: ['barbell', 'squat_rack'], injuryConflicts: ['knee'] });
    const fresh = await registerUser(server.baseUrl);
    const freshBody = await list(fresh, 'pageSize=3');
    expect(freshBody.items).toHaveLength(3);
    for (const e of freshBody.items) expect(e.userContext).toBeNull();
  });

  it('availableOnly follows the current profile equipment', async () => {
    const user = await onboardedUser(server.baseUrl, { equipment: ['dumbbells'] });
    const withDumbbells = await list(user, 'availableOnly=true&pageSize=100');
    expect(withDumbbells.total).toBeGreaterThan(10);
    for (const e of withDumbbells.items) {
      expect(e.equipment.every((q) => q === 'dumbbells'), e.id).toBe(true);
      expect(e.userContext?.hasRequiredEquipment).toBe(true);
    }
    expect(ids(withDumbbells.items)).toContain('goblet_squat');
    expect(ids(withDumbbells.items)).toContain('push_up');

    await setProfile(user.userId!, { equipment: [] });
    const nothing = await list(user, 'availableOnly=1&pageSize=100');
    expect(nothing.total).toBeLessThan(withDumbbells.total);
    for (const e of nothing.items) expect(e.equipment).toEqual([]);
    expect(ids(nothing.items)).not.toContain('goblet_squat');

    const off = await list(user, 'availableOnly=false&pageSize=1');
    expect(off.total).toBeGreaterThan(withDumbbells.total);
  });

  it('rejects invalid query parameters', async () => {
    for (const qs of ['pageSize=0', 'pageSize=101', 'page=0', 'lang=fr', 'equipment=spaceship', 'muscle=wings', 'availableOnly=maybe', `q=${'a'.repeat(200)}`]) {
      const res = await gymUser.get(`/api/exercises?${qs}`);
      expect(res.status, qs).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
  });

  it('requires authentication', async () => {
    const anon = new TestClient(server.baseUrl);
    expect((await anon.get('/api/exercises')).status).toBe(401);
    expect((await anon.get('/api/exercises/facets')).status).toBe(401);
    expect((await anon.get('/api/exercises/push_up')).status).toBe(401);
  });
});

describe('GET /api/exercises/facets', () => {
  it('counts every value of every dimension', async () => {
    const f = await facets(gymUser, '');
    const all = await list(gymUser, 'pageSize=1');
    expect(f.total).toBe(all.total);
    expect(Object.keys(f.muscleGroup).sort()).toEqual([...MUSCLE_GROUPS].sort());
    expect(Object.keys(f.muscle).sort()).toEqual([...MUSCLES].sort());
    expect(Object.keys(f.equipment).sort()).toEqual([...EQUIPMENT, 'none'].sort());
    expect(Object.keys(f.difficulty).sort()).toEqual([...DIFFICULTIES].sort());
    expect(Object.keys(f.category).sort()).toEqual([...EXERCISE_CATEGORIES].sort());
    expect(Object.values(f.difficulty).reduce((a, b) => a + b, 0)).toBe(all.total);
    expect(Object.values(f.category).reduce((a, b) => a + b, 0)).toBe(all.total);
  });

  it('each count equals the list total after selecting that value (other filters applied)', async () => {
    const base = { q: 'press', difficulty: 'beginner', availableOnly: 'true' };
    const qs = (extra: Record<string, string>) => new URLSearchParams({ ...base, ...extra, pageSize: '1' }).toString();
    const f = await facets(dumbbellUser, new URLSearchParams(base).toString());
    expect(f.total).toBe((await list(dumbbellUser, qs({}))).total);
    // Non-trivial: there are results, and other difficulties would give more.
    expect(f.total).toBeGreaterThan(2);
    expect(f.difficulty.intermediate).toBeGreaterThan(0);
    expect(f.equipment.dumbbells).toBeGreaterThan(0);
    expect(f.equipment.none).toBeGreaterThan(0);

    // Counting a dimension ignores that dimension's own selection.
    for (const d of DIFFICULTIES) {
      const { difficulty: _ignored, ...rest } = base;
      const total = (await list(dumbbellUser, new URLSearchParams({ ...rest, difficulty: d, pageSize: '1' }).toString())).total;
      expect(f.difficulty[d], d).toBe(total);
    }
    for (const g of MUSCLE_GROUPS) expect(f.muscleGroup[g], g).toBe((await list(dumbbellUser, qs({ muscleGroup: g }))).total);
    for (const m of MUSCLES) expect(f.muscle[m], m).toBe((await list(dumbbellUser, qs({ muscle: m }))).total);
    for (const c of EXERCISE_CATEGORIES) expect(f.category[c], c).toBe((await list(dumbbellUser, qs({ category: c }))).total);
    for (const q of [...EQUIPMENT, 'none']) expect(f.equipment[q as keyof typeof f.equipment], q).toBe((await list(dumbbellUser, qs({ equipment: q }))).total);
  });

  it('reports how many results remain with only the user equipment', async () => {
    const f = await facets(dumbbellUser, 'muscleGroup=legs');
    const available = await list(dumbbellUser, 'muscleGroup=legs&availableOnly=true&pageSize=1');
    const all = await list(dumbbellUser, 'muscleGroup=legs&pageSize=1');
    expect(f.total).toBe(all.total);
    expect(f.availableTotal).toBe(available.total);
    expect(f.availableTotal).toBeLessThan(f.total);
    const onlyAvailable = await facets(dumbbellUser, 'muscleGroup=legs&availableOnly=true');
    expect(onlyAvailable.total).toBe(available.total);
    expect(onlyAvailable.equipment.barbell).toBe(0);
  });

  it('applies the search text and validates input', async () => {
    const f = await facets(gymUser, `q=${encodeURIComponent('סקוואט')}`);
    expect(f.total).toBe((await list(gymUser, `q=${encodeURIComponent('סקוואט')}&pageSize=1`)).total);
    expect(f.muscleGroup.chest).toBe(0);
    expect((await gymUser.get('/api/exercises/facets?difficulty=expert')).status).toBe(400);
  });
});

describe('GET /api/exercises/:id', () => {
  it('returns alternatives with the user fit and an honest media flag', async () => {
    const res = await dumbbellUser.get('/api/exercises/barbell_back_squat');
    expect(res.status).toBe(200);
    const ex = res.body.exercise;
    expect(ex.media).toBeNull();
    // No video asset is attached, but every exercise ships a built-in animated demonstration.
    expect(ex.hasMedia).toBe(true);
    expect(ex.easierAlternatives.map((a: { id: string }) => a.id)).toEqual(['goblet_squat', 'smith_machine_squat', 'leg_press']);
    const goblet = ex.easierAlternatives[0];
    expect(goblet.userContext).toEqual({ hasRequiredEquipment: true, missingEquipment: [], injuryConflicts: expect.any(Array) });
    expect(ex.harderAlternatives[0].id).toBe('front_squat');
    expect(ex.userContext.injuryConflicts).toEqual(['knee']);
  });

  it('404s unknown exercises with a stable code', async () => {
    const res = await gymUser.get('/api/exercises/not_a_real_exercise');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('exercise_not_found');
    expect((await gymUser.get('/api/exercises/not_a_real_exercise/history')).status).toBe(404);
  });
});

describe('exercise history', () => {
  async function completedSession(userId: string, exerciseId: string, endedAt: string, sets: { reps: number; weightKg: number | null; completed?: boolean }[], status = 'completed') {
    const s = await db.one<{ id: string }>(
      `INSERT INTO workout_sessions (user_id, name, status, started_at, ended_at, duration_seconds)
       VALUES ($1, 'Test session', $2, $3::timestamptz - interval '1 hour', CASE WHEN $2 = 'completed' THEN $3::timestamptz END, 3600) RETURNING id`,
      [userId, status, endedAt],
    );
    const se = await db.one<{ id: string }>(
      `INSERT INTO session_exercises (session_id, user_id, exercise_id, position) VALUES ($1, $2, $3, 0) RETURNING id`,
      [s.id, userId, exerciseId],
    );
    for (const [i, set] of sets.entries()) {
      const done = set.completed ?? true;
      await db.exec(
        `INSERT INTO session_sets (session_exercise_id, session_id, user_id, set_number, reps, weight_kg, completed, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 THEN now() END)`,
        [se.id, s.id, userId, i + 1, set.reps, set.weightKg, done],
      );
    }
    return s.id;
  }

  it('shows only the owner’s completed sets, newest first, in the user’s time zone', async () => {
    const owner = await onboardedUser(server.baseUrl, {}, { timezone: 'Asia/Jerusalem' });
    const other = await onboardedUser(server.baseUrl);
    const older = await completedSession(owner.userId!, 'barbell_back_squat', '2026-03-01T08:00:00Z', [{ reps: 8, weightKg: 80 }]);
    const newer = await completedSession(owner.userId!, 'barbell_back_squat', '2026-03-10T23:30:00Z', [
      { reps: 5, weightKg: 100 },
      { reps: 3, weightKg: 110 },
      { reps: 5, weightKg: 120, completed: false },
    ]);
    // Neither an unfinished session nor another exercise appears.
    await completedSession(owner.userId!, 'barbell_back_squat', '2026-03-12T08:00:00Z', [{ reps: 5, weightKg: 140 }], 'in_progress');
    await completedSession(owner.userId!, 'deadlift', '2026-03-11T08:00:00Z', [{ reps: 5, weightKg: 150 }]);

    const detail = (await owner.get('/api/exercises/barbell_back_squat')).body.exercise;
    expect(detail.recentHistory).toEqual([
      {
        sessionId: newer,
        date: '2026-03-11', // 23:30 UTC is already the next day in Jerusalem
        sets: [
          { reps: 5, weightKg: 100, durationSeconds: null },
          { reps: 3, weightKg: 110, durationSeconds: null },
        ],
        bestEst1rmKg: 121,
      },
      { sessionId: older, date: '2026-03-01', sets: [{ reps: 8, weightKg: 80, durationSeconds: null }], bestEst1rmKg: 101.3 },
    ]);

    const limited = await owner.get('/api/exercises/barbell_back_squat/history?limit=1');
    expect(limited.status).toBe(200);
    expect(limited.body.history.map((h: { sessionId: string }) => h.sessionId)).toEqual([newer]);
    expect((await owner.get('/api/exercises/barbell_back_squat/history?limit=0')).status).toBe(400);

    // Another user never sees it.
    expect((await other.get('/api/exercises/barbell_back_squat')).body.exercise.recentHistory).toEqual([]);
    expect((await other.get('/api/exercises/barbell_back_squat/history')).body.history).toEqual([]);
  });
});
