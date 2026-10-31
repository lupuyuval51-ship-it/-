import { z } from "zod";

/**
 * Provider-neutral billing events.
 *
 * Both the real Stripe webhook and the development simulator produce Stripe-SHAPED event JSON. It is verified
 * (Stripe signature or dev HMAC), parsed here with strict schemas of just the fields we read, and normalised to
 * `BillingEvent`. Everything after this point (idempotency, ordering, state transitions) is one shared code path.
 */

export type SubStatus = "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "PAUSED";

const STATUS_MAP: Record<string, SubStatus> = {
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
  paused: "PAUSED",
};

export interface SubscriptionSnapshot {
  subscriptionId: string;
  customerId: string;
  /** Our own user id, set by us in metadata when the checkout was created. */
  userId: string | null;
  plan: string | null;
  status: SubStatus;
  currency: string | null;
  unitAmount: number | null;
  periodStart: Date;
  periodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
}

export type BillingEvent = { eventId: string; eventTime: Date; type: string } & (
  | { kind: "subscription"; snapshot: SubscriptionSnapshot; deleted: boolean }
  | { kind: "invoice_paid"; invoiceId: string; subscriptionId: string | null; amountPaid: number; periodStart: Date | null; periodEnd: Date | null }
  | { kind: "invoice_failed"; invoiceId: string; subscriptionId: string | null }
  | { kind: "refund"; chargeId: string; paymentIntentId: string | null; invoiceId: string | null; fullyRefunded: boolean }
  | { kind: "ignored"; reason: string }
);

const id = z.union([z.string().min(1), z.object({ id: z.string().min(1) })]).transform((v) => (typeof v === "string" ? v : v.id));
const ts = z.number().int().nonnegative();

const priceSchema = z.object({ unit_amount: z.number().int().nullable().optional(), currency: z.string().optional() }).passthrough();
const subscriptionSchema = z
  .object({
    id: z.string().min(1),
    customer: id,
    status: z.string(),
    cancel_at_period_end: z.boolean().default(false),
    canceled_at: ts.nullable().optional(),
    metadata: z.record(z.string(), z.string()).default({}),
    // Newer API versions put the period on the item, older ones on the subscription.
    current_period_start: ts.optional(),
    current_period_end: ts.optional(),
    items: z.object({
      data: z.array(z.object({ price: priceSchema, current_period_start: ts.optional(), current_period_end: ts.optional() }).passthrough()).min(1),
    }),
  })
  .passthrough();

const invoiceSchema = z
  .object({
    id: z.string().min(1),
    amount_paid: z.number().int().default(0),
    period_start: ts.optional(),
    period_end: ts.optional(),
    lines: z.object({ data: z.array(z.object({ period: z.object({ start: ts, end: ts }).optional() }).passthrough()) }).optional(),
    parent: z.object({ subscription_details: z.object({ subscription: id }).nullable().optional() }).nullable().optional(),
    subscription: id.nullable().optional(), // older API versions
  })
  .passthrough();

