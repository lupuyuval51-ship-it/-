/**
 * Full backup and restore of the device database (runs in the device worker, on the server's `db`).
 *
 * In device mode the data exists only on the phone, so the backup file must be able to bring ALL of it
 * back on a new phone: plans, workout history, records, food diary, saved meals, coach conversations,
 * achievements. The account export in the backup file is the readable copy; this snapshot is the exact
 * one: the device account's rows of every user table, as stored (see `SNAPSHOT_TABLES`).
 *
 * Restore REPLACES the data on this phone with the snapshot's, in one transaction (all or nothing):
 * - the current device account keeps its id, e-mail and password (and stays signed in); its rows are
 *   deleted and the snapshot's rows are inserted with the account's id in their owner column;
 * - name and preferences (users row) come from the snapshot, through an allow-list;
 * - only known tables and only columns the table has are written (an older snapshot gets the defaults of
 *   columns added since); the database's own constraints check every value;
 * - shared foods are matched again (built-in by slug, Open Food Facts by barcode; those are re-created when
 *   missing): built-in foods get new ids on every install. A diary entry whose food cannot be matched keeps
 *   its own name and nutrients (food_id NULL, as when a food is deleted); a saved-meal item needs its food.
 * Not in the snapshot: sessions, password-reset tokens and idempotency records (secrets, bookkeeping) and
 * Web Push subscriptions (no server in device mode).
 */
import type { Sql } from '../../../../server/src/db/pool';
import { DEVICE_MIGRATIONS } from '../migrations';
import { SNAPSHOT_FORMAT, type DeviceSnapshot, type RestoreSummary } from './protocol';
import { summarizeSnapshot } from './summary';

/** The user's tables, parents before children (insert order; deletes run in reverse). */
export const SNAPSHOT_TABLES = [
  { table: 'profiles', owner: 'user_id' },
  { table: 'body_weight_entries', owner: 'user_id' },
  { table: 'foods', owner: 'owner_user_id' },
  { table: 'workout_plans', owner: 'user_id' },
  { table: 'plan_workouts', owner: 'user_id' },
  { table: 'plan_exercises', owner: 'user_id' },
  { table: 'workout_sessions', owner: 'user_id' },
  { table: 'session_exercises', owner: 'user_id' },
  { table: 'session_sets', owner: 'user_id' },
  { table: 'personal_records', owner: 'user_id' },
  { table: 'readiness_checkins', owner: 'user_id' },
  { table: 'food_log_entries', owner: 'user_id' },
  { table: 'saved_meals', owner: 'user_id' },
  { table: 'saved_meal_items', owner: 'user_id' },
  { table: 'coach_threads', owner: 'user_id' },
  { table: 'coach_messages', owner: 'user_id' },
  { table: 'xp_events', owner: 'user_id' },
  { table: 'user_achievements', owner: 'user_id' },
  { table: 'notifications', owner: 'user_id' },
  { table: 'ai_usage_events', owner: 'user_id' },
  { table: 'coach_usage', owner: 'user_id' },
] as const;

/** Per-user tables deliberately left out of the snapshot, and why (with SNAPSHOT_TABLES: every user table). */
export const NOT_IN_SNAPSHOT: Record<string, string> = {
  auth_sessions: 'session and CSRF tokens (the device stays signed in to its own account)',
  password_reset_tokens: 'password reset tokens',
  idempotency_keys: 'internal duplicate-request cache (cleared on restore)',
  push_subscriptions: 'Web Push needs a server',
  push_deliveries: 'Web Push needs a server',
};

/** Name and preferences restored from the snapshot (never e-mail, password, role or lock-out state). */
const USER_FIELDS = ['display_name', 'locale', 'theme', 'units', 'timezone', 'week_start', 'workout_prefs', 'created_at'] as const;

/** Rows per INSERT (a year of data is a few thousand rows per table at most). */
const CHUNK = 500;
/** Far more than years of real use; a larger file is not a snapshot made by the app. */
const MAX_ROWS = 500_000;

