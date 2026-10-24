import type { NextRequest } from "next/server";
import { RATE_LIMITS } from "@/config/limits";
import { rateLimitedRedirect, startGoogle, unexpectedFailureRedirect } from "@/server/auth/google/flow";
import { apiRoute } from "@/server/http/route";

// Same budget as the password login route. A browser navigation, so a throttled or failed start redirects back with a fixed error key.
const guarded = apiRoute({ auth: "none", rateLimit: [{ name: "google-start", rule: RATE_LIMITS.loginPerIp, by: "ip" }] }, ({ req }) => startGoogle(req));

export async function GET(req: NextRequest): Promise<Response> {
  const res = await guarded(req);
  if (res.status === 429) return rateLimitedRedirect(new URL(req.url).searchParams.get("intent"));
  return res.status >= 500 ? unexpectedFailureRedirect() : res;
}
