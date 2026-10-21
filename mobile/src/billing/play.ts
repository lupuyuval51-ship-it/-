/**
 * Google Play Billing for the app (the only way paid features are sold there). A thin wrapper around the native billing
 * plugin: ask Play which subscription the learner has, buy Plus or Pro, restore, open Play's subscription page. Outside the
 * Android app (the browser builds used in tests) billing is simply unavailable.
 */
import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import type { PaidPlanId } from "@/config/plans";
import {
  PLAY_LIFETIME_PRODUCTS, PLAY_PRODUCTS, classifyPurchaseError, loadPlanState, planAfterRefresh, planFromPurchases, purchasesToAcknowledge, savePlanState,
  type PlanState, type PurchaseFailure, type PurchaseLike,
} from "@/lib/offline/billing-state";
import { getOfflinePlan } from "@/lib/offline/entitlement";
import { createSerialQueue } from "@/lib/offline/serial-queue";
import { verifyPurchases } from "../cloud/purchases";

/** Fired on `window` whenever the plan the phone uses may have changed. */
export const PLAN_EVENT = "levelup-plan";

export const billingAvailable = (): boolean => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

const announce = () => window.dispatchEvent(new Event(PLAN_EVENT));

/**
 * One call to the billing plugin at a time: it keeps a single billing client and every call closes the previous one, so two
 * calls at once (the plans screen asks for the purchases and the prices together, the app asks again when it comes back from
 * Play's sheet) cut each other off, and a cut-off purchase query comes back as an empty list.
 */
const inLine = createSerialQueue(60_000);
/** Play's purchase sheet can stay open for minutes; a refresh waits for it (a lost answer frees the line after this long). */
const BUY_SLOT_MS = 10 * 60_000;

/** The purchases Play lists as paid but has not got the acknowledgement for (it refunds them after 3 days). Never throws. */
async function acknowledgeAll(tokens: readonly string[]): Promise<void> {
  for (const purchaseToken of tokens) {
    try { await NativePurchases.acknowledgePurchase({ purchaseToken }); } catch { /* the next refresh tries again */ }
  }
}

/**
 * For a signed-in learner, the server asks Google about these purchases too (`verify-purchase`): its definitive answer can raise,
 * lower or end the plan Play's list gave. Not waited for, never throws; signed out, nothing is sent.
 */
type SessionLike = { user: { id: string }; access_token: string } | null;
let currentSession: () => SessionLike = () => null;
/** The app tells billing where the signed-in learner is (kept out of this module so billing never loads the account code). */
export function setSessionProvider(provider: () => SessionLike): void { currentSession = provider; }

async function checkWithServer(purchases: readonly PurchaseLike[]): Promise<void> {
  try {
    const before = getOfflinePlan();
    const s = currentSession();
    const next = await verifyPurchases(purchases, { session: s ? { userId: s.user.id, accessToken: s.access_token } : null, store: localStorage, now: Date.now() });
    if (next && next.plan !== before) announce();
  } catch { /* the plan stays as Play reported it */ }
}

/**
 * Never throws: offline keeps what was stored. Runs inside the line (callers go through `refreshPlan`, `buyPlan`, `restorePurchases`).
 * `justBought` is the purchase Play's sheet has just confirmed (`buyPlan`): the query right after a purchase can fail or be cut off
 * (the plugin then answers an empty list, or rejects), and that must never leave a learner who has just paid on Free, so the
 * confirmed purchase counts together with whatever the query lists (the best plan of both wins, as always).
 */
async function refreshNow(justBought: readonly PurchaseLike[] = []): Promise<PlanState | null> {
  try {
    const before = getOfflinePlan();
    const now = Date.now();
    let listed: readonly PurchaseLike[] = [];
    try {
      listed = (await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.SUBS })).purchases;
    } catch (err) {
      if (justBought.length === 0) throw err; // nothing certain to keep: the stored plan stays as it is
    }
    // the one-time purchases are a second list; a failed query leaves them out (the stored plan then still runs, see planAfterRefresh)
    try {
      listed = [...listed, ...(await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP })).purchases];
    } catch { /* kept as it is */ }
    const purchases = [...listed, ...justBought];
    const state = planAfterRefresh(loadPlanState(localStorage), planFromPurchases(purchases, now), now);
    savePlanState(localStorage, state);
    if (state.plan !== before) announce();
    void checkWithServer(purchases);
    // the plugin acknowledges a new purchase without waiting for Play's answer: make sure it arrived (not waited for here)
    const unacknowledged = purchasesToAcknowledge(purchases);
    if (unacknowledged.length > 0) void inLine(() => acknowledgeAll(unacknowledged));
    return state;
  } catch {
    return null;
  }
}

