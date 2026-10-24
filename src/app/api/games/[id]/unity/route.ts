import { RATE_LIMITS } from "@/config/limits";
import { apiRoute } from "@/server/http/route";
import { getUnityScene } from "@/server/games/unity";

export const GET = apiRoute<undefined, { id: string }>({ rateLimit: [{ name: "account", rule: RATE_LIMITS.account, by: "user" }] }, async ({ user, params, req }) => {
  const area = req.nextUrl.searchParams.get("area");
  return getUnityScene(user.id, params.id, area && /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(area) ? area : null);
});