export class SnapshotError extends Error {
  constructor(
    readonly code: 'not_a_snapshot' | 'unsupported_version' | 'too_large',
    message: string,
  ) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;
const latestSchema = () => DEVICE_MIGRATIONS[DEVICE_MIGRATIONS.length - 1]?.name ?? '';
/** Deletes one owner's rows. Table and column names come only from the fixed lists in this file (quoted). */
const deleteOwned = (table: string, owner: string) => 'DELETE FROM ' + ident(table) + ' WHERE ' + ident(owner) + ' = $1';

/** The device account's data as a snapshot. Call inside `db.tx` for one consistent read. */
export async function createSnapshot(sql: Sql, userId: string, now: Date = new Date()): Promise<DeviceSnapshot> {
  const user = await sql.one<{ row: Record<string, unknown> }>(
    `SELECT jsonb_build_object(${USER_FIELDS.map((f) => `'${f}', ${ident(f)}`).join(', ')}) AS row FROM users WHERE id = $1`,
    [userId],
  );
  const tables: DeviceSnapshot['tables'] = {};
  for (const { table, owner } of SNAPSHOT_TABLES) {
    const rows = await sql.many<{ row: Record<string, unknown> }>(`SELECT to_jsonb(t) AS row FROM ${ident(table)} t WHERE ${ident(owner)} = $1`, [userId]);
    tables[table] = rows.map((r) => r.row);
  }
  const sharedFoods = await sql.many<{ row: Record<string, unknown> }>(
    `SELECT to_jsonb(f) AS row FROM foods f
      WHERE f.owner_user_id IS NULL
        AND f.id IN (SELECT food_id FROM food_log_entries WHERE user_id = $1 AND food_id IS NOT NULL
                     UNION SELECT food_id FROM saved_meal_items WHERE user_id = $1)`,
    [userId],
  );
  return {
    format: SNAPSHOT_FORMAT,
    version: 1,
    schema: latestSchema(),
    createdAt: now.toISOString(),
    user: user.row,
    tables,
    sharedFoods: sharedFoods.map((r) => r.row),
  };
}

/** Checks the shape of a snapshot from a file (values are checked by the database on insert). */
export function parseSnapshot(value: unknown): DeviceSnapshot {
  if (!isRecord(value) || value.format !== SNAPSHOT_FORMAT || !isRecord(value.tables)) throw new SnapshotError('not_a_snapshot', 'not a device snapshot');
  if (value.version !== 1) throw new SnapshotError('unsupported_version', `snapshot version ${String(value.version)}`);
  const schema = typeof value.schema === 'string' ? value.schema : '';
  // Made by a newer app (a migration this app does not have): its rows may need columns this app lacks.
  if (!DEVICE_MIGRATIONS.some((m) => m.name === schema)) throw new SnapshotError('unsupported_version', `unknown schema ${schema}`);
  let count = 0;
  const tables: DeviceSnapshot['tables'] = {};
  for (const { table } of SNAPSHOT_TABLES) {
    const rows = value.tables[table];
    if (rows === undefined) continue;
    if (!Array.isArray(rows) || !rows.every(isRecord)) throw new SnapshotError('not_a_snapshot', `bad rows for ${table}`);
    count += rows.length;
    tables[table] = rows;
  }
  const sharedFoods = Array.isArray(value.sharedFoods) ? value.sharedFoods.filter(isRecord) : [];
  if (count + sharedFoods.length > MAX_ROWS) throw new SnapshotError('too_large', 'too many rows');
  return {
    format: SNAPSHOT_FORMAT,
    version: 1,
    schema,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
    user: isRecord(value.user) ? value.user : {},
    tables,
    sharedFoods,
  };
}

async function columnsOf(sql: Sql, tables: readonly string[]): Promise<Map<string, Set<string>>> {
  const rows = await sql.many<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1::text[]) AND is_generated = 'NEVER'`,
    [tables],
  );
  const out = new Map<string, Set<string>>();
  for (const r of rows) {
    let set = out.get(r.table_name);
    if (!set) out.set(r.table_name, (set = new Set()));
    set.add(r.column_name);
  }
  return out;
}

async function insertRows(sql: Sql, table: string, columns: Set<string>, rows: Record<string, unknown>[]): Promise<void> {
  if (!rows.length) return;
  const keys = new Set<string>();
  for (const row of rows) for (const k of Object.keys(row)) if (columns.has(k)) keys.add(k);
  const cols = [...keys].map(ident).join(', ');
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK).map((row) => Object.fromEntries([...keys].map((k) => [k, row[k] ?? null])));
    await sql.exec(`INSERT INTO ${ident(table)} (${cols}) SELECT ${cols} FROM jsonb_populate_recordset(NULL::${ident(table)}, $1::jsonb)`, [JSON.stringify(chunk)]);
  }
}

/** Shared food id in the snapshot → id of the same food here (or null: not available on this phone). */
async function matchSharedFoods(sql: Sql, foods: Record<string, unknown>[], columns: Set<string>): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  for (const f of foods) {
    if (typeof f.id !== 'string') continue;
    let id: string | null = null;
    if (typeof f.slug === 'string' && f.slug) {
      id = (await sql.maybeOne<{ id: string }>('SELECT id FROM foods WHERE slug = $1', [f.slug]))?.id ?? null;
    } else if (typeof f.barcode === 'string' && f.barcode) {
      const find = () => sql.maybeOne<{ id: string }>('SELECT id FROM foods WHERE owner_user_id IS NULL AND barcode = $1', [f.barcode]);
      id = (await find())?.id ?? null;
      if (!id && f.source === 'openfoodfacts') {
        // A product looked up on the old phone: bring it back as the shared product it was.
        const row = { ...f, owner_user_id: null, slug: null };
        const keys = Object.keys(row).filter((k) => columns.has(k));
        const cols = keys.map(ident).join(', ');
        await sql.exec(
          `INSERT INTO foods (${cols}) SELECT ${cols} FROM jsonb_populate_record(NULL::foods, $1::jsonb) ON CONFLICT DO NOTHING`,
          [JSON.stringify(Object.fromEntries(keys.map((k) => [k, (row as Record<string, unknown>)[k] ?? null])))],
        );
        id = (await find())?.id ?? null;
      }
    }
    map.set(f.id, id);
  }
  return map;
}

/**
 * Replaces the device account's data with the snapshot's (see the module comment). Call inside `db.tx`:
 * any failure (a value the database refuses) rolls everything back and nothing on the phone changes.
 */
export async function restoreSnapshot(sql: Sql, userId: string, input: unknown): Promise<RestoreSummary> {
  const snapshot = parseSnapshot(input);
  const columns = await columnsOf(sql, [...SNAPSHOT_TABLES.map((t) => t.table), 'users']);

  for (const { table, owner } of [...SNAPSHOT_TABLES].reverse()) await sql.exec(deleteOwned(table, owner), [userId]);
  for (const table of ['idempotency_keys', 'push_subscriptions', 'push_deliveries']) await sql.exec(deleteOwned(table, 'user_id'), [userId]);

  const userColumns = columns.get('users') ?? new Set<string>();
  const fields = USER_FIELDS.filter((f) => userColumns.has(f) && snapshot.user[f] != null);
  if (fields.length) {
    await sql.exec(
      `UPDATE users u SET ${fields.map((f) => `${ident(f)} = s.${ident(f)}`).join(', ')}
         FROM jsonb_populate_record(NULL::users, $2::jsonb) s WHERE u.id = $1`,
      [userId, JSON.stringify(Object.fromEntries(fields.map((f) => [f, snapshot.user[f]])))],
    );
  }

  const customFoodIds = new Set((snapshot.tables.foods ?? []).map((f) => f.id).filter((id): id is string => typeof id === 'string'));
  const shared = await matchSharedFoods(sql, snapshot.sharedFoods, columns.get('foods') ?? new Set());
  const foodId = (id: unknown): string | null => (typeof id !== 'string' ? null : customFoodIds.has(id) ? id : (shared.get(id) ?? null));

  for (const { table, owner } of SNAPSHOT_TABLES) {
    let rows = (snapshot.tables[table] ?? []).map((row) => ({ ...row, [owner]: userId }));
    if (table === 'foods') rows = rows.filter((f) => f.source === 'user' || f.source === 'openfoodfacts').map((f) => ({ ...f, slug: null }));
    if (table === 'food_log_entries') rows = rows.map((e) => ({ ...e, food_id: foodId(e.food_id) }));
    if (table === 'saved_meal_items') rows = rows.map((i) => ({ ...i, food_id: foodId(i.food_id) })).filter((i) => i.food_id != null);
    await insertRows(sql, table, columns.get(table) ?? new Set(), rows);
  }
  // Every account has a profile row (registration creates it); a snapshot without one gets an empty one.
  await sql.exec('INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
  return summarizeSnapshot(snapshot);
}
