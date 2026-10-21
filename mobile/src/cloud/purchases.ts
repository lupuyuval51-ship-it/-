/**
 * Asks the server (Edge Function `verify-purchase` in the account project) whether the purchases Google Play listed are real,
 * for a signed-in learner only: a signed-out phone makes no network request. The answer is Google's own, relayed by the server;
 * it can raise, lower or end the plan (see `src/lib/offline/billing-verify.ts`) and is ignored whenever it is in doubt.
 * Never throws and never blocks the app: offline, or with the server not set up yet, the plan stays as Play reported it.
 */
import { loadPlanState, savePlanState, type KeyValue, type PlanState, type PurchaseLike } from "@/lib/offline/billing-state";
import { markVerified, parseVerdict, purchasesToVerify, shouldVerify, stateAfterVerdict, verifyKey } from "@/lib/offline/billing-verify";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

const TIMEOUT_MS = 12_000;

export interface VerifyContext {
  /** The signed-in learner, or null (nothing is sent then). */
  session: { userId: string; accessToken: string } | null;
  store: KeyValue;
  now: number;
  fetchImpl?: typeof fetch;
}

/**
 * Returns the plan state the server's answer leads to, or null when nothing was decided (signed out, nothing to ask,
 * asked recently, offline, an error, an answer in doubt).
 */
export async function verifyPurchases(purchases: readonly PurchaseLike[], ctx: VerifyContext): Promise<PlanState | null> {
  if (!ctx.session) return null;
  const sent = purchasesToVerify(purchases);
  if (sent.length === 0) return null;
  const key = verifyKey(ctx.session.userId, sent);
  if (!shouldVerify(ctx.store, key, ctx.now)) return null;
  try {
    const res = await (ctx.fetchImpl ?? fetch)(`${SUPABASE_URL}/functions/v1/verify-purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ctx.session.accessToken}`, apikey: SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ purchases: sent }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const verdict = parseVerdict(await res.json().catch(() => null));
    if (!verdict) return null;
    // asked and answered: not again for a while, whatever the answer was (a doubtful one is retried by the next trigger after that)
    markVerified(ctx.store, key, ctx.now);
    const next = stateAfterVerdict(loadPlanState(ctx.store), verdict, ctx.now);
    if (!next || !verdict.definitive) return null;
    savePlanState(ctx.store, next);
    return next;
  } catch {
    return null;
  }
}
