import "server-only";
import Stripe from "stripe";
import { getEnv } from "../env";
import { parseSubscription, type BillingEvent, parseStripeEvent } from "./events";
import type { CheckoutArgs, PaymentGateway } from "./gateway";

/** Just the parts of the Stripe SDK we call — lets tests inject a fake and assert the exact request parameters. */
export interface StripeLike {
  checkout: { sessions: { create(params: Record<string, unknown>, options?: Record<string, unknown>): Promise<{ id: string; url: string | null }>; retrieve(id: string): Promise<Record<string, unknown>> } };
  billingPortal: { sessions: { create(params: Record<string, unknown>): Promise<{ url: string }> } };
  subscriptions: { retrieve(id: string): Promise<unknown>; update(id: string, params: Record<string, unknown>): Promise<unknown> };
  invoicePayments: { list(params: Record<string, unknown>): Promise<{ data: { invoice: string | { id: string } }[] }> };
}

export function stripeConfigError(): string | null {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY) return "STRIPE_SECRET_KEY is not set";
  if (!env.STRIPE_WEBHOOK_SECRET) return "STRIPE_WEBHOOK_SECRET is not set";
  return null;
}

let client: StripeLike | null = null;
export function getStripeClient(): StripeLike {
  const key = getEnv().STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000, appInfo: { name: "level-up" } }) as unknown as StripeLike;
  return client;
}

/**
 * Verify the `Stripe-Signature` header over the RAW request body (HMAC-SHA256 with the endpoint secret, 5 minute
 * tolerance) and parse the event. Throws `Stripe.errors.StripeSignatureVerificationError` on any mismatch.
 */
export function verifyStripeWebhook(rawBody: string, signature: string | null, secret: string): { event: BillingEvent; payload: unknown } {
  if (!signature) throw new Error("missing stripe-signature header");
  const verified = Stripe.webhooks.constructEvent(rawBody, signature, secret);
  return { event: parseStripeEvent(verified), payload: verified };
}

const PRODUCT_NAMES: Record<string, string> = { PLUS: "LEVEL UP Plus", PRO: "LEVEL UP Pro" };

export function createStripeGateway(stripe: StripeLike = getStripeClient()): PaymentGateway {
  return {
    mode: "stripe",

    async createCheckout(a: CheckoutArgs) {
      const appUrl = getEnv().APP_URL.replace(/\/$/, "");
      const metadata = { userId: a.userId, plan: a.plan };
      const session = await stripe.checkout.sessions.create(
        {
          mode: "subscription",
          client_reference_id: a.userId,
          ...(a.customerId ? { customer: a.customerId } : { customer_email: a.email }),
          // The amount and currency come from src/config/plans.ts (Plus: $5, or exactly ₪5 for Israel; Pro: $20, or exactly ₪20 for Israel).
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: a.currency.toLowerCase(),
                unit_amount: a.unitAmount,
                recurring: { interval: "month" },
                product_data: { name: PRODUCT_NAMES[a.plan] ?? a.plan },
              },
            },
          ],
          metadata,
          subscription_data: { metadata },
          success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/billing/cancel`,
        },
        // A double click within the same minute reuses the same Checkout Session instead of creating two.
        { idempotencyKey: `checkout:${a.userId}:${a.plan}:${a.currency}:${Math.floor(Date.now() / 60_000)}` },
      );
      if (!session.url) throw new Error("Stripe did not return a checkout URL");
      return { url: session.url };
    },

    async createPortal({ customerId, returnUrl }) {
      const s = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
      return { url: s.url };
    },

    async setCancelAtPeriodEnd({ subscriptionId, cancel }) {
      const updated = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: cancel });
      return parseSubscription(updated);
    },

    async retrieveCheckout(sessionId) {
      let session: Record<string, unknown>;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
      } catch {
        return null;
      }
      const subRef = session.subscription;
      const subId = typeof subRef === "string" ? subRef : subRef && typeof subRef === "object" ? String((subRef as { id: unknown }).id) : null;
      const complete = session.status === "complete" && (session.payment_status === "paid" || session.payment_status === "no_payment_required");
      const snapshot = complete && subId ? parseSubscription(await stripe.subscriptions.retrieve(subId)) : null;
      return { userId: typeof session.client_reference_id === "string" ? session.client_reference_id : null, complete, snapshot };
    },

    async invoiceIdForPaymentIntent(paymentIntentId) {
      const list = await stripe.invoicePayments.list({ payment: { type: "payment_intent", payment_intent: paymentIntentId }, limit: 1 });
      const inv = list.data[0]?.invoice;
      return inv ? (typeof inv === "string" ? inv : inv.id) : null;
    },
  };
}
