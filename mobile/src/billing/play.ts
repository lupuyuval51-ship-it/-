/**
 * Google Play Billing for the app (the only way paid features are sold there). A thin wrapper around the native billing
 * plugin: ask Play which subscription the learner has, buy Plus or Pro, restore, open Play's subscription page. Outside the
 * Android app (the browser builds used in tests) billing is simply unavailable.
 */
import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import type { PaidPlanId } from "@/config/plans";
import { PLAY_PRODUCTS, planFromPurchases, savePlanState, type PlanState } from "@/lib/offline/billing-state";
import { getOfflinePlan } from "@/lib/offline/entitlement";

/** Fired on `window` whenever the plan the phone uses may have changed. */
export const PLAN_EVENT = "levelup-plan";

export const billingAvailable = (): boolean => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

const announce = () => window.dispatchEvent(new Event(PLAN_EVENT));

/** Asks Play for the learner's purchases and keeps the answer on the phone. Never throws: offline keeps what was stored. */
export async function refreshPlan(): Promise<PlanState | null> {
  if (!billingAvailable()) return null;
  try {
    const before = getOfflinePlan();
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS });
    const state = planFromPurchases(purchases, Date.now());
    savePlanState(localStorage, state);
    if (state.plan !== before) announce();
    return state;
  } catch {
    return null;
  }
}

export type BuyResult = { ok: true } | { ok: false; reason: "UNAVAILABLE" | "CANCELLED" | "FAILED" };

/** Starts Play's purchase sheet for a plan; on success the new plan is read back from Play. */
export async function buyPlan(plan: PaidPlanId): Promise<BuyResult> {
  if (!billingAvailable()) return { ok: false, reason: "UNAVAILABLE" };
  const { productId, basePlanId } = PLAY_PRODUCTS[plan];
  try {
    await NativePurchases.purchaseProduct({ productIdentifier: productId, planIdentifier: basePlanId, productType: PURCHASE_TYPE.SUBS });
  } catch (err) {
    const text = String((err as { message?: unknown })?.message ?? err).toLowerCase();
    return { ok: false, reason: /cancel|user_cancel|usercancel/.test(text) ? "CANCELLED" : "FAILED" };
  }
  await refreshPlan();
  announce();
  return { ok: true };
}

export async function restorePurchases(): Promise<boolean> {
  if (!billingAvailable()) return false;
  try { await NativePurchases.restorePurchases(); } catch { /* the query below is what counts */ }
  return (await refreshPlan()) !== null;
}

/** Play's own page where the learner can change or cancel the subscription. */
export async function manageSubscription(): Promise<void> {
  if (!billingAvailable()) return;
  try { await NativePurchases.manageSubscriptions(); } catch { /* nothing to do */ }
}

/** The price Play will charge (in the learner's own currency), when Play can tell. */
export async function playPrices(): Promise<Partial<Record<PaidPlanId, string>>> {
  if (!billingAvailable()) return {};
  const out: Partial<Record<PaidPlanId, string>> = {};
  try {
    const { products } = await NativePurchases.getProducts({ productIdentifiers: Object.values(PLAY_PRODUCTS).map((p) => p.productId), productType: PURCHASE_TYPE.SUBS });
    for (const [plan, { productId }] of Object.entries(PLAY_PRODUCTS) as [PaidPlanId, { productId: string }][]) {
      const p = products.find((x) => x.identifier === productId);
      if (p?.priceString) out[plan] = p.priceString;
    }
  } catch { /* the configured price is shown instead */ }
  return out;
}
