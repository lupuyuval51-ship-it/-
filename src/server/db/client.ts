/**
 * Database access. `DATABASE_URL` → PostgreSQL (node-postgres pool); otherwise embedded PGlite
 * under `PGLITE_DATA_DIR` (default ./data/pglite, "memory://" for an in-memory database).
 * Migrations run automatically once on first `getDb()`.
 */
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { runMigrations } from "./migrate";

export type DbKind = "pglite" | "postgres";
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

interface DbHandle {
  db: Db;
  kind: DbKind;
  close: () => Promise<void>;
}

type GlobalWithDb = typeof globalThis & { __dcDbPromise?: Promise<DbHandle> | null };
const g = globalThis as GlobalWithDb;

export function dbKind(): DbKind {
  return process.env.DATABASE_URL ? "postgres" : "pglite";
}

async function open(): Promise<DbHandle> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const url = process.env.DATABASE_URL;
    const needsSsl = /sslmode=require|supabase\.co|neon\.tech/i.test(url) || process.env.DATABASE_SSL === "1";
    const pool = new Pool({ connectionString: url, max: 10, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });
    const db = drizzle(pool, { schema });
    await runMigrations(db, "postgres");
    return { db: db as unknown as Db, kind: "postgres", close: () => pool.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dir = process.env.PGLITE_DATA_DIR || "./data/pglite";
  const client = new PGlite(dir);
  const db = drizzle(client, { schema });
  await runMigrations(db, "pglite");
  return { db: db as unknown as Db, kind: "pglite", close: () => client.close() };
}

async function handle(): Promise<DbHandle> {
  if (!g.__dcDbPromise) {
    g.__dcDbPromise = open().catch((err) => {
      g.__dcDbPromise = null;
      throw err;
    });
  }
  return g.__dcDbPromise;
}

/** Drizzle instance (migrated). Safe to call from any route; it is a process-wide singleton. */
export async function getDb(): Promise<Db> {
  return (await handle()).db;
}

/** Closes the connection (tests / scripts). The next getDb() reopens. */
export async function closeDb(): Promise<void> {
  const p = g.__dcDbPromise;
  g.__dcDbPromise = null;
  if (!p) return;
  try {
    const h = await p;
    await h.close();
  } catch {
    /* already closed */
  }
}

export { schema };
