import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/config/limits";
import { loginSchema } from "@/lib/schemas/auth";
import { verifyCredentials } from "@/server/auth/service";
import { createSession, sessionCookie } from "@/server/auth/session";
import { Errors } from "@/server/http/errors";
import { apiRoute } from "@/server/http/route";
import { checkRateLimit } from "@/server/ratelimit";

export const POST = apiRoute(
  { auth: "none", body: loginSchema, rateLimit: [{ name: "login", rule: RATE_LIMITS.loginPerIp, by: "ip" }] },
  async ({ req, body }) => {
    // Per-account limit stops password guessing even when requests come from many IPs.
    const perEmail = await checkRateLimit(`login:email:${body.email}`, RATE_LIMITS.login);
    if (!perEmail.ok) throw Errors.tooMany(perEmail.retryAfterSec);
    const userId = await verifyCredentials(body.email, body.password);
    const { token, expiresAt } = await createSession(userId, req.headers.get("user-agent"));
    const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(sessionCookie(token, expiresAt));
    return res;
  },
);
