import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MUSCLE_GROUPS } from '@shared/constants';
import { addDays, dayOfWeek, startOfWeek, todayInTimeZone } from '@shared/dates';
import { db } from '../src/db/pool';
import { buildInsights, trainingRunLength, type InsightInput } from '../src/modules/progress/insights';
import { backdateAccount, noonUtc, seedBodyWeight, seedFood, seedPr, seedSession, sets } from './helpers/progressSeed';
import { onboardedUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let a: TestClient; // seeded history (UTC, English → weeks start on Monday)
let b: TestClient; // another user, nothing recorded
let T: string;
const d = (offset: number) => addDays(T, offset);
let targets: { calories: number; proteinG: number };
const ids: Record<string, string> = {};

beforeAll(async () => {
  server = await startTestServer();
  a = await onboardedUser(server.baseUrl, { weekly_workout_goal: 3 });
  b = await onboardedUser(server.baseUrl);
  T = todayInTimeZone('UTC');
  const uid = a.userId!;
  await backdateAccount(uid, 200);
  const bench = (kg: number, n = 3) => sets(n, { exerciseId: 'barbell_bench_press', reps: 5, weightKg: kg });
  ids.s1 = await seedSession(uid, {
    endedAt: noonUtc(d(-2)),
    sets: [...bench(100), { exerciseId: 'barbell_bench_press', reps: 5, weightKg: 200, completed: false }],
  });
  ids.s2 = await seedSession(uid, { endedAt: noonUtc(d(-9)), sets: [...bench(95), ...sets(2, { exerciseId: 'barbell_back_squat', reps: 5, weightKg: 120 })] });
  ids.s3 = await seedSession(uid, { endedAt: noonUtc(d(-20)), sets: bench(90) });
  ids.s4 = await seedSession(uid, { endedAt: noonUtc(d(-45)), sets: sets(3, { exerciseId: 'barbell_back_squat', reps: 5, weightKg: 100 }) });
  ids.s5 = await seedSession(uid, { endedAt: noonUtc(d(-35)), sets: sets(3, { exerciseId: 'plank', durationSeconds: 60 }) });
  ids.s6 = await seedSession(uid, { endedAt: noonUtc(d(-1)), durationSeconds: 300, sets: sets(2, { exerciseId: 'push_up', reps: 10 }) });
  // Not completed → never counted.
  await seedSession(uid, { endedAt: noonUtc(d(-1)), status: 'abandoned', sets: bench(200) });
  await seedSession(uid, { endedAt: new Date(), status: 'in_progress', sets: bench(200) });

  ids.pr1 = await seedPr(uid, { exerciseId: 'barbell_bench_press', recordType: 'est_1rm', value: 116.7, previousValue: 110.8, sessionId: ids.s1, achievedAt: noonUtc(d(-2)) });
  ids.pr2 = await seedPr(uid, { exerciseId: 'barbell_back_squat', recordType: 'max_weight', value: 120, previousValue: 100, sessionId: ids.s2, achievedAt: noonUtc(d(-9)), weightKg: 120, reps: 5 });
  ids.pr3 = await seedPr(uid, { exerciseId: 'plank', recordType: 'max_duration', value: 60, previousValue: 45, sessionId: ids.s5, achievedAt: noonUtc(d(-35)) });

  await seedFood(uid, d(-1), 'breakfast', { kcal: 1200, proteinG: 80, carbsG: 100, fatG: 40 });
  await seedFood(uid, d(-1), 'lunch', { kcal: 1800, proteinG: 70, carbsG: 200, fatG: 60 });
  await seedFood(uid, d(-2), 'dinner', { kcal: 1000, proteinG: 50, carbsG: 100, fatG: 30 });
  await seedFood(uid, d(-3), 'breakfast', { kcal: 500, proteinG: 20, carbsG: 60, fatG: 15 });
  await seedFood(uid, T, 'snack', { kcal: 200, proteinG: 10, carbsG: 20, fatG: 5 });
  await seedFood(uid, d(-40), 'lunch', { kcal: 2000, proteinG: 100, carbsG: 200, fatG: 70 });

  await seedBodyWeight(uid, d(-60), 82);
  await seedBodyWeight(uid, d(-25), 80);
  await seedBodyWeight(uid, d(-10), 79);
  await seedBodyWeight(uid, d(-1), 78.5);

  const profile = (await a.get('/api/profile')).body.profile;
  targets = { calories: profile.targets.calories, proteinG: profile.targets.proteinG };
});

afterAll(async () => {
  await server.close();
  await db.close();
});

/** Workouts per Monday-start week from the seeded completed-session dates. */
function expectedWeekly(from: string) {
  const dates = [d(-2), d(-9), d(-20), d(-45), d(-35), d(-1)];
  const out: { weekStart: string; workouts: number }[] = [];
  for (let ws = startOfWeek(from, 1); ws <= startOfWeek(T, 1); ws = addDays(ws, 7)) {
    out.push({ weekStart: ws, workouts: dates.filter((x) => x >= ws && x <= addDays(ws, 6)).length });
  }
  return out;
}

describe('GET /api/progress/overview', () => {
  it('7 days: exact totals, daily series and comparison with the previous 7 days', async () => {
    const res = await a.get('/api/progress/overview?period=7');
    expect(res.status).toBe(200);
    const o = res.body;
    expect(o).toMatchObject({ period: 7, from: d(-6), to: T });
    expect(o.workouts).toEqual({
      count: 2,
      totalDurationSeconds: 2700 + 300,
      totalSets: 5,
      totalReps: 35,
      totalVolumeKg: 1500,
      averagePerWeek: 2,
      previousCount: 1,
      previousVolumeKg: 1425 + 1200,
    });
    expect(o.daily).toHaveLength(7);
    expect(o.daily[0].date).toBe(d(-6));
    expect(o.daily.find((x: { date: string }) => x.date === d(-2))).toEqual({ date: d(-2), workouts: 1, volumeKg: 1500, durationSeconds: 2700 });
    expect(o.daily.find((x: { date: string }) => x.date === d(-1))).toEqual({ date: d(-1), workouts: 1, volumeKg: 0, durationSeconds: 300 });
    expect(o.daily[6]).toEqual({ date: T, workouts: 0, volumeKg: 0, durationSeconds: 0 });
    expect(o.records.map((r: { id: string }) => r.id)).toEqual([ids.pr1]);
    expect(o.records[0]).toMatchObject({ exerciseId: 'barbell_bench_press', recordType: 'est_1rm', value: 116.7, previousValue: 110.8, sessionId: ids.s1 });
    expect(o.records[0].exerciseName.en).toMatch(/bench/i);
    expect(o.bodyWeight).toEqual({ entries: [{ date: d(-1), weightKg: 78.5 }], latestKg: 78.5, changeKg: null });
    expect(o.insights.map((i: { code: string }) => i.code)).toEqual(['calories_low', 'workouts_up', 'protein_low']);
  });

  it('30 days: volume, averages over logged days only, adherence, muscle groups and insights', async () => {
    const o = (await a.get('/api/progress/overview?period=30')).body;
    expect(o.workouts).toEqual({
      count: 4,
      totalDurationSeconds: 2700 * 3 + 300,
      totalSets: 13,
      totalReps: 75,
      totalVolumeKg: 1500 + 2625 + 1350,
      averagePerWeek: 0.9,
      previousCount: 2,
      previousVolumeKg: 1500,
    });
    expect(o.daily).toHaveLength(30);
    expect(o.weekly.map((w: { weekStart: string; workouts: number }) => ({ weekStart: w.weekStart, workouts: w.workouts }))).toEqual(expectedWeekly(d(-29)));
    expect(o.weekly.every((w: { goalMet: boolean }) => w.goalMet === false)).toBe(true);
    // Goal 3 was never met; finished weeks count as missed, the running week does not count yet.
    expect(o.consistency).toEqual({ weeklyGoal: 3, weeksMet: 0, weeksTotal: o.weekly.length - 1, percent: 0, currentStreakWeeks: 0 });

    const dayKcal = [3000, 1000, 500, 200];
    expect(o.nutrition).toEqual({
      daysLogged: 4,
      averages: { kcal: 1175, proteinG: 57.5, carbsG: 120, fatG: 37.5, fiberG: 0 },
      targetCalories: targets.calories,
      targetProteinG: targets.proteinG,
      calorieAdherencePercent: Math.round((dayKcal.filter((k) => Math.abs(k - targets.calories) <= targets.calories * 0.1).length / 4) * 100),
      proteinTargetDays: [150, 50, 20, 10].filter((p) => p >= targets.proteinG * 0.9).length,
    });
    expect(o.muscleGroupSets).toHaveLength(MUSCLE_GROUPS.length);
    expect(o.muscleGroupSets.slice(0, 2)).toEqual([
      { group: 'chest', sets: 11 },
      { group: 'legs', sets: 2 },
    ]);
    expect(o.muscleGroupSets.slice(2).every((g: { sets: number }) => g.sets === 0)).toBe(true);
    expect(o.records.map((r: { id: string }) => r.id)).toEqual([ids.pr1, ids.pr2]);
    expect(o.bodyWeight).toEqual({
      entries: [
        { date: d(-25), weightKg: 80 },
        { date: d(-10), weightKg: 79 },
        { date: d(-1), weightKg: 78.5 },
      ],
      latestKg: 78.5,
      changeKg: -1.5,
    });

    expect(o.insights.map((i: { code: string }) => i.code)).toEqual(['calories_low', 'strength_gain', 'workouts_up', 'volume_up', 'protein_low', 'body_weight_trend']);
    const byCode = Object.fromEntries(o.insights.map((i: { code: string }) => [i.code, i]));
    // Nutrition insights use finished days only (today's partial log is excluded): 4500 kcal / 3 days.
    expect(byCode.calories_low).toEqual({ code: 'calories_low', tone: 'attention', params: { avgKcal: 1500, targetKcal: targets.calories, count: 3 } });
    expect(byCode.protein_low).toEqual({
      code: 'protein_low',
      tone: 'neutral',
      params: { avgG: 73, targetG: targets.proteinG, percent: Math.round((220 / 3 / targets.proteinG) * 100) },
    });
    expect(byCode.strength_gain.params).toMatchObject({ exerciseEn: expect.stringMatching(/bench/i), fromKg: 105, toKg: 116.7, percent: 11.1 });
    expect(byCode.workouts_up.params).toEqual({ count: 4, previous: 2, period: 30 });
    expect(byCode.volume_up.params).toEqual({ percent: 265 });
    expect(byCode.body_weight_trend).toEqual({ code: 'body_weight_trend', tone: 'neutral', params: { changeKg: -1.5, fromKg: 80, toKg: 78.5, count: 24 } });
  });

  it('90 days: whole history, strongest strength gain and body-weight trend', async () => {
    const o = (await a.get('/api/progress/overview?period=90')).body;
    expect(o.workouts).toMatchObject({ count: 6, totalSets: 19, totalReps: 90, totalVolumeKg: 6975, totalDurationSeconds: 13800, averagePerWeek: 0.5, previousCount: 0, previousVolumeKg: 0 });
    expect(o.muscleGroupSets.slice(0, 3)).toEqual([
      { group: 'chest', sets: 11 },
      { group: 'legs', sets: 5 },
      { group: 'core', sets: 3 },
    ]);
    expect(o.records).toHaveLength(3);
    expect(o.nutrition.daysLogged).toBe(5);
    expect(o.bodyWeight.changeKg).toBe(-3.5);
    const strength = o.insights.find((i: { code: string }) => i.code === 'strength_gain');
    expect(strength.params).toMatchObject({ exerciseEn: expect.stringMatching(/squat/i), fromKg: 116.7, toKg: 140, percent: 20 });
    expect(o.insights.map((i: { code: string }) => i.code)).not.toContain('workouts_up');
  });

  it('empty user: zeros, nulls, empty arrays and a single not_enough_data insight', async () => {
    for (const period of [7, 30, 90]) {
      const o = (await b.get(`/api/progress/overview?period=${period}`)).body;
      expect(o.workouts).toEqual({ count: 0, totalDurationSeconds: 0, totalSets: 0, totalReps: 0, totalVolumeKg: 0, averagePerWeek: 0, previousCount: 0, previousVolumeKg: 0 });
      expect(o.daily).toHaveLength(period);
      expect(o.daily.every((x: { workouts: number; volumeKg: number }) => x.workouts === 0 && x.volumeKg === 0)).toBe(true);
      expect(o.weekly.every((w: { workouts: number; goalMet: boolean }) => w.workouts === 0 && !w.goalMet)).toBe(true);
      expect(o.consistency).toEqual({ weeklyGoal: 4, weeksMet: 0, weeksTotal: 0, percent: 0, currentStreakWeeks: 0 });
      expect(o.bodyWeight).toEqual({ entries: [], latestKg: null, changeKg: null });
      expect(o.nutrition).toMatchObject({ daysLogged: 0, averages: null, calorieAdherencePercent: null, proteinTargetDays: 0 });
      expect(o.muscleGroupSets).toEqual([]);
      expect(o.records).toEqual([]);
      expect(o.insights).toEqual([{ code: 'not_enough_data', tone: 'neutral', params: {} }]);
    }
  });

  it('defaults to 30 days and validates the period', async () => {
    expect((await b.get('/api/progress/overview')).body.period).toBe(30);
    expect((await b.get('/api/progress/overview?period=14')).status).toBe(400);
    expect((await b.get('/api/progress/overview?period=abc')).status).toBe(400);
    expect((await b.get('/api/progress/overview?period=7&period=30')).status).toBe(400);
  });

  it('counts consistency over tracked weeks and the current streak', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 2 });
    await backdateAccount(c.userId!, 100);
    const monday = startOfWeek(T, 1);
    const plan: [number, number[]][] = [
      [-4, [3, 4]],
      [-3, [2]],
      [-2, [1, 3]],
      [-1, [0, 2]],
    ];
    for (const [week, days] of plan) {
      for (const day of days) await seedSession(c.userId!, { endedAt: noonUtc(addDays(monday, week * 7 + day)), sets: sets(4, { exerciseId: 'push_up', reps: 10 }) });
    }
    const o = (await c.get('/api/progress/overview?period=30')).body;
    const mondayToday = dayOfWeek(T) === 1;
    // From week -4 (or -5 when today is Monday, an empty finished week) to last week; the running week is not met yet.
    const expectedTotal = mondayToday ? 5 : 4;
    expect(o.consistency).toEqual({ weeklyGoal: 2, weeksMet: 3, weeksTotal: expectedTotal, percent: Math.round((3 / expectedTotal) * 100), currentStreakWeeks: 2 });
    expect(o.weekly.filter((w: { goalMet: boolean }) => w.goalMet).map((w: { weekStart: string }) => w.weekStart)).toEqual([
      addDays(monday, -28),
      addDays(monday, -14),
      addDays(monday, -7),
    ]);
    expect(o.insights.map((i: { code: string }) => i.code)).toContain('weekly_goal_streak');
  });

  it("uses the user's time zone for calendar dates", async () => {
    const c = await onboardedUser(server.baseUrl, {}, { timezone: 'Asia/Jerusalem' });
    const TJ = todayInTimeZone('Asia/Jerusalem');
    // 22:30 UTC is already the next calendar day in Israel (UTC+2/+3).
    await seedSession(c.userId!, { endedAt: new Date(`${addDays(TJ, -3)}T22:30:00Z`), sets: sets(3, { exerciseId: 'push_up', reps: 10 }) });
    const o = (await c.get('/api/progress/overview?period=7')).body;
    expect(o.to).toBe(TJ);
    expect(o.daily.find((x: { date: string }) => x.date === addDays(TJ, -2)).workouts).toBe(1);
    expect(o.daily.find((x: { date: string }) => x.date === addDays(TJ, -3)).workouts).toBe(0);
  });

  it("never exposes another user's data", async () => {
    const o = (await b.get('/api/progress/overview?period=90')).body;
    expect(o.workouts.count).toBe(0);
    expect((await b.get('/api/progress/exercises')).body.exercises).toEqual([]);
    expect((await b.get('/api/progress/records')).body.records).toEqual([]);
    const ex = (await b.get('/api/progress/exercises/barbell_bench_press')).body;
    expect(ex.points).toEqual([]);
    expect(ex.records).toEqual([]);
  });
});

