import "server-only";
import { randomUUID } from "node:crypto";
import { PLANS, monthlyPrice, type CurrencyCode, type PaidPlanId, type PlanId } from "@/config/plans";
import { computeEntitlement } from "../allowance/entitlement";
import { db } from "../db";
import { getEnv, plansEnabled } from "../env";
import { Errors } from "../http/errors";
import { assertDevMode, devId, snapshotOf } from "./dev";
import { chargeObject, invoiceObject, parseStripeEvent, stripeEvent, subscriptionObject, type BillingEvent } from "./events";
import { getGateway, paymentsStatus, type PaymentGateway } from "./gateway";
import { PermanentWebhookError, ingestBillingEvent, isSubscriptionLive, type IngestResult, type Provider } from "./ingest";
import { verifyStripeWebhook } from "./stripe";

export interface BillingView {
  payments: { mode: "disabled" | "stripe" | "dev"; ready: boolean };
  plan: PlanId;
  subscription: null | {
    plan: PlanId;
    status: string;
    simulated: boolean;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    currency: string | null;
    unitAmount: number | null;
    /** Why a subscription that exists is not currently granting paid features. */
    suspended: null | "past_due" | "refunded" | "ended";
    canManage: boolean;
  };
}

export async function getBillingView(userId: string, now = new Date()): Promise<BillingView> {
  const sub = await db.subscription.findUnique({ where: { userId } });
  const ent = computeEntitlement(sub, now);
  const status = paymentsStatus();
  let suspended: NonNullable<BillingView["subscription"]>["suspended"] = null;
  if (sub && ent.source === "FREE") {
    if (sub.status === "PAST_DUE" || sub.status === "UNPAID") suspended = "past_due";
    else if (sub.revokedPeriodStart && sub.revokedPeriodStart.getTime() === sub.currentPeriodStart.getTime()) suspended = "refunded";
    else suspended = "ended";
  }
  return {
    payments: { mode: status.mode, ready: status.ready },
    plan: ent.plan,
    subscription: sub
      ? {
          plan: sub.plan,
          status: sub.status,
          simulated: sub.provider === "DEV",
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          currentPeriodStart: sub.currentPeriodStart.toISOString(),
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
          currency: sub.currency,
          unitAmount: sub.unitAmount,
          suspended,
          canManage: sub.provider === "STRIPE" && status.mode === "stripe" && status.ready,
        }
      : null,
  };
}

function requireGateway(): PaymentGateway {
  const gw = getGateway();
  if (!gw) {
    const s = paymentsStatus();
    throw Errors.unavailable("PAYMENTS_DISABLED", s.mode === "disabled" ? "Online payments are not enabled on this installation." : `Payments are not configured: ${s.reason}`);
  }
  return gw;
}

const providerOf = (gw: PaymentGateway): Provider => (gw.mode === "dev" ? "DEV" : "STRIPE");

/** Start a checkout for a paid plan. The price is looked up from the central config for the user's SAVED region. */
export async function startCheckout(user: { id: string; email: string; country: string | null }, plan: PaidPlanId, now = new Date()): Promise<{ url: string }> {
  if (!plansEnabled()) throw Errors.notFound();
  const gw = requireGateway();
  const price = monthlyPrice(plan, user.country);
  if (price.minor <= 0 || PLANS[plan].monthlyPrices[price.currency] !== price.minor) throw Errors.badRequest("This plan cannot be purchased.");
  const existing = await db.subscription.findUnique({ where: { userId: user.id } });
  if (existing && isSubscriptionLive(existing, now)) {
    throw Errors.conflict("ALREADY_SUBSCRIBED", "You already have a subscription. Cancel it or wait for it to end before choosing another plan.");
  }
  return gw.createCheckout({
    userId: user.id,
    email: user.email,
    plan,
    currency: price.currency as CurrencyCode,
    unitAmount: price.minor,
    customerId: existing && existing.provider === providerOf(gw) ? existing.providerCustomerId : null,
  });
}

