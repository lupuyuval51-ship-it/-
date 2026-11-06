import { AccountDeleteBodySchema, ageBucket, BackupPayloadSchema, epley1RM, type BackupPayload } from '@lupu-fit/shared';
import { EXERCISES } from '@lupu-fit/shared/content';
import { randomId } from '../crypto/portableCrypto.ts';
import { clearedCookie } from '../core/app.ts';
import { ApiError } from '../core/errors.ts';
import { BoundedRateLimiter, ident } from '../core/rateLimit.ts';
import type { Router } from '../core/router.ts';
import type { Ctx, Deps } from '../core/types.ts';
import type { DbAdapter } from '../db/adapter.ts';
import { loadProfile, uid } from './util.ts';

export const RESTORE_LIMIT = { hosted: 8 * 1024 * 1024, device: 200 * 1024 * 1024 } as const;
/** Restores running at once in this process; each one also holds a per-user advisory lock, so one person cannot run two in parallel. */
export const MAX_PARALLEL_RESTORES = 2;
const CHUNK = 1000;
/** Exports per account per minute: a full export reads every row the account has. */
export const EXPORT_PER_MIN = 3;
/** Groups rows by a key in one pass (never a filter per group, which is quadratic in the number of rows). */
export function groupBy<T, K extends keyof T>(rows: readonly T[], key: K): Map<T[K], T[]> {
  const m = new Map<T[K], T[]>();
  for (const r of rows) { const l = m.get(r[key]); if (l) l.push(r); else m.set(r[key], [r]); }
  return m;
}
const EX_IDS = new Set(EXERCISES.map((e) => e.id));
/** Name for a restored workout whose backup has none (older exports), in the profile language. */
export const RESTORED_NAME = { he: 'אימון משוחזר', en: 'Restored workout' } as const;

/**
 * Set-based restore: each statement inserts up to CHUNK rows from one JSON array (`jsonb_to_recordset`), instead of one round trip
 * per row. Every row object carries exactly the columns its statement lists.
 */
const BULK = {
  weights: 'INSERT INTO body_weight_entries (id, user_id, logged_date, weight_kg, note) SELECT id, user_id, logged_date, weight_kg, note FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, logged_date date, weight_kg float8, note text)',
  food: 'INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated) SELECT id, user_id, logged_date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, logged_date date, slot text, food_id text, dish_id text, name text, grams float8, kcal float8, protein_g float8, carbs_g float8, fat_g float8, estimated boolean)',
  sessions: 'INSERT INTO workout_sessions (id, user_id, name, source, started_at, finished_at, duration_sec, local_date) SELECT id, user_id, name, source, started_at, finished_at, duration_sec, local_date FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, name text, source text, started_at timestamptz, finished_at timestamptz, duration_sec int, local_date date)',
  exercises: 'INSERT INTO session_exercises (id, session_id, position, exercise_id, is_finisher, sport, planned) SELECT id, session_id, "position", exercise_id, is_finisher, sport, planned FROM jsonb_to_recordset($1::jsonb) AS x(id text, session_id text, "position" int, exercise_id text, is_finisher boolean, sport text, planned jsonb)',
  sets: 'INSERT INTO session_sets (id, session_exercise_id, set_no, reps, weight_kg, duration_sec, rpe) SELECT id, session_exercise_id, set_no, reps, weight_kg, duration_sec, rpe FROM jsonb_to_recordset($1::jsonb) AS x(id text, session_exercise_id text, set_no int, reps int, weight_kg float8, duration_sec int, rpe float8)',
  prs: 'INSERT INTO personal_records (user_id, exercise_id, max_weight, est_1rm, max_reps, max_duration) SELECT user_id, exercise_id, max_weight, est_1rm, max_reps, max_duration FROM jsonb_to_recordset($1::jsonb) AS x(user_id text, exercise_id text, max_weight float8, est_1rm float8, max_reps int, max_duration int)',
} as const;
async function bulkInsert(tx: DbAdapter, sql: string, rows: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) await tx.query(sql, [JSON.stringify(rows.slice(i, i + CHUNK))]);
}