describe('exercise progress & records', () => {
  it('lists trained exercises, most recent first', async () => {
    const res = await a.get('/api/progress/exercises');
    expect(res.status).toBe(200);
    expect(res.body.exercises.map((e: { exerciseId: string; sessions: number; lastPerformed: string }) => [e.exerciseId, e.sessions, e.lastPerformed])).toEqual([
      ['push_up', 1, d(-1)],
      ['barbell_bench_press', 3, d(-2)],
      ['barbell_back_squat', 2, d(-9)],
      ['plank', 1, d(-35)],
    ]);
    expect(res.body.exercises[1].name.he).toBeTruthy();
  });

  it('returns one point per completed session with best est. 1RM, max weight, reps and volume', async () => {
    const res = await a.get('/api/progress/exercises/barbell_bench_press?period=90');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ exerciseId: 'barbell_bench_press', trackingType: 'weight_reps' });
    expect(res.body.points).toEqual([
      { date: d(-20), sessionId: ids.s3, bestEst1rmKg: 105, maxWeightKg: 90, maxReps: 5, maxDurationSeconds: null, volumeKg: 1350 },
      { date: d(-9), sessionId: ids.s2, bestEst1rmKg: 110.8, maxWeightKg: 95, maxReps: 5, maxDurationSeconds: null, volumeKg: 1425 },
      { date: d(-2), sessionId: ids.s1, bestEst1rmKg: 116.7, maxWeightKg: 100, maxReps: 5, maxDurationSeconds: null, volumeKg: 1500 },
    ]);
    expect(res.body.records.map((r: { id: string }) => r.id)).toEqual([ids.pr1]);
    const short = await a.get('/api/progress/exercises/barbell_bench_press?period=30');
    expect(short.body.points).toHaveLength(3);
    const plank = (await a.get('/api/progress/exercises/plank?period=90')).body;
    expect(plank.trackingType).toBe('time');
    expect(plank.points).toEqual([{ date: d(-35), sessionId: ids.s5, bestEst1rmKg: null, maxWeightKg: null, maxReps: null, maxDurationSeconds: 60, volumeKg: 0 }]);
    expect((await a.get('/api/progress/exercises/plank?period=30')).body.points).toEqual([]);
  });

  it('validates exercise ids and periods', async () => {
    expect((await a.get('/api/progress/exercises/not_a_real_exercise')).status).toBe(404);
    expect((await a.get('/api/progress/exercises/not_a_real_exercise')).body.error.code).toBe('exercise_not_found');
    expect((await a.get('/api/progress/exercises/Bad-Id')).status).toBe(400);
    expect((await a.get('/api/progress/exercises/plank?period=7')).status).toBe(400);
  });

  it('lists personal records newest first with a limit', async () => {
    const res = await a.get('/api/progress/records');
    expect(res.body.records.map((r: { id: string }) => r.id)).toEqual([ids.pr1, ids.pr2, ids.pr3]);
    expect(res.body.records[1]).toMatchObject({ recordType: 'max_weight', value: 120, previousValue: 100, weightKg: 120, reps: 5 });
    expect((await a.get('/api/progress/records?limit=1')).body.records).toHaveLength(1);
    expect((await a.get('/api/progress/records?limit=0')).status).toBe(400);
    expect((await a.get('/api/progress/records?limit=101')).status).toBe(400);
  });
});