export async function openPortal(userId: string): Promise<{ url: string }> {
  const gw = requireGateway();
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || sub.provider !== providerOf(gw)) throw Errors.conflict("NO_SUBSCRIPTION", "There is no subscription to manage.");
  const portal = await gw.createPortal({ customerId: sub.providerCustomerId, returnUrl: `${getEnv().APP_URL.replace(/\/$/, "")}/account` });
  if (!portal) throw Errors.unavailable("PORTAL_UNAVAILABLE", "Billing management is not available in the payment simulator.");
  return portal;
}

/** Apply a provider-confirmed subscription snapshot (from an API response we made ourselves) through the shared pipeline. */
async function applySync(gw: PaymentGateway, event: Extract<BillingEvent, { kind: "subscription" }>["snapshot"], label: string): Promise<IngestResult> {
  const ev: BillingEvent = { eventId: `evt_sync_${randomUUID()}`, eventTime: new Date(Math.floor(Date.now() / 1000) * 1000), type: `sync.${label}`, kind: "subscription", snapshot: event, deleted: false };
  return ingestBillingEvent(providerOf(gw), ev, { source: "sync", label }, gw);
}

export async function setCancellation(userId: string, cancel: boolean, now = new Date()): Promise<BillingView> {
  const gw = requireGateway();
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || sub.provider !== providerOf(gw)) throw Errors.conflict("NO_SUBSCRIPTION", "There is no subscription to change.");
  if (!isSubscriptionLive(sub, now)) throw Errors.conflict("SUBSCRIPTION_ENDED", "This subscription has already ended.");
  const snapshot = await gw.setCancelAtPeriodEnd({ subscriptionId: sub.providerSubscriptionId, userId, cancel });
  await applySync(gw, snapshot, cancel ? "cancel_at_period_end" : "resume");
  return getBillingView(userId, now);
}

/**
 * The success page asks the server to confirm a checkout. The server reads the session from the PROVIDER with its
 * secret key — nothing the browser sends can grant access. Webhooks remain the primary path; this only covers delay.
 */
export async function syncCheckout(userId: string, sessionId: string): Promise<BillingView> {
  const gw = getGateway();
  if (gw?.mode === "stripe" && /^cs_[A-Za-z0-9_]{8,200}$/.test(sessionId)) {
    const result = await gw.retrieveCheckout(sessionId);
    if (result && result.userId === userId && result.complete && result.snapshot) await applySync(gw, result.snapshot, "checkout");
  }
  return getBillingView(userId);
}

// ───────────────────────────── Stripe webhook ─────────────────────────────

export interface WebhookResponse {
  status: number;
  body: Record<string, unknown>;
}

