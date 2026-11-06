/**
 * Backup export and restore. A backup file is the ONLY way to recover data in Device Mode, so both directions are built to be boring:
 *
 *  - Export reads everything the person owns (never passwords, sign-in sessions, replay records, quota counters, translation ledgers or
 *    the hidden device username) and the route checks the result against the very schema restore uses.
 *  - Restore is REPLACE, all or nothing, in one transaction: every section the file carries replaces what is stored; a section the file
 *    does not carry (a version 1 file has no plans, saved meals, ...) is left exactly as it is. Restoring the same file twice therefore
 *    gives the same data, and nothing is ever merged or duplicated.
 *  - Nothing derived is trusted: personal records are recomputed from the restored sets (and only raised by the file's records), XP events
 *    are accepted only when the restored data still backs them, the readiness state is recomputed, minors never get 1RM estimates, and
 *    the coach safety shield is re-run over restored chat messages.
 */
import {
  ACHIEVEMENT_IDS, ageBucket, classifySafety, epley1RM, isoWeekKey, PrescriptionSchema, readinessState, XP,
  type BackupPayload, type BackupV1, type BackupV2, type ProfileInput,
} from '@lupu-fit/shared';
import { EXERCISES } from '@lupu-fit/shared/content';
import { randomId } from '../crypto/portableCrypto.ts';
import { ApiError } from '../core/errors.ts';
import type { DbAdapter } from '../db/adapter.ts';
import { upsertProfile } from '../routes/profile.ts';
import { loadProfile } from '../routes/util.ts';

const CHUNK = 1000;
const EX_IDS = new Set(EXERCISES.map((e) => e.id));
/** Name for a restored workout whose backup has none (older exports), in the profile language. */
export const RESTORED_NAME = { he: 'אימון משוחזר', en: 'Restored workout' } as const;

/** Groups rows by a key in one pass (never a filter per group, which is quadratic in the number of rows). */
export function groupBy<T, K extends keyof T>(rows: readonly T[], key: K): Map<T[K], T[]> {
  const m = new Map<T[K], T[]>();
  for (const r of rows) { const l = m.get(r[key]); if (l) l.push(r); else m.set(r[key], [r]); }
  return m;
}
const iso = (v: unknown): string => new Date(v as string).toISOString();
const isoOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : iso(v));

/* ============================================================================================================== export */

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- rows straight from SQL, shaped below

