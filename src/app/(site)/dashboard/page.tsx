import Link from "next/link";
import { Alert, Arrow, Badge, Card } from "@/components/ui";
import { GameCardView } from "@/components/games/GameCardView";
import { formatDate } from "@/lib/format";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { requireUser } from "@/server/auth/current";
import { listGames } from "@/server/games/library";
import { getT } from "@/server/i18n";
import { resolveRender } from "@/server/games/play";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const btn = "inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const { t, locale } = await getT();
  const [allowance, games, render] = await Promise.all([getAllowanceSummary(user.id), listGames(user.id), resolveRender(user.id)]);
  const inProgress = games.filter((g) => g.progress?.inProgress);
  const recent = games.slice(0, 6);
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold" data-testid="dash-greeting">{t("dash.greeting", { name: user.displayName })}</h1>
          <p className="text-muted">{t("dash.subtitle")}</p>
        </div>
        <Link href="/create" data-testid="dash-create" className={`${btn} bg-neon text-ink-950 hover:bg-white`}>{t("dash.create")}</Link>
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
            <Badge tone={allowance.plan === "FREE" ? "neutral" : "violet"}>{t(`plan.${allowance.plan}`)}</Badge>
          </div>
          <p className="text-3xl font-extrabold"><span className="ltr-num" data-testid="dash-remaining">{allowance.remaining}</span><span className="text-lg font-medium text-muted"> / <span className="ltr-num">{allowance.limit}</span></span></p>
          <p className="text-sm text-muted">{t("dash.allowance.left", { n: allowance.remaining, limit: allowance.limit })}</p>
          <p className="text-xs text-muted">{allowance.plan === "FREE" ? t("dash.allowance.free") : ""} {t("dash.allowance.resets", { date: formatDate(allowance.periodEnd, locale) })}</p>
          {allowance.reserved > 0 && <p className="text-xs text-amber">{t("dash.allowance.inflight", { n: allowance.reserved })}</p>}
          {allowance.remaining === 0 && allowance.plan !== "PRO" && <Link href="/pricing" className="text-sm font-semibold text-neon hover:underline">{t("dash.upgrade")} <Arrow /></Link>}
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
          <Card className="space-y-3 py-10 text-center" data-testid="dash-empty">
            <p className="text-lg font-semibold">{t("dash.empty.title")}</p>
            <p className="mx-auto max-w-md text-sm text-muted">{t("dash.empty.text")}</p>
            <div><Link href="/create" className={`${btn} bg-neon text-ink-950 hover:bg-white`}>{t("dash.empty.cta")}</Link></div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((g) => <GameCardView key={g.id} game={g} t={t} />)}</div>
        )}
      </section>
    </div>
  );
}
