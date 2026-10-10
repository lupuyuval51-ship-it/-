import { RATE_LIMITS } from "@/config/limits";
import { openPortal } from "@/server/billing/service";
import { apiRoute } from "@/server/http/route";

export const POST = apiRoute({ rateLimit: [{ name: "checkout", rule: RATE_LIMITS.checkout, by: "user" }] }, async ({ user }) => openPortal(user.id));
