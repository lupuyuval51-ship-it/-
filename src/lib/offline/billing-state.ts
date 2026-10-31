/**
 * What the phone knows about the learner's subscription: the plan Google Play reported last time, kept on the device so
 * the app works offline. Pure functions over a plain key/value store, so they are unit-tested; the app's Play Billing
 * wrapper (`mobile/src/billing/play.ts`) fills it from Google Play. Paid features there use Google Play Billing only.
 */
import { PAID_PLAN_IDS, isPlanId, type PaidPlanId, type PlanId } from "../../config/plans";

/** The subscription products created in the Play Console (one subscription each, with a monthly base plan). */
export const PLAY_PRODUCTS: Readonly<Record<PaidPlanId, { productId: string; basePlanId: string }>> = Object.freeze({
  PLUS: { productId: "levelup_plus", basePlanId: "monthly" },
  PRO: { productId: "levelup_pro", basePlanId: "monthly" },
});

/** The one-time ("for good") products: in-app products with no base plan, bought once and kept. */
export const PLAY_LIFETIME_PRODUCTS: Readonly<Record<PaidPlanId, string>> = Object.freeze({ PLUS: "levelup_plus_lifetime", PRO: "levelup_pro_lifetime" });

/**
 * A one-time purchase has no end date, but Play is asked again at every start: a refunded one is gone from the list, and the
 * phone keeps the plan this long after the last time Play confirmed it (a year offline is more than a phone is ever away).
 */
export const LIFETIME_RECHECK_MS = 365 * 86_400_000;

const KEY = "levelup.plan.v1";
/**
 * A subscription that Play has not confirmed again keeps working this long after its expiry (offline, renewal delayed).
 * Play on Android gives no expiry date: the stored expiry is then the moment Play last confirmed the plan, so it keeps
 * working this long after the last confirmation.
 */
export const PLAN_GRACE_MS = 3 * 86_400_000;

