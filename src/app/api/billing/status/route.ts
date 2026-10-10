import { getBillingView, syncCheckout } from "@/server/billing/service";
import { apiRoute } from "@/server/http/route";

/** Poll target for the post-checkout page. `session_id` lets the server confirm the checkout with the provider. */
export const GET = apiRoute({}, async ({ user, req }) => {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  return sessionId ? syncCheckout(user.id, sessionId.slice(0, 220)) : getBillingView(user.id);
});
