import Link from "next/link";
import { Alert, Badge, Card } from "@/components/ui";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import { planGames, planHasTierA, planPriceText } from "@/components/pricing/PlanPrice";
import { PLAN_IDS, isPaidPlanId, type PlanId } from "@/config/plans";
import { REGIONS, regionLabel } from "@/lib/regions";
import { getBillingView } from "@/server/billing/service";
import { paymentsStatus } from "@/server/billing/gateway";
import { getCurrentUser } from "@/server/auth/current";
import { getT } from "@/server/i18n";
import { getRegion } from "@/server/region";

export const metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

const linkBtn = "inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 font-semibold";

export default async function PricingPage() {
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

      <div className="grid gap-5 md:grid-cols-3">
        {PLAN_IDS.map((plan) => {
          const price = planPriceText(plan, region);
          const isCurrent = current === plan;
          const games = planGames(plan);
          return (
            <Card key={plan} className={`flex flex-col gap-4 ${plan === "PLUS" ? "border-neon/60 shadow-[0_0_50px_-25px_var(--color-neon)]" : ""}`} data-testid={`plan-${plan}`}>
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
                {plan === "PRO" && region === "IL" && <p className="mt-1 text-xs text-amber">{t("pricing.pro.usd")}</p>}
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                <li className="flex gap-2"><span aria-hidden className="text-lime">✓</span><span>{games === 1 ? t("pricing.games.one", { period: plan === "FREE" ? t("pricing.period.month") : t("pricing.period.billing") }) : t("pricing.games.many", { n: games, period: t("pricing.period.billing") })}</span></li>
                <li className="flex gap-2"><span aria-hidden className="text-lime">✓</span><span>{planHasTierA(plan) ? t("pricing.graphics.A") : t("pricing.graphics.BC")}</span></li>
                <li className="flex gap-2"><span aria-hidden className="text-lime">✓</span><span>{t("pricing.feature.modes")}</span></li>
                <li className="flex gap-2"><span aria-hidden className="text-lime">✓</span><span>{t("pricing.feature.save")}</span></li>
                {plan === "PRO" && <li className="flex gap-2"><span aria-hidden className="text-violet-soft">★</span><span>{t("pricing.feature.same")}</span></li>}
              </ul>
              {plan === "FREE" ? (
                user ? (
                  isCurrent ? <div className="text-center text-sm text-muted">{t("pricing.current")}</div> : <Link href="/account" className={`${linkBtn} border border-line hover:bg-white/10`}>{t("acc.sub.manage")}</Link>
                ) : (
                  <Link href="/register" className={`${linkBtn} border border-line hover:bg-white/10`}>{t("pricing.cta.free")}</Link>
                )
              ) : !user ? (
                <Link href="/login?next=/pricing" className={`${linkBtn} bg-neon text-ink-950 hover:bg-white`}>{t("pricing.cta.login")}</Link>
              ) : isCurrent || (hasSubscription && billing?.subscription?.plan === plan) ? (
                <Link href="/account" className={`${linkBtn} border border-line hover:bg-white/10`}>{t("pricing.cta.manage")}</Link>
              ) : hasSubscription ? (
                <Link href="/account" className={`${linkBtn} border border-line hover:bg-white/10`}>{t("pricing.cta.manage")}</Link>
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
            {([1, 2, 3, 4] as const).map((n) => <li key={n} className="flex gap-2"><span aria-hidden>•</span><span>{t(`pricing.rules.${n}`)}</span></li>)}
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