/** Verify (signature over the raw body) → parse → ingest idempotently. 2xx tells Stripe to stop retrying; 5xx to retry. */
export async function handleStripeWebhook(rawBody: string, signature: string | null): Promise<WebhookResponse> {
  const env = getEnv();
  const status = paymentsStatus();
  if (status.mode !== "stripe" || !status.ready || !env.STRIPE_WEBHOOK_SECRET) return { status: 503, body: { error: "stripe webhooks are not enabled" } };
  let parsed: ReturnType<typeof verifyStripeWebhook>;
  try {
    parsed = verifyStripeWebhook(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return { status: 400, body: { error: "invalid signature or payload" } };
  }
  try {
    const result = await ingestBillingEvent("STRIPE", parsed.event, parsed.payload, getGateway());
    return { status: 200, body: { received: true, status: result.status } };
  } catch (err) {
    if (err instanceof PermanentWebhookError) {
      console.error(`[billing] event ${parsed.event.eventId} (${parsed.event.type}) rejected: ${err.message}`);
      return { status: 200, body: { received: true, status: "failed" } };
    }
    console.error(`[billing] event ${parsed.event.eventId} (${parsed.event.type}) failed, will be retried:`, err instanceof Error ? err.message : err);
    return { status: 500, body: { error: "processing failed, retry later" } };
  }
}

// ───────────────────────────── development simulator ─────────────────────────────

function addMonthUtc(d: Date): Date {
  const r = new Date(d.getTime());
  r.setUTCMonth(r.getUTCMonth() + 1);
  return r;
}

export async function completeDevCheckout(userId: string, checkoutId: string, now = new Date()): Promise<BillingView> {
  assertDevMode();
  const gw = requireGateway();
  const row = await db.devCheckoutSession.findFirst({ where: { id: checkoutId, userId } });
  if (!row) throw Errors.notFound("Checkout not found.");
  if (!row.completedAt) {
    const existing = await db.subscription.findUnique({ where: { userId } });
    if (existing && isSubscriptionLive(existing, now)) throw Errors.conflict("ALREADY_SUBSCRIBED", "You already have a subscription.");
    const sim = { subscriptionId: `sub_dev_${row.id}`, customerId: `cus_dev_${userId}`, userId, plan: row.plan, currency: row.currency, unitAmount: row.unitAmount, periodStart: now, periodEnd: addMonthUtc(now) };
    const invoiceId = `in_dev_${row.id}`;
    // Deterministic event ids: completing twice (double click, retry after a crash) can never create two subscriptions.
    const events = [
      stripeEvent(`evt_dev_${row.id}_sub`, "customer.subscription.created", now, subscriptionObject({ ...sim, status: "active" })),
      stripeEvent(`evt_dev_${row.id}_inv`, "invoice.paid", now, invoiceObject({ invoiceId, subscriptionId: sim.subscriptionId, customerId: sim.customerId, amountPaid: sim.unitAmount, periodStart: sim.periodStart, periodEnd: sim.periodEnd })),
    ];
    for (const e of events) await ingestBillingEvent("DEV", parseStripeEvent(e), e, gw, now);
    await db.devCheckoutSession.updateMany({ where: { id: row.id, completedAt: null }, data: { completedAt: now } });
  }
  return getBillingView(userId, now);
}

export type DevSimulation = "renew" | "payment_failed" | "refund";

export async function simulateDevEvent(userId: string, kind: DevSimulation, now = new Date()): Promise<BillingView> {
  assertDevMode();
  const gw = requireGateway();
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || sub.provider !== "DEV") throw Errors.conflict("NO_SUBSCRIPTION", "There is no simulated subscription.");
  const base = { subscriptionId: sub.providerSubscriptionId, customerId: sub.providerCustomerId, userId, plan: sub.plan, currency: sub.currency ?? "usd", unitAmount: sub.unitAmount ?? 0 };
  const events: unknown[] = [];
  if (kind === "renew") {
    // A renewal starts exactly where the previous period ended (this is what Stripe does), and opens a fresh allowance period.
    const periodStart = sub.currentPeriodEnd;
    const periodEnd = addMonthUtc(periodStart);
    const invoiceId = devId("in");
    events.push(
      stripeEvent(devId("evt"), "invoice.paid", now, invoiceObject({ invoiceId, subscriptionId: sub.providerSubscriptionId, customerId: sub.providerCustomerId, amountPaid: base.unitAmount, periodStart, periodEnd })),
      stripeEvent(devId("evt"), "customer.subscription.updated", now, subscriptionObject({ ...base, status: "active", periodStart, periodEnd, cancelAtPeriodEnd: sub.cancelAtPeriodEnd })),
    );
  } else if (kind === "payment_failed") {
    const snap = snapshotOf(sub);
    events.push(
      stripeEvent(devId("evt"), "invoice.payment_failed", now, invoiceObject({ invoiceId: devId("in"), subscriptionId: sub.providerSubscriptionId, customerId: sub.providerCustomerId, amountPaid: 0, periodStart: snap.periodEnd, periodEnd: addMonthUtc(snap.periodEnd) })),
      stripeEvent(devId("evt"), "customer.subscription.updated", now, subscriptionObject({ ...base, status: "past_due", periodStart: sub.currentPeriodStart, periodEnd: sub.currentPeriodEnd, cancelAtPeriodEnd: sub.cancelAtPeriodEnd })),
    );
  } else {
    if (!sub.lastPaidInvoiceId) throw Errors.conflict("NOTHING_TO_REFUND", "There is no paid invoice to refund.");
    events.push(stripeEvent(devId("evt"), "charge.refunded", now, chargeObject({ chargeId: devId("ch"), invoiceId: sub.lastPaidInvoiceId, amount: base.unitAmount, amountRefunded: base.unitAmount, paymentIntentId: `pi_dev_${sub.lastPaidInvoiceId}` })));
  }
  for (const e of events) await ingestBillingEvent("DEV", parseStripeEvent(e), e, gw, now);
  return getBillingView(userId, now);
}
