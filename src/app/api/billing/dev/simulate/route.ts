import { z } from "zod";
import { RATE_LIMITS } from "@/config/limits";
import { simulateDevEvent } from "@/server/billing/service";
import { apiRoute } from "@/server/http/route";

const body = z.object({ event: z.enum(["renew", "payment_failed", "refund"]) });

/** DEVELOPMENT SIMULATOR ONLY (PAYMENTS_MODE=dev, refused in production). Replays lifecycle events through the real ingest pipeline. */
export const POST = apiRoute({ body, rateLimit: [{ name: "checkout", rule: RATE_LIMITS.checkout, by: "user" }] }, async ({ user, body }) => simulateDevEvent(user.id, body.event));
