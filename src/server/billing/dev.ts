import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "../db";
import { getEnv } from "../env";
import { parseSubscription, subscriptionObject, type SubscriptionSnapshot } from "./events";
import type { CheckoutArgs, PaymentGateway } from "./gateway";

/**
 * DEVELOPMENT PAYMENT SIMULATOR — NOT A PAYMENT PROVIDER. No money moves.
 *
 * It exists so the subscription flow can be exercised end to end without Stripe credentials. Safety properties:
 *  - `PAYMENTS_MODE=dev` is refused at startup when APP_ENV=production (see getEnv), and every entry point re-checks it;
 *  - the plan, currency and amount are read from the server-side checkout row created from src/config/plans.ts,
 *    never from the browser;
 *  - events go through the very same ingest pipeline as Stripe webhooks, tagged provider=DEV, and the UI labels
 *    such subscriptions as simulated.
 */
export function assertDevMode(): void {
  const env = getEnv();
  if (env.PAYMENTS_MODE !== "dev" || env.APP_ENV === "production") throw new Error("The payment simulator is only available when PAYMENTS_MODE=dev outside production");
}

export function createDevGateway(): PaymentGateway {
  return {
    mode: "dev",

    async createCheckout(a: CheckoutArgs) {
      assertDevMode();
      const row = await db.devCheckoutSession.create({ data: { userId: a.userId, plan: a.plan, currency: a.currency.toLowerCase(), unitAmount: a.unitAmount } });
      return { url: `/billing/dev-checkout/${row.id}` };
    },

    async createPortal() {
      return null; // the simulator has no customer portal
    },

    async setCancelAtPeriodEnd({ subscriptionId, userId, cancel }) {
      assertDevMode();
      const sub = await db.subscription.findFirst({ where: { providerSubscriptionId: subscriptionId, userId } });
      if (!sub) throw new Error("subscription not found");
      return snapshotOf(sub, { cancelAtPeriodEnd: cancel, canceledAt: cancel ? new Date() : null });
    },

    async retrieveCheckout() {
      return null;
    },

    async invoiceIdForPaymentIntent(paymentIntentId) {
      return paymentIntentId.startsWith("pi_dev_") ? paymentIntentId.slice("pi_dev_".length) : null;
    },
  };
}

type SubRow = { providerSubscriptionId: string; providerCustomerId: string; userId: string; plan: string; status: string; currency: string | null; unitAmount: number | null; currentPeriodStart: Date; currentPeriodEnd: Date; cancelAtPeriodEnd: boolean; canceledAt: Date | null };

export function snapshotOf(sub: SubRow, over: Partial<{ cancelAtPeriodEnd: boolean; canceledAt: Date | null; status: string; periodStart: Date; periodEnd: Date }> = {}): SubscriptionSnapshot {
  return parseSubscription(
    subscriptionObject({
      subscriptionId: sub.providerSubscriptionId,
      customerId: sub.providerCustomerId,
      userId: sub.userId,
      plan: sub.plan,
      status: (over.status ?? sub.status.toLowerCase()) as never,
      currency: sub.currency ?? "usd",
      unitAmount: sub.unitAmount ?? 0,
      periodStart: over.periodStart ?? sub.currentPeriodStart,
      periodEnd: over.periodEnd ?? sub.currentPeriodEnd,
      cancelAtPeriodEnd: over.cancelAtPeriodEnd ?? sub.cancelAtPeriodEnd,
      canceledAt: over.canceledAt === undefined ? sub.canceledAt : over.canceledAt,
    }),
  );
}

export const devId = (prefix: string): string => `${prefix}_dev_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
