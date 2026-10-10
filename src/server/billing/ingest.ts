import "server-only";
import { PLANS, isPaidPlanId, type CurrencyCode, type PaidPlanId } from "@/config/plans";
import type { Prisma } from "@/generated/prisma/client";
import { db, isUniqueViolation, type Tx } from "../db";
import type { BillingEvent, SubscriptionSnapshot } from "./events";

/** A condition that may resolve by itself (e.g. an invoice arrived before its subscription): answer 5xx so the provider retries. */
export class RetryableWebhookError extends Error {}
/** An event that can never be applied (unknown plan, price mismatch). Recorded as FAILED, answered 2xx so the provider stops retrying. */
export class PermanentWebhookError extends Error {}

export type Provider = "STRIPE" | "DEV";
export interface IngestResult {
  status: "processed" | "duplicate" | "ignored";
  note?: string;
}

/** Resolves facts that the provider's webhook payload does not contain (Stripe charges do not carry their invoice). */
export interface InvoiceResolver {
  invoiceIdForPaymentIntent(paymentIntentId: string): Promise<string | null>;
}

const TERMINAL = new Set(["CANCELED", "INCOMPLETE_EXPIRED"]);
const REPLACEABLE = new Set(["CANCELED", "INCOMPLETE_EXPIRED", "INCOMPLETE"]);

/**
 * Does a stored subscription block starting a new one? Live = the provider may still bill the customer
 * (active, trialing, past due, unpaid, paused). A subscription that was set to cancel at period end stops being
 * live once that period is over, even if the final "deleted" webhook was lost.
 */
export function isSubscriptionLive(sub: { status: string; currentPeriodEnd: Date; cancelAtPeriodEnd: boolean }, now: Date): boolean {
  if (REPLACEABLE.has(sub.status)) return false;
  if (sub.cancelAtPeriodEnd && now.getTime() >= sub.currentPeriodEnd.getTime()) return false;
  return true;
}

/**
 * Idempotently ingest ONE verified billing event.
 *
 *  - The event id is the primary key of WebhookEvent: a redelivery of a processed event is a no-op.
 *  - State is only ever derived from persisted rows; ordering is protected by `lastEventAt` and terminal states.
 *  - Allowance rows are derived from the subscription lazily (resolveEntitlement), so renewals open a fresh
 *    period and upgrades keep `used` without any explicit allowance mutation here.
 */
export async function ingestBillingEvent(provider: Provider, ev: BillingEvent, payload: unknown, resolver: InvoiceResolver | null, now = new Date()): Promise<IngestResult> {
  try {
    await db.webhookEvent.create({ data: { id: ev.eventId, provider, type: ev.type, eventTime: ev.eventTime, payload: payload as Prisma.InputJsonValue } });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const existing = await db.webhookEvent.findUniqueOrThrow({ where: { id: ev.eventId } });
    if (existing.status === "PROCESSED" || existing.status === "IGNORED") return { status: "duplicate" };
    // RECEIVED (a previous attempt crashed midway) or FAILED: process it again — application is idempotent.
  }

  try {
    let invoiceId = ev.kind === "refund" ? ev.invoiceId : null;
    if (ev.kind === "refund" && ev.fullyRefunded && !invoiceId && ev.paymentIntentId) {
      if (!resolver) throw new RetryableWebhookError("no invoice resolver available for refund");
      invoiceId = await resolver.invoiceIdForPaymentIntent(ev.paymentIntentId); // network call kept outside the transaction
    }
    const outcome = await db.$transaction((tx) => apply(tx, provider, ev, invoiceId, now), { timeout: 15_000 });
    await db.webhookEvent.update({
      where: { id: ev.eventId },
      data: { status: outcome.applied ? "PROCESSED" : "IGNORED", processedAt: new Date(), error: outcome.note ?? null },
    });
    return { status: outcome.applied ? "processed" : "ignored", note: outcome.note };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.webhookEvent.update({ where: { id: ev.eventId }, data: { status: "FAILED", error: message.slice(0, 500) } }).catch(() => undefined);
    throw err;
  }
}

