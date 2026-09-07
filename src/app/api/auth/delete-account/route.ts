/** POST /api/auth/delete-account → deletes every row owned by the user, then the account; clears the cookie. */
import { assertCsrf, clientIp, jsonOk, withRoute } from "@/server/http";
import { checkAuthRateLimit } from "@/server/auth/rateLimit";
import { deleteAccount } from "@/server/auth/service";
import { clearSessionCookie, requireUser } from "@/server/auth/session";
import type { OkResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";

export const POST = withRoute(async (req) => {
  assertCsrf(req);
  checkAuthRateLimit(clientIp(req));
  const user = await requireUser(req);
  await deleteAccount(user.id);
  const body: OkResponse = { ok: true };
  return jsonOk(body, { headers: { "set-cookie": clearSessionCookie() } });
});