/** Reads everything one person owns, in the shape of a version 2 backup. Every query is scoped to the user; children join through their parent. */
export async function buildBackup(db: DbAdapter, userId: string, meta: { now: Date; mode: 'hosted' | 'device'; appVersion: string }): Promise<BackupV2> {
  const q = <T = Row>(sql: string) => db.query<T>(sql, [userId]);
  const profile = await loadProfile(db, userId);
  const bodyWeight = (await q('SELECT logged_date, weight_kg, note FROM body_weight_entries WHERE user_id = $1 ORDER BY logged_date')).map((w) => ({ loggedDate: w['logged_date'] as string, weightKg: w['weight_kg'] as number, ...(w['note'] ? { note: w['note'] as string } : {}) }));
  const readiness = (await q('SELECT local_date, sleep, energy, soreness, pain FROM readiness_checkins WHERE user_id = $1 ORDER BY local_date')).map((r) => ({ localDate: r['local_date'] as string, sleep: r['sleep'] as number, energy: r['energy'] as number, soreness: r['soreness'] as number, pain: r['pain'] as boolean }));
  const foodLog = (await q('SELECT * FROM food_log_entries WHERE user_id = $1 ORDER BY logged_date, created_at, id')).map((f) => ({
    loggedDate: f['logged_date'] as string, slot: f['slot'] as 'breakfast', ...(f['food_id'] ? { foodId: f['food_id'] as string } : {}), ...(f['dish_id'] ? { dishId: f['dish_id'] as string } : {}),
    name: f['name'] as string, grams: f['grams'] as number, kcal: f['kcal'] as number, proteinG: f['protein_g'] as number, carbsG: f['carbs_g'] as number, fatG: f['fat_g'] as number, ...(f['estimated'] ? { estimated: true } : {}),
  }));

  // Workouts: three user-scoped queries for the whole history (not one per session and one per exercise), grouped in single passes.
  const sess = await q('SELECT * FROM workout_sessions WHERE user_id = $1 ORDER BY started_at, id');
  const exs = await q('SELECT e.* FROM session_exercises e JOIN workout_sessions s ON s.id = e.session_id WHERE s.user_id = $1 ORDER BY e.session_id, e.position');
  const sets = await q('SELECT t.* FROM session_sets t JOIN session_exercises e ON e.id = t.session_exercise_id JOIN workout_sessions s ON s.id = e.session_id WHERE s.user_id = $1 ORDER BY t.session_exercise_id, t.set_no');
  const setsBy = groupBy(sets, 'session_exercise_id'); const exBy = groupBy(exs, 'session_id');
  const sessions = sess.map((s) => ({
    id: s['id'] as string, name: s['name'] as string, source: s['source'] as 'custom', sourceId: (s['source_id'] ?? null) as string | null, sport: (s['sport'] ?? null) as null,
    startedAt: iso(s['started_at']), finishedAt: isoOrNull(s['finished_at']), durationSec: (s['duration_sec'] ?? null) as number | null, localDate: s['local_date'] as string,
    readiness: (s['readiness'] ?? null) as null, xpAwarded: (s['xp_awarded'] ?? 0) as number,
    exercises: (exBy.get(s['id']) ?? []).map((e) => {
      const planned = PrescriptionSchema.safeParse(e['planned']);
      return {
        exerciseId: e['exercise_id'] as string, sport: (e['sport'] ?? null) as null, isFinisher: e['is_finisher'] as boolean, planned: planned.success ? planned.data : null,
        sets: (setsBy.get(e['id']) ?? []).map((t) => ({
          ...(t['reps'] !== null ? { reps: t['reps'] as number } : {}), ...(t['weight_kg'] !== null ? { weightKg: t['weight_kg'] as number } : {}),
          ...(t['duration_sec'] !== null ? { durationSec: t['duration_sec'] as number } : {}), ...(t['rpe'] !== null ? { rpe: t['rpe'] as number } : {}), doneAt: iso(t['done_at']),
        })),
      };
    }),
  }));

  const meals = await q('SELECT id, name, slot, created_at FROM saved_meals WHERE user_id = $1 ORDER BY created_at, name, id');
  const items = await q('SELECT i.* FROM saved_meal_items i JOIN saved_meals m ON m.id = i.saved_meal_id WHERE m.user_id = $1 ORDER BY i.saved_meal_id, i.id');
  const itemsBy = groupBy(items, 'saved_meal_id');
  const savedMeals = meals.map((m) => ({
    name: m['name'] as string, slot: m['slot'] as 'lunch', createdAt: iso(m['created_at']),
    items: (itemsBy.get(m['id']) ?? []).map((i) => ({ ...(i['food_id'] ? { foodId: i['food_id'] as string } : {}), name: i['name'] as string, grams: i['grams'] as number, kcal: i['kcal'] as number, proteinG: i['protein_g'] as number, carbsG: i['carbs_g'] as number, fatG: i['fat_g'] as number })),
  }));
  const customFoods = (await q('SELECT * FROM custom_foods WHERE user_id = $1 ORDER BY created_at, name, id')).map((f) => ({
    name: f['name'] as string, kcal: f['kcal'] as number, proteinG: f['protein_g'] as number, carbsG: f['carbs_g'] as number, fatG: f['fat_g'] as number, servingG: f['serving_g'] as number, barcode: (f['barcode'] ?? null) as string | null, createdAt: iso(f['created_at']),
  }));
  const plans = (await q('SELECT * FROM workout_plans WHERE user_id = $1 ORDER BY created_at, name, id')).map((p) => ({ id: p['id'] as string, name: p['name'] as string, active: p['active'] as boolean, archived: p['archived'] as boolean, createdAt: iso(p['created_at']), plan: p['plan'] as BackupV2['plans'][number]['plan'] }));
  const personalRecords = (await q('SELECT * FROM personal_records WHERE user_id = $1 ORDER BY exercise_id')).map((r) => ({
    exerciseId: r['exercise_id'] as string, maxWeight: (r['max_weight'] ?? null) as number | null, est1rm: (r['est_1rm'] ?? null) as number | null, maxReps: (r['max_reps'] ?? null) as number | null,
    maxVolume: (r['max_volume'] ?? null) as number | null, maxDuration: (r['max_duration'] ?? null) as number | null, updatedAt: iso(r['updated_at']),
  }));
  const xpEvents = (await q('SELECT source_type, source_key, amount, created_at FROM xp_events WHERE user_id = $1 ORDER BY created_at, source_type, source_key')).map((x) => ({ sourceType: x['source_type'] as string, sourceKey: x['source_key'] as string, amount: x['amount'] as number, createdAt: iso(x['created_at']) }));
  const achievements = (await q('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at, achievement_id')).map((a) => ({ id: a['achievement_id'] as string, unlockedAt: iso(a['unlocked_at']) }));
  const notifications = (await q('SELECT kind, payload, read_at, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at, kind, payload::text, id')).map((n) => ({ kind: n['kind'] as string, payload: (n['payload'] ?? {}) as Record<string, string>, read: !!n['read_at'], createdAt: iso(n['created_at']) }));
  const threads = await q('SELECT id, title, created_at, updated_at FROM coach_threads WHERE user_id = $1 ORDER BY created_at, title, id');
  const msgs = await q('SELECT m.* FROM coach_messages m JOIN coach_threads t ON t.id = m.thread_id WHERE t.user_id = $1 ORDER BY m.created_at, m.id');
  const msgsBy = groupBy(msgs, 'thread_id');
  const coachThreads = threads.map((t) => ({
    title: t['title'] as string, createdAt: iso(t['created_at']), updatedAt: iso(t['updated_at']),
    messages: (msgsBy.get(t['id']) ?? []).map((m) => ({ role: m['role'] as 'user', content: m['content'] as string, provider: (m['provider'] ?? null) as string | null, safetyCategory: (m['safety_category'] ?? null) as string | null, createdAt: iso(m['created_at']) })),
  }));

  return { version: 2, exportedAt: meta.now.toISOString(), appVersion: meta.appVersion, mode: meta.mode, profile, bodyWeight, readiness, foodLog, savedMeals, customFoods, plans, sessions, personalRecords, xpEvents, achievements, notifications, coachThreads };
}

