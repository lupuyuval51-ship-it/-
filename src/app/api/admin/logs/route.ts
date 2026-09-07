/** GET /api/admin/logs?limit&cursor&action&status → { ok, logs, nextCursor }. Admin only. */
import { LOGS_DEFAULT_LIMIT, LOGS_MAX_LIMIT, listAiLogs } from "@/server/admin/logs";
import { requireAdmin } from "@/server/auth/session";
import { boundedInt, jsonOk, searchParam, withRoute } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withRoute(async (req) => {
  await requireAdmin(req);
  return jsonOk(
    await listAiLogs({
      limit: boundedInt(searchParam(req, "limit"), LOGS_DEFAULT_LIMIT, 1, LOGS_MAX_LIMIT),
      cursor: searchParam(req, "cursor"),
      action: searchParam(req, "action"),
      status: searchParam(req, "status"),
    }),
  );
});