export interface PlanState {
  plan: PlanId;
  /** Epoch ms the paid period ends (null for Free). */
  expiresAt: number | null;
  /** Epoch ms of the last time Play confirmed it. */
  checkedAt: number;
}

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * A purchase as Play reports it (the fields of the billing plugin's transaction that matter here). On Android the plugin
 * gives neither `isActive` nor `expirationDate`: a paid purchase has `purchaseState` "1" ("2" is pending, "0" unknown),
 * and `isAcknowledged` says whether Play has the acknowledgement it needs (without it Play refunds after 3 days).
 */
export interface PurchaseLike {
  productIdentifier: string;
  isActive?: boolean;
  expirationDate?: string;
  purchaseState?: string;
  revocationDate?: string;
  purchaseToken?: string;
  isAcknowledged?: boolean;
}

const planOfProduct = (productId: string): PaidPlanId | null =>
  PAID_PLAN_IDS.find((p) => PLAY_PRODUCTS[p].productId === productId || PLAY_LIFETIME_PRODUCTS[p] === productId) ?? null;
const isLifetime = (productId: string): boolean => PAID_PLAN_IDS.some((p) => PLAY_LIFETIME_PRODUCTS[p] === productId);

/** The best paid plan among the purchases that are still running at `now` (Pro over Plus, a subscription or a one-time purchase), or Free. */
export function planFromPurchases(purchases: readonly PurchaseLike[], now: number): PlanState {
  let best: PlanState = { plan: "FREE", expiresAt: null, checkedAt: now };
  for (const p of purchases) {
    const plan = planOfProduct(p.productIdentifier);
    if (!plan || p.revocationDate) continue;
    if (isLifetime(p.productIdentifier)) {
      // bought once: running while Play lists it as paid (it lists no refunded one); the stored plan is re-checked a year on
      if (p.isActive === true || p.purchaseState === "1") {
        const expiresAt = now + LIFETIME_RECHECK_MS;
        if ((plan === "PRO" ? 2 : plan === "PLUS" ? 1 : 0) > (best.plan === "PRO" ? 2 : best.plan === "PLUS" ? 1 : 0) || (plan === best.plan && (best.expiresAt ?? 0) < expiresAt)) best = { plan, expiresAt, checkedAt: now };
      }
      continue;
    }
    const expires = p.expirationDate ? Date.parse(p.expirationDate) : NaN;
    const dated = Number.isFinite(expires);
    // Android (no isActive, no expiry): Play lists only subscriptions that are still running, and a paid one is purchaseState "1".
    const running = p.isActive === true || (dated && expires > now) || (!dated && p.purchaseState === "1");
    if (!running) continue;
    // Without an expiry the plan is known to run until now; `effectivePlan` adds the grace once.
    const expiresAt = dated ? expires : now;
    const rank = (x: PlanId) => (x === "PRO" ? 2 : x === "PLUS" ? 1 : 0);
    if (rank(plan) > rank(best.plan) || (plan === best.plan && (best.expiresAt ?? 0) < expiresAt)) best = { plan, expiresAt, checkedAt: now };
  }
  return best;
}

/**
 * The tokens of our subscriptions that Play lists as paid ("1") but not acknowledged yet. The plugin acknowledges right after
 * a purchase without waiting for Play's answer, so this is the safety net: Play refunds what stays unacknowledged for 3 days.
 */
export function purchasesToAcknowledge(purchases: readonly PurchaseLike[]): string[] {
  const out: string[] = [];
  for (const p of purchases) {
    if (!planOfProduct(p.productIdentifier) || p.revocationDate || p.purchaseState !== "1" || p.isAcknowledged !== false) continue;
    if (typeof p.purchaseToken === "string" && p.purchaseToken && !out.includes(p.purchaseToken)) out.push(p.purchaseToken);
  }
  return out;
}

/**
 * What to keep after asking Play. An empty answer is also what the plugin returns when its query failed (it only logs the
 * error), so it never takes a paid plan away while the stored one still runs (its expiry plus the grace); after that the
 * stored plan is Free anyway. A non-empty answer always replaces what was stored.
 */
export function planAfterRefresh(stored: PlanState | null, fresh: PlanState, now: number): PlanState {
  if (fresh.plan === "FREE" && stored && stored.plan !== "FREE" && effectivePlan(stored, now) === stored.plan) return stored;
  return fresh;
}

export type PurchaseFailure = "CANCELLED" | "PENDING" | "FAILED";

/**
 * Why a purchase did not complete. The plugin rejects with fixed texts, not Play's response code: "Purchase is not purchased"
 * for every answer that is not OK (closing Play's sheet is USER_CANCELED) and "Purchase is pending" while the payment is still
 * being confirmed (it may be charged later).
 */
export function classifyPurchaseError(err: unknown): PurchaseFailure {
  const text = String((err as { message?: unknown })?.message ?? err).toLowerCase();
  if (text.includes("pending")) return "PENDING";
  return /cancel|not purchased/.test(text) ? "CANCELLED" : "FAILED";
}

export function sanitizePlanState(v: unknown): PlanState | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!isPlanId(o.plan) || typeof o.checkedAt !== "number" || !Number.isFinite(o.checkedAt)) return null;
  const expiresAt = typeof o.expiresAt === "number" && Number.isFinite(o.expiresAt) ? o.expiresAt : null;
  return { plan: o.plan, expiresAt, checkedAt: o.checkedAt };
}

export function loadPlanState(store: KeyValue): PlanState | null {
  try {
    const raw = store.getItem(KEY);
    return raw ? sanitizePlanState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function savePlanState(store: KeyValue, state: PlanState): void {
  try { store.setItem(KEY, JSON.stringify(state)); } catch { /* optional: Play is asked again at the next start */ }
}

/** The plan to use at `now`: the stored one while it runs (plus the grace), else Free; `null` when nothing was ever stored. */
export function effectivePlan(state: PlanState | null, now: number): PlanId | null {
  if (!state) return null;
  if (state.plan === "FREE") return "FREE";
  return state.expiresAt !== null && now <= state.expiresAt + PLAN_GRACE_MS ? state.plan : "FREE";
}
