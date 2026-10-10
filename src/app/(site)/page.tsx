import Link from "next/link";
import { Bot, Check, Flag, Gem } from "lucide-react";
import { GameTypeIcon } from "@/components/ui/icons";
import { Arrow, Badge, Card } from "@/components/ui";
import { PLAN_IDS, type PlanId } from "@/config/plans";
import { GAME_TYPES } from "@/lib/game/spec/constants";
import { planGames, planHasTierA, planPriceText } from "@/components/pricing/PlanPrice";
import { getCurrentUser } from "@/server/auth/current";
import { getT } from "@/server/i18n";
import { getRegion } from "@/server/region";


export default async function LandingPage() {
  const { t } = await getT();
  const user = await getCurrentUser();
  const region = await getRegion();
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 py-6 md:grid-cols-2">
        <div className="space-y-6">
          <Badge tone="violet">{t("app.tagline")}</Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl" data-testid="hero-title">{t("landing.hero.title")}</h1>
          <p className="max-w-xl text-lg text-muted">{t("landing.hero.subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link href="/dashboard" className="inline-flex min-h-12 items-center rounded-xl bg-neon px-6 font-semibold text-ink-950 shadow-glow hover:brightness-110">{t("landing.cta.dashboard")}</Link>
            ) : (
              <>
                <Link href="/register" data-testid="cta-start" className="inline-flex min-h-12 items-center rounded-xl bg-neon px-6 font-semibold text-ink-950 shadow-glow hover:brightness-110">{t("landing.cta.primary")}</Link>
                <Link href="/pricing" className="inline-flex min-h-12 items-center rounded-xl border border-line px-6 font-semibold hover:bg-text/10">{t("landing.cta.secondary")}</Link>
              </>
            )}
          </div>
          <p className="text-sm text-muted">{t("landing.subjects.list")}</p>
        </div>
        <div aria-hidden className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-ink-700 via-ink-800 to-violet/30 shadow-e3">
          <div className="absolute inset-0 [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:36px_36px] opacity-40 [transform:perspective(500px)_rotateX(58deg)_translateY(20%)_scale(1.6)]" />
          <div className="absolute start-[18%] top-[20%] grid size-24 place-items-center rounded-2xl border border-neon/50 bg-neon/10 text-neon shadow-glow"><Bot className="size-12" /></div>
          <div className="absolute end-[14%] top-[34%] grid size-16 place-items-center rounded-xl border border-violet/50 bg-violet/15 text-violet-soft"><Gem className="size-8" /></div>
          <div className="absolute bottom-[14%] start-[40%] grid size-20 place-items-center rounded-2xl border border-lime/50 bg-lime/10 text-lime"><Flag className="size-10" /></div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">{t("landing.how.title")}</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([1, 2, 3, 4] as const).map((n) => (
            <li key={n}>
              <Card className="h-full space-y-2">
                <span className="grid size-9 place-items-center rounded-full bg-neon/15 font-bold text-neon">{n}</span>
                <h3 className="font-semibold">{t(`landing.how.${n}.title`)}</h3>
                <p className="text-sm text-muted">{t(`landing.how.${n}.text`)}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">{t("landing.types.title")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {GAME_TYPES.map((g) => (
            <li key={g}>
              <Card className="h-full space-y-2">
                <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-neon/10 text-neon"><GameTypeIcon type={g} className="size-6" /></span>
                <h3 className="font-semibold">{t(`gameType.${g}`)}</h3>
                <p className="text-sm text-muted">{t(`landing.types.${g}`)}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t("landing.modes.title")}</h2>
          <ul className="space-y-3">
            {(["FAST", "FULL", "EXTEND"] as const).map((m) => (
              <li key={m}>
                <Card className="space-y-1 p-4">
                  <h3 className="font-semibold text-neon">{t(`mode.${m}`)}</h3>
                  <p className="text-sm text-muted">{t(`landing.modes.${m}`)}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{t("landing.learn.title")}</h2>
          <ul className="space-y-3">
            {([1, 2, 3] as const).map((n) => (
              <li key={n} className="flex gap-3 rounded-2xl border border-line bg-ink-800/70 p-4 text-sm shadow-e1">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-lime" />
                <span>{t(`landing.learn.${n}`)}</span>
              </li>
            ))}
          </ul>
          <Card className="space-y-1 border-violet/40">
            <h3 className="font-semibold text-violet-soft">{t("landing.tiers.title")}</h3>
            <p className="text-sm text-muted">{t("landing.tiers.text")}</p>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">{t("landing.pricing.title")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_IDS.map((plan: PlanId) => {
            const price = planPriceText(plan, region);
            return (
              <Card key={plan} className="space-y-2" data-testid={`teaser-${plan}`}>
                <h3 className="text-lg font-bold">{t(`plan.${plan}`)}</h3>
                <p className="text-3xl font-extrabold"><span className="ltr-num">{price.isFree ? t("pricing.free.price") : price.text}</span>{!price.isFree && <span className="text-sm font-normal text-muted"> {t("pricing.per")}</span>}</p>
                <p className="text-sm text-muted">{planGames(plan) === 1 ? t("pricing.games.one", { period: plan === "FREE" ? t("pricing.period.month") : t("pricing.period.billing") }) : t("pricing.games.many", { n: planGames(plan), period: t("pricing.period.billing") })}</p>
                <p className="text-sm text-muted">{planHasTierA(plan) ? t("pricing.graphics.A") : t("pricing.graphics.BC")}</p>
              </Card>
            );
          })}
        </div>
        <Link href="/pricing" className="inline-block text-neon hover:underline">{t("landing.cta.secondary")} <Arrow /></Link>
      </section>
    </div>
  );
}