describe('body weight', () => {
  it('upserts by date, mirrors the latest weight into the profile and re-syncs targets', async () => {
    const c = await onboardedUser(server.baseUrl);
    const today = todayInTimeZone('UTC');
    const before = (await c.get('/api/profile')).body.profile;
    expect(before.weightKg).toBe(80);

    const first = await c.post('/api/progress/body-weight', { date: today, weightKg: 82.4, note: 'morning <b>' });
    expect(first.status).toBe(201);
    expect(first.body.entry).toEqual({ id: expect.any(String), date: today, weightKg: 82.4, note: 'morning b' });
    expect(first.body.rewards).toEqual({ xpAwarded: 5, newAchievements: [], levelUp: null, notes: [] });
    const after = (await c.get('/api/profile')).body.profile;
    expect(after.weightKg).toBe(82.4);
    expect(after.targets.calories).toBeGreaterThan(before.targets.calories);
    const stored = await db.one<{ calorie_target: number }>('SELECT calorie_target FROM profiles WHERE user_id = $1', [c.userId]);
    expect(stored.calorie_target).toBe(after.targets.calories);

    const update = await c.post('/api/progress/body-weight', { date: today, weightKg: 82 });
    expect(update.status).toBe(200);
    expect(update.body.entry.id).toBe(first.body.entry.id);
    expect(update.body.rewards).toMatchObject({ xpAwarded: 0, notes: ['weekly_weigh_in_cap'] });
    expect((await c.get('/api/profile')).body.profile.weightKg).toBe(82);

    // An older entry does not change the current weight.
    const older = await c.post('/api/progress/body-weight', { date: addDays(today, -5), weightKg: 85 });
    expect(older.status).toBe(201);
    expect((await c.get('/api/profile')).body.profile.weightKg).toBe(82);

    const list = await c.get('/api/progress/body-weight?period=30');
    expect(list.body.entries.map((e: { date: string; weightKg: number }) => [e.date, e.weightKg])).toEqual([
      [addDays(today, -5), 85],
      [today, 82],
    ]);
    expect((await c.get('/api/progress/body-weight')).body.entries).toHaveLength(2);

    // Deleting the latest entry falls back to the previous one.
    const del = await c.delete(`/api/progress/body-weight/${update.body.entry.id}`);
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ ok: true });
    expect((await c.get('/api/profile')).body.profile.weightKg).toBe(85);
    expect((await c.delete(`/api/progress/body-weight/${update.body.entry.id}`)).status).toBe(404);
  });

  it('validates input and rejects future dates', async () => {
    const c = await onboardedUser(server.baseUrl);
    const today = todayInTimeZone('UTC');
    const future = await c.post('/api/progress/body-weight', { date: addDays(today, 1), weightKg: 80 });
    expect(future.status).toBe(422);
    expect(future.body.error.code).toBe('future_date');
    expect((await c.post('/api/progress/body-weight', { date: today, weightKg: 10 })).status).toBe(400);
    expect((await c.post('/api/progress/body-weight', { date: '2026-02-30', weightKg: 80 })).status).toBe(400);
    expect((await c.post('/api/progress/body-weight', { weightKg: 80 })).status).toBe(400);
    expect((await c.get('/api/progress/body-weight?period=7')).status).toBe(400);
    expect((await c.delete('/api/progress/body-weight/not-a-uuid')).status).toBe(400);
    expect((await c.get('/api/progress/body-weight')).body.entries).toEqual([]);
  });

  it('isolates users: another user cannot read or delete entries', async () => {
    const owner = await onboardedUser(server.baseUrl);
    const other = await onboardedUser(server.baseUrl);
    const today = todayInTimeZone('UTC');
    const created = (await owner.post('/api/progress/body-weight', { date: today, weightKg: 70 })).body.entry;
    expect((await other.get('/api/progress/body-weight')).body.entries).toEqual([]);
    const del = await other.delete(`/api/progress/body-weight/${created.id}`);
    expect(del.status).toBe(404);
    expect(del.body.error.code).toBe('body_weight_not_found');
    expect((await owner.get('/api/progress/body-weight')).body.entries).toHaveLength(1);
    // The other user's own entry on the same date is independent.
    expect((await other.post('/api/progress/body-weight', { date: today, weightKg: 90 })).status).toBe(201);
    expect((await owner.get('/api/progress/body-weight')).body.entries[0].weightKg).toBe(70);
  });

  it('handles concurrent logging and keeps the latest date as the profile weight', async () => {
    const c = await onboardedUser(server.baseUrl);
    const today = todayInTimeZone('UTC');
    const results = await Promise.all([
      c.post('/api/progress/body-weight', { date: addDays(today, -2), weightKg: 75 }),
      c.post('/api/progress/body-weight', { date: today, weightKg: 77 }),
      c.post('/api/progress/body-weight', { date: addDays(today, -1), weightKg: 76 }),
    ]);
    expect(results.map((r) => r.status)).toEqual([201, 201, 201]);
    expect((await c.get('/api/profile')).body.profile.weightKg).toBe(77);
    const xp = await db.one<{ n: number }>(`SELECT COUNT(*)::int AS n FROM xp_events WHERE user_id = $1 AND source_type = 'body_weight'`, [c.userId]);
    expect(xp.n).toBe(1);
  });

  it('resets custom targets that become unsafe after a weigh-in (same rule as the profile page)', async () => {
    const c = await onboardedUser(server.baseUrl); // 30 y, male, 180 cm, 80 kg → protein ≥ 64 g
    const custom = await c.put('/api/profile/targets', { calories: 2000, proteinG: 70, carbsG: 255, fatG: 60 });
    expect(custom.status).toBe(200);
    expect(custom.body.profile.targets.custom).toBe(true);
    // 100 kg raises the protein minimum to 80 g: the custom targets are no longer safe.
    const res = await c.post('/api/progress/body-weight', { date: todayInTimeZone('UTC'), weightKg: 100 });
    expect(res.status).toBe(201);
    const profile = (await c.get('/api/profile')).body.profile;
    expect(profile.weightKg).toBe(100);
    expect(profile.targets.custom).toBe(false);
    expect(profile.targets.calories).toBe(profile.targets.computed.calories);
  });

  it('logs weights whose computed targets fall outside the stored-target ranges', async () => {
    // Allowed inputs (200 cm, very active, muscle gain) give a computed target above 6000 kcal.
    const c = await onboardedUser(server.baseUrl, { height_cm: 200, weight_kg: 190, activity_level: 'very_active', goal: 'muscle_gain' });
    const res = await c.post('/api/progress/body-weight', { date: todayInTimeZone('UTC'), weightKg: 200 });
    expect(res.status).toBe(201);
    const profile = (await c.get('/api/profile')).body.profile;
    expect(profile.weightKg).toBe(200);
    expect(profile.targets.calories).toBeGreaterThan(6000);
  });
});

