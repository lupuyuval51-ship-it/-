import "server-only";
import type { CurrencyCode, PaidPlanId } from "@/config/plans";
import { getEnv } from "../env";
import type { SubscriptionSnapshot } from "./events";
import { createDevGateway } from "./dev";
import { createStripeGateway, stripeConfigError } from "./stripe";
import type { InvoiceResolver } from "./ingest";

export interface CheckoutArgs {
  userId: string;
  email: string;
  plan: PaidPlanId;
  currency: CurrencyCode;
  /** Minor units, taken from the central plan config — never from the client. */
  unitAmount: number;
  /** Existing provider customer, so a returning customer is not duplicated. */
  customerId: string | null;
}

/** What the rest of the app needs from a payment provider. Stripe is the real implementation; `dev` is a labelled simulator. */
export interface PaymentGateway extends InvoiceResolver {
  readonly mode: "stripe" | "dev";
  createCheckout(args: CheckoutArgs): Promise<{ url: string }>;
  /** Customer self-service (payment method, invoices). Not offered by the simulator. */
  createPortal(args: { customerId: string; returnUrl: string }): Promise<{ url: string } | null>;
  /** Ask the provider to (un)schedule cancellation and return the resulting authoritative subscription state. */
  setCancelAtPeriodEnd(args: { subscriptionId: string; userId: string; cancel: boolean }): Promise<SubscriptionSnapshot>;
  /** Read a finished checkout back from the provider (never trust the browser's redirect). */
  retrieveCheckout(sessionId: string): Promise<{ userId: string | null; complete: boolean; snapshot: SubscriptionSnapshot | null } | null>;
}

export type PaymentsStatus =
  | { mode: "disabled"; ready: false; reason: string }
  | { mode: "stripe" | "dev"; ready: boolean; reason?: string };

export function paymentsStatus(): PaymentsStatus {
  const env = getEnv();
  if (env.PAYMENTS_MODE === "disabled") return { mode: "disabled", ready: false, reason: "PAYMENTS_MODE=disabled" };
  if (env.PAYMENTS_MODE === "dev") return { mode: "dev", ready: true };
  const missing = stripeConfigError();
  return missing ? { mode: "stripe", ready: false, reason: missing } : { mode: "stripe", ready: true };
}

let cached: PaymentGateway | null = null;

/** The configured gateway, or null when payments are disabled / misconfigured. */
export function getGateway(): PaymentGateway | null {
  const status = paymentsStatus();
  if (!status.ready) return null;
  cached ??= status.mode === "dev" ? createDevGateway() : createStripeGateway();
  if (cached.mode !== status.mode) cached = status.mode === "dev" ? createDevGateway() : createStripeGateway();
  return cached;
}

/** Test seam. */
export function setGatewayForTests(g: PaymentGateway | null): void {
  cached = g;
}
