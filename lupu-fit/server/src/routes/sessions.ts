import {
  epley1RM, isoWeekKey, levelFromXp, prXp, setXp, weeklyGoalXp, workoutXp, ageBucket, LIMITS,
  SessionExerciseAddSchema, SessionExerciseReplaceSchema, SessionOrderSchema, SessionStartSchema, SetBodySchema,
  type XpAward,
} from '@lupu-fit/shared';
import { EXERCISES } from '@lupu-fit/shared/content';
import { z } from 'zod';
import { randomId } from '../crypto/portableCrypto.ts';
import type { DbAdapter } from '../db/adapter.ts';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { awardXp, totalXp, unlockAchievements } from '../services/gamification.ts';
import { addDays, isoDate, loadProfile, uid } from './util.ts';

const EX = new Map(EXERCISES.map((e) => [e.id, e]));

interface SetRow { id: string; session_exercise_id: string; set_no: number; reps: number | null; weight_kg: number | null; duration_sec: number | null; rpe: number | null; done_at: string }
interface SessRow { id: string; name: string; source: string; source_id: string | null; sport: string | null; started_at: string; finished_at: string | null; duration_sec: number | null; local_date: string; readiness: string | null; xp_awarded: number }
interface SeRow { id: string; session_id: string; position: number; exercise_id: string; is_finisher: boolean; sport: string | null; planned: unknown }

const toSet = (s: SetRow) => ({ id: s.id, sessionExerciseId: s.session_exercise_id, setNo: s.set_no, reps: s.reps, weightKg: s.weight_kg, durationSec: s.duration_sec, rpe: s.rpe, doneAt: s.done_at });

async function loadSession(db: DbAdapter, userId: string, id: string) {
  const s = (await db.query<SessRow>('SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2', [id, userId]))[0];
  if (!s) throw new ApiError(404, 'not_found'); // another user's id is indistinguishable from a missing one
  const exs = await db.query<SeRow>('SELECT * FROM session_exercises WHERE session_id = $1 ORDER BY position', [id]);
  const sets = exs.length ? await db.query<SetRow>('SELECT t.* FROM session_sets t JOIN session_exercises e ON e.id = t.session_exercise_id WHERE e.session_id = $1 ORDER BY t.set_no', [id]) : [];
  return {
    id: s.id, name: s.name, source: s.source, sourceId: s.source_id, sport: s.sport, startedAt: s.started_at, finishedAt: s.finished_at, durationSec: s.duration_sec, localDate: s.local_date, readiness: s.readiness, xpAwarded: s.xp_awarded,
    exercises: exs.map((e) => ({ id: e.id, position: e.position, exerciseId: e.exercise_id, isFinisher: e.is_finisher, sport: e.sport, planned: e.planned, sets: sets.filter((t) => t.session_exercise_id === e.id).map(toSet) })),
  };
}

async function ownedOpenSession(db: DbAdapter, userId: string, id: string): Promise<SessRow> {
  const s = (await db.query<SessRow>('SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2', [id, userId]))[0];
  if (!s) throw new ApiError(404, 'not_found');
  if (s.finished_at) throw new ApiError(409, 'session_finished');
  return s;
}

