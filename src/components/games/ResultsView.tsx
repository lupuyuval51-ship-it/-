import Link from "next/link";
import { Award } from "lucide-react";
import { Alert, Arrow, Badge, Card, ProgressBar, Stars } from "@/components/ui";
import type { DictKey, TFn } from "@/lib/i18n";
import type { LearningSummary } from "@/lib/game/state/progress";
import type { ReviewItem } from "@/lib/game/state/review";
import { recommendedNext, type NextAction } from "@/lib/offline/onboarding";

/** Learning results. Presentational only: shared by the web results page and the offline app. */
export function ResultsView({ t, s, game, sessionId, conclusion, review, libraryHref = "/games" }: { t: TFn; s: LearningSummary; game: { id: string; title: string }; sessionId: string; conclusion: string; review: readonly ReviewItem[]; libraryHref?: string }) {
  const minutes = Math.max(1, Math.round(s.durationMs / 60000));
  const spec = { learning: { conclusion } };
  const r = { review };
  const next: NextAction = recommendedNext(s, review.length);
  const all: { id: NextAction; href: string; label: string }[] = [
    { id: "review", href: `/games/${game.id}/results/${sessionId}/review`, label: t("res.review.open") },
    { id: "replay", href: `/play/${game.id}`, label: t("res.replay") },
    { id: "new", href: "/create", label: t("res.new") },
  ];
  // The recommended step comes first; "review" is only offered when there is something to review.
  const actions = all.filter((a) => a.id !== "review" || review.length > 0).sort((a, b) => Number(b.id === next) - Number(a.id === next));
  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="results">
      <Link href={`/games/${game.id}`} className="text-sm text-muted hover:text-text"><Arrow back /> {game.title}</Link>
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-extrabold">{t("res.title")}</h1>
        <div className="flex justify-center"><Stars n={s.stars} size="lg" label={t("common.stars", { n: s.stars })} /></div>
        <p className="text-2xl font-bold" data-testid="results-score">{t("res.score", { score: s.score, max: s.maxScore })}</p>
        <p className="text-sm text-muted">{t("res.time", { m: minutes })} · {t("res.collected", { n: s.collected, total: s.collectiblesTotal })}</p>
      </header>
      {!s.completed && <Alert tone="warn">{t("res.incomplete")}</Alert>}

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">{t("res.objectives")}</h2>
        <ul className="space-y-3">
          {s.objectives.map((o) => (
            <li key={o.id} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3 text-sm">
                <span>{o.text}</span>
                <span className="shrink-0 text-muted ltr-num">{o.mastery === null ? t("res.mastery.none") : `${Math.round(o.mastery * 100)}%`}</span>
              </div>
              <ProgressBar value={(o.mastery ?? 0) * 100} label={o.text} />
            </li>
          ))}
        </ul>
      </Card>

      {s.concepts.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">{t("res.concepts")}</h2>
          <ul className="space-y-2 text-sm">
            {s.concepts.map((c) => (
              <li key={c.concept} className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="neon">{c.concept}</Badge>
                <span className="text-muted">{t("res.concept.row", { correct: c.correct, total: c.total, first: c.firstTry })}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-3" data-testid="results-review">
        <h2 className="text-lg font-semibold">{t("res.review")}</h2>
        {s.review.length === 0 ? (
          <p className="text-sm text-muted">{t("res.review.none")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {s.review.map((x) => (
              <li key={x.challengeId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-ink-900/50 p-3">
                <span><span className="font-medium">{x.title}</span> <span className="text-muted">· {x.concept}</span></span>
                <Badge tone={x.reason === "revealed" ? "rose" : "amber"}>{t(x.reason === "revealed" ? "res.review.revealed" : "res.review.multiple")}</Badge>
              </li>
            ))}
          </ul>
        )}
        {r.review.length > 0 && (
          <Link href={`/games/${game.id}/results/${sessionId}/review`} data-testid="review-open" className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 hover:brightness-110">{t("res.review.open")} <Arrow /></Link>
        )}
      </Card>

      {s.achievements.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">{t("res.achievements")}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {s.achievements.map((a) => (
              <li key={a} className="rounded-xl border border-amber/30 bg-amber/5 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-amber"><Award aria-hidden className="size-4" /> {t(`ach.${a}` as DictKey)}</p>
                <p className="text-xs text-muted">{t(`ach.${a}.desc` as DictKey)}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {s.completed && (
        <Card className="space-y-2 border-violet/40">
          <h2 className="text-lg font-semibold">{t("res.conclusion")}</h2>
          <p className="text-sm">{spec.learning.conclusion}</p>
        </Card>
      )}

      <Card className="space-y-3" data-testid="results-next" data-recommended={next}>
        <h2 className="text-lg font-semibold">{t("res.next.title")}</h2>
        <p className="text-sm text-muted">{t(`res.next.${next}` as DictKey)}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {actions.map((a) => (
            <Link key={a.id} href={a.href} data-testid={`next-${a.id}`} className={`inline-flex min-h-12 items-center justify-center gap-1 rounded-xl px-6 font-semibold ${a.id === next ? "bg-neon text-ink-950 hover:brightness-110" : "border border-line hover:bg-text/10"}`}>{a.label}</Link>
          ))}
        </div>
        <Link href={libraryHref} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-text">{t("res.library")}</Link>
      </Card>
    </div>
  );
}
