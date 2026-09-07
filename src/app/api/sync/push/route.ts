/** POST /api/sync/push { records: SyncRecord[] } (≤ 500) → { ok, accepted, conflicts, rejected, serverTime }. */
import { assertCsrf, jsonOk, parseJsonBody, withRoute } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { pushRecords, pushRequestSchema } from "@/server/sync";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withRoute(async (req) => {
  assertCsrf(req);
  const user = await requireUser(req);
  const input = await parseJsonBody(req, pushRequestSchema, 8_000_000);
  return jsonOk(await pushRecords(user.id, input.records));
});
