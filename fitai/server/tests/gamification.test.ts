import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays, dayOfWeek, startOfWeek, todayInTimeZone } from '@shared/dates';
import { ACHIEVEMENTS, XP_RULES, computeWeeklyStreak, isQualifyingWorkout, levelInfo, weeklyGoalFor } from '@shared/gamification';
import { db } from '../src/db/pool';
import { onBodyWeightLogged, onCoachQuestion, onFoodLogged, onWorkoutCompleted, type WorkoutCompletedEvent } from '../src/modules/gamification/hooks';
import { backdateAccount, noonUtc, seedBodyWeight, seedFood, seedPr, seedSession, sets } from './helpers/progressSeed';
import { TestClient, onboardedUser, registerUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;
const today = () => todayInTimeZone('UTC');

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

/** Seeds a completed session and fires the hook like the sessions module does. */
async function completeWorkout(
  userId: string,
  opts: { date: string; minutes?: number; setCount?: number; prIds?: string[]; at?: Date },
): Promise<{ sessionId: string; event: WorkoutCompletedEvent; reward: Awaited<ReturnType<typeof onWorkoutCompleted>> }> {
  const endedAt = opts.at ?? noonUtc(opts.date);
  const durationSeconds = (opts.minutes ?? 45) * 60;
  const setCount = opts.setCount ?? 10;
  const sessionId = await seedSession(userId, {
    endedAt,
    durationSeconds,
    sets: sets(setCount, { exerciseId: 'barbell_bench_press', reps: 8, weightKg: 60 }),
  });
  const event: WorkoutCompletedEvent = {
    userId,
    sessionId,
    date: opts.date,
    endedAt,
    durationSeconds,
    completedSets: setCount,
    totalVolumeKg: setCount * 480,
    personalRecordIds: opts.prIds ?? [],
  };
  const reward = await db.tx((tx) => onWorkoutCompleted(tx, event));
  return { sessionId, event, reward };
}

const xpTotal = async (userId: string) =>
  Number((await db.one<{ t: number }>('SELECT COALESCE(SUM(xp), 0)::int AS t FROM xp_events WHERE user_id = $1', [userId])).t);
const notifications = (userId: string, kind?: string) =>
  db.many<{ kind: string; data: Record<string, unknown>; dedupe_key: string | null }>(
    `SELECT kind, data, dedupe_key FROM notifications WHERE user_id = $1 AND ($2::text IS NULL OR kind = $2) ORDER BY created_at, id`,
    [userId, kind ?? null],
  );

/** A Monday-start week that is entirely in the past (two weeks ago). */
const pastWeek = () => addDays(startOfWeek(today(), 1), -14);

describe('shared rules', () => {
  it('qualifying workouts, weekly goal fallback and level curve', () => {
    expect(isQualifyingWorkout(600, 3)).toBe(true);
    expect(isQualifyingWorkout(599, 10)).toBe(false);
    expect(isQualifyingWorkout(3600, 2)).toBe(false);
    expect(isQualifyingWorkout(null, 5)).toBe(false);
    expect(weeklyGoalFor(4, 3)).toBe(4);
    expect(weeklyGoalFor(null, 5)).toBe(5);
    expect(weeklyGoalFor(null, null)).toBe(3);
    expect(levelInfo(99).level).toBe(1);
    expect(levelInfo(100).level).toBe(2);
    expect(levelInfo(300).level).toBe(3);
  });

  it('computes current and longest weekly streaks', () => {
    const cur = '2026-10-05';
    const weeks = (list: [string, number][]) => new Map(list);
    // Met last week and the two before → current 3 (current week not met yet).
    expect(computeWeeklyStreak(weeks([['2026-09-14', 3], ['2026-09-21', 3], ['2026-09-28', 4], [cur, 1]]), 3, cur)).toEqual({ currentWeeks: 3, longestWeeks: 3 });
    // Current week already met → counts.
    expect(computeWeeklyStreak(weeks([['2026-09-28', 3], [cur, 3]]), 3, cur)).toEqual({ currentWeeks: 2, longestWeeks: 2 });
    // A gap breaks the streak; the longest run is remembered.
    expect(
      computeWeeklyStreak(weeks([['2026-08-03', 2], ['2026-08-10', 2], ['2026-08-17', 2], ['2026-08-24', 2], ['2026-09-21', 2], ['2026-09-28', 2]]), 2, cur),
    ).toEqual({ currentWeeks: 2, longestWeeks: 4 });
    // Last week missed → streak is 0 even though older weeks were met.
    expect(computeWeeklyStreak(weeks([['2026-09-21', 3]]), 3, cur)).toEqual({ currentWeeks: 0, longestWeeks: 1 });
    expect(computeWeeklyStreak(new Map(), 3, cur)).toEqual({ currentWeeks: 0, longestWeeks: 0 });
  });
});

describe('onWorkoutCompleted', () => {
  it('awards base XP plus a capped per-set bonus', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 7 });
    const ws = pastWeek();
    const small = await completeWorkout(c.userId!, { date: ws, setCount: 10 });
    expect(small.reward.xpAwarded).toBe(XP_RULES.workoutCompleted + 10 * XP_RULES.perCompletedSet);
    expect(small.reward.notes).toEqual([]);
    const big = await completeWorkout(c.userId!, { date: addDays(ws, 1), setCount: 25 });
    expect(big.reward.xpAwarded).toBe(XP_RULES.workoutCompleted + XP_RULES.perSessionSetXpCap);
  });

  it('gives no XP for too-short workouts', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 7 });
    const ws = pastWeek();
    const short = await completeWorkout(c.userId!, { date: ws, minutes: 5 });
    expect(short.reward.xpAwarded).toBe(0);
    expect(short.reward.notes).toEqual(['too_short']);
    const fewSets = await completeWorkout(c.userId!, { date: addDays(ws, 1), setCount: 2 });
    expect(fewSets.reward.xpAwarded).toBe(0);
    expect(fewSets.reward.notes).toEqual(['too_short']);
    expect(await xpTotal(c.userId!)).toBe(0);
  });

  it('rewards at most one workout per calendar day', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 7 });
    const d = pastWeek();
    const first = await completeWorkout(c.userId!, { date: d, at: new Date(`${d}T08:00:00Z`) });
    expect(first.reward.xpAwarded).toBeGreaterThan(0);
    const second = await completeWorkout(c.userId!, { date: d, at: new Date(`${d}T18:00:00Z`) });
    expect(second.reward.xpAwarded).toBe(0);
    expect(second.reward.notes).toEqual(['daily_workout_cap']);
  });

  it('rewards the weekly goal once and stops rewarding workouts beyond goal + buffer (rest matters)', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 2 });
    const ws = pastWeek();
    const perWorkout = XP_RULES.workoutCompleted + 10 * XP_RULES.perCompletedSet;
    const w1 = await completeWorkout(c.userId!, { date: ws });
    expect(w1.reward.xpAwarded).toBe(perWorkout);
    const w2 = await completeWorkout(c.userId!, { date: addDays(ws, 1) });
    expect(w2.reward.xpAwarded).toBe(perWorkout + XP_RULES.weeklyGoalMet);
    const w3 = await completeWorkout(c.userId!, { date: addDays(ws, 2) });
    expect(w3.reward.xpAwarded).toBe(perWorkout); // goal + 1 buffer is still rewarded
    const w4 = await completeWorkout(c.userId!, { date: addDays(ws, 3) });
    expect(w4.reward.xpAwarded).toBe(0);
    expect(w4.reward.notes).toEqual(['rest_matters']);
    const weekly = await notifications(c.userId!, 'weekly_goal');
    expect(weekly).toHaveLength(1);
    expect(weekly[0]!.data).toMatchObject({ weekStart: ws, goal: 2, completed: 2 });
    expect(await xpTotal(c.userId!)).toBe(3 * perWorkout + XP_RULES.weeklyGoalMet);
  });

  it('rewards PRs up to the per-session cap and notifies every PR', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 7 });
    const d = pastWeek();
    const prIds: string[] = [];
    for (const [i, type] of ['max_weight', 'est_1rm', 'max_volume', 'max_reps', 'max_duration'].entries()) {
      prIds.push(await seedPr(c.userId!, { exerciseId: 'barbell_bench_press', recordType: type, value: 100 + i, previousValue: 90, achievedAt: noonUtc(d) }));
    }
    const { reward } = await completeWorkout(c.userId!, { date: d, prIds });
    const base = XP_RULES.workoutCompleted + 10 * XP_RULES.perCompletedSet;
    expect(reward.xpAwarded).toBe(base + XP_RULES.maxRewardedPrsPerSession * XP_RULES.personalRecord);
    const prNotes = await notifications(c.userId!, 'personal_record');
    expect(prNotes).toHaveLength(5);
    // Notifications keep the caller's PR order (clock_timestamp ordering within one transaction).
    expect(prNotes.map((n) => n.data.recordType)).toEqual(['max_weight', 'est_1rm', 'max_volume', 'max_reps', 'max_duration']);
    expect(prNotes[0]!.data).toMatchObject({ exerciseId: 'barbell_bench_press', recordType: 'max_weight', value: 100, previousValue: 90 });
    expect((prNotes[0]!.data.exerciseName as { en: string }).en).toMatch(/bench/i);
    expect(reward.newAchievements).toEqual(expect.arrayContaining(['first_workout', 'first_pr']));
  });

  it('is idempotent: calling the hook twice never double-awards or duplicates notifications', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 1 });
    const d = pastWeek();
    const pr = await seedPr(c.userId!, { exerciseId: 'barbell_back_squat', recordType: 'max_weight', value: 120, previousValue: 110, achievedAt: noonUtc(d) });
    const first = await completeWorkout(c.userId!, { date: d, prIds: [pr] });
    expect(first.reward.xpAwarded).toBe(XP_RULES.workoutCompleted + 20 + XP_RULES.personalRecord + XP_RULES.weeklyGoalMet);
    const total = await xpTotal(c.userId!);
    const notes = (await notifications(c.userId!)).length;
    const again = await db.tx((tx) => onWorkoutCompleted(tx, first.event));
    expect(again).toEqual({ xpAwarded: 0, newAchievements: [], levelUp: null, notes: [] });
    expect(await xpTotal(c.userId!)).toBe(total);
    expect((await notifications(c.userId!)).length).toBe(notes);
    // Repeated calls echo the stored limitation notes.
    const short = await completeWorkout(c.userId!, { date: addDays(d, 1), minutes: 3 });
    const shortAgain = await db.tx((tx) => onWorkoutCompleted(tx, short.event));
    expect(shortAgain.notes).toEqual(['too_short']);
  });

  it('notifies a level-up exactly once', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 1 });
    const d = pastWeek();
    const { reward } = await completeWorkout(c.userId!, { date: d });
    expect(reward.levelUp).toEqual({ from: 1, to: 2 });
    const levelNotes = await notifications(c.userId!, 'level_up');
    expect(levelNotes).toHaveLength(1);
    expect(levelNotes[0]!.data).toEqual({ level: 2, from: 1 });
    expect(levelNotes[0]!.dedupe_key).toBe('level:2');
    const next = await completeWorkout(c.userId!, { date: addDays(d, 1) });
    expect(next.reward.levelUp).toBeNull();
    expect(await notifications(c.userId!, 'level_up')).toHaveLength(1);
  });

  it('unlocks achievements once with a single deduplicated notification', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 1 });
    const d = pastWeek();
    const first = await completeWorkout(c.userId!, { date: d });
    expect(first.reward.newAchievements).toEqual(expect.arrayContaining(['first_workout', 'weekly_goal_1']));
    const second = await completeWorkout(c.userId!, { date: addDays(d, 1) });
    expect(second.reward.newAchievements).not.toContain('first_workout');
    const ach = await notifications(c.userId!, 'achievement');
    expect(ach.filter((n) => n.data.achievementId === 'first_workout')).toHaveLength(1);
    expect(ach.find((n) => n.data.achievementId === 'first_workout')!.dedupe_key).toBe('achievement:first_workout');
    const rows = await db.many('SELECT achievement_id FROM user_achievements WHERE user_id = $1', [c.userId]);
    expect(rows.map((r) => r.achievement_id).sort()).toEqual(['first_workout', 'weekly_goal_1']);
  });

  it('never throws: a broken event yields an empty reward and leaves the transaction usable', async () => {
    const c = await onboardedUser(server.baseUrl);
    const result = await db.tx(async (tx) => {
      const r = await onWorkoutCompleted(tx, {
        userId: '00000000-0000-4000-8000-000000000000',
        sessionId: '00000000-0000-4000-8000-000000000001',
        date: today(),
        endedAt: new Date(),
        durationSeconds: 3600,
        completedSets: 10,
        totalVolumeKg: 0,
        personalRecordIds: [],
      });
      const still = await tx.one<{ ok: number }>('SELECT 1 AS ok');
      return { r, still };
    });
    expect(result.r).toEqual({ xpAwarded: 0, newAchievements: [], levelUp: null, notes: [] });
    expect(result.still.ok).toBe(1);
    expect(await xpTotal(c.userId!)).toBe(0);
  });
});