export function sessionRoutes(r: Router, _d: Deps): void {
  r.post('/api/sessions', async (ctx) => {
    const b = ctx.body as z.infer<typeof SessionStartSchema>;
    for (const e of b.exercises) if (!EX.has(e.exerciseId)) throw new ApiError(400, 'unknown_exercise', { exerciseId: e.exerciseId });
    const open = (await ctx.db.query<{ id: string }>('SELECT id FROM workout_sessions WHERE user_id = $1 AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', [uid(ctx)]))[0];
    if (open) throw new ApiError(409, 'session_in_progress', { sessionId: open.id });
    const id = randomId();
    await ctx.db.transaction(async (tx) => {
      await tx.query('INSERT INTO workout_sessions (id, user_id, name, source, source_id, sport, started_at, local_date, readiness) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, uid(ctx), b.name, b.source, b.sourceId ?? null, b.sport ?? null, ctx.now.toISOString(), b.localDate, b.readiness ?? null]);
      let pos = 0;
      for (const e of b.exercises) await tx.query('INSERT INTO session_exercises (id, session_id, position, exercise_id, is_finisher, sport, planned) VALUES ($1,$2,$3,$4,$5,$6,$7)', [randomId(), id, pos++, e.exerciseId, e.isFinisher, e.isFinisher ? (e.sport ?? b.sport ?? null) : null, JSON.stringify(e.planned)]);
    });
    return { json: await loadSession(ctx.db, uid(ctx), id), status: 201 };
  }, { body: SessionStartSchema });

  r.get('/api/sessions/active', async (ctx) => {
    const open = (await ctx.db.query<{ id: string }>('SELECT id FROM workout_sessions WHERE user_id = $1 AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1', [uid(ctx)]))[0];
    return { json: { session: open ? await loadSession(ctx.db, uid(ctx), open.id) : null } };
  });

  r.get('/api/sessions', async (ctx) => {
    const limit = Math.min(Math.max(Number(ctx.req.query['limit'] ?? 30) || 30, 1), 200);
    const rows = await ctx.db.query<SessRow & { sets: number; finishers: number }>(`SELECT s.*, (SELECT COUNT(*)::int FROM session_sets t JOIN session_exercises e ON e.id = t.session_exercise_id WHERE e.session_id = s.id) AS sets,
      (SELECT COUNT(*)::int FROM session_exercises e WHERE e.session_id = s.id AND e.is_finisher) AS finishers FROM workout_sessions s WHERE s.user_id = $1 AND s.finished_at IS NOT NULL ORDER BY s.started_at DESC LIMIT $2`, [uid(ctx), limit]);
    return { json: { sessions: rows.map((s) => ({ id: s.id, name: s.name, source: s.source, sourceId: s.source_id, sport: s.sport, startedAt: s.started_at, finishedAt: s.finished_at, durationSec: s.duration_sec, localDate: s.local_date, xpAwarded: s.xp_awarded, sets: s.sets, hasFinisher: s.finishers > 0 })) } };
  });

  r.get('/api/sessions/:id', async (ctx) => ({ json: await loadSession(ctx.db, uid(ctx), ctx.params['id'] as string) }));

  r.delete('/api/sessions/:id', async (ctx) => {
    const del = await ctx.db.query('DELETE FROM workout_sessions WHERE id = $1 AND user_id = $2 RETURNING id', [ctx.params['id'], uid(ctx)]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });

  r.post('/api/sessions/:id/sets', async (ctx) => {
    const b = ctx.body as z.infer<typeof SetBodySchema>;
    await ownedOpenSession(ctx.db, uid(ctx), ctx.params['id'] as string);
    const se = (await ctx.db.query<SeRow>('SELECT * FROM session_exercises WHERE id = $1 AND session_id = $2', [b.sessionExerciseId, ctx.params['id']]))[0];
    if (!se) throw new ApiError(404, 'not_found');
    const next = Number((await ctx.db.query<{ n: number }>('SELECT COALESCE(MAX(set_no),0)::int + 1 AS n FROM session_sets WHERE session_exercise_id = $1', [se.id]))[0]?.n ?? 1);
    if (next > LIMITS.sets.max * 3) throw new ApiError(400, 'too_many_sets');
    const id = randomId();
    await ctx.db.query('INSERT INTO session_sets (id, session_exercise_id, set_no, reps, weight_kg, duration_sec, rpe, done_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [id, se.id, next, b.reps ?? null, b.weightKg ?? null, b.durationSec ?? null, b.rpe ?? null, ctx.now.toISOString()]);
    return { json: { id, sessionExerciseId: se.id, setNo: next, reps: b.reps ?? null, weightKg: b.weightKg ?? null, durationSec: b.durationSec ?? null, rpe: b.rpe ?? null }, status: 201 };
  }, { body: SetBodySchema });

  r.delete('/api/sessions/:id/sets/:setId', async (ctx) => {
    await ownedOpenSession(ctx.db, uid(ctx), ctx.params['id'] as string);
    const del = await ctx.db.query('DELETE FROM session_sets WHERE id = $1 AND session_exercise_id IN (SELECT id FROM session_exercises WHERE session_id = $2) RETURNING id', [ctx.params['setId'], ctx.params['id']]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true } };
  });

  r.post('/api/sessions/:id/exercises', async (ctx) => {
    const b = ctx.body as z.infer<typeof SessionExerciseAddSchema>;
    await ownedOpenSession(ctx.db, uid(ctx), ctx.params['id'] as string);
    if (!EX.has(b.exerciseId)) throw new ApiError(400, 'unknown_exercise');
    const count = Number((await ctx.db.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM session_exercises WHERE session_id = $1', [ctx.params['id']]))[0]?.n ?? 0);
    if (count >= LIMITS.maxExercisesPerWorkout + 10) throw new ApiError(400, 'too_many_exercises');
    const id = randomId();
    await ctx.db.query('INSERT INTO session_exercises (id, session_id, position, exercise_id, is_finisher, sport, planned) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, ctx.params['id'], count, b.exerciseId, b.isFinisher, b.isFinisher ? (b.sport ?? null) : null, JSON.stringify(b.planned)]);
    return { json: await loadSession(ctx.db, uid(ctx), ctx.params['id'] as string), status: 201 };
  }, { body: SessionExerciseAddSchema });

  r.patch('/api/sessions/:id/exercises/:seId', async (ctx) => {
    const b = ctx.body as z.infer<typeof SessionExerciseReplaceSchema>;
    await ownedOpenSession(ctx.db, uid(ctx), ctx.params['id'] as string);
    if (!EX.has(b.exerciseId)) throw new ApiError(400, 'unknown_exercise');
    const has = Number((await ctx.db.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM session_sets WHERE session_exercise_id = $1', [ctx.params['seId']]))[0]?.n ?? 0);
    if (has > 0) throw new ApiError(409, 'exercise_has_sets'); // never rewrite history: replace only before any set is logged
    const up = await ctx.db.query('UPDATE session_exercises SET exercise_id = $1 WHERE id = $2 AND session_id = $3 RETURNING id', [b.exerciseId, ctx.params['seId'], ctx.params['id']]);
    if (up.length === 0) throw new ApiError(404, 'not_found');
    return { json: await loadSession(ctx.db, uid(ctx), ctx.params['id'] as string) };
  }, { body: SessionExerciseReplaceSchema });

  r.delete('/api/sessions/:id/exercises/:seId', async (ctx) => {
    await ownedOpenSession(ctx.db, uid(ctx), ctx.params['id'] as string);
    const del = await ctx.db.query('DELETE FROM session_exercises WHERE id = $1 AND session_id = $2 RETURNING id', [ctx.params['seId'], ctx.params['id']]);
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: await loadSession(ctx.db, uid(ctx), ctx.params['id'] as string) };
  });

  r.put('/api/sessions/:id/order', async (ctx) => {
    const b = ctx.body as z.infer<typeof SessionOrderSchema>;
    await ownedOpenSession(ctx.db, uid(ctx), ctx.params['id'] as string);
    const existing = (await ctx.db.query<{ id: string }>('SELECT id FROM session_exercises WHERE session_id = $1', [ctx.params['id']])).map((x) => x.id).sort();
    if (JSON.stringify([...b.ids].sort()) !== JSON.stringify(existing)) throw new ApiError(400, 'order_mismatch');
    await ctx.db.transaction(async (tx) => { let i = 0; for (const id of b.ids) await tx.query('UPDATE session_exercises SET position = $1 WHERE id = $2', [i++, id]); });
    return { json: await loadSession(ctx.db, uid(ctx), ctx.params['id'] as string) };
  }, { body: SessionOrderSchema });

  r.post('/api/sessions/:id/finish', async (ctx) => {
    const sess = await ownedOpenSession(ctx.db, uid(ctx), ctx.params['id'] as string);
    const profile = await loadProfile(ctx.db, uid(ctx));
    const minor = profile ? ageBucket(profile.age) === 'minor' : false;
    const durationSec = Math.max(1, Math.round((ctx.now.getTime() - new Date(sess.started_at).getTime()) / 1000));
    const full = await loadSession(ctx.db, uid(ctx), sess.id);
    const totalSets = full.exercises.reduce((a, e) => a + e.sets.length, 0);
    const volumeKg = Math.round(full.exercises.reduce((a, e) => a + e.sets.reduce((s, t) => s + (t.weightKg ?? 0) * (t.reps ?? 0), 0), 0));

    const levelBefore = levelFromXp(await totalXp(ctx.db, uid(ctx)));
    const prs: { exerciseId: string; kind: string; value: number; previous: number }[] = [];
    await ctx.db.transaction(async (tx) => {
      await tx.query('UPDATE workout_sessions SET finished_at = $1, duration_sec = $2 WHERE id = $3', [ctx.now.toISOString(), durationSec, sess.id]);
      // personal records: the first time an exercise is logged only sets the baseline; later improvements are PRs (one per exercise per session)
      const byEx = new Map<string, typeof full.exercises[number]['sets']>();
      for (const e of full.exercises) byEx.set(e.exerciseId, [...(byEx.get(e.exerciseId) ?? []), ...e.sets]);
      for (const [exerciseId, sets] of byEx) {
        if (sets.length === 0) continue;
        const weights = sets.filter((s) => s.weightKg && s.weightKg > 0 && s.reps && s.reps > 0);
        const maxWeight = weights.length ? Math.max(...weights.map((s) => s.weightKg as number)) : null;
        const est = minor ? null : weights.length ? Math.max(...weights.map((s) => epley1RM(s.weightKg as number, s.reps as number) ?? 0)) || null : null;
        const maxReps = sets.some((s) => s.reps) ? Math.max(...sets.map((s) => s.reps ?? 0)) : null;
        const maxVolume = weights.length ? Math.max(...weights.map((s) => (s.weightKg as number) * (s.reps as number))) : null;
        const maxDur = sets.some((s) => s.durationSec) ? Math.max(...sets.map((s) => s.durationSec ?? 0)) : null;
        const prev = (await tx.query<{ max_weight: number | null; est_1rm: number | null; max_reps: number | null; max_volume: number | null; max_duration: number | null }>('SELECT max_weight, est_1rm, max_reps, max_volume, max_duration FROM personal_records WHERE user_id = $1 AND exercise_id = $2', [uid(ctx), exerciseId]))[0];
        if (prev) {
          const better = (cur: number | null, old: number | null) => cur !== null && old !== null && cur > old + 1e-9;
          if (weights.length > 0 && (better(est, prev.est_1rm) || better(maxWeight, prev.max_weight))) prs.push({ exerciseId, kind: better(maxWeight, prev.max_weight) ? 'weight' : 'est_1rm', value: better(maxWeight, prev.max_weight) ? (maxWeight as number) : Math.round((est as number) * 10) / 10, previous: better(maxWeight, prev.max_weight) ? (prev.max_weight as number) : (prev.est_1rm as number) });
          else if (weights.length === 0 && better(maxReps, prev.max_reps)) prs.push({ exerciseId, kind: 'reps', value: maxReps as number, previous: prev.max_reps as number });
          else if (weights.length === 0 && better(maxDur, prev.max_duration)) prs.push({ exerciseId, kind: 'duration', value: maxDur as number, previous: prev.max_duration as number });
        }
        const mx = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : Math.max(a, b));
        await tx.query(`INSERT INTO personal_records (user_id, exercise_id, max_weight, est_1rm, max_reps, max_volume, max_duration, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (user_id, exercise_id) DO UPDATE SET max_weight=$3, est_1rm=$4, max_reps=$5, max_volume=$6, max_duration=$7, updated_at=$8`,
          [uid(ctx), exerciseId, mx(prev?.max_weight ?? null, maxWeight), mx(prev?.est_1rm ?? null, est), mx(prev?.max_reps ?? null, maxReps), mx(prev?.max_volume ?? null, maxVolume), mx(prev?.max_duration ?? null, maxDur), ctx.now.toISOString()]);
      }
    });

    // --- XP (all idempotent through the unique key)
    const goal = profile?.daysPerWeek ?? 3;
    const week = isoWeekKey(sess.local_date);
    const recent = await ctx.db.query<{ source_key: string }>("SELECT source_key FROM xp_events WHERE user_id = $1 AND source_type = 'workout' AND source_key >= $2", [uid(ctx), addDays(sess.local_date, -8)]);
    const xpWorkoutThisWeek = recent.filter((x) => isoWeekKey(x.source_key) === week).length;
    const awards: XpAward[] = [];
    const w = workoutXp({ date: sess.local_date, durationMin: durationSec / 60, sets: totalSets, workoutXpAlreadyToday: recent.some((x) => x.source_key === sess.local_date), workoutXpThisWeek: xpWorkoutThisWeek, weeklyGoal: goal });
    if (w) awards.push(w);
    const s = setXp(sess.id, totalSets); if (s) awards.push(s);
    const p = prXp(sess.id, prs.length); if (p) awards.push(p);
    const gained: { type: string; amount: number }[] = [];
    for (const a of awards) if (await awardXp(ctx.db, uid(ctx), a)) gained.push({ type: a.sourceType, amount: a.amount });
    const sessionsThisWeek = (await ctx.db.query<{ local_date: string }>('SELECT DISTINCT local_date FROM workout_sessions WHERE user_id = $1 AND finished_at IS NOT NULL AND local_date >= $2 AND local_date <= $3', [uid(ctx), addDays(sess.local_date, -7), addDays(sess.local_date, 7)])).filter((x) => isoWeekKey(x.local_date) === week).length;
    const wg = weeklyGoalXp(sess.local_date, sessionsThisWeek, goal);
    if (wg && (await awardXp(ctx.db, uid(ctx), wg))) gained.push({ type: wg.sourceType, amount: wg.amount });
    const xpTotal = gained.reduce((a, g) => a + g.amount, 0);
    await ctx.db.query('UPDATE workout_sessions SET xp_awarded = $1 WHERE id = $2', [xpTotal, sess.id]);
    const achievements = await unlockAchievements(ctx.db, uid(ctx), isoDate(ctx.now));
    const levelAfter = levelFromXp(await totalXp(ctx.db, uid(ctx)));
    const finishers = full.exercises.filter((e) => e.isFinisher);
    return { json: { sessionId: sess.id, durationSec, totalSets, volumeKg, prs, xp: gained, xpTotal, achievements, levelBefore, levelAfter, sport: sess.sport, finisherCount: finishers.length } };
  });
}
