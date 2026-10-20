import { useEffect, useState } from "react";
import { PracticeClient } from "@/components/game/PracticeClient";
import { ResultsView } from "@/components/games/ResultsView";
import { ReviewView } from "@/components/games/ReviewView";
import { useT } from "@/components/I18nProvider";
import { Arrow } from "@/components/ui";
import { primaryLink, StateView } from "@/components/ui/StateView";
import type { LearningSummary } from "@/lib/game/state/progress";
import { chapterOf } from "@/lib/game/topics/courses";
import { store, transport } from "../app-state";
import { loadCourseProgress } from "../course-model";
import { bestNote, quickNext } from "../results-model";
import { navigate } from "../router";

function useResults(gameId: string, sessionId: string) {
  const r = store.results(sessionId);
  return r && r.game.id === gameId ? r : null;
}

/** A deleted game or a stale link: say so, and offer the way back as a proper 44px button. */
function Missing() {
  const t = useT();
  return (
    <StateView
      kind="notfound"
      data-testid="results-missing"
      title={t("mob.notfound")}
      text={t("mob.notfound.text")}
      actions={<a href="#/" className={primaryLink}>{t("res.library")}</a>}
    />
  );
}

/**
 * The results page is long (objectives, concepts, mistakes, achievements) and its "what next" card sits at the very
 * bottom. On a phone that is a lot of scrolling, so the same recommendation is offered first, next to how this run
 * compares with the player's own best.
 */
function QuickNext({ gameId, sessionId, summary, reviewCount }: { gameId: string; sessionId: string; summary: LearningSummary; reviewCount: number }) {
  const t = useT();
  const next = quickNext(gameId, sessionId, summary, reviewCount);
  let best = 0;
  try { best = store.gameSummary(gameId)?.bestScore ?? 0; } catch { /* no comparison then */ }
  const note = bestNote(summary, best);
  return (
    <div data-testid="results-quick" data-next={next.id} className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-neon/40 bg-neon/10 p-3">
      {note && (
        <p data-testid="results-best" data-kind={note.kind} className="min-w-0 flex-1 basis-44 text-sm font-medium">
          {note.kind === "best" ? t("mob.results.best") : t("mob.results.bestOther", { best: note.best, max: note.max })}
        </p>
      )}
      <a href={`#${next.href}`} data-testid="results-quick-next" className="inline-flex min-h-11 grow basis-44 items-center justify-center gap-1 rounded-xl bg-neon px-5 text-sm font-bold text-ink-950 shadow-glow transition active:scale-[0.98]">
        {t(next.labelKey)} <Arrow />
      </a>
    </div>
  );
}

/** A course chapter's results lead back to the course, where the next chapter waits. */
function BackToCourse({ topicId }: { topicId: string }) {
  const t = useT();
  const chapter = chapterOf(topicId);
  // The chapter named here is the one the course screen and the home card suggest (the first not finished at any level), not just
  // "the chapter after this one": a replayed or skipped chapter would otherwise point at the wrong one, or at a chapter already done.
  const [next] = useState(() => (chapter ? loadCourseProgress(store, chapter.course).next?.number ?? null : null));
  if (!chapter) return null;
  return (
    <a href={`#/course/${chapter.course.id}`} data-testid="results-course" data-next={next ?? undefined} className="mx-auto mb-4 flex min-h-12 max-w-3xl items-center justify-between gap-3 rounded-2xl border border-violet/50 bg-violet/10 px-4 py-3 text-sm font-semibold">
      <span>{next !== null ? t("mob.results.course.next", { n: next }) : t("mob.results.course")}</span>
      <Arrow />
    </a>
  );
}

export function ResultsPage({ gameId, sessionId }: { gameId: string; sessionId: string }) {
  const t = useT();
  const r = useResults(gameId, sessionId);
  if (!r) return <Missing />;
  const gen = r.game.spec.meta.generator;
  return (
    <>
      {gen?.kind === "catalog" && gen.templateId && <BackToCourse topicId={gen.templateId} />}
      <QuickNext gameId={gameId} sessionId={sessionId} summary={r.summary} reviewCount={r.review.length} />
      <ResultsView t={t} s={r.summary} game={{ id: r.game.id, title: r.game.title }} sessionId={sessionId} conclusion={r.game.spec.learning.conclusion} review={r.review} libraryHref="/" />
    </>
  );
}

export function ReviewPage({ gameId, sessionId }: { gameId: string; sessionId: string }) {
  const t = useT();
  const r = useResults(gameId, sessionId);
  if (!r) return <Missing />;
  return <ReviewView t={t} id={gameId} sessionId={sessionId} review={r.review} />;
}

export function PracticePage({ gameId, sessionId }: { gameId: string; sessionId: string }) {
  const r = useResults(gameId, sessionId);
  const empty = !r || r.review.length === 0;
  useEffect(() => { if (r && empty) navigate(`/games/${gameId}/results/${sessionId}/review`, true); }, [r, empty, gameId, sessionId]);
  if (!r) return <Missing />;
  if (empty) return null;
  return <PracticeClient gameId={gameId} sessionId={sessionId} transport={transport} />;
}