const chargeSchema = z
  .object({
    id: z.string().min(1),
    amount: z.number().int(),
    amount_refunded: z.number().int(),
    refunded: z.boolean().optional(),
    payment_intent: id.nullable().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

const envelopeSchema = z.object({ id: z.string().min(1).max(255), type: z.string().min(1).max(120), created: ts, data: z.object({ object: z.unknown() }) });

const date = (s: number) => new Date(s * 1000);

export function parseSubscription(raw: unknown): SubscriptionSnapshot {
  const s = subscriptionSchema.parse(raw);
  const item = s.items.data[0]!;
  const start = item.current_period_start ?? s.current_period_start;
  const end = item.current_period_end ?? s.current_period_end;
  if (start === undefined || end === undefined) throw new Error("subscription has no billing period");
  const status = STATUS_MAP[s.status];
  if (!status) throw new Error(`unknown subscription status "${s.status}"`);
  return {
    subscriptionId: s.id,
    customerId: s.customer,
    userId: s.metadata.userId ?? null,
    plan: s.metadata.plan ?? null,
    status,
    currency: item.price.currency?.toLowerCase() ?? null,
    unitAmount: item.price.unit_amount ?? null,
    periodStart: date(start),
    periodEnd: date(end),
    cancelAtPeriodEnd: s.cancel_at_period_end,
    canceledAt: s.canceled_at ? date(s.canceled_at) : null,
  };
}

/** Turn a verified Stripe-shaped event into a normalised one. Unsupported event types become `ignored`, never an error. */
export function parseStripeEvent(raw: unknown): BillingEvent {
  const env = envelopeSchema.parse(raw);
  const base = { eventId: env.id, eventTime: date(env.created), type: env.type };
  const obj = env.data.object;
  switch (env.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      return { ...base, kind: "subscription", snapshot: parseSubscription(obj), deleted: false };
    case "customer.subscription.deleted": {
      const snapshot = parseSubscription(obj);
      return { ...base, kind: "subscription", snapshot: { ...snapshot, status: "CANCELED" }, deleted: true };
    }
    case "invoice.paid": {
      const inv = invoiceSchema.parse(obj);
      const line = inv.lines?.data.find((l) => l.period)?.period;
      return {
        ...base,
        kind: "invoice_paid",
        invoiceId: inv.id,
        subscriptionId: inv.parent?.subscription_details?.subscription ?? inv.subscription ?? null,
        amountPaid: inv.amount_paid,
        periodStart: line ? date(line.start) : null,
        periodEnd: line ? date(line.end) : null,
      };
    }
    case "invoice.payment_failed": {
      const inv = invoiceSchema.parse(obj);
      return { ...base, kind: "invoice_failed", invoiceId: inv.id, subscriptionId: inv.parent?.subscription_details?.subscription ?? inv.subscription ?? null };
    }
    case "charge.refunded": {
      const ch = chargeSchema.parse(obj);
      const fully = (ch.refunded ?? false) && ch.amount_refunded >= ch.amount && ch.amount > 0;
      return { ...base, kind: "refund", chargeId: ch.id, paymentIntentId: ch.payment_intent ?? null, invoiceId: ch.metadata?.invoiceId ?? null, fullyRefunded: fully };
    }
    default:
      return { ...base, kind: "ignored", reason: "event type is not used" };
  }
}

// ───────────────────────────── event builders (dev simulator and tests) ─────────────────────────────

export interface SimSubscription {
  subscriptionId: string;
  customerId: string;
  userId: string;
  plan: string;
  status: "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused" | "incomplete_expired";
  currency: string;
  unitAmount: number;
  periodStart: Date;
  periodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
}

const secs = (d: Date) => Math.floor(d.getTime() / 1000);

export function subscriptionObject(s: SimSubscription) {
  return {
    id: s.subscriptionId,
    object: "subscription",
    customer: s.customerId,
    status: s.status,
    cancel_at_period_end: s.cancelAtPeriodEnd ?? false,
    canceled_at: s.canceledAt ? secs(s.canceledAt) : null,
    metadata: { userId: s.userId, plan: s.plan },
    items: { data: [{ price: { unit_amount: s.unitAmount, currency: s.currency }, current_period_start: secs(s.periodStart), current_period_end: secs(s.periodEnd) }] },
  };
}

export function invoiceObject(args: { invoiceId: string; subscriptionId: string; customerId: string; amountPaid: number; periodStart: Date; periodEnd: Date }) {
  return {
    id: args.invoiceId,
    object: "invoice",
    customer: args.customerId,
    amount_paid: args.amountPaid,
    period_start: secs(args.periodStart),
    period_end: secs(args.periodEnd),
    lines: { data: [{ period: { start: secs(args.periodStart), end: secs(args.periodEnd) } }] },
    parent: { type: "subscription_details", subscription_details: { subscription: args.subscriptionId } },
  };
}

export function chargeObject(args: { chargeId: string; invoiceId: string; amount: number; amountRefunded: number; paymentIntentId: string }) {
  return {
    id: args.chargeId,
    object: "charge",
    amount: args.amount,
    amount_refunded: args.amountRefunded,
    refunded: args.amountRefunded >= args.amount,
    payment_intent: args.paymentIntentId,
    // Real Stripe charges do not carry the invoice id; the simulator adds it so the gateway can resolve it offline.
    metadata: { invoiceId: args.invoiceId },
  };
}

export function stripeEvent(eventId: string, type: string, created: Date, object: unknown) {
  return { id: eventId, object: "event", api_version: "simulated", created: secs(created), type, data: { object } };
}
