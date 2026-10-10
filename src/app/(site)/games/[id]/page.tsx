import Link from "next/link";
import { notFound } from "next/navigation";
import { Arrow, Badge, Card, Stars } from "@/components/ui";
import { GameActions } from "@/components/games/GameActions";
import { GeneratorBadge } from "@/components/games/GameBadges";
import { formatDate } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";
import { requireUser } from "@/server/auth/current";
import { ApiError } from "@/server/http/errors";
import { getGameDetails } from "@/server/games/library";
import { getT } from "@/server/i18n";

export const metadata = { title: "Game details" };
export const dynamic = "force-dynamic";

export default async function GameDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/games/${id}`);
  const { t, locale } = await getT();
  const d = await getGameDetails(user.id, id).catch((e: unknown) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!d) notFound();
  const { game, overview, progress, inProgress, recent, revisions } = d;
  const btn = "inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold";
  return (
    <div className="space-y-8">
      <Link href="/games" className="text-sm text-muted hover:text-text"><Arrow back /> {t("det.back")}</Link>
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{t(`gameType.${game.gameType}` as DictKey)}</Badge>
          <Badge>{t(`difficulty.${game.difficulty}` as DictKey)}</Badge>
          <Badge>{t(`env.${overview.environment}` as DictKey)}</Badge>
          <GeneratorBadge kind={game.generator.kind} provider={game.generator.provider} t={t} />
          <Badge>{t("det.version", { n: game.revision })}</Badge>
        </div>
        <h1 className="text-3xl font-extrabold" data-testid="game-title">{game.title}</h1>
        <p className="max-w-3xl text-lg text-muted">{overview.tagline}</p>
        <p className="text-xs text-muted">
          {t("det.created", { date: formatDate(game.createdAt, locale) })} · {t("det.minutes", { n: overview.estimatedMinutes })} · {t("det.generator", { provider: game.generator.provider, model: game.generator.model })}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={`/play/${game.id}`} data-testid="details-play" className={`${btn} bg-neon text-ink-950 shadow-[0_0_30px_-8px_var(--color-neon)] hover:bg-white`}>
            {inProgress ? t("det.continue") : t("det.play")}
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold">{t("det.overview")}</h2>
            <div>
              <h3 className="text-sm font-medium text-muted">{t("det.goal")}</h3>
              <p>{overview.goal}</p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted">{t("det.objectives")}</h3>
              <ul className="list-disc space-y-1 ps-5 text-sm">{overview.objectives.map((o) => <li key={o.id}>{o.text}</li>)}</ul>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted">{t("det.concepts")}</h3>
              <div className="flex flex-wrap gap-1.5">{overview.concepts.map((c) => <Badge key={c} tone="neon">{c}</Badge>)}</div>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">{t("det.areas")}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {overview.areas.map((a) => (
                <li key={a.id} className="rounded-xl border border-line bg-ink-900/50 p-3 text-sm">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs text-muted">{t(`layout.${a.layout}` as DictKey)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">{a.mechanics.map((m) => <Badge key={m}>{t(`mechanic.${m}` as DictKey)}</Badge>)}</div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">{t("det.missions")}</h2>
            <ol className="space-y-3 text-sm">
              {overview.missions.map((m, i) => (
                <li key={m.id} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-violet/20 text-xs font-bold text-violet">{i + 1}</span>
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <ul className="list-disc ps-5 text-muted">{m.objectives.map((o, j) => <li key={j}>{o}</li>)}</ul>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">{t("det.mechanics")}</h2>
            <div className="flex flex-wrap gap-1.5">{overview.mechanics.map((m) => <Badge key={m}>{t(`mechanic.${m}` as DictKey)}</Badge>)}</div>
            <h3 className="pt-1 text-sm font-medium text-muted">{t("det.challengeTypes")}</h3>
            <div className="flex flex-wrap gap-1.5">{overview.challengeTypes.map((c) => <Badge key={c}>{t(`challengeType.${c}` as DictKey)}</Badge>)}</div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="space-y-3" data-testid="details-progress">
            <h2 className="text-lg font-semibold">{t("det.progress")}</h2>
            {inProgress ? (
              <p className="text-sm">{t("det.progress.inProgress", { done: inProgress.missionsDone, total: inProgress.totalMissions })}</p>
            ) : progress ? (
              <p className="flex items-center gap-2 text-sm">{t("det.progress.best", { score: progress.bestScore })}<Stars n={progress.bestStars} size="sm" /></p>
            ) : (
              <p className="text-sm text-muted">{t("det.progress.none")}</p>
            )}
            {inProgress && progress && <p className="text-xs text-muted">{t("lib.best", { score: progress.bestScore })}</p>}
            {recent.length > 0 && (
              <div className="space-y-2 border-t border-line pt-3">
                <h3 className="text-sm font-medium text-muted">{t("det.recent")}</h3>
                <ul className="space-y-1.5 text-sm">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <span className="text-muted">{r.finishedAt ? formatDate(r.finishedAt, locale) : ""}</span>
                      <span className="flex items-center gap-2"><Stars n={r.stars} size="sm" /><Link href={`/games/${game.id}/results/${r.id}`} className="text-neon hover:underline">{t("det.results")}</Link></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <GameActions
            gameId={game.id}
            title={game.title}
            timeOfDay={overview.timeOfDay}
            mechanics={overview.mechanics}
            hasProgress={Boolean(progress || inProgress)}
          />

          <Card className="space-y-2">
            <h2 className="text-lg font-semibold">{t("det.revisions")}</h2>
            <ul className="space-y-1 text-sm text-muted">
              {revisions.map((r) => (
                <li key={r.revision} className="flex justify-between">
                  <span>{t("det.version", { n: r.revision })} · {t(`det.rev.${r.reason}` as DictKey)}</span>
                  <span>{formatDate(r.createdAt, locale)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