/* ============================================================================================================= restore */

/** What a restore can replace. `workouts` includes the personal records, `xp` the XP events and achievements. */
export const RESTORE_SECTIONS = ['profile', 'weights', 'readiness', 'food', 'workouts', 'plans', 'savedMeals', 'customFoods', 'coach', 'xp', 'notifications'] as const;
export type RestoreSection = (typeof RESTORE_SECTIONS)[number];

export interface RestoreSummary {
  ok: true;
  /** `replace`: what the file carries replaced what was stored; what it does not carry was left alone (see `untouched`). */
  policy: 'replace';
  backupVersion: 1 | 2;
  restored: {
    workouts: number; sets: number; foods: number; weights: number; plans: number; savedMeals: number; customFoods: number; threads: number; messages: number;
    readiness: number; personalRecords: number; xpEvents: number; achievements: number; notifications: number; profile: number;
  };
  skipped: { profile: number; unknownExercises: number; unfinishedWorkouts: number; duplicateDays: number; invalidItems: number; xpEvents: number; achievements: number };
  untouched: RestoreSection[];
}

/** Set-based inserts: each statement takes up to CHUNK rows from one JSON array (`jsonb_to_recordset`), not one round trip per row. */
const BULK = {
  weights: 'INSERT INTO body_weight_entries (id, user_id, logged_date, weight_kg, note) SELECT id, user_id, logged_date, weight_kg, note FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, logged_date date, weight_kg float8, note text)',
  readiness: 'INSERT INTO readiness_checkins (id, user_id, local_date, sleep, energy, soreness, pain, state, created_at) SELECT id, user_id, local_date, sleep, energy, soreness, pain, state, created_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, local_date date, sleep int, energy int, soreness int, pain boolean, state text, created_at timestamptz)',
  food: 'INSERT INTO food_log_entries (id, user_id, logged_date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated, created_at) SELECT id, user_id, logged_date, slot, food_id, dish_id, name, grams, kcal, protein_g, carbs_g, fat_g, estimated, created_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, logged_date date, slot text, food_id text, dish_id text, name text, grams float8, kcal float8, protein_g float8, carbs_g float8, fat_g float8, estimated boolean, created_at timestamptz)',
  plans: 'INSERT INTO workout_plans (id, user_id, name, active, archived, plan, created_at) SELECT id, user_id, name, active, archived, plan, created_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, name text, active boolean, archived boolean, plan jsonb, created_at timestamptz)',
  sessions: 'INSERT INTO workout_sessions (id, user_id, name, source, source_id, sport, started_at, finished_at, duration_sec, local_date, readiness, xp_awarded) SELECT id, user_id, name, source, source_id, sport, started_at, finished_at, duration_sec, local_date, readiness, xp_awarded FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, name text, source text, source_id text, sport text, started_at timestamptz, finished_at timestamptz, duration_sec int, local_date date, readiness text, xp_awarded int)',
  exercises: 'INSERT INTO session_exercises (id, session_id, position, exercise_id, is_finisher, sport, planned) SELECT id, session_id, "position", exercise_id, is_finisher, sport, planned FROM jsonb_to_recordset($1::jsonb) AS x(id text, session_id text, "position" int, exercise_id text, is_finisher boolean, sport text, planned jsonb)',
  sets: 'INSERT INTO session_sets (id, session_exercise_id, set_no, reps, weight_kg, duration_sec, rpe, done_at) SELECT id, session_exercise_id, set_no, reps, weight_kg, duration_sec, rpe, done_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, session_exercise_id text, set_no int, reps int, weight_kg float8, duration_sec int, rpe float8, done_at timestamptz)',
  prs: 'INSERT INTO personal_records (user_id, exercise_id, max_weight, est_1rm, max_reps, max_volume, max_duration, updated_at) SELECT user_id, exercise_id, max_weight, est_1rm, max_reps, max_volume, max_duration, updated_at FROM jsonb_to_recordset($1::jsonb) AS x(user_id text, exercise_id text, max_weight float8, est_1rm float8, max_reps int, max_volume float8, max_duration int, updated_at timestamptz)',
  meals: 'INSERT INTO saved_meals (id, user_id, name, slot, created_at) SELECT id, user_id, name, slot, created_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, name text, slot text, created_at timestamptz)',
  mealItems: 'INSERT INTO saved_meal_items (id, saved_meal_id, food_id, name, grams, kcal, protein_g, carbs_g, fat_g) SELECT id, saved_meal_id, food_id, name, grams, kcal, protein_g, carbs_g, fat_g FROM jsonb_to_recordset($1::jsonb) AS x(id text, saved_meal_id text, food_id text, name text, grams float8, kcal float8, protein_g float8, carbs_g float8, fat_g float8)',
  customFoods: 'INSERT INTO custom_foods (id, user_id, name, kcal, protein_g, carbs_g, fat_g, serving_g, barcode, created_at) SELECT id, user_id, name, kcal, protein_g, carbs_g, fat_g, serving_g, barcode, created_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, name text, kcal float8, protein_g float8, carbs_g float8, fat_g float8, serving_g float8, barcode text, created_at timestamptz)',
  threads: 'INSERT INTO coach_threads (id, user_id, title, created_at, updated_at) SELECT id, user_id, title, created_at, updated_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, title text, created_at timestamptz, updated_at timestamptz)',
  messages: 'INSERT INTO coach_messages (id, thread_id, role, content, provider, safety_category, created_at) SELECT id, thread_id, role, content, provider, safety_category, created_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, thread_id text, role text, content text, provider text, safety_category text, created_at timestamptz)',
  xp: 'INSERT INTO xp_events (id, user_id, source_type, source_key, amount, created_at) SELECT id, user_id, source_type, source_key, amount, created_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, source_type text, source_key text, amount int, created_at timestamptz)',
  achievements: 'INSERT INTO user_achievements (user_id, achievement_id, unlocked_at) SELECT user_id, achievement_id, unlocked_at FROM jsonb_to_recordset($1::jsonb) AS x(user_id text, achievement_id text, unlocked_at timestamptz)',
  notifications: 'INSERT INTO notifications (id, user_id, kind, payload, read_at, created_at) SELECT id, user_id, kind, payload, read_at, created_at FROM jsonb_to_recordset($1::jsonb) AS x(id text, user_id text, kind text, payload jsonb, read_at timestamptz, created_at timestamptz)',
} as const;
/** What replacing a section deletes first: only this person's rows. */
const WIPE = {
  sessions: 'DELETE FROM workout_sessions WHERE user_id = $1', records: 'DELETE FROM personal_records WHERE user_id = $1', weights: 'DELETE FROM body_weight_entries WHERE user_id = $1',
  food: 'DELETE FROM food_log_entries WHERE user_id = $1', readiness: 'DELETE FROM readiness_checkins WHERE user_id = $1', plans: 'DELETE FROM workout_plans WHERE user_id = $1',
  meals: 'DELETE FROM saved_meals WHERE user_id = $1', customFoods: 'DELETE FROM custom_foods WHERE user_id = $1', threads: 'DELETE FROM coach_threads WHERE user_id = $1',
  xp: 'DELETE FROM xp_events WHERE user_id = $1', achievements: 'DELETE FROM user_achievements WHERE user_id = $1', notifications: 'DELETE FROM notifications WHERE user_id = $1',
} as const;
type R = Record<string, unknown>;
async function bulkInsert(tx: DbAdapter, sql: string, rows: R[]): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) await tx.query(sql, [JSON.stringify(rows.slice(i, i + CHUNK))]);
}

