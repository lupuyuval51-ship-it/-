import { timingSafeEqual } from "node:crypto";
import { getEnv } from "@/server/env";
import { Errors } from "@/server/http/errors";
import { apiRoute } from "@/server/http/route";
import { reapExpiredJobs } from "@/server/generation/jobs";

/** Optional cron hook: POST with `Authorization: Bearer $CRON_SECRET` to refund jobs that outlived their deadline. */
export const POST = apiRoute({ auth: "none", csrf: false }, async ({ req }) => {
  const secret = getEnv().CRON_SECRET;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret ?? "");
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) throw Errors.forbidden("Invalid credentials.");
  return { reaped: await reapExpiredJobs() };
});
