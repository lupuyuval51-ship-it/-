/** GET /api/admin/overview → coach-call stats (24h/7d/30d), replaced drills, users. Admin only. */
import { buildAdminOverview } from "@/server/admin/overview";
import { requireAdmin } from "@/server/auth/session";
import { jsonOk, withRoute } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withRoute(async (req) => {
  await requireAdmin(req);
  return jsonOk(await buildAdminOverview());
});
