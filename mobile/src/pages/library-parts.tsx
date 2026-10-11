import { Arrow, Button, Card, ProgressBar, Stars } from "@/components/ui";
import { GeneratorBadge } from "@/components/games/GameBadges";
import type { TFn } from "@/lib/i18n";
import { LIBRARY_FILTERS, type LibraryFilter, type LibraryGame } from "../library-model";

/** Presentational pieces of the phone library. No storage access here, so they render (and are tested) in node. */

/** "Continue where you left off": the most recently played unfinished game, one tap away. */
export function ContinueCard({ game, t }: { game: LibraryGame; t: TFn }) {
  const progress = t("lib.progress", { n: game.percent });
  return (
    <section aria-labelledby="continue-title" data-testid="continue-card" data-game={game.id} className="space-y-3 rounded-2xl border border-neon/50 bg-neon/10 p-4 shadow-e1">
      <p className="text-xs font-bold uppercase tracking-wide text-neon">{t("mob.lib.continue.label")}</p>
      <h2 id="continue-title" dir="auto" className="break-words text-xl font-bold">{game.title}</h2>
      <div className="flex items-center gap-3">
        <ProgressBar value={game.percent} label={progress} className="flex-1" />
        <span className="shrink-0 text-xs text-muted">{progress}</span>
      </div>
      <a
        href={`#/play/${game.id}`}
        data-testid="continue-play"
        aria-label={t("a11y.forGame", { action: t("lib.continue"), title: game.title })}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-neon px-5 font-bold text-ink-950 shadow-glow transition active:scale-[0.99]"
      >
        {t("lib.continue")} <Arrow />
      </a>
    </section>
  );
}

export function GameCard({ game: g, t, onDelete }: { game: LibraryGame; t: TFn; onDelete: (id: string) => void }) {
  return (
    <Card interactive className="w-full min-w-0 space-y-3" data-testid="mobile-game">
      <div className="flex flex-wrap items-center gap-2">
        <h3 dir="auto" className="me-auto min-w-0 break-words text-lg font-semibold">{g.title}</h3>
        <GeneratorBadge kind={g.generatorKind} provider={g.generatorKind} t={t} />
      </div>
      <p dir="auto" className="break-words text-sm text-muted">{g.subject}</p>
      {g.inProgress && (
        <div className="flex items-center gap-3">
          <ProgressBar value={g.percent} label={t("lib.progress", { n: g.percent })} className="flex-1" />
          <span className="shrink-0 text-xs text-muted">{t("lib.progress", { n: g.percent })}</span>
        </div>
      )}
      {g.bestStars > 0 && <div className="flex flex-wrap items-center gap-2 text-sm"><Stars n={g.bestStars} size="sm" /><span className="ltr-num text-muted">{g.bestScore}/{g.maxScore}</span></div>}
      <div className="flex flex-wrap gap-2">
        <a href={`#/play/${g.id}`} data-testid="mobile-play" aria-label={t("a11y.forGame", { action: g.inProgress ? t("lib.continue") : t("lib.play"), title: g.title })} className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 font-semibold text-ink-950">{g.inProgress ? t("lib.continue") : t("lib.play")}</a>
        {g.lastSessionId && <a href={`#/games/${g.id}/results/${g.lastSessionId}`} aria-label={t("a11y.forGame", { action: t("mob.results"), title: g.title })} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm font-semibold">{t("mob.results")}</a>}
        <Button variant="ghost" size="sm" className="ms-auto" aria-label={t("a11y.forGame", { action: t("mob.delete"), title: g.title })} onClick={() => onDelete(g.id)}>{t("mob.delete")}</Button>
      </div>
    </Card>
  );
}

const FILTER_KEY = { all: "mob.lib.filter.all", progress: "mob.lib.filter.progress", done: "mob.lib.filter.done" } as const;

/** All / In progress / Completed, each with its count. Toggle buttons (44px tall) so TalkBack announces the pressed state. */
export function FilterBar({ filter, counts, onChange, t }: { filter: LibraryFilter; counts: Record<LibraryFilter, number>; onChange: (f: LibraryFilter) => void; t: TFn }) {
  return (
    <div role="group" aria-label={t("mob.lib.filter.label")} className="flex flex-wrap gap-2" data-testid="library-filters">
      {LIBRARY_FILTERS.map((f) => {
        const on = f === filter;
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            data-testid={`filter-${f}`}
            onClick={() => onChange(f)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition active:scale-[0.98] ${on ? "border-neon bg-neon/15 text-neon" : "border-line text-muted"}`}
          >
            {t(FILTER_KEY[f])}
            <span className="ltr-num text-xs">{counts[f]}</span>
          </button>
        );
      })}
    </div>
  );
}
