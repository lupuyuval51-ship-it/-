/** GET /api/admin/users → { ok, count, users: [{ id, emailMasked, role, createdAt, lastLoginAt, sessionsCount }] }. Admin only. */
import { listUsersWithSessionCounts } from "@/server/admin/users";
import { requireAdmin } from "@/server/auth/session";
import { jsonOk, withRoute } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withRoute(async (req) => {
  await requireAdmin(req);
  return jsonOk(await listUsersWithSessionCounts());
});