export function accountRoutes(r: Router, d: Deps): void {
  const exportLimiter = new BoundedRateLimiter(EXPORT_PER_MIN);
  r.get('/api/export', async (ctx) => {
    const u = uid(ctx);
    if (!exportLimiter.hit(u, ctx.now.getTime())) throw new ApiError(429, 'rate_limited', undefined, { 'retry-after': '60' });
    const profile = await loadProfile(ctx.db, u);
    const bodyWeight = (await ctx.db.query<{ logged_date: string; weight_kg: number; note: string | null }>('SELECT logged_date, weight_kg, note FROM body_weight_entries WHERE user_id = $1 ORDER BY logged_date', [u])).map((w) => ({ loggedDate: w.logged_date, weightKg: w.weight_kg, ...(w.note ? { note: w.note } : {}) }));
    const foodLog = (await ctx.db.query<{ logged_date: string; slot: string; name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number; food_id: string | null; dish_id: string | null; estimated: boolean }>('SELECT * FROM food_log_entries WHERE user_id = $1 ORDER BY logged_date, created_at', [u])).map((f) => ({ loggedDate: f.logged_date, slot: f.slot as 'breakfast', ...(f.food_id ? { foodId: f.food_id } : {}), ...(f.dish_id ? { dishId: f.dish_id } : {}), name: f.name, grams: f.grams, kcal: f.kcal, proteinG: f.protein_g, carbsG: f.carbs_g, fatG: f.fat_g, ...(f.estimated ? { estimated: true } : {}) }));
    // Three user-scoped queries for the whole workout history (not one per session and one per exercise).
    const sess = await ctx.db.query<{ id: string; name: string; started_at: string; finished_at: string | null }>('SELECT id, name, started_at, finished_at FROM workout_sessions WHERE user_id = $1 ORDER BY started_at, id', [u]);
    const exs = await ctx.db.query<{ id: string; session_id: string; exercise_id: string; sport: string | null; is_finisher: boolean }>('SELECT e.id, e.session_id, e.exercise_id, e.sport, e.is_finisher FROM session_exercises e JOIN workout_sessions s ON s.id = e.session_id WHERE s.user_id = $1 ORDER BY e.session_id, e.position', [u]);
    const sets = await ctx.db.query<{ session_exercise_id: string; reps: number | null; weight_kg: number | null; duration_sec: number | null; rpe: number | null }>('SELECT t.session_exercise_id, t.reps, t.weight_kg, t.duration_sec, t.rpe FROM session_sets t JOIN session_exercises e ON e.id = t.session_exercise_id JOIN workout_sessions s ON s.id = e.session_id WHERE s.user_id = $1 ORDER BY t.session_exercise_id, t.set_no', [u]);
    const setsBy = new Map<string, Record<string, number>[]>();
    for (const t of sets) {
      const list = setsBy.get(t.session_exercise_id) ?? []; setsBy.set(t.session_exercise_id, list);
      list.push({ ...(t.reps !== null ? { reps: t.reps } : {}), ...(t.weight_kg !== null ? { weightKg: t.weight_kg } : {}), ...(t.duration_sec !== null ? { durationSec: t.duration_sec } : {}), ...(t.rpe !== null ? { rpe: t.rpe } : {}) });
    }
    const exBy = new Map<string, unknown[]>();
    for (const e of exs) { const list = exBy.get(e.session_id) ?? []; exBy.set(e.session_id, list); list.push({ exerciseId: e.exercise_id, sport: e.sport as null, isFinisher: e.is_finisher, sets: setsBy.get(e.id) ?? [] }); }
    const sessions = sess.map((s) => ({ id: s.id, name: s.name, startedAt: s.started_at, finishedAt: s.finished_at, exercises: exBy.get(s.id) ?? [] }));
    const backup: BackupPayload = { version: 1, exportedAt: ctx.now.toISOString(), profile, bodyWeight, foodLog: foodLog as BackupPayload['foodLog'], sessions: sessions as BackupPayload['sessions'] };
    // The file must restore: a backup that the restore schema refuses is useless exactly when it is needed. If stored data ever drifts
    // from the write limits again, fail loudly here (and name where) instead of handing over a file that cannot be restored.
    const check = BackupPayloadSchema.safeParse(JSON.parse(JSON.stringify(backup)));
    if (!check.success) {
      console.error('[export] backup would not restore', check.error.issues.slice(0, 5).map((i) => i.path.join('.')));
      throw new ApiError(500, 'internal_error', { reason: 'export_unrestorable', issues: check.error.issues.slice(0, 20).map((i) => ({ path: i.path.join('.'), message: i.message })) });
    }

    // Everything else this account stores (the restore copy names what restore brings back: weights, food and workouts).
    const account = (await ctx.db.query<{ username: string; created_at: string }>('SELECT username, created_at FROM users WHERE id = $1', [u]))[0];
    const threads = await ctx.db.query<{ id: string; title: string; created_at: string; updated_at: string }>('SELECT id, title, created_at, updated_at FROM coach_threads WHERE user_id = $1 ORDER BY created_at, id', [u]);
    const msgs = await ctx.db.query<{ thread_id: string; role: string; content: string; safety_category: string | null; created_at: string }>('SELECT m.thread_id, m.role, m.content, m.safety_category, m.created_at FROM coach_messages m JOIN coach_threads t ON t.id = m.thread_id WHERE t.user_id = $1 ORDER BY m.created_at, m.id', [u]);
    const meals = await ctx.db.query<{ id: string; name: string; slot: string; created_at: string }>('SELECT id, name, slot, created_at FROM saved_meals WHERE user_id = $1 ORDER BY created_at, id', [u]);
    const items = await ctx.db.query<{ saved_meal_id: string; food_id: string | null; name: string; grams: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number }>('SELECT i.saved_meal_id, i.food_id, i.name, i.grams, i.kcal, i.protein_g, i.carbs_g, i.fat_g FROM saved_meal_items i JOIN saved_meals m ON m.id = i.saved_meal_id WHERE m.user_id = $1 ORDER BY i.saved_meal_id, i.id', [u]);
    const itemsBy = groupBy(items, 'saved_meal_id'); const msgsBy = groupBy(msgs, 'thread_id');
    const extra = {
      // Device Mode has no account: the hidden local identifier is an implementation detail and stays out of the file the person keeps.
      account: account && d.mode !== 'device' ? { username: account.username, createdAt: account.created_at } : null,
      plans: await ctx.db.query('SELECT id, name, active, archived, plan, created_at FROM workout_plans WHERE user_id = $1', [u]),
      personalRecords: await ctx.db.query('SELECT exercise_id, max_weight, est_1rm, max_reps, max_volume, max_duration FROM personal_records WHERE user_id = $1', [u]),
      readiness: await ctx.db.query('SELECT local_date, sleep, energy, soreness, pain, state FROM readiness_checkins WHERE user_id = $1', [u]),
      customFoods: await ctx.db.query('SELECT name, kcal, protein_g, carbs_g, fat_g, serving_g, barcode FROM custom_foods WHERE user_id = $1', [u]),
      savedMeals: meals.map((m) => ({ id: m.id, name: m.name, slot: m.slot, createdAt: m.created_at, items: (itemsBy.get(m.id) ?? []).map((i) => ({ ...(i.food_id ? { foodId: i.food_id } : {}), name: i.name, grams: i.grams, kcal: i.kcal, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g })) })),
      coachThreads: threads.map((t) => ({ id: t.id, title: t.title, createdAt: t.created_at, updatedAt: t.updated_at, messages: (msgsBy.get(t.id) ?? []).map((m) => ({ role: m.role, content: m.content, createdAt: m.created_at, safetyCategory: m.safety_category })) })),
      xpEvents: await ctx.db.query('SELECT source_type, source_key, amount, created_at FROM xp_events WHERE user_id = $1', [u]),
      achievements: await ctx.db.query('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1', [u]),
      notifications: await ctx.db.query('SELECT kind, payload, read_at, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at', [u]),
    };
    return { json: { backup, extra }, headers: { 'content-disposition': 'attachment; filename="lupu-fit-export.json"' } };
  });

  // Mode-dependent payload cap: 200 MB only inside the user's own device worker, 8 MB when hosted.
  let restoresRunning = 0;
  r.post('/api/device/restore', async (ctx) => {
    const b = ctx.body as BackupPayload;
    const u = uid(ctx);
    if (restoresRunning >= MAX_PARALLEL_RESTORES) throw new ApiError(503, 'rate_limited', { reason: 'busy' }, { 'retry-after': '5' });
    restoresRunning++;
    try {
      const prof = await loadProfile(ctx.db, u);
      const minor = prof ? ageBucket(prof.age) === 'minor' : false; // no 1RM estimates for minors, however the data got here
      const fallbackName = RESTORED_NAME[prof?.language ?? 'he'];
      // Rows are built first (plain data), then written with a handful of set-based statements.
      const weights = new Map<string, Record<string, unknown>>(); // one row per day, the last one wins (the table is unique per day)
      for (const w of b.bodyWeight) weights.set(w.loggedDate, { id: randomId(), user_id: u, logged_date: w.loggedDate, weight_kg: w.weightKg, note: w.note ?? null });
      const food = b.foodLog.map((f) => ({ id: randomId(), user_id: u, logged_date: f.loggedDate, slot: f.slot, food_id: f.foodId ?? null, dish_id: f.dishId ?? null, name: f.name, grams: f.grams, kcal: f.kcal, protein_g: f.proteinG, carbs_g: f.carbsG, fat_g: f.fatG, estimated: f.estimated ?? false }));
      const sessRows: Record<string, unknown>[] = []; const exRows: Record<string, unknown>[] = []; const setRows: Record<string, unknown>[] = [];
      const best = new Map<string, { w: number | null; e: number | null; r: number | null; d: number | null }>();
      let skipped = 0;
      for (const s of b.sessions) {
        const sid = randomId();
        const startedAt = new Date(s.startedAt);
        sessRows.push({ id: sid, user_id: u, name: s.name ?? fallbackName, source: 'custom', started_at: startedAt.toISOString(), finished_at: s.finishedAt, duration_sec: s.finishedAt ? Math.max(1, Math.round((Date.parse(s.finishedAt) - startedAt.getTime()) / 1000)) : null, local_date: startedAt.toISOString().slice(0, 10) });
        let pos = 0;
        for (const e of s.exercises) {
          // Only exercises this app knows: an unknown id (hand-edited file, renamed in an older content version) would otherwise be
          // shown raw in history and end up in the coach prompt.
          if (!EX_IDS.has(e.exerciseId)) { skipped++; continue; }
          const seId = randomId();
          exRows.push({ id: seId, session_id: sid, position: pos++, exercise_id: e.exerciseId, is_finisher: e.isFinisher, sport: e.sport, planned: {} });
          let n = 1;
          for (const t of e.sets) {
            setRows.push({ id: randomId(), session_exercise_id: seId, set_no: n++, reps: t.reps ?? null, weight_kg: t.weightKg ?? null, duration_sec: t.durationSec ?? null, rpe: t.rpe ?? null });
            const cur = best.get(e.exerciseId) ?? { w: null, e: null, r: null, d: null };
            const e1 = !minor && t.weightKg && t.reps ? epley1RM(t.weightKg, t.reps) : null;
            best.set(e.exerciseId, { w: Math.max(cur.w ?? 0, t.weightKg ?? 0) || null, e: Math.max(cur.e ?? 0, e1 ?? 0) || null, r: Math.max(cur.r ?? 0, t.reps ?? 0) || null, d: Math.max(cur.d ?? 0, t.durationSec ?? 0) || null });
          }
        }
      }
      const prs = [...best].map(([ex, v]) => ({ user_id: u, exercise_id: ex, max_weight: v.w, est_1rm: v.e, max_reps: v.r, max_duration: v.d }));
      await ctx.db.transaction(async (tx) => {
        // One restore per person at a time: a second one in parallel would race on the same rows (and double the work for nothing).
        const lock = (await tx.query<{ ok: boolean }>('SELECT pg_try_advisory_xact_lock(hashtext($1)) AS ok', [`lupu-fit:restore:${u}`]))[0];
        if (!lock?.ok) throw new ApiError(429, 'rate_limited', { reason: 'restore_in_progress' }, { 'retry-after': '5' });
        await tx.query('DELETE FROM workout_sessions WHERE user_id = $1', [u]);
        await tx.query('DELETE FROM body_weight_entries WHERE user_id = $1', [u]);
        await tx.query('DELETE FROM food_log_entries WHERE user_id = $1', [u]);
        await tx.query('DELETE FROM personal_records WHERE user_id = $1', [u]);
        await bulkInsert(tx, BULK.weights, [...weights.values()]);
        await bulkInsert(tx, BULK.food, food);
        await bulkInsert(tx, BULK.sessions, sessRows);
        await bulkInsert(tx, BULK.exercises, exRows);
        await bulkInsert(tx, BULK.sets, setRows);
        await bulkInsert(tx, BULK.prs, prs);
      });
      return { json: { ok: true, restored: { weights: b.bodyWeight.length, foodEntries: b.foodLog.length, sessions: b.sessions.length }, skipped: { unknownExercises: skipped } } };
    } finally { restoresRunning--; }
  }, { body: BackupPayloadSchema, maxBodyBytes: d.mode === 'device' ? RESTORE_LIMIT.device : RESTORE_LIMIT.hosted, idempotent: false });

  r.delete('/api/account', async (ctx) => {
    void (ctx.body as { confirm: 'DELETE' });
    const username = (ctx.user as NonNullable<Ctx['user']>).username;
    const del = await ctx.db.query('DELETE FROM users WHERE id = $1 RETURNING id', [uid(ctx)]); // everything else cascades
    if (del.length === 0) throw new ApiError(404, 'not_found');
    // The only table keyed by the person rather than by user_id: login / registration counters hold a hash of the username.
    await ctx.db.query('DELETE FROM auth_attempts WHERE identifier = $1', [(await ident('username', username)).id]);
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
