import { useT } from "@/components/I18nProvider";
import { Alert, Arrow, Card } from "@/components/ui";
import { offerText, planHasTierA, planPriceText, topicsText } from "@/components/pricing/PlanPrice";
import { PLAN_IDS } from "@/config/plans";
import { useSettings } from "../app-state";

/**
 * The plans and their prices, as information only: the app sells nothing (no buy button, no link to a payment page;
 * paid features in an app from Google Play may only use Google Play Billing). Prices come from src/config/plans.ts in the
 * currency of the country picked at first launch; the offer text ("2 topics at level C or 1 at level B") from `planOffer`.
 */
export function PlansPage() {
  const t = useT();
  const { region } = useSettings();
  return (
    <div className="space-y-5" data-testid="mobile-plans-page">
      <a href="#/settings" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
      <h1 className="text-2xl font-extrabold">{t("pricing.title")}</h1>
      <Alert tone="info" data-testid="plans-open-now">{t("pricing.open.now")}</Alert>
      <div className="space-y-3">
        {PLAN_IDS.map((plan) => {
          const price = planPriceText(plan, region === "OTHER" ? null : region);
          return (
            <Card key={plan} className={`space-y-2 ${plan === "PLUS" ? "border-neon/60" : ""}`} data-testid={`mobile-plan-${plan}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">{t(`plan.${plan}`)}</h2>
                <p className="text-xl font-extrabold" data-testid={`mobile-price-${plan}`}>
                  <span className="ltr-num">{price.isFree ? t("pricing.free.price") : price.text}</span>
                  {!price.isFree && <span className="text-sm font-normal text-muted"> {t("pricing.per")}</span>}
                </p>
              </div>
              <p className="text-sm">{offerText(t, plan)}</p>
              <p className="text-sm text-muted" data-testid={`mobile-topics-${plan}`}>{topicsText(t, plan)}</p>
              <p className="text-sm text-muted">{planHasTierA(plan) ? t("pricing.graphics.A") : t("pricing.graphics.BC")}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
