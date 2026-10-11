import { useEffect, useMemo, useRef } from "react";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, dirOf } from "@/lib/i18n";
import { ErrorBoundary } from "./ErrorBoundary";
import { useSettings } from "./app-state";
import { usePath } from "./router";
import { CreatePage } from "./pages/Create";
import { DeckPage } from "./pages/Deck";
import { LibraryPage } from "./pages/Library";
import { PlayPage } from "./pages/Play";
import { PracticePage, ResultsPage, ReviewPage } from "./pages/Results";
import { SettingsPage } from "./pages/Settings";

function route(path: string) {
  let m: RegExpMatchArray | null;
  if (path === "/create") return <CreatePage />;
  if (path === "/settings") return <SettingsPage />;
  if (path === "/review") return <DeckPage />;
  if ((m = path.match(/^\/play\/([\w-]+)$/))) return <PlayPage key={m[1]} gameId={m[1]!} />;
  if ((m = path.match(/^\/games\/([\w-]+)\/results\/([\w-]+)\/review$/))) return <ReviewPage gameId={m[1]!} sessionId={m[2]!} />;
  if ((m = path.match(/^\/games\/([\w-]+)\/results\/([\w-]+)\/practice$/))) return <PracticePage gameId={m[1]!} sessionId={m[2]!} />;
  if ((m = path.match(/^\/games\/([\w-]+)\/results\/([\w-]+)$/))) return <ResultsPage gameId={m[1]!} sessionId={m[2]!} />;
  return <LibraryPage />;
}

export function App() {
  const { locale } = useSettings();
  const path = usePath();
  const dict = useMemo(() => DICTIONARIES[locale], [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  // Screen readers: after navigating, land on the new page's heading so TalkBack announces where the player is
  // (the first render keeps the default focus; the play screen manages its own focus). Screens that open with a
  // state card (empty, not found) have an h2 instead of an h1.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (path.startsWith("/play/")) return;
    const h = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("main h2");
    if (!h) return;
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  }, [path]);
  const play = path.startsWith("/play/");
  return (
    <I18nProvider locale={locale} dict={dict}>
      <ErrorBoundary key={path}>
        {play ? route(path) : <main className="mx-auto max-w-3xl px-4 py-5 md:max-w-5xl md:py-8" style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}><div className="lu-page">{route(path)}</div></main>}
      </ErrorBoundary>
    </I18nProvider>
  );
}
