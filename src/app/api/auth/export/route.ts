/** GET /api/auth/export → JSON document with everything stored for the signed-in user. */
import { jsonOk, withRoute } from "@/server/http";
import { exportUserData } from "@/server/auth/service";
import { requireUser } from "@/server/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withRoute(async (req) => {
  const user = await requireUser(req);
  const body = await exportUserData({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt });
  const stamp = body.exportedAt.slice(0, 10);
  return jsonOk(body, { headers: { "content-disposition": `attachment; filename="disccoach-export-${stamp}.json"` } });
});
