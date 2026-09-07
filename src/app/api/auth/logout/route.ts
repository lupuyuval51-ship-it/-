/** POST /api/auth/logout → { ok } and clears the cookie (the session row is deleted). */
import { assertCsrf, jsonOk, withRoute } from "@/server/http";
import { clearSessionCookie, revokeSession } from "@/server/auth/session";
import type { OkResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";

export const POST = withRoute(async (req) => {
  assertCsrf(req);
  await revokeSession(req);
  const body: OkResponse = { ok: true };
  return jsonOk(body, { headers: { "set-cookie": clearSessionCookie() } });
});
