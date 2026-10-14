import { useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { RotateCcw } from "lucide-react";
import { Alert, Arrow, Button, Card } from "@/components/ui";
import { primaryLink, secondaryLink, StateView } from "@/components/ui/StateView";
import { browserKV } from "@/lib/offline/store";
import { hashQuery, markWelcomeSeen, shouldShowWelcome } from "@/lib/offline/onboarding";
import { store, useSettings } from "../app-state";
import { useAccount } from "../cloud/account";
import { formatWhen, syncLineKey } from "../format";
import { continueGame, filterCounts, filterGames, loadLibrary, showFilters, type LibraryFilter } from "../library-model";
import { stripQuery } from "../router";
import { ContinueCard, FilterBar, GameCard } from "./library-parts";
import { FirstSetup } from "./FirstSetup";
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
  const { setupDone } = useSettings();
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
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight">LEVEL UP</h1>
          <p className="text-sm text-muted">{t("mob.tagline")}</p>
        </div>
        <a href="#/settings" className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-line px-3 text-sm font-semibold" data-testid="mobile-settings">{t("mob.settings")}</a>
      </header>
      {!setupDone ? <FirstSetup /> : welcome && <Welcome onDone={closeWelcome} onSkip={() => { closeWelcome(); focusHeading(); }} />}
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
          {resume && !welcome && <ContinueCard game={resume} t={t} />}
          <div className="space-y-5 md:grid md:grid-cols-2 md:items-stretch md:gap-3 md:space-y-0" data-testid="mobile-actions">
            <a
              href="#/create"
              data-testid="mobile-new"
              className={`flex min-h-14 items-center justify-center rounded-2xl text-lg font-bold md:min-h-16 ${resume && !welcome ? "border-2 border-neon text-neon" : "bg-neon text-ink-950"}`}
            >
              + {t("mob.new")}
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
          <h2 id="library-title" ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">{t("lib.title")}</h2>
          {games.length === 0 ? (
            welcome ? (
              // The welcome card above already explains what to do: keep the empty state to one quiet line.
              <p data-testid="mobile-empty" className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">{t("lib.empty.title")} · {t("lib.empty.text")}</p>
            ) : (
              <Card elevation="flat" className="py-0">
                <StateView
                  kind="empty"
                  data-testid="mobile-empty"
                  title={t("mob.empty.title")}
                  text={
                    <>
                      {t("mob.empty.text")}
                      <span className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                        {(["mob.empty.tip1", "mob.empty.tip2", "mob.empty.tip3"] as const).map((k) => <span key={k}>✓ {t(k)}</span>)}
                      </span>
                    </>
                  }
                  actions={
                    <>
                      <a href="#/create?example=1" data-testid="empty-example" className={primaryLink}>{t("mob.empty.example")}</a>
                      <a href="#/create" data-testid="empty-create" className={secondaryLink}>{t("lib.empty.cta")}</a>
                    </>
                  }
                />
              </Card>
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
