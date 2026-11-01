import { sha256Hex } from '../crypto/portableCrypto.ts';
import type { DbAdapter } from './adapter.ts';
import { MIGRATIONS, PINNED_CHECKSUMS } from './migrationsBundle.ts';

export class MigrationDriftError extends Error {}

/** Applies pending migrations in order and refuses to run if an applied or bundled migration no longer matches its pin. */
export async function migrate(db: DbAdapter): Promise<{ applied: string[] }> {
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, sha256 TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const done = new Map((await db.query<{ name: string; sha256: string }>('SELECT name, sha256 FROM schema_migrations')).map((r) => [r.name, r.sha256]));
  const applied: string[] = [];
  for (const m of MIGRATIONS) {
    const actual = await sha256Hex(m.sql.replace(/\r\n/g, '\n'));
    if (actual !== m.sha256 || PINNED_CHECKSUMS[m.name] !== actual) throw new MigrationDriftError(`migration ${m.name} does not match its pinned checksum`);
    const prev = done.get(m.name);
    if (prev !== undefined) {
      if (prev !== actual) throw new MigrationDriftError(`applied migration ${m.name} differs from the bundled one (schema drift)`);
      continue;
    }
    await db.transaction(async (tx) => {
      for (const stmt of splitSql(m.sql)) await tx.query(stmt);
      await tx.query('INSERT INTO schema_migrations (name, sha256) VALUES ($1, $2)', [m.name, actual]);
    });
    applied.push(m.name);
  }
  return { applied };
}

/** Splits on semicolons that end a statement (migrations contain no function bodies or dollar quoting). */
function splitSql(sql: string): string[] {
  return sql.split(/;\s*(?:\n|$)/).map((s) => s.replace(/^\s*--.*$/gm, '').trim()).filter((s) => s.length > 0);
}
