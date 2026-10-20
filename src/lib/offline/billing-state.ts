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

const KEY = "levelup.plan.v1";
/** A subscription that Play has not confirmed again keeps working this long after its expiry (offline, renewal delayed). */
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

/** A purchase as Play reports it (the fields of the billing plugin's transaction that matter here). */
export interface PurchaseLike {
  productIdentifier: string;
  isActive?: boolean;
  expirationDate?: string;
  purchaseState?: string;
  revocationDate?: string;
}

const planOfProduct = (productId: string): PaidPlanId | null => PAID_PLAN_IDS.find((p) => PLAY_PRODUCTS[p].productId === productId) ?? null;

/** The best paid plan among the purchases that are still running at `now` (Pro over Plus), or Free. */
export function planFromPurchases(purchases: readonly PurchaseLike[], now: number): PlanState {
  let best: PlanState = { plan: "FREE", expiresAt: null, checkedAt: now };
  for (const p of purchases) {
    const plan = planOfProduct(p.productIdentifier);
    if (!plan || p.revocationDate) continue;
    const expires = p.expirationDate ? Date.parse(p.expirationDate) : NaN;
    const running = p.isActive === true || (Number.isFinite(expires) && expires > now);
    if (!running) continue;
    const expiresAt = Number.isFinite(expires) ? expires : now + PLAN_GRACE_MS;
    const rank = (x: PlanId) => (x === "PRO" ? 2 : x === "PLUS" ? 1 : 0);
    if (rank(plan) > rank(best.plan) || (plan === best.plan && (best.expiresAt ?? 0) < expiresAt)) best = { plan, expiresAt, checkedAt: now };
  }
  return best;
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
