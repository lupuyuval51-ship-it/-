import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Arrow, Button, Card } from "@/components/ui";
import { planHasTierA, planPriceText, topicsOpen } from "@/components/pricing/PlanPrice";
import { APP_TRACKS, PAID_PLAN_IDS, PLAN_IDS, type PaidPlanId } from "@/config/plans";
import { getOfflinePlan } from "@/lib/offline/entitlement";
import { PLAN_EVENT, billingAvailable, buyPlan, manageSubscription, playPrices, refreshPlan, restorePurchases } from "../billing/play";

/**
 * The plans and their prices, and the way to buy: Google Play Billing (the only payment an app from Google Play may use).
 * Prices are in shekels from src/config/plans.ts (Play shows the learner its own final price on the purchase sheet; when Play
 * can tell the price it is shown instead); the offer is the number of library topics per half-year (`APP_TRACKS`).
 */
/** Where the topics of the line above come from: in the app a plan opens a part of the library, and the learner picks the plan's topics there. */
function chooseFrom(t: ReturnType<typeof useT>, id: (typeof PLAN_IDS)[number]): string {
  const { open, total } = topicsOpen(id);
  return open === total ? t("mob.plans.choose.all", { n: total }) : t("mob.plans.choose.some", { n: open, total });
}

export function PlansPage() {
  const t = useT();
  const [plan, setPlan] = useState(() => getOfflinePlan());
  const [busy, setBusy] = useState<PaidPlanId | "restore" | null>(null);
  const [message, setMessage] = useState<"CANCELLED" | "PENDING" | "SUBSCRIBED" | "FAILED" | "RESTORED" | "NOTHING" | null>(null);
  const [prices, setPrices] = useState<Partial<Record<PaidPlanId, string>>>({});
  const canBuy = billingAvailable();

  useEffect(() => {
    const sync = () => setPlan(getOfflinePlan());
    window.addEventListener(PLAN_EVENT, sync);
    void refreshPlan().then(sync);
    void playPrices().then(setPrices);
    return () => window.removeEventListener(PLAN_EVENT, sync);
  }, []);

  async function buy(p: PaidPlanId) {
    setBusy(p);
    setMessage(null);
    const res = await buyPlan(p);
    setPlan(getOfflinePlan());
    if (!res.ok && res.reason !== "UNAVAILABLE") setMessage(res.reason);
    // a plan is changed or cancelled on Google Play's own page: a second subscription would be billed next to the first
    if (!res.ok && res.reason === "SUBSCRIBED") void manageSubscription();
    setBusy(null);
  }

  async function restore() {
    setBusy("restore");
    setMessage(null);
    const ok = await restorePurchases();
    const now = getOfflinePlan();
    setPlan(now);
    setMessage(ok && now !== "FREE" ? "RESTORED" : "NOTHING");
    setBusy(null);
  }

  return (
    <div className="space-y-5" data-testid="mobile-plans-page">
      <a href="#/settings" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
      <h1 className="text-2xl font-extrabold">{t("pricing.title")}</h1>
      <Alert tone="info" data-testid="plans-current">{t("mob.plans.current", { plan: t(`plan.${plan}`) })}</Alert>
      {message && <Alert tone={message === "RESTORED" ? "info" : "warn"} data-testid="plans-message">{t(`mob.plans.msg.${message}`)}</Alert>}
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
              <p className="text-sm" data-testid={`mobile-tracks-${id}`}>{APP_TRACKS[id] === 1 ? t("mob.plans.tracks.one") : t("mob.plans.tracks.many", { n: APP_TRACKS[id] })}</p>
              <p className="text-sm text-muted" data-testid={`mobile-topics-${id}`}>{chooseFrom(t, id)}</p>
              <p className="text-sm text-muted">{planHasTierA(id) ? t("pricing.graphics.A") : t("pricing.graphics.BC")}</p>
              {paid && (
                plan === id ? (
                  <p className="text-sm font-bold text-neon" data-testid={`plan-active-${id}`}>{t("mob.plans.active")}</p>
                ) : (
                  <Button type="button" className="w-full" disabled={!canBuy || busy !== null} onClick={() => void buy(id as PaidPlanId)} data-testid={`plan-buy-${id}`}>
                    {busy === id ? t("common.loading") : t("mob.plans.subscribe", { plan: t(`plan.${id}`) })}
                  </Button>
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
