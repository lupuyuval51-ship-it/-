/** GET /api/health → { ok, db, claudeConfigured, version, time } (used by the E2E server wait and uptime checks). */
import pkg from "../../../../package.json";
import { dbKind, getDb } from "@/server/db/client";
import { claudeConfigured } from "@/server/ai/claude";
import { jsonOk, withRoute } from "@/server/http";
import type { HealthResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withRoute(async () => {
  let db: HealthResponse["db"] = dbKind();
  try {
    await getDb();
  } catch {
    db = "error";
  }
  const body: HealthResponse = { ok: true, db, claudeConfigured: claudeConfigured(), version: (pkg as { version?: string }).version ?? "0.0.0", time: new Date().toISOString() };
  return jsonOk(body, { status: db === "error" ? 503 : 200 });
});