describe('onFoodLogged', () => {
  it('needs two meal types, rewards protein days at the threshold, and is idempotent', async () => {
    const c = await onboardedUser(server.baseUrl);
    const profile = (await c.get('/api/profile')).body.profile;
    const target = profile.targets.proteinG as number;
    const d = today();
    await seedFood(c.userId!, d, 'breakfast', { kcal: 500, proteinG: 30 });
    const one = await db.tx((tx) => onFoodLogged(tx, { userId: c.userId!, date: d }));
    expect(one.xpAwarded).toBe(0);
    expect(one.newAchievements).toEqual(['first_food_log']);
    await seedFood(c.userId!, d, 'lunch', { kcal: 700, proteinG: 40 });
    const two = await db.tx((tx) => onFoodLogged(tx, { userId: c.userId!, date: d }));
    expect(two.xpAwarded).toBe(XP_RULES.foodLoggedDay);
    expect(two.newAchievements).toEqual([]);
    // Reach exactly the protein threshold (90% of target).
    await seedFood(c.userId!, d, 'dinner', { kcal: 800, proteinG: Math.ceil(target * XP_RULES.proteinTargetThreshold) - 70 });
    const protein = await db.tx((tx) => onFoodLogged(tx, { userId: c.userId!, date: d }));
    expect(protein.xpAwarded).toBe(XP_RULES.proteinTargetDay);
    const again = await db.tx((tx) => onFoodLogged(tx, { userId: c.userId!, date: d }));
    expect(again.xpAwarded).toBe(0);
    expect(await xpTotal(c.userId!)).toBe(XP_RULES.foodLoggedDay + XP_RULES.proteinTargetDay);
  });

  it('does not reward protein below the threshold or back-filled days', async () => {
    const c = await onboardedUser(server.baseUrl);
    const target = (await c.get('/api/profile')).body.profile.targets.proteinG as number;
    const d = today();
    await seedFood(c.userId!, d, 'breakfast', { kcal: 400, proteinG: Math.floor(target * 0.5) });
    await seedFood(c.userId!, d, 'snack', { kcal: 200, proteinG: 5 });
    const r = await db.tx((tx) => onFoodLogged(tx, { userId: c.userId!, date: d }));
    expect(r.xpAwarded).toBe(XP_RULES.foodLoggedDay);
    const old = addDays(d, -(XP_RULES.foodRewardWindowDays + 1));
    await seedFood(c.userId!, old, 'breakfast', { kcal: 400, proteinG: target });
    await seedFood(c.userId!, old, 'dinner', { kcal: 400, proteinG: target });
    const back = await db.tx((tx) => onFoodLogged(tx, { userId: c.userId!, date: old }));
    expect(back.xpAwarded).toBe(0);
    expect(back.notes).toEqual(['outside_reward_window']);
  });

  it('unlocks the 7-day logging and protein achievements from recorded days', async () => {
    const c = await onboardedUser(server.baseUrl);
    const target = (await c.get('/api/profile')).body.profile.targets.proteinG as number;
    for (let i = 0; i < 7; i++) await seedFood(c.userId!, addDays(today(), -i), 'lunch', { kcal: 2500, proteinG: target });
    const r = await db.tx((tx) => onFoodLogged(tx, { userId: c.userId!, date: today() }));
    expect(r.newAchievements).toEqual(expect.arrayContaining(['first_food_log', 'food_log_7_days', 'protein_target_7_days']));
  });
});