interface Outcome {
  applied: boolean;
  note?: string;
}

async function apply(tx: Tx, provider: Provider, ev: BillingEvent, resolvedInvoiceId: string | null, now: Date): Promise<Outcome> {
  switch (ev.kind) {
    case "ignored":
      return { applied: false, note: ev.reason };
    case "subscription":
      return applySubscription(tx, provider, ev.snapshot, ev.eventTime, ev.deleted, now);
    case "invoice_paid":
      return applyInvoicePaid(tx, ev);
    case "invoice_failed":
      return applyInvoiceFailed(tx, ev);
    case "refund":
      return applyRefund(tx, ev, resolvedInvoiceId);
  }
}

/** Serialise all billing mutations for one user (webhooks arrive concurrently and out of order). */
async function lockUser(tx: Tx, userId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"billing:" + userId}))`;
}

async function findSubscription(tx: Tx, subscriptionId: string) {
  return tx.subscription.findUnique({ where: { providerSubscriptionId: subscriptionId } });
}

function expectedAmount(plan: PaidPlanId, currency: string): number | undefined {
  return PLANS[plan].monthlyPrices[currency.toUpperCase() as CurrencyCode];
}

async function applySubscription(tx: Tx, provider: Provider, snap: SubscriptionSnapshot, eventTime: Date, deleted: boolean, now: Date): Promise<Outcome> {
  const bySub = await findSubscription(tx, snap.subscriptionId);
  const userId = snap.userId ?? bySub?.userId ?? (await tx.subscription.findFirst({ where: { providerCustomerId: snap.customerId }, select: { userId: true } }))?.userId ?? null;
  if (!userId) return { applied: false, note: "no user is associated with this subscription" };
  await lockUser(tx, userId);
  const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { applied: false, note: "user no longer exists" };

  const existing = await tx.subscription.findUnique({ where: { userId } });
  const plan = existing?.providerSubscriptionId === snap.subscriptionId && !isPaidPlanId(snap.plan) ? existing.plan : snap.plan;
  if (!isPaidPlanId(plan)) throw new PermanentWebhookError(`subscription ${snap.subscriptionId} carries no valid plan`);

  // Fail closed on price tampering/misconfiguration: the charged amount must equal the configured price for the plan.
  if (!deleted) {
    const want = snap.currency ? expectedAmount(plan, snap.currency) : undefined;
    if (want === undefined || snap.unitAmount !== want) {
      throw new PermanentWebhookError(`price ${snap.unitAmount} ${snap.currency} does not match the configured ${plan} price`);
    }
  }

  const data = {
    plan,
    status: snap.status,
    currency: snap.currency,
    unitAmount: snap.unitAmount,
    currentPeriodStart: snap.periodStart,
    currentPeriodEnd: snap.periodEnd,
    cancelAtPeriodEnd: snap.cancelAtPeriodEnd,
    canceledAt: snap.canceledAt,
    providerCustomerId: snap.customerId,
    lastEventAt: eventTime,
  } satisfies Prisma.SubscriptionUncheckedUpdateInput;

  if (!existing) {
    await tx.subscription.create({ data: { userId, provider, providerSubscriptionId: snap.subscriptionId, ...data } });
    return { applied: true };
  }

  if (existing.providerSubscriptionId !== snap.subscriptionId) {
    // A different subscription may only take over once the stored one can no longer entitle or bill the user.
    if (isSubscriptionLive(existing, now)) return { applied: false, note: "another subscription is still active for this user" };
    await tx.subscription.update({
      where: { userId },
      data: { provider, providerSubscriptionId: snap.subscriptionId, revokedPeriodStart: null, lastPaidInvoiceId: null, ...data },
    });
    return { applied: true, note: "replaced a finished subscription" };
  }

  if (TERMINAL.has(existing.status)) return { applied: false, note: `subscription is already ${existing.status}` };
  if (eventTime.getTime() < existing.lastEventAt.getTime()) return { applied: false, note: "stale event (a newer one was already applied)" };
  await tx.subscription.update({ where: { userId }, data });
  return { applied: true };
}

async function subscriptionForInvoice(tx: Tx, subscriptionId: string | null) {
  if (!subscriptionId) return null;
  const sub = await findSubscription(tx, subscriptionId);
  if (sub) await lockUser(tx, sub.userId);
  return sub ? tx.subscription.findUnique({ where: { id: sub.id } }) : null;
}

async function applyInvoicePaid(tx: Tx, ev: Extract<BillingEvent, { kind: "invoice_paid" }>): Promise<Outcome> {
  if (!ev.subscriptionId) return { applied: false, note: "invoice is not for a subscription" };
  const sub = await subscriptionForInvoice(tx, ev.subscriptionId);
  // invoice.paid commonly races ahead of customer.subscription.created: ask the provider to retry.
  if (!sub) throw new RetryableWebhookError(`subscription ${ev.subscriptionId} is not known yet`);
  if (TERMINAL.has(sub.status)) return { applied: false, note: `subscription is already ${sub.status}` };
  const data: Prisma.SubscriptionUncheckedUpdateInput = {};
  if (ev.amountPaid > 0) data.lastPaidInvoiceId = ev.invoiceId; // only a real charge can be refunded
  if (ev.periodStart && ev.periodEnd && ev.periodStart.getTime() > sub.currentPeriodStart.getTime()) {
    // The renewal invoice can arrive before the subscription update: advance the period from the invoice itself.
    data.currentPeriodStart = ev.periodStart;
    data.currentPeriodEnd = ev.periodEnd;
  }
  const settlesDebt = (sub.status === "PAST_DUE" || sub.status === "UNPAID" || sub.status === "INCOMPLETE") && ev.amountPaid > 0 && ev.eventTime.getTime() >= sub.lastEventAt.getTime();
  if (settlesDebt) data.status = "ACTIVE";
  if (ev.eventTime.getTime() > sub.lastEventAt.getTime()) data.lastEventAt = ev.eventTime;
  if (Object.keys(data).length === 0) return { applied: false, note: "nothing to update" };
  await tx.subscription.update({ where: { id: sub.id }, data });
  return { applied: true };
}

async function applyInvoiceFailed(tx: Tx, ev: Extract<BillingEvent, { kind: "invoice_failed" }>): Promise<Outcome> {
  const sub = await subscriptionForInvoice(tx, ev.subscriptionId);
  if (!sub) throw new RetryableWebhookError(`subscription ${ev.subscriptionId ?? "?"} is not known yet`);
  if (ev.eventTime.getTime() < sub.lastEventAt.getTime()) return { applied: false, note: "stale event" };
  // Only a subscription that was in good standing becomes PAST_DUE (an INCOMPLETE first payment stays INCOMPLETE).
  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING") return { applied: false, note: `status ${sub.status} is unchanged` };
  await tx.subscription.update({ where: { id: sub.id }, data: { status: "PAST_DUE", lastEventAt: ev.eventTime } });
  return { applied: true };
}

async function applyRefund(tx: Tx, ev: Extract<BillingEvent, { kind: "refund" }>, invoiceId: string | null): Promise<Outcome> {
  if (!ev.fullyRefunded) return { applied: false, note: "partial refund: access is unchanged" };
  if (!invoiceId) return { applied: false, note: "refunded charge does not belong to a subscription invoice" };
  const sub = await tx.subscription.findFirst({ where: { lastPaidInvoiceId: invoiceId } });
  if (!sub) return { applied: false, note: "refunded invoice is not the latest paid invoice of any subscription" };
  await lockUser(tx, sub.userId);
  // Suspend paid entitlements for THIS billing period only; the next period (a new paid invoice) is unaffected.
  await tx.subscription.update({ where: { id: sub.id }, data: { revokedPeriodStart: sub.currentPeriodStart } });
  return { applied: true };
}
