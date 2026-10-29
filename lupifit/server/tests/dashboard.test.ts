import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays, dayOfWeek, startOfWeek, todayInTimeZone } from '@shared/dates';
import { futureDatesOfWeek } from '@shared/schedule';
import { db } from '../src/db/pool';
import { onWorkoutCompleted } from '../src/modules/gamification/hooks';
import { seedFood, seedPlan, seedPr, seedSession, sets } from './helpers/progressSeed';
import { TestClient, onboardedUser, registerUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

describe('GET /api/dashboard', () => {
  it('brand-new user: honest empty state', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.get('/api/dashboard');
    expect(res.status).toBe(200);
    const today = todayInTimeZone('UTC');
    const weekStart = startOfWeek(today, 1);
    expect(res.body).toEqual({
      today,
      activePlan: null,
      nextWorkout: null,
      activeSession: null,
      lastWorkout: null,
      nutritionToday: {
        totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
        targets: expect.objectContaining({ calories: expect.any(Number), proteinG: expect.any(Number) }),
        entryCount: 0,
        lastLoggedAt: null,
      },
      weeklyGoal: { weekStart, target: 4, completed: 0, met: false },
      weekDays: Array.from({ length: 7 }, (_, i) => ({ date: addDays(weekStart, i), workouts: 0 })),
      streakWeeks: 0,
      level: { level: 1, totalXp: 0, levelStartXp: 0, nextLevelXp: 100, progress: 0 },
      recentRecords: [],
      unreadNotifications: 0,
      insights: [{ code: 'not_enough_data', tone: 'neutral', params: {} }],
    });
  });

  it('user without a profile yet has null targets', async () => {
    const c = await registerUser(server.baseUrl);
    const res = await c.get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.nutritionToday.targets).toBeNull();
    expect(res.body.weeklyGoal.target).toBe(3);
  });

  it('seeded user: next workout from the plan, active session, nutrition today, weekly goal and rewards', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 2 }, { locale: 'he', timezone: 'UTC' });
    const uid = c.userId!;
    const today = todayInTimeZone('UTC');
    const weekStart = startOfWeek(today, 0); // Hebrew → weeks start on Sunday
    const { planId, workoutIds } = await seedPlan(uid, {
      name: 'Upper / lower',
      nextWorkoutIndex: 4, // wraps around: 4 % 3 = 1
      workouts: [
        { name: 'Upper A', focus: 'Chest & back', estimatedMinutes: 50, exercises: ['barbell_bench_press', 'pull_up'] },
        { name: 'Lower A', focus: 'Legs', estimatedMinutes: null, exercises: ['barbell_back_squat', 'romanian_deadlift', 'plank'] },
        { name: 'Upper B', exercises: ['push_up'] },
      ],
    });

    // Two qualifying workouts today (both in the current week), then an open session.
    const sessionIds: string[] = [];
    for (const hour of ['06', '07']) {
      const endedAt = new Date(`${today}T${hour}:00:00Z`);
      const id = await seedSession(uid, { endedAt, name: `Morning ${hour}`, sets: sets(4, { exerciseId: 'barbell_bench_press', reps: 8, weightKg: 60 }) });
      sessionIds.push(id);
      const pr = await seedPr(uid, { exerciseId: 'barbell_bench_press', recordType: 'max_weight', value: 60 + Number(hour), previousValue: 55, sessionId: id, achievedAt: endedAt });
      await db.tx((tx) =>
        onWorkoutCompleted(tx, { userId: uid, sessionId: id, date: today, endedAt, durationSeconds: 2700, completedSets: 4, totalVolumeKg: 1920, personalRecordIds: [pr] }),
      );
    }
    const activeId = await seedSession(uid, { endedAt: new Date(), status: 'paused', name: 'Lower A', sets: [], planId, planWorkoutId: workoutIds[1] });

    await seedFood(uid, today, 'breakfast', { kcal: 450.5, proteinG: 30.2, carbsG: 50, fatG: 12.3, fiberG: 6 });
    await seedFood(uid, today, 'lunch', { kcal: 700, proteinG: 45, carbsG: 80, fatG: 20, fiberG: 9.5 });
    await seedFood(uid, addDays(today, -1), 'dinner', { kcal: 900, proteinG: 50 });

    const res = await c.get('/api/dashboard');
    expect(res.status).toBe(200);
    const body = res.body;
    expect(body.activePlan).toEqual({ id: planId, name: 'Upper / lower' });
    // 3 exercises × 3 sets × (40 s + 90 s rest) = 1170 s ≈ 20 min (rounded to 5).
    expect(body.nextWorkout).toEqual({ planId, workoutId: workoutIds[1], name: 'Lower A', focus: 'Legs', exerciseCount: 3, estimatedMinutes: 20, schedule: { code: 'rotation', skippedFocus: null, nextTrainingDate: null } });
    expect(body.activeSession).toEqual({ id: activeId, name: 'Lower A', status: 'paused', startedAt: expect.any(String) });
    expect(body.lastWorkout).toEqual({ id: sessionIds[1], name: 'Morning 07', endedAt: new Date(`${today}T07:00:00Z`).toISOString(), durationSeconds: 2700 });
    expect(body.nutritionToday.totals).toEqual({ kcal: 1151, proteinG: 75.2, carbsG: 130, fatG: 32.3, fiberG: 15.5 });
    expect(body.nutritionToday.entryCount).toBe(2);
    expect(body.nutritionToday.lastLoggedAt).not.toBeNull();
    expect(body.weeklyGoal).toEqual({ weekStart, target: 2, completed: 2, met: true });
    expect(body.weekDays.find((x: { date: string }) => x.date === today).workouts).toBe(2);
    expect(body.weekDays[0].date).toBe(weekStart);
    expect(body.streakWeeks).toBe(1);
    // Workout 1: 50 + 8 + PR 15; workout 2: daily cap (0) + PR 15 + weekly goal 100.
    expect(body.level.totalXp).toBe(50 + 8 + 15 + 15 + 100);
    expect(body.level.level).toBe(2);
    expect(body.recentRecords.map((r: { value: number }) => r.value)).toEqual([67, 66]);
    // 2 PRs + weekly goal + level-up + achievements (first_workout, weekly_goal_1, first_pr, first_food_log not via hook)
    const unread = (await c.get('/api/notifications')).body.unreadCount;
    expect(body.unreadNotifications).toBe(unread);
    expect(unread).toBeGreaterThanOrEqual(6);
    expect(body.insights.length).toBeLessThanOrEqual(2);

    // Uses the next plan day when the index points at a day with an explicit estimate.
    await db.exec('UPDATE workout_plans SET next_workout_index = 0 WHERE id = $1', [planId]);
    const next = (await c.get('/api/dashboard')).body.nextWorkout;
    expect(next).toMatchObject({ workoutId: workoutIds[0], name: 'Upper A', exerciseCount: 2, estimatedMinutes: 50 });
  });

  it('suggests a different day instead of loading yesterday\'s muscles again', async () => {
    const c = await onboardedUser(server.baseUrl, {}, { timezone: 'UTC' });
    const today = todayInTimeZone('UTC');
    const { planId, workoutIds } = await seedPlan(c.userId!, {
      nextWorkoutIndex: 2, // Upper B is next in the rotation
      workouts: [
        { name: 'Upper A', focus: 'upper_a', exercises: ['push_up'] },
        { name: 'Lower A', focus: 'lower_a', exercises: ['barbell_back_squat'] },
        { name: 'Upper B', focus: 'upper_b', exercises: ['pull_up'] },
        { name: 'Lower B', focus: 'lower_b', exercises: ['plank'] },
      ],
    });
    await seedSession(c.userId!, {
      endedAt: new Date(`${addDays(today, -1)}T12:00:00Z`),
      name: 'Upper A',
      planId,
      planWorkoutId: workoutIds[0],
      sets: sets(3, { exerciseId: 'push_up', reps: 12 }),
    });
    const next = (await c.get('/api/dashboard')).body.nextWorkout;
    expect(next).toMatchObject({ workoutId: workoutIds[3], name: 'Lower B', schedule: { code: 'avoid_back_to_back', skippedFocus: 'upper_b' } });

    // Two days after the same workout nothing needs avoiding: the rotation applies unchanged.
    await db.exec('UPDATE workout_sessions SET started_at = started_at - interval \'1 day\', ended_at = ended_at - interval \'1 day\' WHERE user_id = $1', [c.userId]);
    const later = (await c.get('/api/dashboard')).body.nextWorkout;
    expect(later).toMatchObject({ workoutId: workoutIds[2], schedule: { code: 'rotation' } });
  });

  it('a day swapped in to avoid yesterday\'s muscles does not drop the skipped day from the rotation', async () => {
    const c = await onboardedUser(server.baseUrl, {}, { timezone: 'UTC' });
    const today = todayInTimeZone('UTC');
    // 5-day split: full body loads every region, so it overlaps the leg day before it.
    const { planId, workoutIds } = await seedPlan(c.userId!, {
      nextWorkoutIndex: 2,
      workouts: [
        { name: 'Upper A', focus: 'upper_a', exercises: ['push_up'] },
        { name: 'Lower A', focus: 'lower_a', exercises: ['barbell_back_squat'] },
        { name: 'Full body', focus: 'full_body', exercises: ['plank'] },
        { name: 'Upper B', focus: 'upper_b', exercises: ['pull_up'] },
        { name: 'Lower B', focus: 'lower_b', exercises: ['romanian_deadlift'] },
      ],
    });
    await seedSession(c.userId!, { endedAt: new Date(`${addDays(today, -1)}T12:00:00Z`), name: 'Lower A', planId, planWorkoutId: workoutIds[1], sets: sets(3, { exerciseId: 'barbell_back_squat', reps: 8, weightKg: 60 }) });
    const nextIndex = async () => (await c.get(`/api/plans/${planId}`)).body.plan.nextWorkoutIndex as number;
    const dayLater = () => db.exec(`UPDATE workout_sessions SET started_at = started_at - interval '1 day', ended_at = ended_at - interval '1 day' WHERE user_id = $1`, [c.userId]);
    /** Starts and finishes today's suggested workout (as the "Start workout" button does). */
    const trainSuggested = async () => {
      const next = (await c.get('/api/dashboard')).body.nextWorkout;
      const started = await c.post('/api/sessions', { planWorkoutId: next.workoutId });
      expect(started.status, JSON.stringify(started.body)).toBe(201);
      expect((await c.post(`/api/sessions/${started.body.session.id}/finish`, {})).status).toBe(200);
      return next;
    };

    // Day 1: Upper B replaces Full body; finishing it must not move the rotation past Full body.
    expect(await trainSuggested()).toMatchObject({ workoutId: workoutIds[3], schedule: { code: 'avoid_back_to_back', skippedFocus: 'full_body' } });
    expect(await nextIndex()).toBe(2);
    // Day 2: Full body still overlaps (upper yesterday), so another day stands in; the rotation keeps waiting.
    await dayLater();
    expect(await trainSuggested()).toMatchObject({ workoutId: workoutIds[4], schedule: { code: 'avoid_back_to_back', skippedFocus: 'full_body' } });
    expect(await nextIndex()).toBe(2);
    // Day 3: stand-ins take turns from yesterday's day (Lower B → Upper A) instead of repeating Upper B.
    await dayLater();
    expect((await c.get('/api/dashboard')).body.nextWorkout).toMatchObject({ workoutId: workoutIds[0], schedule: { code: 'avoid_back_to_back', skippedFocus: 'full_body' } });
    // After a rest day the skipped Full body day comes up, and finishing it moves on as usual.
    await dayLater();
    expect(await trainSuggested()).toMatchObject({ workoutId: workoutIds[2], schedule: { code: 'rotation' } });
    expect(await nextIndex()).toBe(3);
  });

  it('plans a rest day only when preferred days remain to reach the weekly goal', async () => {
    const today = todayInTimeZone('UTC');
    const future = futureDatesOfWeek(today, startOfWeek(today, 1));
    const onlyFuture = [...new Set(future.map(dayOfWeek))];
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 1, preferred_days: onlyFuture.length ? onlyFuture : [dayOfWeek(today)] }, { timezone: 'UTC', locale: 'en' });
    const { workoutIds } = await seedPlan(c.userId!, { workouts: [{ name: 'Full', focus: 'full_body_a', exercises: ['push_up'] }] });
    const next = (await c.get('/api/dashboard')).body.nextWorkout;
    expect(next.workoutId).toBe(workoutIds[0]);
    if (future.length) {
      expect(next.schedule).toEqual({ code: 'rest_day_scheduled', skippedFocus: null, nextTrainingDate: future[0] });
    } else {
      expect(next.schedule.code).toBe('preferred_day'); // last day of the week: today is the only day left
    }
    // Nothing to rest for once the goal is met.
    const met = await onboardedUser(server.baseUrl, { weekly_workout_goal: 1, preferred_days: onlyFuture.length ? onlyFuture : [dayOfWeek(today)] }, { timezone: 'UTC', locale: 'en' });
    await seedPlan(met.userId!, { workouts: [{ name: 'Full', focus: 'full_body_a', exercises: ['push_up'] }] });
    const endedAt = new Date(`${today}T05:00:00Z`);
    const id = await seedSession(met.userId!, { endedAt, name: 'Done', sets: sets(4, { exerciseId: 'push_up', reps: 12 }) });
    await db.tx((tx) => onWorkoutCompleted(tx, { userId: met.userId!, sessionId: id, date: today, endedAt, durationSeconds: 2700, completedSets: 4, totalVolumeKg: 0, personalRecordIds: [] }));
    expect((await met.get('/api/dashboard')).body.nextWorkout.schedule.code).not.toBe('rest_day_scheduled');
  });

  it("is scoped to the signed-in user and requires authentication", async () => {
    const owner = await onboardedUser(server.baseUrl);
    await seedPlan(owner.userId!, { workouts: [{ name: 'Only day', exercises: ['push_up'] }] });
    await seedFood(owner.userId!, todayInTimeZone('UTC'), 'lunch', { kcal: 500 });
    const other = await onboardedUser(server.baseUrl);
    const res = (await other.get('/api/dashboard')).body;
    expect(res.activePlan).toBeNull();
    expect(res.nutritionToday.entryCount).toBe(0);
    expect((await owner.get('/api/dashboard')).body.activePlan.name).toBe('Seeded plan');
    expect((await new TestClient(server.baseUrl).get('/api/dashboard')).status).toBe(401);
  });

  it('active plan without workouts has no next workout', async () => {
    const c = await onboardedUser(server.baseUrl);
    await seedPlan(c.userId!, { name: 'Empty plan', workouts: [] });
    const res = (await c.get('/api/dashboard')).body;
    expect(res.activePlan.name).toBe('Empty plan');
    expect(res.nextWorkout).toBeNull();
  });
});
