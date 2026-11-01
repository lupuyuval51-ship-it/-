import { AccountDeleteBodySchema, BackupPayloadSchema, epley1RM, type BackupPayload } from '@lupu-fit/shared';
import { randomId } from '../crypto/portableCrypto.ts';
import { clearedCookie } from '../core/app.ts';
import { ApiError } from '../core/errors.ts';
import type { Router } from '../core/router.ts';
import type { Deps } from '../core/types.ts';
import { loadProfile, uid } from './util.ts';

export const RESTORE_LIMIT = { hosted: 8 * 1024 * 1024, device: 200 * 1024 * 1024 } as const;

export function accountRoutes(r: Router, d: Deps): void {
  r.get('/api/export', async (ctx) => {
    const u = uid(ctx);
    const profile = await loadProfile(ctx.db, u);
    const bodyWeight = (await ctx.db.query<{ logged_date: string; weight_kg: number; note: string | null }>('SELECT logged_date, weight_kg, note FROM body_weight_entries WHERE user_id = $1 ORDER BY logged_date', [u])).map((w) => ({ loggedDate: w.logged_date, weightKg: w.weight_kg, ...(w.note ? { note: w.note } : {}) }));
    const foodLog = (await ctx.db.query<{ logged_date: string; slot: string; name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number; food_id: string | null }>('SELECT * FROM food_log_entries WHERE user_id = $1 ORDER BY logged_date, created_at', [u])).map((f) => ({ loggedDate: f.logged_date, slot: f.slot as 'breakfast', ...(f.food_id ? { foodId: f.food_id } : {}), name: f.name, grams: f.grams, kcal: f.kcal, proteinG: f.protein_g, carbsG: f.carbs_g, fatG: f.fat_g }));
    const sess = await ctx.db.query<{ id: string; started_at: string; finished_at: string | null }>('SELECT id, started_at, finished_at FROM workout_sessions WHERE user_id = $1 ORDER BY started_at', [u]);
    const sessions = [];
    for (const s of sess) {
      const exs = await ctx.db.query<{ id: string; exercise_id: string; sport: string | null; is_finisher: boolean }>('SELECT id, exercise_id, sport, is_finisher FROM session_exercises WHERE session_id = $1 ORDER BY position', [s.id]);
      const out = [];
      for (const e of exs) {
        const sets = await ctx.db.query<{ reps: number | null; weight_kg: number | null; duration_sec: number | null; rpe: number | null }>('SELECT reps, weight_kg, duration_sec, rpe FROM session_sets WHERE session_exercise_id = $1 ORDER BY set_no', [e.id]);
        out.push({ exerciseId: e.exercise_id, sport: e.sport as null, isFinisher: e.is_finisher, sets: sets.map((t) => ({ ...(t.reps !== null ? { reps: t.reps } : {}), ...(t.weight_kg !== null ? { weightKg: t.weight_kg } : {}), ...(t.duration_sec !== null ? { durationSec: t.duration_sec } : {}), ...(t.rpe !== null ? { rpe: t.rpe } : {}) })) });
      }
      sessions.push({ id: s.id, startedAt: s.started_at, finishedAt: s.finished_at, exercises: out });
    }
    const backup: BackupPayload = { version: 1, exportedAt: ctx.now.toISOString(), profile, bodyWeight, foodLog: foodLog as BackupPayload['foodLog'], sessions: sessions as BackupPayload['sessions'] };
    const extra = {
      plans: await ctx.db.query('SELECT id, name, active, archived, plan, created_at FROM workout_plans WHERE user_id = $1', [u]),
      personalRecords: await ctx.db.query('SELECT exercise_id, max_weight, est_1rm, max_reps, max_volume, max_duration FROM personal_records WHERE user_id = $1', [u]),
      readiness: await ctx.db.query('SELECT local_date, sleep, energy, soreness, pain, state FROM readiness_checkins WHERE user_id = $1', [u]),
      customFoods: await ctx.db.query('SELECT name, kcal, protein_g, carbs_g, fat_g, serving_g, barcode FROM custom_foods WHERE user_id = $1', [u]),
      xpEvents: await ctx.db.query('SELECT source_type, source_key, amount, created_at FROM xp_events WHERE user_id = $1', [u]),
      achievements: await ctx.db.query('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1', [u]),
    };
    return { json: { backup, extra }, headers: { 'content-disposition': 'attachment; filename="lupu-fit-export.json"' } };
  });

  // Mode-dependent payload cap: 200 MB only inside the user's own device worker, 8 MB when hosted.
  r.post('/api/device/restore', async (ctx) => {
    const b = ctx.body as BackupPayload;
    const u = uid(ctx);
    await ctx.db.transaction(async (tx) => {
      await tx.query('DELETE FROM workout_sessions WHERE user_id = $1', [u]);
      await tx.query('DELETE FROM body_weight_entries WHERE user_id = $1', [u]);
      await tx.query('DELETE FROM food_log_entries WHERE user_id = $1', [u]);
      await tx.query('DELETE FROM personal_records WHERE user_id = $1', [u]);
      for (const w of b.bodyWeight) await tx.query('INSERT INTO body_weight_entries (id, user_id, logged_date, weight_kg, note) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id, logged_date) DO UPDATE SET weight_kg = EXCLUDED.weight_kg', [randomId(), u, w.loggedDate, w.weightKg, w.note ?? null]);
      for (const f of b.foodLog) await tx.query('INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, name, grams, kcal, protein_g, carbs_g, fat_g) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [randomId(), u, f.loggedDate, f.slot, f.foodId ?? null, f.name, f.grams, f.kcal, f.proteinG, f.carbsG, f.fatG]);
      const best = new Map<string, { w: number | null; e: number | null; r: number | null; d: number | null }>();
      for (const s of b.sessions) {
        const sid = randomId();
        const startedAt = new Date(s.startedAt);
        await tx.query('INSERT INTO workout_sessions (id, user_id, name, source, started_at, finished_at, duration_sec, local_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [sid, u, 'Restored workout', 'custom', startedAt.toISOString(), s.finishedAt, s.finishedAt ? Math.max(1, Math.round((Date.parse(s.finishedAt) - startedAt.getTime()) / 1000)) : null, startedAt.toISOString().slice(0, 10)]);
        let pos = 0;
        for (const e of s.exercises) {
          const seId = randomId();
          await tx.query('INSERT INTO session_exercises (id, session_id, position, exercise_id, is_finisher, sport, planned) VALUES ($1,$2,$3,$4,$5,$6,$7)', [seId, sid, pos++, e.exerciseId, e.isFinisher, e.sport, '{}']);
          let n = 1;
          for (const t of e.sets) {
            await tx.query('INSERT INTO session_sets (id, session_exercise_id, set_no, reps, weight_kg, duration_sec, rpe) VALUES ($1,$2,$3,$4,$5,$6,$7)', [randomId(), seId, n++, t.reps ?? null, t.weightKg ?? null, t.durationSec ?? null, t.rpe ?? null]);
            const cur = best.get(e.exerciseId) ?? { w: null, e: null, r: null, d: null };
            const e1 = t.weightKg && t.reps ? epley1RM(t.weightKg, t.reps) : null;
            best.set(e.exerciseId, { w: Math.max(cur.w ?? 0, t.weightKg ?? 0) || null, e: Math.max(cur.e ?? 0, e1 ?? 0) || null, r: Math.max(cur.r ?? 0, t.reps ?? 0) || null, d: Math.max(cur.d ?? 0, t.durationSec ?? 0) || null });
          }
        }
      }
      for (const [ex, v] of best) await tx.query('INSERT INTO personal_records (user_id, exercise_id, max_weight, est_1rm, max_reps, max_duration) VALUES ($1,$2,$3,$4,$5,$6)', [u, ex, v.w, v.e, v.r, v.d]);
    });
    return { json: { ok: true, restored: { weights: b.bodyWeight.length, foodEntries: b.foodLog.length, sessions: b.sessions.length } } };
  }, { body: BackupPayloadSchema, maxBodyBytes: d.mode === 'device' ? RESTORE_LIMIT.device : RESTORE_LIMIT.hosted, idempotent: false });

  r.delete('/api/account', async (ctx) => {
    void (ctx.body as { confirm: 'DELETE' });
    const del = await ctx.db.query('DELETE FROM users WHERE id = $1 RETURNING id', [uid(ctx)]); // everything else cascades
    if (del.length === 0) throw new ApiError(404, 'not_found');
    return { json: { ok: true }, setCookies: [clearedCookie(d)] };
  }, { body: AccountDeleteBodySchema });

  r.get('/api/notifications', async (ctx) => {
    const rows = await ctx.db.query<{ id: string; kind: string; payload: unknown; read_at: string | null; created_at: string }>('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [uid(ctx)]);
    return { json: { notifications: rows.map((n) => ({ id: n.id, kind: n.kind, payload: n.payload, read: !!n.read_at, createdAt: n.created_at })) } };
  });
  r.post('/api/notifications/read', async (ctx) => {
    await ctx.db.query('UPDATE notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL', [ctx.now.toISOString(), uid(ctx)]);
    return { json: { ok: true } };
  });
}
