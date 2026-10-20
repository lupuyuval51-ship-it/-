import { lazy, Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { I18nProvider, useT } from "@/components/I18nProvider";
import { Spinner } from "@/components/ui";
import { DICTIONARIES, dirOf } from "@/lib/i18n";
import { ErrorBoundary } from "./ErrorBoundary";
import { useSettings } from "./app-state";
import { usePath } from "./router";
import { showPlans } from "./features";
import { googleRequired } from "./cloud/google";
import { hasSavedSession } from "./cloud/client";
import { useAccount } from "./cloud/account";
import { LibraryPage } from "./pages/Library";
import { FirstSetup } from "./pages/FirstSetup";
import { TabBar } from "./pages/TabBar";

// Only the library (the screen the app opens on) is in the first bundle. Every other screen is its own chunk, loaded when it is
// opened: the create form carries the offline generator and the demo templates, the play screen the HUD and the runtime
// (and, one level deeper, the 3D renderer), the results screens their own views. With everything in one bundle the first
// chunk was 2.05 MB (587 kB gzip); with the boundaries it is 0.66 MB (193 kB gzip). tests/unit/bundle-boundary.test.ts guards it.
const CreatePage = lazy(() => import("./pages/Create").then((m) => ({ default: m.CreatePage })));
const DeckPage = lazy(() => import("./pages/Deck").then((m) => ({ default: m.DeckPage })));
const PlayPage = lazy(() => import("./pages/Play").then((m) => ({ default: m.PlayPage })));
const PracticePage = lazy(() => import("./pages/Results").then((m) => ({ default: m.PracticePage })));
const ResultsPage = lazy(() => import("./pages/Results").then((m) => ({ default: m.ResultsPage })));
const ReviewPage = lazy(() => import("./pages/Results").then((m) => ({ default: m.ReviewPage })));
const AboutPage = lazy(() => import("./pages/About").then((m) => ({ default: m.AboutPage })));
const PlansPage = lazy(() => import("./pages/Plans").then((m) => ({ default: m.PlansPage })));
const SettingsPage = lazy(() => import("./pages/Settings").then((m) => ({ default: m.SettingsPage })));
const GoogleGate = lazy(() => import("./pages/GoogleGate").then((m) => ({ default: m.GoogleGate })));
const CoursePage = lazy(() => import("./pages/Course").then((m) => ({ default: m.CoursePage })));

function route(path: string) {
  let m: RegExpMatchArray | null;
  if (path === "/create") return <CreatePage />;
  if (path === "/settings") return <SettingsPage />;
  if (path === "/about") return <AboutPage />;
  if (path === "/plans" && showPlans()) return <PlansPage />;
  if (path === "/review") return <DeckPage />;
  if ((m = path.match(/^\/course\/([\w-]+)$/))) return <CoursePage key={m[1]} courseId={m[1]!} />;
  if ((m = path.match(/^\/play\/([\w-]+)$/))) return <PlayPage key={m[1]} gameId={m[1]!} />;
  if ((m = path.match(/^\/games\/([\w-]+)\/results\/([\w-]+)\/review$/))) return <ReviewPage gameId={m[1]!} sessionId={m[2]!} />;
  if ((m = path.match(/^\/games\/([\w-]+)\/results\/([\w-]+)\/practice$/))) return <PracticePage gameId={m[1]!} sessionId={m[2]!} />;
  if ((m = path.match(/^\/games\/([\w-]+)\/results\/([\w-]+)$/))) return <ResultsPage gameId={m[1]!} sessionId={m[2]!} />;
  return <LibraryPage />;
}

export function App() {
  const { locale, setupDone } = useSettings();
  const path = usePath();
  const account = useAccount();
  // A phone without a Google sign-in sees only the sign-in; one that has a saved sign-in opens straight away, offline too.
  const needSignIn = googleRequired() && !account.session && !hasSavedSession();
  const dict = useMemo(() => DICTIONARIES[locale], [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
  }, [locale]);
  useEffect(() => { window.scrollTo(0, 0); }, [path]);
  // Opening a game is the most common next step from the library: fetch and parse the play screen once the library has been
  // drawn and the phone is idle (the 3D renderer is not part of it; it is fetched when a game opens).
  useEffect(() => {
    const id = setTimeout(() => { void import("./pages/Play").catch(() => undefined); }, 1500);
    return () => clearTimeout(id);
  }, []);
  const first = useRef(true);
  const play = path.startsWith("/play/");
  return (
    <I18nProvider locale={locale} dict={dict}>
      {/* The Suspense boundary sits inside the error boundary, which is re-keyed per route: every navigation mounts it afresh,
          so the heading focus below runs once the (possibly still loading) screen has really been committed. */}
      <ErrorBoundary key={path}>
        {/* a new install opens on the questionnaire, full screen, before anything else */}
        {needSignIn
          ? <Suspense fallback={<ScreenLoading />}><GoogleGate /></Suspense>
          : !setupDone && !play
          ? <FirstSetup />
          : play
          ? <Suspense fallback={<PlayLoading />}>{route(path)}<LandOnHeading first={first} play /></Suspense>
          : <>
              {/* bottom padding: the content never ends under the tab bar */}
              <main className="mx-auto max-w-3xl px-4 py-5 md:max-w-5xl md:py-8" style={{ paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))", paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}><div className="lu-page"><Suspense fallback={<ScreenLoading />}>{route(path)}<LandOnHeading first={first} play={false} /></Suspense></div></main>
              <TabBar path={path} />
            </>}
      </ErrorBoundary>
    </I18nProvider>
  );
}

/** What a screen shows while its chunk loads: a spinner that only appears if loading takes a moment (no flash on a fast phone). */
function ScreenLoading() {
  const t = useT();
  return (
    <div role="status" aria-live="polite" className="lu-delayed grid place-items-center gap-3 py-24 text-muted" data-testid="screen-loading">
      <Spinner className="size-8" />
      <span className="text-sm">{t("common.loading")}</span>
    </div>
  );
}

/** What the play screen shows while its chunk loads: the same card the screen itself shows while the session starts. */
function PlayLoading() {
  const t = useT();
  return (
    <main className="theme-dark grid h-dvh place-items-center bg-ink-950" aria-busy="true">
      <div className="flex items-center gap-3 text-lg"><Spinner /> {t("hud.loading")}</div>
    </main>
  );
}

/**
 * Screen readers: after navigating, land on the new page's heading so TalkBack announces where the player is (the first
 * render keeps the default focus; the play screen manages its own focus). Screens that open with a state card (empty, not
 * found) have an h2 instead of an h1. Rendered next to the screen inside its Suspense boundary, so with a lazily loaded
 * screen the effect waits for the screen's content instead of finding the loading fallback.
 */
function LandOnHeading({ first, play }: { first: MutableRefObject<boolean>; play: boolean }) {
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (play) return;
    const h = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("main h2");
    if (!h) return;
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  }, [first, play]);
  return null;
}
