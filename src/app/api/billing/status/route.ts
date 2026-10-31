import { getBillingView, syncCheckout } from "@/server/billing/service";
import { Errors } from "@/server/http/errors";
import { apiRoute } from "@/server/http/route";
import { checkRateLimit } from "@/server/ratelimit";

/**
 * Confirming a checkout asks the payment provider (two Stripe API calls) and writes a ledger row, so a signed-in user
 * must not be able to drive that in a loop: it would burn the account-wide Stripe API budget that real checkouts share.
 * The success page polls every 2 s for about a minute, so this leaves room for a few page loads.
 */
const SYNC_RULE = { max: 90, windowSec: 600 } as const;

/** Poll target for the post-checkout page. `session_id` lets the server confirm the checkout with the provider. */
export const GET = apiRoute({}, async ({ user, req }) => {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return getBillingView(user.id);
  const limit = await checkRateLimit(`billing-sync:u:${user.id}`, SYNC_RULE);
  if (!limit.ok) throw Errors.tooMany(limit.retryAfterSec);
  return syncCheckout(user.id, sessionId.slice(0, 220));
});
