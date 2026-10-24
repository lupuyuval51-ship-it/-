import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Arrow, Button, Card } from "@/components/ui";
import { planHasTierA, planPriceText, topicsOpen } from "@/components/pricing/PlanPrice";
import { APP_LIFETIME_PRICES_ILS, APP_TRACKS, PAID_PLAN_IDS, PLAN_IDS, formatMoney, type PaidPlanId, type PlanId } from "@/config/plans";
import type { DictKey } from "@/lib/i18n";
import { getOfflinePlan, type OfflinePlan } from "@/lib/offline/entitlement";
import { PLAN_EVENT, billingAvailable, buyPlan, manageSubscription, playLifetimePrices, playPrices, refreshPlan, restorePurchases, type BuyKind, type BuyResult } from "../billing/play";

/**
 * The plans and their prices, and the way to buy: Google Play Billing (the only payment an app from Google Play may use).
 * Prices are in shekels from src/config/plans.ts (Play shows the learner its own final price on the purchase sheet; when Play
 * can tell the price it is shown instead); the offer is the number of library topics per half-year (`APP_TRACKS`).
 */
/** What a plan gives in the app: library topics per half-year (`APP_TRACKS`), not the website's games per level. */
export function tracksText(t: ReturnType<typeof useT>, id: PlanId): string {
  return APP_TRACKS[id] === 1 ? t("mob.plans.tracks.one") : t("mob.plans.tracks.many", { n: APP_TRACKS[id] });
}

/** Where the topics of the line above come from: in the app a plan opens a part of the library, and the learner picks the plan's topics there. */
export function chooseFrom(t: ReturnType<typeof useT>, id: PlanId): string {
  const { open, total } = topicsOpen(id);
  return open === total ? t("mob.plans.choose.all", { n: total }) : t("mob.plans.choose.some", { n: open, total });
}

/** The one line the screen says after the learner bought or restored (`UNREACHABLE`: Play could not be asked). */
export type PlansMessage = "BOUGHT" | "CANCELLED" | "PENDING" | "SUBSCRIBED" | "OWNED" | "FAILED" | "RESTORED" | "NOTHING" | "UNREACHABLE";

/**
 * After Play's purchase sheet. What counts is the plan the phone now uses: a purchase whose answer could not be read as a paid plan
 * yet is "waiting for Google Play" (the next refresh turns it on), never "Your plan is on" next to "Your plan: Free". No billing in
 * this build says nothing here (the screen already explains it).
 */
export function messageAfterBuy(res: BuyResult, plan: OfflinePlan): PlansMessage | null {
  if (res.ok) return plan !== "FREE" ? "BOUGHT" : "PENDING";
  return res.reason === "UNAVAILABLE" ? null : res.reason;
}

/** After "Restore": when Play could not be asked nothing was looked up, so it must not say that no subscription was found. */
export const messageAfterRestore = (reached: boolean, plan: OfflinePlan): PlansMessage => (!reached ? "UNREACHABLE" : plan !== "FREE" ? "RESTORED" : "NOTHING");

/** The plan turned on while the screen is open (Play confirmed a pending payment): "waiting for Google Play" is no longer true. */
export const messageOnPlanChange = (m: PlansMessage | null, plan: OfflinePlan): PlansMessage | null => (m === "PENDING" && plan !== "FREE" ? "BOUGHT" : m);

export const plansMessageKey = (m: PlansMessage): DictKey => (m === "UNREACHABLE" ? "common.error.network" : `mob.plans.msg.${m}`);

