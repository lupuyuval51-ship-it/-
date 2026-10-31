import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/config/limits";
import { registerSchema } from "@/lib/schemas/auth";
import { registerUser } from "@/server/auth/service";
import { createSession, sessionCookie } from "@/server/auth/session";
import { apiRoute } from "@/server/http/route";

export const POST = apiRoute(
  { auth: "none", body: registerSchema, rateLimit: [{ name: "register", rule: RATE_LIMITS.register, by: "ip" }] },
  async ({ req, body }) => {
    const { id } = await registerUser({ ...body, displayName: body.displayName, country: body.country ?? null });
    const { token, expiresAt } = await createSession(id, req.headers.get("user-agent"));
    const res = NextResponse.json({ ok: true, userId: id }, { status: 201, headers: { "Cache-Control": "no-store" } });
    res.cookies.set(sessionCookie(token, expiresAt));
    return res;
  },
);