describe('onBodyWeightLogged & onCoachQuestion', () => {
  it('rewards weigh-ins at most once per week and unlocks the 4-week habit', async () => {
    const c = await onboardedUser(server.baseUrl);
    const first = await db.tx((tx) => onBodyWeightLogged(tx, { userId: c.userId!, date: today() }));
    expect(first.xpAwarded).toBe(XP_RULES.bodyWeightWeekly);
    const second = await db.tx((tx) => onBodyWeightLogged(tx, { userId: c.userId!, date: today() }));
    expect(second.xpAwarded).toBe(0);
    expect(second.notes).toEqual(['weekly_weigh_in_cap']);
    for (let i = 0; i < 4; i++) await seedBodyWeight(c.userId!, addDays(today(), -7 * i), 80 - i);
    const habit = await db.tx((tx) => onBodyWeightLogged(tx, { userId: c.userId!, date: today() }));
    expect(habit.newAchievements).toContain('body_weight_4_weeks');
    expect(habit.xpAwarded).toBe(0);
  });

  it('first coach question unlocks an achievement without XP, once', async () => {
    const c = await onboardedUser(server.baseUrl);
    const r = await db.tx((tx) => onCoachQuestion(tx, { userId: c.userId! }));
    expect(r).toEqual({ xpAwarded: 0, newAchievements: ['coach_first_question'], levelUp: null, notes: [] });
    const again = await db.tx((tx) => onCoachQuestion(tx, { userId: c.userId! }));
    expect(again.newAchievements).toEqual([]);
    expect(await notifications(c.userId!, 'achievement')).toHaveLength(1);
  });
});

