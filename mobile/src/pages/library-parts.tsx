import { Route, Trash2 } from "lucide-react";
import { Arrow, Card, ProgressBar, Stars } from "@/components/ui";
import { GeneratorBadge } from "@/components/games/GameBadges";
import { StateView } from "@/components/ui/StateView";
import { DIFFICULTIES } from "@/lib/game/spec/constants";
import type { TopicCategory } from "@/lib/game/topics/types";
import type { DictKey, TFn } from "@/lib/i18n";
import type { Course } from "@/lib/game/topics/courses";
import type { CourseProgress } from "../course-model";
import { LIBRARY_FILTERS, type LibraryFilter, type LibraryGame } from "../library-model";

/** Presentational pieces of the phone library. No storage access here, so they render (and are tested) in node. */

/** "Continue where you left off": the most recently played unfinished game, one tap away. */
export function ContinueCard({ game, t }: { game: LibraryGame; t: TFn }) {
  const progress = t("lib.progress", { n: game.percent });
  return (
    <section aria-labelledby="continue-title" data-testid="continue-card" data-game={game.id} className="space-y-3 rounded-2xl border border-neon/50 bg-neon/10 p-4 shadow-e1">
      <p className="text-xs font-bold uppercase tracking-wide text-neon">{t("mob.lib.continue.label")}</p>
      <h2 id="continue-title" dir="auto" className="wrap-anywhere text-xl font-bold">{game.title}</h2>
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

/** The learning path on the home screen: how far the learner got and the way to the next chapter. */
export function CourseCard({ course, progress, lang, t }: { course: Course; progress: CourseProgress; lang: "he" | "en"; t: TFn }) {
  const total = course.chapters.length;
  const label = t("mob.course.progress", { done: progress.done, total });
  return (
    <a href={`#/course/${course.id}`} data-testid="course-card" data-done={progress.done} className="block space-y-3 rounded-2xl border border-violet/50 bg-violet/10 p-4 shadow-e1 transition hover:border-violet active:scale-[0.99]">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-soft"><Route aria-hidden className="size-4" />{t("mob.course.label")}</span>
      <span className="block text-lg font-bold leading-snug">{course[lang][0]}</span>
      <span className="block text-sm text-muted">{course[lang][2]}</span>
      <span className="flex items-center gap-3">
        <ProgressBar value={progress.done} max={total} label={label} className="flex-1" />
        <span className="shrink-0 text-xs text-muted">{label}</span>
      </span>
      <span className="flex min-h-11 items-center justify-between gap-2 font-semibold text-neon">
        {progress.next ? t("mob.course.next", { n: progress.next.number }) : t("mob.course.open")} <Arrow />
      </span>
    </a>
  );
}

/** Full-width, 56 px actions of the empty library: the first game is one big tap away. */
const bigPrimary = "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-neon px-5 text-lg font-bold text-ink-950 shadow-glow transition active:scale-[0.99]";
const bigSecondary = "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line px-5 text-base font-semibold transition active:scale-[0.99]";

/**
 * The library of a learner with no games (after the welcome was dismissed): one primary action (an example, about a minute to a
 * first game), one alternative (their own notes) and, when the first-run questionnaire named an interest, a way into the ready-made
 * topics of that category (the topic library: built on the phone, not AI).
 */
export function EmptyLibrary({ t, interest }: { t: TFn; interest?: TopicCategory | undefined }) {
  return (
    <Card className="space-y-4 p-4">
      <StateView
        kind="empty"
        compact
        data-testid="mobile-empty"
        title={t("mob.empty.title")}
        text={
          <>
            {t("mob.empty.text")}
            <span className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
              {(["mob.empty.tip1", "mob.empty.tip2", "mob.empty.tip3"] as const).map((k) => <span key={k}><span aria-hidden>✓ </span>{t(k)}</span>)}
            </span>
          </>
        }
        actions={
          <>
            <a href="#/create?example=1" data-testid="empty-example" className={bigPrimary}>{t("mob.empty.example")} <Arrow /></a>
            <a href="#/create" data-testid="empty-create" className={bigSecondary}>{t("mob.welcome.own")}</a>
          </>
        }
      />
      {interest && (
        <div className="rounded-xl border border-line bg-ink-900/60 px-4 py-3" data-testid="empty-suggest-box">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("mob.empty.suggest")}</p>
          <a href="#/create?source=library" data-testid="empty-suggest" className="flex min-h-12 items-center justify-between gap-3 font-semibold text-neon">
            <span className="min-w-0">{t("mob.empty.suggest.cta", { category: t(`topics.cat.${interest}` as DictKey) })}</span>
            <Arrow />
          </a>
        </div>
      )}
    </Card>
  );
}

/**
 * One game: its title, where it came from (the source label is never hidden), its level, then the progress or the best result,
 * and the actions: Play / Continue as the one big button, last results, delete (icon button, set apart at the end).
 */
export function GameCard({ game: g, t, onDelete }: { game: LibraryGame; t: TFn; onDelete: (id: string) => void }) {
  const level = DIFFICULTIES.find((d) => d === g.difficulty);
  const progress = t("lib.progress", { n: g.percent });
  // "Continue" once something was achieved in the open run; a game only opened (0 %) still reads "Play"
  const action = g.inProgress && g.percent > 0 ? t("lib.continue") : t("lib.play");
  return (
    <Card interactive className="w-full min-w-0 space-y-3 p-4" data-testid="mobile-game">
      <h3 dir="auto" className="wrap-anywhere text-lg font-semibold leading-snug">{g.title}</h3>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted">
        <GeneratorBadge kind={g.generatorKind} provider={g.generatorKind} t={t} />
        <span dir="auto" className="min-w-0 wrap-anywhere">{g.subject}</span>
        {level && <><span aria-hidden>·</span><span data-testid="game-level">{t(`difficulty.${level}` as DictKey)}</span></>}
      </div>
      {g.inProgress && (
        <div className="flex items-center gap-3">
          <ProgressBar value={g.percent} label={progress} className="flex-1" />
          <span className="shrink-0 text-xs text-muted">{progress}</span>
        </div>
      )}
      {g.bestStars > 0 && <div className="flex flex-wrap items-center gap-2 text-sm"><Stars n={g.bestStars} size="sm" /><span className="ltr-num text-muted">{g.bestScore}/{g.maxScore}</span></div>}
      <div className="flex items-center gap-2">
        <a href={`#/play/${g.id}`} data-testid="mobile-play" aria-label={t("a11y.forGame", { action, title: g.title })} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-neon px-5 font-bold text-ink-950 transition active:scale-[0.98]">{action}</a>
        {/* the last finished run, not a replay under way (that one is what the play button continues) */}
        {(g.lastDoneSessionId ?? g.lastSessionId) && <a href={`#/games/${g.id}/results/${g.lastDoneSessionId ?? g.lastSessionId}`} aria-label={t("a11y.forGame", { action: t("mob.results"), title: g.title })} className="inline-flex min-h-12 shrink-0 items-center whitespace-nowrap rounded-xl border border-line px-4 text-sm font-semibold transition hover:bg-text/10 active:scale-[0.98]">{t("mob.results")}</a>}
        <button type="button" className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-text/10 hover:text-rose active:scale-[0.98]" title={t("mob.delete")} aria-label={t("a11y.forGame", { action: t("mob.delete"), title: g.title })} onClick={() => onDelete(g.id)}>
          <Trash2 aria-hidden className="size-5" />
        </button>
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
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition active:scale-[0.98] min-[400px]:px-4 ${on ? "border-neon bg-neon/15 text-neon" : "border-line text-muted"}`}
          >
            {t(FILTER_KEY[f])}
            <span className="ltr-num text-xs">{counts[f]}</span>
          </button>
        );
      })}
    </div>
  );
}
