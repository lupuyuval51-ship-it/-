import { NextResponse } from "next/server";
import { clearedSessionCookie, destroySession } from "@/server/auth/session";
import { apiRoute } from "@/server/http/route";

export const POST = apiRoute({ auth: "none" }, async ({ sessionToken }) => {
  await destroySession(sessionToken);
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(clearedSessionCookie());
  return res;
});