/** Asks Play for the learner's purchases and keeps the answer on the phone. Never throws: offline keeps what was stored. */
export async function refreshPlan(): Promise<PlanState | null> {
  if (!billingAvailable()) return null;
  return inLine(refreshNow);
}

export type BuyResult = { ok: true } | { ok: false; reason: "UNAVAILABLE" | "SUBSCRIBED" | "OWNED" | PurchaseFailure };

/** How a plan is bought: the monthly subscription, or once and for good. */
export type BuyKind = "monthly" | "lifetime";

const RANK: Record<string, number> = { FREE: 0, PLUS: 1, PRO: 2 };

/**
 * Starts Play's purchase sheet for a plan; on success the new plan is read back from Play, counting the purchase the sheet itself
 * confirmed (the plugin resolves only for a paid purchase, state "1"; pending and everything else reject). Plus and Pro are two
 * separate Play subscriptions and the plugin cannot replace one with the other, so a learner who already has a plan is not sold a
 * second one (it would be billed next to the first): `SUBSCRIBED` sends them to Play's own subscription page instead.
 * The one-time purchase (`lifetime`) is billed once, so a learner may buy it for a plan higher than the one they have (Plus, then
 * Pro for good); a plan they already have or a lower one is `OWNED`.
 */
export async function buyPlan(plan: PaidPlanId, kind: BuyKind = "monthly"): Promise<BuyResult> {
  if (!billingAvailable()) return { ok: false, reason: "UNAVAILABLE" };
  const { productId, basePlanId } = PLAY_PRODUCTS[plan];
  return inLine(async (): Promise<BuyResult> => {
    const have = getOfflinePlan();
    if (kind === "lifetime" ? (RANK[have] ?? 0) >= RANK[plan]! : have !== "FREE") return { ok: false, reason: kind === "lifetime" ? "OWNED" : "SUBSCRIBED" };
    let bought: PurchaseLike | null;
    try {
      bought = kind === "lifetime"
        ? await NativePurchases.purchaseProduct({ productIdentifier: PLAY_LIFETIME_PRODUCTS[plan], productType: PURCHASE_TYPE.INAPP })
        : await NativePurchases.purchaseProduct({ productIdentifier: productId, planIdentifier: basePlanId, productType: PURCHASE_TYPE.SUBS });
    } catch (err) {
      return { ok: false, reason: classifyPurchaseError(err) };
    }
    await refreshNow(bought && typeof bought === "object" ? [bought] : []);
    announce();
    return { ok: true };
  }, BUY_SLOT_MS);
}

export async function restorePurchases(): Promise<boolean> {
  if (!billingAvailable()) return false;
  return inLine(async () => {
    try { await NativePurchases.restorePurchases(); } catch { /* the query below is what counts */ }
    return (await refreshNow()) !== null;
  });
}

/** Play's own page where the learner can change or cancel the subscription. */
export async function manageSubscription(): Promise<void> {
  if (!billingAvailable()) return;
  try { await NativePurchases.manageSubscriptions(); } catch { /* nothing to do */ }
}

/** The price Play will charge (in the learner's own currency), when Play can tell. */
export async function playPrices(): Promise<Partial<Record<PaidPlanId, string>>> {
  if (!billingAvailable()) return {};
  return inLine(async () => {
    const out: Partial<Record<PaidPlanId, string>> = {};
    try {
      const { products } = await NativePurchases.getProducts({ productIdentifiers: Object.values(PLAY_PRODUCTS).map((p) => p.productId), productType: PURCHASE_TYPE.SUBS });
      for (const [plan, { productId }] of Object.entries(PLAY_PRODUCTS) as [PaidPlanId, { productId: string }][]) {
        const p = products.find((x) => x.identifier === productId);
        if (p?.priceString) out[plan] = p.priceString;
      }
    } catch { /* the configured price is shown instead */ }
    return out;
  });
}

/** The one-time price Play will charge, when Play can tell (the configured price is shown otherwise). */
export async function playLifetimePrices(): Promise<Partial<Record<PaidPlanId, string>>> {
  if (!billingAvailable()) return {};
  return inLine(async () => {
    const out: Partial<Record<PaidPlanId, string>> = {};
    try {
      const { products } = await NativePurchases.getProducts({ productIdentifiers: Object.values(PLAY_LIFETIME_PRODUCTS), productType: PURCHASE_TYPE.INAPP });
      for (const [plan, productId] of Object.entries(PLAY_LIFETIME_PRODUCTS) as [PaidPlanId, string][]) {
        const p = products.find((x) => x.identifier === productId);
        if (p?.priceString) out[plan] = p.priceString;
      }
    } catch { /* the configured price is shown instead */ }
    return out;
  });
}
