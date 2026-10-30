/**
 * Forward-only SQL migration runner.
 * - Files: `NNNN_description.sql` in the migrations directory, applied in order.
 * - Each file runs in its own transaction and is recorded in `schema_migrations` with a checksum.
 * - Applied migrations are immutable: a checksum mismatch aborts startup.
 * - A Postgres advisory lock prevents concurrent runners (multiple instances starting at once).
 * - Where the files come from is separate from running them: the server reads the directory
 *   (`readMigrations`); device mode passes the same files bundled into the app (`migrationsFromSources`).
 *   The checksum is the SHA-256 of the file text either way.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { db } from './pool';

const LOCK_ID = 74_617_201; // arbitrary constant shared by all LUPU-FIT instances

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

const MIGRATION_FILE = /^\d{4}_[a-z0-9_]+\.sql$/;

/**
 * A migration from its file name (`NNNN_description.sql`) and SQL text. Line endings are normalized to
 * LF before hashing, so a checkout with CRLF line endings (Windows) gives the same checksum
 * (.gitattributes also pins `*.sql` to LF); for LF files this changes nothing.
 */
export function migrationFile(file: string, sql: string): MigrationFile {
  const text = sql.replace(/\r\n/g, '\n');
  return {
    version: file.slice(0, 4),
    name: file.replace(/\.sql$/, ''),
    sql: text,
    checksum: crypto.createHash('sha256').update(text).digest('hex'),
  };
}

/** Server mode: the migration files in the migrations directory, in order. */
export function readMigrations(dir = migrationsDir()): MigrationFile[] {
  return fs
    .readdirSync(dir)
    .filter((f) => MIGRATION_FILE.test(f))
    .sort()
    .map((file) => migrationFile(file, fs.readFileSync(path.join(dir, file), 'utf8')));
}

/**
 * Device mode: migrations given as `{ path: sql }` (e.g. Vite's `import.meta.glob('…/*.sql', { query: '?raw' })`).
 * Only the file name counts, so the result is the same as `readMigrations` on that directory.
 */
export function migrationsFromSources(sources: Readonly<Record<string, string>>): MigrationFile[] {
  const byFile = new Map<string, string>();
  for (const [p, sql] of Object.entries(sources)) {
    const file = p.slice(p.lastIndexOf('/') + 1);
    if (!MIGRATION_FILE.test(file)) continue;
    if (byFile.has(file)) throw new Error(`Migration ${file} is listed twice`);
    byFile.set(file, sql);
  }
  return [...byFile.keys()].sort().map((file) => migrationFile(file, byFile.get(file)!));
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

/** Applies the pending migrations: by default the files in the migrations directory. */
export async function migrate(log: (msg: string) => void = () => undefined, files: readonly MigrationFile[] = readMigrations()): Promise<MigrationResult> {
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

export async function migrationStatus(
  files: readonly MigrationFile[] = readMigrations(),
): Promise<{ name: string; applied: boolean; appliedAt: string | null }[]> {
  const exists = await db.maybeOne<{ t: string | null }>("SELECT to_regclass('public.schema_migrations')::text AS t");
  const rows = exists?.t
    ? await db.many<{ version: string; applied_at: Date }>('SELECT version, applied_at FROM schema_migrations')
    : [];
  const map = new Map(rows.map((r) => [r.version, r.applied_at]));
  return files.map((f) => ({ name: f.name, applied: map.has(f.version), appliedAt: map.get(f.version)?.toISOString() ?? null }));
}
