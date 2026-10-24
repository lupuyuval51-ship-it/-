import { z } from "zod";
import { RATE_LIMITS } from "@/config/limits";
import { completeDevCheckout } from "@/server/billing/service";
import { apiRoute } from "@/server/http/route";

const body = z.object({ checkoutId: z.string().min(1).max(60) });

/** DEVELOPMENT SIMULATOR ONLY (PAYMENTS_MODE=dev, refused in production). No money moves. */
export const POST = apiRoute({ body, rateLimit: [{ name: "checkout", rule: RATE_LIMITS.checkout, by: "user" }] }, async ({ user, body }) => completeDevCheckout(user.id, body.checkoutId));
