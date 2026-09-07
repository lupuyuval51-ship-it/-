/** GET /api/sync/pull?since=ISO&cursor=&limit= → { ok, records, nextCursor, serverTime } (all collections + singletons). */
import { boundedInt, jsonOk, searchParam, withRoute } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { PULL_PAGE_LIMIT, pullRecords } from "@/server/sync";
import type { SyncPullResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withRoute(async (req) => {
  const user = await requireUser(req);
  const since = searchParam(req, "since");
  const cursor = searchParam(req, "cursor");
  const limit = boundedInt(searchParam(req, "limit"), PULL_PAGE_LIMIT, 1, PULL_PAGE_LIMIT);
  const result = await pullRecords(user.id, since, cursor, limit);
  const body: SyncPullResponse = { ok: true, ...result };
  return jsonOk(body);
});
