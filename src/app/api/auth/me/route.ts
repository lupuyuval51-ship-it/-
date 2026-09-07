/** GET /api/auth/me → { ok, user | null } (null for guests and expired sessions – never an error). */
import { jsonOk, withRoute } from "@/server/http";
import { getSessionUser } from "@/server/auth/session";
import type { MeResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withRoute(async (req) => {
  const session = await getSessionUser(req);
  const user = session ? { id: session.id, email: session.email, name: session.name, role: session.role, createdAt: session.createdAt } : null;
  const body: MeResponse = { ok: true, user };
  return jsonOk(body);
});
