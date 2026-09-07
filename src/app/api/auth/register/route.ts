/** POST /api/auth/register { email, password (min 8), name? } → { ok, user } + dc_session cookie. */
import { assertCsrf, clientIp, jsonOk, parseJsonBody, withRoute } from "@/server/http";
import { checkAuthRateLimit } from "@/server/auth/rateLimit";
import { registerSchema, registerUser } from "@/server/auth/service";
import { sessionCookie } from "@/server/auth/session";
import type { AuthResponse } from "@/lib/serverTypes";

export const runtime = "nodejs";

export const POST = withRoute(async (req) => {
  assertCsrf(req);
  checkAuthRateLimit(clientIp(req));
  const input = await parseJsonBody(req, registerSchema, 20_000);
  const { user, token, expiresAt } = await registerUser(input, req.headers.get("user-agent"));
  const body: AuthResponse = { ok: true, user };
  return jsonOk(body, { status: 201, headers: { "set-cookie": sessionCookie(token, expiresAt) } });
});
