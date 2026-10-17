import "server-only";
import { PLANS, calendarMonthUtc, type PlanId } from "@/config/plans";
import { db, type Tx } from "../db";
import { plansEnabled } from "../env";

/**
 * Paid access stays valid for this long after `currentPeriodEnd` while the subscription is still ACTIVE, which
 * covers short renewal-webhook delays. It never extends access for PAST_DUE / UNPAID / CANCELED subscriptions.
 */
export const ENTITLEMENT_GRACE_MS = 48 * 3600 * 1000;

export type EntitlementSource = "FREE" | "SUBSCRIPTION";

export interface Entitlement {
  plan: PlanId;
  source: EntitlementSource;
  periodStart: Date;
  periodEnd: Date;
  /** The plan's allowance budget in POINTS (each game costs points by level: PLANS[plan].allowance). */
  limit: number;
  subscriptionId: string | null;
}

export interface SubscriptionFacts {
  id: string;
  plan: PlanId;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  revokedPeriodStart: Date | null;
}

/** Does this subscription currently entitle its owner to the paid plan? (pure, easily unit-tested) */
export function subscriptionGrantsAccess(sub: SubscriptionFacts | null, now: Date): boolean {
  if (!sub || sub.plan === "FREE") return false;
  // Only fully paid states grant entitlements. PAST_DUE (failed renewal), UNPAID, CANCELED, INCOMPLETE,
  // INCOMPLETE_EXPIRED and PAUSED all fall back to FREE until a payment succeeds.
  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING") return false;
  // A fully refunded invoice suspends access for that billing period only.
  if (sub.revokedPeriodStart && sub.revokedPeriodStart.getTime() === sub.currentPeriodStart.getTime()) return false;
  return now.getTime() < sub.currentPeriodEnd.getTime() + ENTITLEMENT_GRACE_MS;
}

export function computeEntitlement(sub: SubscriptionFacts | null, now: Date): Entitlement {
  if (!plansEnabled()) {
    // Plans are switched off: everybody has the full product (a fair-use monthly allowance, no subscription, no plan shown).
    const { start, end } = calendarMonthUtc(now);
    return { plan: "PRO", source: "FREE", periodStart: start, periodEnd: end, limit: PLANS.PRO.allowance.budget, subscriptionId: null };
  }
  if (sub && subscriptionGrantsAccess(sub, now)) {
    return {
      plan: sub.plan,
      source: "SUBSCRIPTION",
      periodStart: sub.currentPeriodStart,
      periodEnd: sub.currentPeriodEnd,
      limit: PLANS[sub.plan].allowance.budget,
      subscriptionId: sub.id,
    };
  }
  const { start, end } = calendarMonthUtc(now);
  return { plan: "FREE", source: "FREE", periodStart: start, periodEnd: end, limit: PLANS.FREE.allowance.budget, subscriptionId: null };
}

/** The user's current entitlement, derived from persisted subscription state only (never from the client). */
export async function resolveEntitlement(userId: string, now = new Date(), client: Tx | typeof db = db): Promise<Entitlement> {
  const sub = await client.subscription.findUnique({ where: { userId } });
  return computeEntitlement(sub, now);
}
