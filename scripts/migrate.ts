/**
 * `npm run db:migrate` – applies ./drizzle migrations to DATABASE_URL (or the local PGlite directory).
 */
import { closeDb, dbKind, getDb } from "../src/server/db/client";

async function main() {
  const kind = dbKind();
  console.log(`[migrate] target: ${kind}${kind === "pglite" ? ` (${process.env.PGLITE_DATA_DIR || "./data/pglite"})` : ""}`);
  await getDb();
  console.log("[migrate] done");
  await closeDb();
}

main().catch((err) => {
  console.error("[migrate] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