describe('GET /api/gamification', () => {
  it('returns level, every achievement with progress, weekly goal and recent XP', async () => {
    const c = await onboardedUser(server.baseUrl, { weekly_workout_goal: 3 });
    const empty = await c.get('/api/gamification');
    expect(empty.status).toBe(200);
    expect(empty.body.level).toMatchObject({ level: 1, totalXp: 0 });
    expect(empty.body.achievements).toHaveLength(ACHIEVEMENTS.length);
    expect(empty.body.achievements.every((a: { unlockedAt: string | null }) => a.unlockedAt === null)).toBe(true);
    expect(empty.body.weeklyGoal).toEqual({ weekStart: startOfWeek(today(), 1), target: 3, completed: 0, met: false });
    expect(empty.body.streak).toEqual({ currentWeeks: 0, longestWeeks: 0 });
    expect(empty.body.recentXp).toEqual([]);

    await completeWorkout(c.userId!, { date: today() });
    await completeWorkout(c.userId!, { date: today(), minutes: 4 }); // too short: recorded, not counted
    const res = await c.get('/api/gamification');
    expect(res.body.weeklyGoal.completed).toBe(1);
    expect(res.body.level.totalXp).toBe(70);
    const byId = Object.fromEntries(res.body.achievements.map((a: { id: string }) => [a.id, a]));
    expect(byId.first_workout.unlockedAt).not.toBeNull();
    expect(byId.workouts_5.progress).toEqual({ current: 2, target: 5 });
    expect(byId.streak_4_weeks.progress).toEqual({ current: 0, target: 4 });
    expect(res.body.recentXp).toEqual([{ sourceType: 'workout', xp: 70, createdAt: expect.any(String) }]);
  });

  it('computes streaks with each locale week convention', async () => {
    // Pairs of Saturday+Sunday sessions: one Monday-start week each, but split across Sunday-start weeks.
    const en = await onboardedUser(server.baseUrl, { weekly_workout_goal: 2 }, { locale: 'en' });
    const he = await onboardedUser(server.baseUrl, { weekly_workout_goal: 2 }, { locale: 'he' });
    const monday = startOfWeek(today(), 1);
    for (const user of [en, he]) {
      await backdateAccount(user.userId!, 60);
      for (let i = 1; i <= 3; i++) {
        for (const offset of [5, 6]) {
          await seedSession(user.userId!, { endedAt: noonUtc(addDays(monday, -7 * i + offset)), sets: sets(4, { exerciseId: 'push_up', reps: 12 }) });
        }
      }
    }
    const enRes = (await en.get('/api/gamification')).body;
    expect(enRes.streak).toEqual({ currentWeeks: 3, longestWeeks: 3 });
    const heRes = (await he.get('/api/gamification')).body;
    expect(heRes.streak).toEqual({ currentWeeks: dayOfWeek(today()) === 0 ? 0 : 2, longestWeeks: 2 });
    expect(heRes.weeklyGoal.weekStart).toBe(startOfWeek(today(), 0));
  });

  it('requires authentication', async () => {
    const anon = new TestClient(server.baseUrl);
    expect((await anon.get('/api/gamification')).status).toBe(401);
    expect((await anon.get('/api/notifications')).status).toBe(401);
  });
});