interface NormSet { reps?: number | undefined; weightKg?: number | undefined; durationSec?: number | undefined; rpe?: number | undefined; doneAt?: string | undefined }
interface NormSession {
  oldId: string; name: string | null; source: 'ready' | 'plan' | 'custom'; sourceId: string | null; sport: string | null; startedAt: string; finishedAt: string | null;
  durationSec: number | null; localDate: string | null; readiness: string | null; xpAwarded: number;
  exercises: { exerciseId: string; sport: string | null; isFinisher: boolean; planned: unknown; sets: NormSet[] }[];
}
const fromV1 = (s: BackupV1['sessions'][number]): NormSession => ({
  oldId: s.id, name: s.name ?? null, source: 'custom', sourceId: null, sport: null, startedAt: s.startedAt, finishedAt: s.finishedAt, durationSec: null, localDate: null, readiness: null, xpAwarded: 0,
  exercises: s.exercises.map((e) => ({ exerciseId: e.exerciseId, sport: e.sport, isFinisher: e.isFinisher, planned: null, sets: e.sets })),
});

/** Personal bests of a list of sets: the same rules as finishing a workout (weights need reps; no 1RM estimate for minors). */
interface Best { w: number | null; e: number | null; r: number | null; v: number | null; d: number | null; at: number }
const mx = (a: number | null, b: number | null): number | null => (a === null ? b : b === null ? a : Math.max(a, b));
function foldBest(cur: Best | undefined, sets: readonly NormSet[], minor: boolean, at: number): Best {
  const b: Best = cur ?? { w: null, e: null, r: null, v: null, d: null, at: 0 };
  const weighted = sets.filter((s) => s.weightKg && s.weightKg > 0 && s.reps && s.reps > 0);
  return {
    w: mx(b.w, weighted.length ? Math.max(...weighted.map((s) => s.weightKg as number)) : null),
    e: minor ? null : mx(b.e, weighted.length ? Math.max(...weighted.map((s) => epley1RM(s.weightKg as number, s.reps as number) ?? 0)) || null : null),
    r: mx(b.r, sets.some((s) => s.reps) ? Math.max(...sets.map((s) => s.reps ?? 0)) : null),
    v: mx(b.v, weighted.length ? Math.max(...weighted.map((s) => (s.weightKg as number) * (s.reps as number))) : null),
    d: mx(b.d, sets.some((s) => s.durationSec) ? Math.max(...sets.map((s) => s.durationSec ?? 0)) : null),
    at: Math.max(b.at, at),
  };
}

