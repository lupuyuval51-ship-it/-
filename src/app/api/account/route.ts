import { z } from "zod";
import { INPUT_LIMITS, RATE_LIMITS } from "@/config/limits";
import { countrySchema, localeSchema } from "@/lib/schemas/auth";
import { deleteAccount, updateAccount } from "@/server/account";
import { clearedSessionCookie } from "@/server/auth/session";
import { apiRoute } from "@/server/http/route";
import { NextResponse } from "next/server";

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(INPUT_LIMITS.nameMax).optional(),
  locale: localeSchema.optional(),
  country: countrySchema.nullable().optional(),
  graphicsPreference: z.enum(["A", "B", "C"]).nullable().optional(),
  soundEnabled: z.boolean().optional(),
  musicEnabled: z.boolean().optional(),
});

export const PATCH = apiRoute({ body: updateSchema, rateLimit: [{ name: "account", rule: RATE_LIMITS.account, by: "user" }] }, async ({ user, body }) => {
  const p = await updateAccount(user.id, body);
  return { displayName: p.displayName, locale: p.locale, country: p.country, graphicsPreference: p.graphicsPreference, soundEnabled: p.soundEnabled, musicEnabled: p.musicEnabled };
});

const deleteSchema = z.union([z.object({ password: z.string().min(1).max(INPUT_LIMITS.passwordMax) }), z.object({ googleReauth: z.literal(true) })]);
export const DELETE = apiRoute({ body: deleteSchema, rateLimit: [{ name: "account-delete", rule: { max: 5, windowSec: 3600 }, by: "user" }] }, async ({ user, body, sessionToken }) => {
  await deleteAccount(user.id, "password" in body ? { password: body.password } : { googleReauth: true, sessionToken });
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(clearedSessionCookie());
  return res;
});
