import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { RotateCcw } from "lucide-react";
import { Alert, Arrow, Button, Card } from "@/components/ui";
import { secondaryLink, StateView } from "@/components/ui/StateView";
import { browserKV } from "@/lib/offline/store";
import { hashQuery, markWelcomeSeen, shouldShowWelcome } from "@/lib/offline/onboarding";
import { getSettings, store } from "../app-state";
import { Brand } from "@/components/ui/Brand";
import { useAccount } from "../cloud/account";
import { formatWhen, syncLineKey } from "../format";
import { continueGame, filterCounts, filterGames, loadLibrary, showFilters, type LibraryFilter } from "../library-model";
import { stripQuery } from "../router";
import { COURSES } from "@/lib/game/topics/courses";
import { contentLangOf } from "@/lib/i18n";
import { loadCourseProgress } from "../course-model";
import { ContinueCard, CourseCard, EmptyLibrary, FilterBar, GameCard } from "./library-parts";
import { Welcome } from "./Welcome";

/** The chosen filter survives opening a game and coming back (kept for the app session only; a new launch starts at "All"). */
let rememberedFilter: LibraryFilter = "all";

export function LibraryPage() {
  const t = useT();
  const locale = useLocale();
  const { session, status, lastSyncAt } = useAccount();
  const [data, setData] = useState(() => loadLibrary(store));
  const reload = () => setData(loadLibrary(store));
  // A cloud sync can bring in or remove games from another phone while this screen is open (its merges are silent for the
  // store's own change listeners), so the list is read again whenever a sync finishes.
  const syncMark = useRef(lastSyncAt);
  useEffect(() => {
    if (syncMark.current === lastSyncAt) return;
    syncMark.current = lastSyncAt;
    setData(loadLibrary(store));
  }, [lastSyncAt]);
  const [filter, setFilterState] = useState<LibraryFilter>(rememberedFilter);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string; n: number } | null>(null);
  const setFilter = (f: LibraryFilter) => { rememberedFilter = f; setFilterState(f); setNotice(null); };
  const heading = useRef<HTMLHeadingElement>(null);
  // First launch: a short, skippable intro above the library. "Show the welcome again" in Settings opens it on demand
  // (`explicit`). On first launch it also goes away by itself if games arrive, e.g. from the cloud backup of a new phone.
  const [welcomeMode, setWelcomeMode] = useState<"off" | "first" | "explicit">(() => {
    if (!data.ok) return "off";
    if (hashQuery(window.location.hash).get("welcome") === "1") return "explicit";
    return shouldShowWelcome(browserKV(), data.games.length > 0) ? "first" : "off";
  });
  const closeWelcome = () => { markWelcomeSeen(browserKV()); setWelcomeMode("off"); stripQuery(); };
  // A tapped button that disappears (Skip, Delete) would drop the screen-reader cursor: park it on the list heading.
  const focusHeading = () => { requestAnimationFrame(() => heading.current?.focus({ preventScroll: true })); };

  const games = data.ok ? data.games : [];
  const welcome = welcomeMode === "explicit" || (welcomeMode === "first" && games.length === 0);
  const deck = data.ok ? data.deck : null;
  const filtering = showFilters(games);
  const active: LibraryFilter = filtering ? filter : "all";
  const shown = filterGames(games, active);
  const resume = continueGame(games);
  // the learning path is the first thing on the home screen (its progress is read from the games on the phone)
  const course = COURSES[0];
  const courseProgress = useMemo(() => (course && data.ok ? loadCourseProgress(store, course) : null), [course, data]);

  const remove = (id: string) => {
    // Name the game: with several cards on screen "this game" would leave room for a wrong tap.
    const title = games.find((g) => g.id === id)?.title;
    if (!window.confirm(title ? t("mob.lib.delete.confirmNamed", { title }) : t("mob.delete.confirm"))) return;
    try {
      store.deleteGame(id);
      setNotice((p) => ({ tone: "success", text: t("mob.lib.deleted"), n: (p?.n ?? 0) + 1 }));
    } catch {
      setNotice((p) => ({ tone: "error", text: t("mob.lib.delete.error"), n: (p?.n ?? 0) + 1 }));
    }
    reload();
    focusHeading();
  };

  return (
    <div className="space-y-5" data-testid="mobile-library">
      {/* Settings, review and a new game are in the bottom tab bar (App.tsx), within reach of the thumb */}
      <header className="min-w-0">
        <h1><Brand size="lg" /></h1>
        <p className="text-sm text-muted">{t("mob.tagline")}</p>
      </header>
      {welcome && <Welcome onDone={closeWelcome} onSkip={() => { closeWelcome(); focusHeading(); }} />}
      {/* One live region that always exists; a fresh node per message so a repeated message (a second delete) is announced again. */}
      <div aria-live="polite">{notice && <Alert key={notice.n} role="none" tone={notice.tone} data-testid="library-notice">{notice.text}</Alert>}</div>
      {!data.ok ? (
        <Card elevation="flat" className="py-0">
          <StateView
            kind="error"
            data-testid="mobile-load-error"
            title={t("mob.lib.error.title")}
            text={t("mob.lib.error.text")}
            actions={
              <>
                <Button onClick={() => reload()} data-testid="load-retry">{t("common.retry")}</Button>
                <a href="#/settings" className={secondaryLink}>{t("mob.settings")}</a>
              </>
            }
          />
        </Card>
      ) : (
        <>
          {course && courseProgress && !welcome && <CourseCard course={course} progress={courseProgress} lang={contentLangOf(locale)} t={t} />}
          {resume && !welcome && <ContinueCard game={resume} t={t} />}
          {/* one main action per screen: next to the welcome's "Try an example" (or a game to continue) this one is outlined */}
          {!(games.length === 0 && !welcome) && (
            <div className="space-y-4 md:grid md:grid-cols-2 md:items-stretch md:gap-3 md:space-y-0" data-testid="mobile-actions">
              <a
                href="#/create"
                data-testid="mobile-new"
                className={`flex min-h-14 items-center justify-center rounded-2xl text-lg font-bold md:min-h-16 ${resume || welcome ? "border-2 border-neon text-neon" : "bg-neon text-ink-950 shadow-glow"}`}
              >
                <span aria-hidden className="me-2">+</span>{t("mob.new")}
              </a>
              {deck && deck.total > 0 && (
                <a href="#/review" data-testid="deck-open" data-due={deck.due} className="flex min-h-14 items-center gap-3 rounded-2xl border border-violet/50 bg-violet/10 px-4 shadow-e1 transition hover:border-violet active:scale-[0.99]">
                  <RotateCcw aria-hidden className="size-5 shrink-0 text-violet-soft" />
                  <span className="me-auto">
                    <span className="block font-semibold">{t("mob.deck.title")}</span>
                    <span className="block text-sm text-muted">{deck.due > 0 ? t("mob.deck.due", { n: deck.due }) : t("mob.deck.later", { n: deck.total })}</span>
                  </span>
                  <Arrow />
                </a>
              )}
            </div>
          )}
          <h2 id="library-title" ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">{t("lib.title")}</h2>
          {games.length === 0 ? (
            welcome ? (
              // The welcome card above already explains what to do: keep the empty state to one quiet line.
              <p data-testid="mobile-empty" className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">{t("lib.empty.title")} · {t("lib.empty.text")}</p>
            ) : (
              <EmptyLibrary t={t} interest={getSettings().interests[0]} />
            )
          ) : (
            <>
              {filtering && (
                <>
                  <FilterBar filter={active} counts={filterCounts(games)} onChange={setFilter} t={t} />
                  <p role="status" className="sr-only">{t("mob.lib.filter.shown", { shown: shown.length, total: games.length })}</p>
                </>
              )}
              {shown.length === 0 ? (
                <Card elevation="flat" className="space-y-3 text-center" data-testid="library-filter-empty">
                  <p className="text-sm text-muted">{t("mob.lib.filter.none")}</p>
                  <Button variant="secondary" size="sm" onClick={() => setFilter("all")}>{t("mob.lib.filter.reset")}</Button>
                </Card>
              ) : (
                <ul aria-labelledby="library-title" className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="mobile-games">
                  {shown.map((g) => <li key={g.id} className="flex min-w-0"><GameCard game={g} t={t} onDelete={remove} /></li>)}
                </ul>
              )}
            </>
          )}
        </>
      )}
      <p className="text-center text-xs text-muted" data-testid="library-footer">
        {session ? t(syncLineKey(status, lastSyncAt), { when: lastSyncAt ? formatWhen(lastSyncAt, locale) : "" }) : t("mob.offline")}
      </p>
    </div>
  );
}