describe('notifications API', () => {
  let a: TestClient;
  let b: TestClient;
  beforeAll(async () => {
    a = await registerUser(server.baseUrl);
    b = await registerUser(server.baseUrl);
    for (const id of ['first_workout', 'first_pr', 'first_food_log']) {
      await db.exec(`INSERT INTO notifications (user_id, kind, data, dedupe_key) VALUES ($1, 'achievement', $2, $3)`, [
        a.userId,
        JSON.stringify({ achievementId: id }),
        `achievement:${id}`,
      ]);
    }
  });

  it('lists newest first with unread count and honours limit', async () => {
    const res = await a.get('/api/notifications');
    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(3);
    expect(res.body.notifications).toHaveLength(3);
    expect(res.body.notifications[0]).toMatchObject({ kind: 'achievement', readAt: null, data: { achievementId: expect.any(String) } });
    expect((await a.get('/api/notifications?limit=1')).body.notifications).toHaveLength(1);
    expect((await a.get('/api/notifications?limit=0')).status).toBe(400);
    expect((await a.get('/api/notifications?limit=abc')).status).toBe(400);
    expect((await b.get('/api/notifications')).body).toEqual({ notifications: [], unreadCount: 0 });
  });

  it('isolates users: another user gets 404 and cannot modify', async () => {
    const list = (await a.get('/api/notifications')).body.notifications as { id: string }[];
    const target = list[0]!.id;
    expect((await b.post(`/api/notifications/${target}/read`)).status).toBe(404);
    expect((await b.delete(`/api/notifications/${target}`)).status).toBe(404);
    expect((await b.post('/api/notifications/read-all')).body).toEqual({ ok: true, unreadCount: 0 });
    expect((await a.get('/api/notifications')).body.unreadCount).toBe(3);
    expect((await a.post('/api/notifications/not-a-uuid/read')).status).toBe(400);
  });

  it('marks one / all as read and deletes', async () => {
    const list = (await a.get('/api/notifications')).body.notifications as { id: string }[];
    const read = await a.post(`/api/notifications/${list[0]!.id}/read`);
    expect(read.body).toEqual({ ok: true, unreadCount: 2 });
    expect((await a.post(`/api/notifications/${list[0]!.id}/read`)).body.unreadCount).toBe(2);
    const del = await a.delete(`/api/notifications/${list[1]!.id}`);
    expect(del.body).toEqual({ ok: true, unreadCount: 1 });
    expect((await a.delete(`/api/notifications/${list[1]!.id}`)).status).toBe(404);
    const all = await a.post('/api/notifications/read-all');
    expect(all.body).toEqual({ ok: true, unreadCount: 0 });
    const after = (await a.get('/api/notifications')).body;
    expect(after.notifications).toHaveLength(2);
    expect(after.notifications.every((n: { readAt: string | null }) => n.readAt !== null)).toBe(true);
  });

  it('requires the CSRF token for mutations', async () => {
    expect((await a.post('/api/notifications/read-all', {}, { csrf: false })).status).toBe(403);
  });
});
