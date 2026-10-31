import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALE_COOKIE } from "@/config/limits";
import { localeSchema } from "@/lib/schemas/auth";
import { db } from "@/server/db";
import { secureCookies } from "@/server/env";
import { apiRoute } from "@/server/http/route";

/** Switch UI language: a cookie for everyone, plus the saved preference for signed-in users. */
export const POST = apiRoute({ auth: "optional", body: z.object({ locale: localeSchema }) }, async ({ user, body }) => {
  if (user) await db.userProfile.update({ where: { userId: user.id }, data: { locale: body.locale } });
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set({ name: LOCALE_COOKIE, value: body.locale, path: "/", sameSite: "lax", secure: secureCookies(), maxAge: 60 * 60 * 24 * 365 });
  return res;
});