describe('insights (pure)', () => {
  const base: InsightInput = {
    period: 30,
    today: '2026-10-09',
    workouts: { count: 0, previousCount: 0, volumeKg: 0, previousVolumeKg: 0 },
    currentStreakWeeks: 0,
    finishedWeeks: { met: 0, total: 0 },
    trainingDates: [],
    strength: [],
    bodyWeight: [],
    nutritionDays: [],
    targetCalories: 2500,
    targetProteinG: 150,
    lastFoodLogDate: null,
  };
  const codes = (input: Partial<InsightInput>) => buildInsights({ ...base, ...input }).map((i) => i.code);

  it('needs enough data', () => {
    expect(codes({})).toEqual(['not_enough_data']);
    // Two logged days are not enough for nutrition insights.
    expect(codes({ nutritionDays: [{ date: '2026-10-07', kcal: 500, proteinG: 10 }, { date: '2026-10-08', kcal: 500, proteinG: 10 }] })).toEqual(['not_enough_data']);
    expect(codes({ bodyWeight: [{ date: '2026-10-01', weightKg: 80 }] })).toEqual(['not_enough_data']);
    expect(codes({ workouts: { count: 3, previousCount: 0, volumeKg: 100, previousVolumeKg: 0 } })).toEqual(['workouts_logged']);
  });

  it('flags rest after six consecutive training days, ending today or yesterday', () => {
    const run = (end: string, n: number) => Array.from({ length: n }, (_, i) => addDays(end, -i));
    expect(trainingRunLength(run('2026-10-08', 6), '2026-10-09')).toBe(6);
    expect(codes({ trainingDates: run('2026-10-09', 6) })).toEqual(['rest_needed']);
    expect(codes({ trainingDates: run('2026-10-09', 5) })).toEqual(['not_enough_data']);
    expect(codes({ trainingDates: run('2026-10-06', 8) })).toEqual(['not_enough_data']);
  });

  it('nutrition: supportive protein note, attention for very low calories, positive when on track', () => {
    const days = (kcal: number, proteinG: number) => ['2026-10-06', '2026-10-07', '2026-10-08'].map((date) => ({ date, kcal, proteinG }));
    expect(buildInsights({ ...base, nutritionDays: days(1800, 100) })).toEqual([
      { code: 'calories_low', tone: 'attention', params: { avgKcal: 1800, targetKcal: 2500, count: 3 } },
      { code: 'protein_low', tone: 'neutral', params: { avgG: 100, targetG: 150, percent: 67 } },
    ]);
    expect(codes({ nutritionDays: days(2400, 140) })).toEqual(['nutrition_on_track']);
    expect(codes({ nutritionDays: days(2400, 140), targetCalories: null, targetProteinG: null })).toEqual(['not_enough_data']);
    // Today's partial log is ignored.
    expect(codes({ nutritionDays: [...days(2400, 140), { date: '2026-10-09', kcal: 100, proteinG: 5 }] })).toEqual(['nutrition_on_track']);
  });

  it('strength gain needs two sessions and ≥2.5%', () => {
    const name = { en: 'Squat', he: 'סקוואט' };
    expect(codes({ strength: [{ name, points: [{ date: '2026-10-01', est1rmKg: 100 }, { date: '2026-10-08', est1rmKg: 102 }] }] })).toEqual(['not_enough_data']);
    const r = buildInsights({ ...base, strength: [{ name, points: [{ date: '2026-10-01', est1rmKg: 100 }, { date: '2026-10-08', est1rmKg: 103 }] }] });
    expect(r).toEqual([{ code: 'strength_gain', tone: 'positive', params: { exerciseEn: 'Squat', exerciseHe: 'סקוואט', fromKg: 100, toKg: 103, percent: 3 } }]);
  });

  it('workout trends, volume, consistency, logging gap and weight trend', () => {
    expect(codes({ workouts: { count: 2, previousCount: 1, volumeKg: 0, previousVolumeKg: 0 } })).toEqual(['workouts_up']);
    expect(codes({ workouts: { count: 11, previousCount: 10, volumeKg: 0, previousVolumeKg: 0 } })).toEqual(['workouts_logged']);
    expect(codes({ workouts: { count: 6, previousCount: 10, volumeKg: 0, previousVolumeKg: 0 } })).toEqual(['workouts_down']);
    expect(codes({ workouts: { count: 0, previousCount: 3, volumeKg: 0, previousVolumeKg: 0 } })).toEqual(['workouts_down']);
    expect(codes({ workouts: { count: 4, previousCount: 4, volumeKg: 1100, previousVolumeKg: 1000 } })).toEqual(['volume_up']);
    expect(codes({ finishedWeeks: { met: 4, total: 5 } })).toEqual(['consistency_high']);
    expect(codes({ finishedWeeks: { met: 2, total: 2 } })).toEqual(['not_enough_data']);
    expect(codes({ currentStreakWeeks: 2 })).toEqual(['weekly_goal_streak']);
    expect(codes({ lastFoodLogDate: '2026-10-06' })).toEqual(['logging_gap']);
    expect(codes({ lastFoodLogDate: '2026-10-07' })).toEqual(['not_enough_data']);
    expect(buildInsights({ ...base, bodyWeight: [{ date: '2026-09-20', weightKg: 80 }, { date: '2026-10-08', weightKg: 80.6 }] })).toEqual([
      { code: 'body_weight_trend', tone: 'neutral', params: { changeKg: 0.6, fromKg: 80, toKg: 80.6, count: 18 } },
    ]);
  });
});
