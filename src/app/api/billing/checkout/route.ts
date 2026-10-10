import { z } from "zod";
import { RATE_LIMITS } from "@/config/limits";
import { PAID_PLAN_IDS } from "@/config/plans";
import { startCheckout } from "@/server/billing/service";
import { apiRoute } from "@/server/http/route";

const body = z.object({ plan: z.enum(PAID_PLAN_IDS) });

/** Price and currency are decided on the server from the account's saved region; the body only names the plan. */
export const POST = apiRoute({ body, rateLimit: [{ name: "checkout", rule: RATE_LIMITS.checkout, by: "user" }] }, async ({ user, body }) => startCheckout(user, body.plan));
