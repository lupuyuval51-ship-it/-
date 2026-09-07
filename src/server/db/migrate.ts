/**
 * Runs the SQL migrations under ./drizzle against the given database.
 * Used by getDb() on first use and by `npm run db:migrate`.
 */
import path from "node:path";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./schema";

export function migrationsFolder(): string {
  return process.env.DRIZZLE_MIGRATIONS_DIR || path.resolve(process.cwd(), "drizzle");
}

export async function runMigrations(db: PgliteDatabase<typeof schema> | NodePgDatabase<typeof schema>, kind: "pglite" | "postgres"): Promise<void> {
  const config = { migrationsFolder: migrationsFolder() };
  if (kind === "pglite") await migratePglite(db as PgliteDatabase<typeof schema>, config);
  else await migratePg(db as NodePgDatabase<typeof schema>, config);
}
