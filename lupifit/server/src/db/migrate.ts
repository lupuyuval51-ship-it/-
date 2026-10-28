/**
 * Forward-only SQL migration runner.
 * - Files: `NNNN_description.sql` in the migrations directory, applied in order.
 * - Each file runs in its own transaction and is recorded in `schema_migrations` with a checksum.
 * - Applied migrations are immutable: a checksum mismatch aborts startup.
 * - A Postgres advisory lock prevents concurrent runners (multiple instances starting at once).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { db } from './pool';

const LOCK_ID = 74_617_201; // arbitrary constant shared by all LUPIFIT instances

export function migrationsDir(): string {
  if (process.env.MIGRATIONS_DIR) return process.env.MIGRATIONS_DIR;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, 'migrations'), // source: server/src/db
    path.join(here, 'db', 'migrations'), // bundle: dist/server
    path.resolve(process.cwd(), 'server/src/db/migrations'),
  ];
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error(`Migrations directory not found (looked in ${candidates.join(', ')})`);
  return found;
}

export interface MigrationFile {
  version: string;
  name: string;
  sql: string;
  checksum: string;
}

export function readMigrations(dir = migrationsDir()): MigrationFile[] {
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f))
    .sort()
    .map((file) => {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      return {
        version: file.slice(0, 4),
        name: file.replace(/\.sql$/, ''),
        sql,
        checksum: crypto.createHash('sha256').update(sql).digest('hex'),
      };
    });
}

async function ensureTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      name text NOT NULL,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
}

export interface MigrationResult {
  applied: string[];
  alreadyApplied: number;
}

export async function migrate(log: (msg: string) => void = () => undefined): Promise<MigrationResult> {
  const files = readMigrations();
  const client = await db.pool().connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await ensureTable(client);
    const { rows } = await client.query<{ version: string; checksum: string; name: string }>(
      'SELECT version, checksum, name FROM schema_migrations ORDER BY version',
    );
    const applied = new Map(rows.map((r) => [r.version, r]));
    for (const f of files) {
      const prev = applied.get(f.version);
      if (prev && prev.checksum !== f.checksum) {
        throw new Error(`Migration ${f.name} was modified after being applied (checksum mismatch). Create a new migration instead.`);
      }
    }
    const result: MigrationResult = { applied: [], alreadyApplied: applied.size };
    for (const f of files) {
      if (applied.has(f.version)) continue;
      log(`applying ${f.name}`);
      try {
        await client.query('BEGIN');
        await client.query(f.sql);
        await client.query('INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)', [f.version, f.name, f.checksum]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw new Error(`Migration ${f.name} failed: ${(err as Error).message}`);
      }
      result.applied.push(f.name);
    }
    return result;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => undefined);
    client.release();
  }
}

export async function migrationStatus(): Promise<{ name: string; applied: boolean; appliedAt: string | null }[]> {
  const files = readMigrations();
  const exists = await db.maybeOne<{ t: string | null }>("SELECT to_regclass('public.schema_migrations')::text AS t");
  const rows = exists?.t
    ? await db.many<{ version: string; applied_at: Date }>('SELECT version, applied_at FROM schema_migrations')
    : [];
  const map = new Map(rows.map((r) => [r.version, r.applied_at]));
  return files.map((f) => ({ name: f.name, applied: map.has(f.version), appliedAt: map.get(f.version)?.toISOString() ?? null }));
}