export function PlansPage() {
  const t = useT();
  const [plan, setPlan] = useState(() => getOfflinePlan());
  const [busy, setBusy] = useState<`${PaidPlanId}:${BuyKind}` | "restore" | null>(null);
  const [message, setMessage] = useState<PlansMessage | null>(null);
  const [prices, setPrices] = useState<Partial<Record<PaidPlanId, string>>>({});
  const [lifetimePrices, setLifetimePrices] = useState<Partial<Record<PaidPlanId, string>>>({});
  const canBuy = billingAvailable();

  useEffect(() => {
    const sync = () => { const now = getOfflinePlan(); setPlan(now); setMessage((m) => messageOnPlanChange(m, now)); };
    window.addEventListener(PLAN_EVENT, sync);
    void refreshPlan().then(sync);
    void playPrices().then(setPrices);
    void playLifetimePrices().then(setLifetimePrices);
    return () => window.removeEventListener(PLAN_EVENT, sync);
  }, []);

  // The buttons are given back whatever happens: a call that failed in an unexpected way must never leave them all disabled.
  async function buy(p: PaidPlanId, kind: BuyKind) {
    setBusy(`${p}:${kind}`);
    setMessage(null);
    try {
      const res = await buyPlan(p, kind);
      const now = getOfflinePlan();
      setPlan(now);
      // a purchase that went through says so (the card also turns to "This is your plan")
      setMessage(messageAfterBuy(res, now));
      // a plan is changed or cancelled on Google Play's own page: a second subscription would be billed next to the first
      if (!res.ok && res.reason === "SUBSCRIBED") void manageSubscription();
    } catch {
      setMessage("FAILED");
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    setBusy("restore");
    setMessage(null);
    try {
      const reached = await restorePurchases();
      const now = getOfflinePlan();
      setPlan(now);
      setMessage(messageAfterRestore(reached, now));
    } catch {
      setMessage("UNREACHABLE");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5" data-testid="mobile-plans-page">
      <a href="#/settings" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
      <h1 className="text-2xl font-extrabold">{t("pricing.title")}</h1>
      <Alert tone="info" data-testid="plans-current">{t("mob.plans.current", { plan: t(`plan.${plan}`) })}</Alert>
      {message && <Alert tone={message === "RESTORED" ? "info" : message === "BOUGHT" ? "success" : "warn"} data-testid="plans-message">{t(plansMessageKey(message))}</Alert>}
      <div className="space-y-3">
        {PLAN_IDS.map((id) => {
          const price = planPriceText(id, "IL");
          const paid = (PAID_PLAN_IDS as readonly string[]).includes(id);
          const shown = paid ? prices[id as PaidPlanId] ?? price.text : null;
          return (
            <Card key={id} className={`space-y-2 ${id === "PLUS" ? "border-neon/60" : ""}`} data-testid={`mobile-plan-${id}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">{t(`plan.${id}`)}</h2>
                <p className="text-xl font-extrabold" data-testid={`mobile-price-${id}`}>
                  <span className="ltr-num">{price.isFree ? t("pricing.free.price") : shown}</span>
                  {!price.isFree && <span className="text-sm font-normal text-muted"> {t("pricing.per")}</span>}
                </p>
              </div>
              <p className="text-sm" data-testid={`mobile-tracks-${id}`}>{tracksText(t, id)}</p>
              <p className="text-sm text-muted" data-testid={`mobile-topics-${id}`}>{chooseFrom(t, id)}</p>
              <p className="text-sm text-muted">{planHasTierA(id) ? t("pricing.graphics.A") : t("pricing.graphics.BC")}</p>
              {paid && (
                plan === id ? (
                  <p className="text-sm font-bold text-neon" data-testid={`plan-active-${id}`}>{t("mob.plans.active")}</p>
                ) : (
                  <div className="space-y-2">
                    <Button type="button" className="w-full" disabled={!canBuy || busy !== null} onClick={() => void buy(id as PaidPlanId, "monthly")} data-testid={`plan-buy-${id}`}>
                      {busy === `${id}:monthly` ? t("common.loading") : t("mob.plans.subscribe", { plan: t(`plan.${id}`) })}
                    </Button>
                    {(plan === "FREE" || (plan === "PLUS" && id === "PRO")) && (
                      <Button type="button" variant="secondary" className="w-full" disabled={!canBuy || busy !== null} onClick={() => void buy(id as PaidPlanId, "lifetime")} data-testid={`plan-buy-lifetime-${id}`}>
                        {busy === `${id}:lifetime` ? t("common.loading") : t("mob.plans.lifetime", { plan: t(`plan.${id}`), price: lifetimePrices[id as PaidPlanId] ?? formatMoney(APP_LIFETIME_PRICES_ILS[id as PaidPlanId], "ILS") })}
                      </Button>
                    )}
                  </div>
                )
              )}
            </Card>
          );
        })}
      </div>
      {!canBuy && <p className="text-xs text-muted" data-testid="plans-unavailable">{t("mob.plans.unavailable")}</p>}
      <div className="space-y-2">
        <Button type="button" variant="secondary" className="w-full" disabled={!canBuy || busy !== null} onClick={() => void restore()} data-testid="plans-restore">{t("mob.plans.restore")}</Button>
        {plan !== "FREE" && <Button type="button" variant="secondary" className="w-full" disabled={!canBuy} onClick={() => void manageSubscription()} data-testid="plans-manage">{t("mob.plans.manage")}</Button>}
      </div>
      <p className="text-xs text-muted">{t("mob.plans.fineprint")}</p>
    </div>
  );
}
