import type { NextRequest } from "next/server";
import { RATE_LIMITS } from "@/config/limits";
import { finishGoogle, rateLimitedRedirect, unexpectedFailureRedirect } from "@/server/auth/google/flow";
import { apiRoute } from "@/server/http/route";

const guarded = apiRoute({ auth: "none", rateLimit: [{ name: "google-callback", rule: RATE_LIMITS.loginPerIp, by: "ip" }] }, ({ req }) => finishGoogle(req));

export async function GET(req: NextRequest): Promise<Response> {
  const res = await guarded(req);
  if (res.status === 429) return rateLimitedRedirect(null);
  // Google has just sent the browser here: never answer it with an API error body.
  return res.status >= 500 ? unexpectedFailureRedirect() : res;
}
