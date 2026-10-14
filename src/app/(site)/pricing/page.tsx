import { notFound } from "next/navigation";
import { plansEnabled } from "@/server/env";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { Alert, Badge, Card } from "@/components/ui";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import { offerText, planHasTierA, planPriceText, pointsText } from "@/components/pricing/PlanPrice";
import { PLAN_IDS, TIER_FEATURES, featureShare, isPaidPlanId, levelsAllowed, maxLevel, tierHas, type PlanId } from "@/config/plans";
import { modeAllowed } from "@/lib/game/spec/tier";
import type { DictKey } from "@/lib/i18n";
import { REGIONS, regionLabel } from "@/lib/regions";
import { getBillingView } from "@/server/billing/service";
import { paymentsStatus } from "@/server/billing/gateway";
import { getCurrentUser } from "@/server/auth/current";
import { getT } from "@/server/i18n";
import { getRegion } from "@/server/region";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("pricing.title");
export const dynamic = "force-dynamic";

const linkBtn = "inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 font-semibold";

export default async function PricingPage() {
  if (!plansEnabled()) notFound();
  const { t, locale } = await getT();
  const user = await getCurrentUser();
  const region = await getRegion();
  const payments = paymentsStatus();
  const billing = user ? await getBillingView(user.id) : null;
  const hasSubscription = Boolean(billing?.subscription && !["CANCELED", "INCOMPLETE_EXPIRED"].includes(billing.subscription.status));
  const current: PlanId | null = billing?.plan ?? null;
  const knownRegion = REGIONS.some((r) => r.code === region);

  return (
    <div className="space-y-12">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-extrabold" data-testid="pricing-title">{t("pricing.title")}</h1>
        <p className="mx-auto max-w-2xl text-muted">{t("pricing.subtitle")}</p>
        <p className="text-xs text-muted" data-testid="pricing-region">
          {user ? t("pricing.region.note", { region: regionLabel(region, locale) }) : knownRegion ? t("pricing.region.visitor", { region: regionLabel(region, locale) }) : t("pricing.region.default")}
        </p>
      </header>

      {payments.mode === "dev" && <Alert tone="warn" data-testid="payments-dev-banner">{t("pricing.payments.dev")}</Alert>}
      {payments.mode === "disabled" && <Alert tone="info" data-testid="payments-disabled-banner">{t("pricing.payments.disabled")}</Alert>}
      {payments.mode === "stripe" && !payments.ready && <Alert tone="error">{t("pricing.payments.disabled")}</Alert>}

      {/* three columns only where each card is wide enough to read (a 768px tablet gets one comfortable column) */}
      <div className="mx-auto grid max-w-xl gap-5 min-[860px]:max-w-none min-[860px]:grid-cols-3">
        {PLAN_IDS.map((plan) => {
          const price = planPriceText(plan, region);
          const isCurrent = current === plan;
          const period = plan === "FREE" ? t("pricing.period.month") : t("pricing.period.billing");
          const top = maxLevel(plan);
          // what this plan's highest level adds on top of the plan below it (the cheapest plan lists everything it has)
          const below = PLAN_IDS[PLAN_IDS.indexOf(plan) - 1];
          const newFeatures = TIER_FEATURES[top].filter((f) => !below || !tierHas(maxLevel(below), f));
          return (
            <Card key={plan} className={`flex flex-col gap-4 ${plan === "PLUS" ? "border-neon/60 shadow-glow" : ""}`} data-testid={`plan-${plan}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t(`plan.${plan}`)}</h2>
                {isCurrent && <Badge tone="lime" data-testid={`current-${plan}`}>{t("pricing.current")}</Badge>}
              </div>
              <div>
                <p className="text-4xl font-extrabold" data-testid={`price-${plan}`}>
                  <span className="ltr-num">{price.isFree ? t("pricing.free.price") : price.text}</span>
                  {!price.isFree && <span className="text-base font-normal text-muted"> {t("pricing.per")}</span>}
                </p>
                {!price.isFree && <p className="text-xs text-muted">{price.currency === "ILS" ? t("pricing.region.il") : t("pricing.region.usd")}</p>}
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                <li className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-lime" /><span data-testid={`offer-${plan}`}><b>{t("pricing.games.many", { offer: offerText(t, plan), period })}</b><span className="block text-xs text-muted" data-testid={`points-${plan}`}>{pointsText(t, plan)}</span></span></li>
                <li className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-lime" /><span>{planHasTierA(plan) ? t("pricing.graphics.A") : t("pricing.graphics.BC")}</span></li>
                <li className="flex gap-2" data-testid={`share-${plan}`}><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-lime" /><span>{[...levelsAllowed(plan)].reverse().map((tier) => t("pricing.level.item", { tier, share: featureShare(tier) })).join(" · ")}</span></li>
                <li className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-lime" /><span>{t(modeAllowed(top, "FULL") ? "pricing.feature.modes" : "pricing.feature.modes.fast")}</span></li>
                <li className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-lime" /><span>{t("pricing.feature.save")}</span></li>
                {plan === "PRO" && <li className="flex gap-2"><Star aria-hidden className="mt-0.5 size-4 shrink-0 fill-violet-soft text-violet-soft" /><span>{t("pricing.feature.same")}</span></li>}
              </ul>
              <div className="space-y-1.5 border-t border-line pt-3 text-xs text-muted" data-testid={`features-${plan}`}>
                <p className="font-semibold text-text">{!below ? t("pricing.features.base") : newFeatures.length ? t("pricing.features.more", { plan: t(`plan.${below}` as DictKey) }) : t("pricing.features.same", { plan: t(`plan.${below}` as DictKey) })}</p>
                <ul className="space-y-1">
                  {newFeatures.map((f) => <li key={f} className="flex gap-1.5"><Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-lime" /><span>{t(`feat.${f.replace(":", ".")}` as DictKey)}</span></li>)}
                </ul>
              </div>
              {plan === "FREE" ? (
                user ? (
                  isCurrent ? <div className="text-center text-sm text-muted">{t("pricing.current")}</div> : <Link href="/account" className={`${linkBtn} border border-line hover:bg-text/10`}>{t("acc.sub.manage")}</Link>
                ) : (
                  <Link href="/register" className={`${linkBtn} border border-line hover:bg-text/10`}>{t("pricing.cta.free")}</Link>
                )
              ) : !user ? (
                <Link href="/login?next=/pricing" className={`${linkBtn} bg-neon text-ink-950 hover:brightness-110`}>{t("pricing.cta.login")}</Link>
              ) : isCurrent || (hasSubscription && billing?.subscription?.plan === plan) ? (
                <Link href="/account" className={`${linkBtn} border border-line hover:bg-text/10`}>{t("pricing.cta.manage")}</Link>
              ) : hasSubscription ? (
                <Link href="/account" className={`${linkBtn} border border-line hover:bg-text/10`}>{t("pricing.cta.manage")}</Link>
              ) : isPaidPlanId(plan) ? (
                <CheckoutButton plan={plan} label={t("pricing.cta.upgrade", { plan: t(`plan.${plan}`) })} disabled={!payments.ready} />
              ) : null}
            </Card>
          );
        })}
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3" data-testid="pricing-rules">
          <h2 className="text-lg font-semibold">{t("pricing.rules.title")}</h2>
          <ul className="space-y-2 text-sm text-muted">
            {([1, 2, 3, 4] as const).map((n) => <li key={n} className="flex gap-2"><span aria-hidden>•</span><span>{t(`pricing.rules.${n}`, { offer: offerText(t, "FREE") })}</span></li>)}
          </ul>
        </Card>
        <Card className="space-y-3" data-testid="pricing-billing">
          <h2 className="text-lg font-semibold">{t("pricing.billing.title")}</h2>
          <ul className="space-y-2 text-sm text-muted">
            {([1, 2] as const).map((n) => <li key={n} className="flex gap-2"><span aria-hidden>•</span><span>{t(`pricing.billing.${n}`)}</span></li>)}
          </ul>
        </Card>
      </section>
    </div>
  );
}