/** Valid XP events and what they must be backed by in the restored data (see `acceptXp`). */
const XP_TYPES = new Set(['workout', 'sets', 'pr', 'food_day', 'protein_day', 'weigh_in', 'weekly_goal']);
const WEEK_KEY = /^\d{4}-W\d{2}$/;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Replaces the person's data with a backup, in one transaction. Throws (and so changes nothing) on any database error; the caller
 * has already validated the file against `BackupPayloadSchema`.
 */
export async function restoreBackup(db: DbAdapter, userId: string, b: BackupPayload, now: Date): Promise<RestoreSummary> {
  const v2 = b.version === 2 ? b : null;
  const current = await loadProfile(db, userId);
  const isMinor = (p: ProfileInput | null): boolean => (p ? ageBucket(p.age) === 'minor' : false);
  // A restore never turns a minor's account into an adult one (that would lift the limits that protect minors): the file's profile is
  // then left out. In the other direction, a minor's profile in the file makes the account a minor's. Either way, minor rules apply.
  const profileBlocked = !!b.profile && isMinor(current) && !isMinor(b.profile);
  const profileToWrite: ProfileInput | null = b.profile && !profileBlocked ? b.profile : null;
  const profile: ProfileInput | null = profileToWrite ?? current; // the profile after the restore; a file without one keeps the current profile
  const minor = isMinor(profile) || isMinor(current); // no 1RM estimates for minors, however the data got here
  const fallbackName = RESTORED_NAME[profile?.language ?? 'he'];
  const nowMs = now.getTime();
  const sk = { profile: profileBlocked ? 1 : 0, unknownExercises: 0, unfinishedWorkouts: 0, duplicateDays: 0, invalidItems: 0, xpEvents: 0, achievements: 0 };

  // ---- body weight (one row per day, the last one wins: the table is unique per day)
  const weights = new Map<string, R>();
  for (const w of b.bodyWeight) { if (weights.has(w.loggedDate)) sk.duplicateDays++; weights.set(w.loggedDate, { id: randomId(), user_id: userId, logged_date: w.loggedDate, weight_kg: w.weightKg, note: w.note ?? null }); }

  // ---- food log (entries keep their order inside a day through consecutive creation times)
  const food: R[] = b.foodLog.map((f, i) => ({ id: randomId(), user_id: userId, logged_date: f.loggedDate, slot: f.slot, food_id: f.foodId ?? null, dish_id: f.dishId ?? null, name: f.name, grams: f.grams, kcal: f.kcal, protein_g: f.proteinG, carbs_g: f.carbsG, fat_g: f.fatG, estimated: f.estimated ?? false, created_at: new Date(nowMs - (b.foodLog.length - i)).toISOString() }));
  const slotsByDay = new Map<string, Set<string>>();
  for (const f of b.foodLog) { const s = slotsByDay.get(f.loggedDate) ?? new Set<string>(); slotsByDay.set(f.loggedDate, s); s.add(f.slot); }

  // ---- plans (ids are new; the old ids only connect workouts to the plan they came from)
  const planIdMap = new Map<string, string>();
  const plans: R[] = [];
  let activeSeen = false;
  for (const p of v2?.plans ?? []) {
    const id = randomId(); planIdMap.set(p.id, id);
    const days = p.plan.days.map((d) => ({ ...d, exercises: d.exercises.filter((e) => { const ok = EX_IDS.has(e.exerciseId); if (!ok) sk.unknownExercises++; return ok; }) }));
    const active = p.active && !p.archived && !activeSeen; // at most one active plan, and an archived plan is never active
    if (active) activeSeen = true;
    plans.push({ id, user_id: userId, name: p.name, active, archived: p.archived, plan: { ...p.plan, days }, created_at: p.createdAt });
  }

  // ---- workouts
  const sessions: NormSession[] = v2 ? v2.sessions.map((s) => ({ ...s, oldId: s.id })) : (b as BackupV1).sessions.map(fromV1);
  const sessRows: R[] = []; const exRows: R[] = []; const setRows: R[] = [];
  const sessionIdMap = new Map<string, string>(); const setCount = new Map<string, number>();
  const finishedDays = new Set<string>(); const finishedWeeks = new Set<string>();
  const best = new Map<string, Best>();
  for (const s of sessions) {
    if (!s.finishedAt) { sk.unfinishedWorkouts++; continue; } // a workout still in progress lives in this phone's live screen, not in a backup
    const sid = randomId(); sessionIdMap.set(s.oldId, sid);
    const startedAt = new Date(s.startedAt); const finishedAt = new Date(s.finishedAt);
    const localDate = s.localDate ?? startedAt.toISOString().slice(0, 10);
    const duration = s.durationSec ?? Math.max(1, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000));
    let sourceId = s.sourceId;
    if (s.source === 'plan' && sourceId) { const [head, ...rest] = sourceId.split(':'); const mapped = planIdMap.get(head as string); sourceId = mapped ? [mapped, ...rest].join(':') : null; }
    sessRows.push({ id: sid, user_id: userId, name: s.name ?? fallbackName, source: s.source, source_id: s.source === 'ready' || s.source === 'plan' ? sourceId : null, sport: s.sport, started_at: startedAt.toISOString(), finished_at: finishedAt.toISOString(), duration_sec: Math.max(1, duration), local_date: localDate, readiness: s.readiness, xp_awarded: s.xpAwarded });
    finishedDays.add(localDate); finishedWeeks.add(isoWeekKey(localDate));
    let pos = 0; let n = 0;
    for (const e of s.exercises) {
      // Only exercises this app knows: an unknown id (hand-edited file, renamed in an older content version) would otherwise be
      // shown raw in history and end up in the coach prompt.
      if (!EX_IDS.has(e.exerciseId)) { sk.unknownExercises++; continue; }
      const seId = randomId();
      exRows.push({ id: seId, session_id: sid, position: pos++, exercise_id: e.exerciseId, is_finisher: e.isFinisher, sport: e.isFinisher ? e.sport : null, planned: PrescriptionSchema.safeParse(e.planned).success ? e.planned : {} });
      let no = 1;
      for (const t of e.sets) setRows.push({ id: randomId(), session_exercise_id: seId, set_no: no++, reps: t.reps ?? null, weight_kg: t.weightKg ?? null, duration_sec: t.durationSec ?? null, rpe: t.rpe ?? null, done_at: t.doneAt ?? startedAt.toISOString() });
      n += e.sets.length;
      best.set(e.exerciseId, foldBest(best.get(e.exerciseId), e.sets, minor, finishedAt.getTime()));
    }
    setCount.set(sid, n);
  }

  // ---- personal records: recomputed from the restored sets, only ever RAISED by the file's records (a record outlives the workout it came from)
  if (v2) {
    for (const r of v2.personalRecords) {
      if (!EX_IDS.has(r.exerciseId)) { sk.unknownExercises++; continue; }
      const cur = best.get(r.exerciseId);
      best.set(r.exerciseId, { w: mx(cur?.w ?? null, r.maxWeight), e: minor ? null : mx(cur?.e ?? null, r.est1rm), r: mx(cur?.r ?? null, r.maxReps), v: mx(cur?.v ?? null, r.maxVolume), d: mx(cur?.d ?? null, r.maxDuration), at: Math.max(cur?.at ?? 0, Date.parse(r.updatedAt)) });
    }
  }
  const prs: R[] = [...best].map(([ex, v]) => ({ user_id: userId, exercise_id: ex, max_weight: v.w, est_1rm: v.e, max_reps: v.r, max_volume: v.v, max_duration: v.d, updated_at: new Date(v.at || nowMs).toISOString() }));

  // ---- XP and achievements (version 2 only): an event is kept only when the restored data still backs it, so a file cannot mint rewards
  const xp: R[] = []; const achievements: R[] = [];
  if (v2) {
    const weighWeeks = new Set(b.bodyWeight.map((w) => isoWeekKey(w.loggedDate)));
    const seen = new Set<string>();
    for (const x of v2.xpEvents) {
      let key = x.sourceKey; let ok = false;
      switch (x.sourceType) {
        case 'workout': ok = x.amount === XP.workout && DAY_KEY.test(key) && finishedDays.has(key); break;
        case 'sets': case 'pr': {
          const sid = sessionIdMap.get(key);
          if (sid) {
            key = sid;
            ok = x.sourceType === 'sets' ? x.amount >= 1 && x.amount <= Math.min((setCount.get(sid) ?? 0) * XP.perSet, XP.perSetCap) : x.amount > 0 && x.amount % XP.pr === 0 && x.amount <= XP.pr * XP.prCapPerSession;
          }
          break;
        }
        case 'food_day': ok = x.amount === XP.foodDay && (slotsByDay.get(key)?.size ?? 0) >= 2; break;
        case 'protein_day': ok = x.amount === XP.proteinDay && slotsByDay.has(key); break;
        case 'weigh_in': ok = x.amount === XP.weighIn && WEEK_KEY.test(key) && weighWeeks.has(key); break;
        case 'weekly_goal': ok = x.amount === XP.weeklyGoal && WEEK_KEY.test(key) && finishedWeeks.has(key); break;
        default: ok = false;
      }
      const unique = `${x.sourceType}|${key}`;
      if (!ok || !XP_TYPES.has(x.sourceType) || seen.has(unique)) { sk.xpEvents++; continue; }
      seen.add(unique);
      xp.push({ id: randomId(), user_id: userId, source_type: x.sourceType, source_key: key, amount: x.amount, created_at: x.createdAt });
    }
    const known = new Set<string>(ACHIEVEMENT_IDS);
    const have = new Set<string>();
    for (const a of v2.achievements) { if (!known.has(a.id) || have.has(a.id)) { sk.achievements++; continue; } have.add(a.id); achievements.push({ user_id: userId, achievement_id: a.id, unlocked_at: a.unlockedAt }); }
  }

  // ---- readiness (state is recomputed from the answers, never taken from the file)
  const readiness = new Map<string, R>();
  for (const r of v2?.readiness ?? []) {
    if (readiness.has(r.localDate)) sk.duplicateDays++;
    readiness.set(r.localDate, { id: randomId(), user_id: userId, local_date: r.localDate, sleep: r.sleep, energy: r.energy, soreness: r.soreness, pain: r.pain, state: readinessState({ sleep: r.sleep as 1, energy: r.energy as 1, soreness: r.soreness as 1, pain: r.pain }), created_at: now.toISOString() });
  }

  // ---- saved meals, custom foods (a meal's items have no position column: their ids start with the position, so they keep the file's order)
  const meals: R[] = []; const mealItems: R[] = [];
  for (const m of v2?.savedMeals ?? []) {
    const id = randomId();
    meals.push({ id, user_id: userId, name: m.name, slot: m.slot, created_at: m.createdAt });
    m.items.forEach((i, n) => mealItems.push({ id: `${String(n).padStart(2, '0')}-${randomId()}`, saved_meal_id: id, food_id: i.foodId ?? null, name: i.name, grams: i.grams, kcal: i.kcal, protein_g: i.proteinG, carbs_g: i.carbsG, fat_g: i.fatG }));
  }
  const customFoods: R[] = [];
  for (const f of v2?.customFoods ?? []) {
    if (f.proteinG + f.carbsG + f.fatG > 100.5) { sk.invalidItems++; continue; } // the same rule as creating one: macros per 100 g cannot exceed 100 g
    customFoods.push({ id: randomId(), user_id: userId, name: f.name, kcal: f.kcal, protein_g: f.proteinG, carbs_g: f.carbsG, fat_g: f.fatG, serving_g: f.servingG, barcode: f.barcode, created_at: f.createdAt });
  }

  // ---- coach chats: the safety shield runs over restored messages too, and a flagged exchange never reaches an AI provider
  const threads: R[] = []; const messages: R[] = [];
  for (const t of v2?.coachThreads ?? []) {
    const id = randomId();
    threads.push({ id, user_id: userId, title: t.title, created_at: t.createdAt, updated_at: t.updatedAt });
    let prev = 0; let flagged: string | null = null;
    for (const m of t.messages) {
      let cat = m.safetyCategory;
      if (m.role === 'user') { if (!cat) cat = classifySafety(m.content)?.category ?? null; flagged = cat; }
      else { if (!cat && flagged) cat = flagged; flagged = null; } // the reply right after a flagged message is part of that exchange
      const at = Math.max(Date.parse(m.createdAt), prev + 1); prev = at; // strictly increasing: the order inside a chat is the order in the file
      messages.push({ id: randomId(), thread_id: id, role: m.role, content: m.content, provider: m.provider, safety_category: cat, created_at: new Date(at).toISOString() });
    }
  }
  const notifications: R[] = (v2?.notifications ?? []).map((n) => ({ id: randomId(), user_id: userId, kind: n.kind, payload: n.payload, read_at: n.read ? n.createdAt : null, created_at: n.createdAt }));

  // ---- write everything, or nothing
  const replaces = new Set<RestoreSection>(['weights', 'food', 'workouts']);
  if (profileToWrite) replaces.add('profile');
  if (v2) for (const s of ['readiness', 'plans', 'savedMeals', 'customFoods', 'coach', 'xp', 'notifications'] as const) replaces.add(s);
  await db.transaction(async (tx) => {
    // One restore per person at a time (a second one in parallel would race on the same rows), and room to finish on a big history.
    const lock = (await tx.query<{ ok: boolean }>('SELECT pg_try_advisory_xact_lock(hashtext($1)) AS ok', [`lupu-fit:restore:${userId}`]))[0];
    if (!lock?.ok) throw new ApiError(429, 'rate_limited', { reason: 'restore_in_progress' }, { 'retry-after': '5' });
    await tx.query("SET LOCAL statement_timeout = '120s'");
    if (profileToWrite) await upsertProfile(tx, userId, profileToWrite, now);
    // Children (exercises, sets, meal items, messages) go with their parent through ON DELETE CASCADE.
    const wipe: [RestoreSection, string[]][] = [
      ['workouts', [WIPE.sessions, WIPE.records]], ['weights', [WIPE.weights]], ['food', [WIPE.food]], ['readiness', [WIPE.readiness]], ['plans', [WIPE.plans]],
      ['savedMeals', [WIPE.meals]], ['customFoods', [WIPE.customFoods]], ['coach', [WIPE.threads]], ['xp', [WIPE.xp, WIPE.achievements]], ['notifications', [WIPE.notifications]],
    ];
    for (const [section, statements] of wipe) if (replaces.has(section)) for (const sql of statements) await tx.query(sql, [userId]);
    await bulkInsert(tx, BULK.weights, [...weights.values()]);
    await bulkInsert(tx, BULK.food, food);
    await bulkInsert(tx, BULK.readiness, [...readiness.values()]);
    await bulkInsert(tx, BULK.plans, plans);
    await bulkInsert(tx, BULK.sessions, sessRows);
    await bulkInsert(tx, BULK.exercises, exRows);
    await bulkInsert(tx, BULK.sets, setRows);
    await bulkInsert(tx, BULK.prs, prs);
    await bulkInsert(tx, BULK.meals, meals);
    await bulkInsert(tx, BULK.mealItems, mealItems);
    await bulkInsert(tx, BULK.customFoods, customFoods);
    await bulkInsert(tx, BULK.threads, threads);
    await bulkInsert(tx, BULK.messages, messages);
    await bulkInsert(tx, BULK.xp, xp);
    await bulkInsert(tx, BULK.achievements, achievements);
    await bulkInsert(tx, BULK.notifications, notifications);
  });

  return {
    ok: true, policy: 'replace', backupVersion: b.version,
    restored: {
      workouts: sessRows.length, sets: setRows.length, foods: food.length, weights: weights.size, plans: plans.length, savedMeals: meals.length, customFoods: customFoods.length, threads: threads.length, messages: messages.length,
      readiness: readiness.size, personalRecords: prs.length, xpEvents: xp.length, achievements: achievements.length, notifications: notifications.length, profile: profileToWrite ? 1 : 0,
    },
    skipped: sk,
    untouched: RESTORE_SECTIONS.filter((s) => !replaces.has(s)),
  };
}
