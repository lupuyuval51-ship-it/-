import { plansEnabled } from "@/server/env";
import Link from "next/link";
import { primaryLink, StateView } from "@/components/ui/StateView";
import { Alert, Arrow, Badge, Card } from "@/components/ui";
import { GameCardView } from "@/components/games/GameCardView";
import { offerText } from "@/components/pricing/PlanPrice";
import { leftText, levelHasLeft, offeredLevels } from "@/components/allowance/quota";
import { formatDate } from "@/lib/format";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { requireUser } from "@/server/auth/current";
import { listGames } from "@/server/games/library";
import { getT } from "@/server/i18n";
import { resolveRender } from "@/server/games/play";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("nav.dashboard");
export const dynamic = "force-dynamic";

const btn = "inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const { t, locale } = await getT();
  const [allowance, games, render] = await Promise.all([getAllowanceSummary(user.id), listGames(user.id), resolveRender(user.id)]);
  const inProgress = games.filter((g) => g.progress?.inProgress);
  // every level the plan offers has its own count this period (highest first)
  const levels = offeredLevels(allowance.levels);
  const held = levels.find((l) => l.reserved > 0);
  const resets = formatDate(allowance.periodEnd, locale);
  const recent = games.slice(0, 6);
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold" data-testid="dash-greeting">{t("dash.greeting", { name: user.displayName })}</h1>
          <p className="text-muted">{t("dash.subtitle")}</p>
        </div>
        <Link href="/create" data-testid="dash-create" className={`${btn} bg-neon text-ink-950 hover:brightness-110`}>{t("dash.create")}</Link>
      </header>

      {allowance.activeJobId && (
        <Alert tone="info" className="flex flex-wrap items-center justify-between gap-3" data-testid="dash-generating">
          <span>{t("dash.generating")}</span>
          <Link href={`/generate/${allowance.activeJobId}`} className="font-semibold text-neon hover:underline">{t("dash.generating.cta")} <Arrow /></Link>
        </Alert>
      )}

      <section className="grid gap-4 md:grid-cols-2" aria-label={t("dash.allowance.title")}>
        <Card className="space-y-3" data-testid="dash-allowance">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("dash.allowance.title")}</h2>
            {plansEnabled() && <Badge tone={allowance.plan === "FREE" ? "neutral" : "violet"}>{t(`plan.${allowance.plan}`)}</Badge>}
          </div>
          <ul className="space-y-1.5" data-testid="dash-levels">
            {levels.map((l) => (
              <li key={l.level} className="flex items-baseline justify-between gap-3" data-testid={`dash-level-${l.level}`}>
                <span className="font-semibold">{t("quota.level", { level: l.level })}</span>
                {l.remaining === null || l.limit === null ? (
                  <span className="text-lg font-extrabold" data-testid={`dash-remaining-${l.level}`}>{t("quota.unlimited.title")}</span>
                ) : (
                  <span className="text-end">
                    <span aria-hidden>
                      <span className={`ltr-num text-2xl font-extrabold ${levelHasLeft(l) ? "" : "text-amber"}`} data-testid={`dash-remaining-${l.level}`}>{l.remaining}</span>
                      <span className="text-base font-medium text-muted"> / <span className="ltr-num">{l.limit}</span></span>
                    </span>
                    <span className={levelHasLeft(l) ? "sr-only" : "block text-xs text-amber"}>{leftText(t, l, resets)}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted" data-testid="dash-offer">{t("dash.allowance.offer", { offer: offerText(t, allowance.plan) })} {t("dash.allowance.resets", { date: resets })}</p>
          {held && <p className="text-xs text-amber" data-testid="dash-inflight">{t("dash.allowance.inflight", { level: held.level })}</p>}
          {plansEnabled() && allowance.plan !== "PRO" && levels.some((l) => !levelHasLeft(l)) && <Link href="/pricing" className="text-sm font-semibold text-neon hover:underline">{t("dash.upgrade")} <Arrow /></Link>}
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold">{t("dash.graphics", { tier: t(`tier.short.${render.tier}`) })}</h2>
          <p className="text-sm text-muted">{t(`tier.${render.tier}`)}</p>
          <Link href="/account" className="text-sm font-semibold text-neon hover:underline">{t("nav.account")} <Arrow /></Link>
        </Card>
      </section>

      {inProgress.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">{t("dash.continue.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{inProgress.map((g) => <GameCardView key={g.id} game={g} t={t} />)}</div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("dash.recent.title")}</h2>
          {games.length > 0 && <Link href="/games" className="text-sm font-semibold text-neon hover:underline">{t("dash.recent.all")} <Arrow /></Link>}
        </div>
        {recent.length === 0 ? (
          <Card elevation="flat" className="py-2">
            <StateView kind="empty" data-testid="dash-empty" title={t("dash.empty.title")} text={t("dash.empty.text")} actions={<Link href="/create" className={primaryLink}>{t("dash.empty.cta")}</Link>} />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((g) => <GameCardView key={g.id} game={g} t={t} />)}</div>
        )}
      </section>
    </div>
  );
}
