/**
 * What the phone does with the server's check of its Google Play purchases (the Edge Function `verify-purchase`, see
 * `src/server/play/verify.ts`). Pure functions over plain values, so they are unit-tested; `mobile/src/cloud/purchases.ts`
 * does the request.
 *
 * Only a signed-in learner is checked (a signed-out phone makes no network request at all). The server's answer can only
 * ever be applied when it is `definitive`; a failed request, a server that is not set up yet or any other doubt leaves the
 * plan exactly as Play reported it, so a learner who paid is never put on Free by a server hiccup.
 */
import { PAID_PLAN_IDS, type PaidPlanId } from "../../config/plans";
import { LIFETIME_RECHECK_MS, PLAY_LIFETIME_PRODUCTS, PLAY_PRODUCTS, type KeyValue, type PlanState, type PurchaseLike } from "./billing-state";

const KEY = "levelup.plan.verified.v1";
/** The same purchases of the same account are asked about again after this long (a refund or an end shows up then). */
export const VERIFY_EVERY_MS = 6 * 3_600_000;
/** The most the server takes in one request (`MAX_TOKENS` in `src/server/play/verify.ts`). */
export const MAX_PURCHASES = 6;

export interface SentPurchase { productId: string; purchaseToken: string }

/** The server's answer (the part the phone uses). */
export interface ServerVerdict {
  plan: "FREE" | PaidPlanId;
  expiresAt: number | null;
  definitive: boolean;
  verifiedAt: number;
}

const OURS = new Set<string>([...PAID_PLAN_IDS.map((p) => PLAY_PRODUCTS[p].productId), ...PAID_PLAN_IDS.map((p) => PLAY_LIFETIME_PRODUCTS[p])]);

/** The purchases worth asking the server about: ours, paid ("1"), not revoked, with a token; no token twice. */
export function purchasesToVerify(purchases: readonly PurchaseLike[]): SentPurchase[] {
  const out: SentPurchase[] = [];
  for (const p of purchases) {
    if (!OURS.has(p.productIdentifier) || p.revocationDate || (p.purchaseState !== "1" && p.isActive !== true)) continue;
    const token = p.purchaseToken;
    if (typeof token !== "string" || !token || out.some((o) => o.purchaseToken === token)) continue;
    out.push({ productId: p.productIdentifier, purchaseToken: token });
  }
  return out.slice(0, MAX_PURCHASES);
}

/** Reads the server's JSON; anything that is not a verdict is null. */
export function parseVerdict(v: unknown): ServerVerdict | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (o.plan !== "FREE" && o.plan !== "PLUS" && o.plan !== "PRO") return null;
  if (typeof o.definitive !== "boolean" || typeof o.verifiedAt !== "number" || !Number.isFinite(o.verifiedAt)) return null;
  const expiresAt = typeof o.expiresAt === "number" && Number.isFinite(o.expiresAt) ? o.expiresAt : null;
  return { plan: o.plan, expiresAt, definitive: o.definitive, verifiedAt: o.verifiedAt };
}

/**
 * The plan to keep after the server's answer. A definitive answer is the truth about these purchases (Google's own): it
 * raises, lowers or ends the plan Play's list gave; the end of a subscription is Google's date, a one-time purchase is asked
 * again a year later. An answer that is not definitive changes nothing.
 */
export function stateAfterVerdict(current: PlanState | null, verdict: ServerVerdict, now: number): PlanState | null {
  if (!verdict.definitive) return current;
  if (verdict.plan === "FREE") return { plan: "FREE", expiresAt: null, checkedAt: now };
  return { plan: verdict.plan, expiresAt: verdict.expiresAt ?? now + LIFETIME_RECHECK_MS, checkedAt: now };
}

/** Identifies what was asked: the account and the purchases (the token itself is kept out of storage). */
export function verifyKey(userId: string, sent: readonly SentPurchase[]): string {
  const tokens = sent.map((s) => s.purchaseToken).sort();
  let h = 5381;
  for (const t of tokens) for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return `${userId}:${tokens.length}:${(h >>> 0).toString(36)}`;
}

/** Whether the server should be asked now: other account or other purchases than last time, or the last answer is old. */
export function shouldVerify(store: KeyValue, key: string, now: number): boolean {
  try {
    const raw = store.getItem(KEY);
    const last = raw ? (JSON.parse(raw) as { key?: unknown; at?: unknown }) : null;
    return !(last && last.key === key && typeof last.at === "number" && now - last.at < VERIFY_EVERY_MS && now >= last.at);
  } catch {
    return true;
  }
}

export function markVerified(store: KeyValue, key: string, now: number): void {
  try { store.setItem(KEY, JSON.stringify({ key, at: now })); } catch { /* the server is asked again at the next start */ }
}
