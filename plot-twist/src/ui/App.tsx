import { useEffect, useRef, useState } from 'react';
import type { Weirdness } from '../../shared/types.ts';
import { isFinished } from '../engine/run.ts';
import { StoreProvider, useStore } from '../state/store.tsx';
import { DirectorSheet, StorageBanner, Toasts, TopBar } from './components/Chrome.tsx';
import { useRoute, type Route } from './router.ts';
import { Envelopes } from './screens/Envelopes.tsx';
import { Finale } from './screens/Finale.tsx';
import { Play } from './screens/Play.tsx';
import { EpisodeDetail, Series } from './screens/Series.tsx';
import { SetScene } from './screens/SetScene.tsx';

const VIBE: Record<Weirdness, string> = { 1: 'chill', 2: 'surprise', 3: 'main' };

function useVibe(route: Route): Weirdness {
  const { state } = useStore();
  switch (route.name) {
    case 'play':
      return state.p.run?.prefs.weirdness ?? state.p.prefs.weirdness;
    case 'envelopes':
      return state.p.draw?.prefs.weirdness ?? state.p.prefs.weirdness;
    case 'finale':
    case 'episode': {
      const ep = state.p.completed.find((c) => c.id === route.episodeId);
      return ep?.prefs.weirdness ?? ep?.weirdness ?? state.p.prefs.weirdness;
    }
    default:
      return state.p.prefs.weirdness;
  }
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'scene':
      return <SetScene />;
    case 'envelopes':
      return <Envelopes />;
    case 'play':
      return <Play />;
    case 'finale':
      return <Finale episodeId={route.episodeId} />;
    case 'series':
      return <Series />;
    case 'episode':
      return <EpisodeDetail episodeId={route.episodeId} />;
  }
}

/** Screens that move focus themselves (to the stage heading / the finale title). */
const SELF_FOCUSING = new Set<Route['name']>(['play', 'finale']);

function Shell() {
  const route = useRoute();
  const vibe = useVibe(route);
  const { state, pause, toast } = useStore();
  const [statusOpen, setStatusOpen] = useState(false);
  const routeKey = route.name === 'finale' || route.name === 'episode' ? `${route.name}:${route.episodeId}` : route.name;
  const previousRoute = useRef<Route | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // The vibe also goes on <html>, so dialogs portaled to <body> use the same tokens.
  useEffect(() => {
    document.documentElement.dataset.vibe = VIBE[vibe];
  }, [vibe]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const previous = previousRoute.current;
    previousRoute.current = route;
    if (!previous) return;
    // Leaving an episode that is still running pauses it, like Save & exit — browsing
    // My Series or the home screen never counts as play time.
    const run = state.p.run;
    if (previous.name === 'play' && route.name !== 'play' && route.name !== 'finale' && run && !isFinished(run) && run.runningSince !== null) {
      pause();
      toast('Episode paused while you look around. Resume it from the home screen.');
    }
    // Move focus to the new screen's heading so keyboard and screen-reader users land on it.
    if (!SELF_FOCUSING.has(route.name)) {
      window.requestAnimationFrame(() => {
        const heading = mainRef.current?.querySelector<HTMLElement>('h1');
        if (!heading) return;
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.classList.add('outline-none');
        heading.focus({ preventScroll: true });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  useEffect(() => {
    const episodeTitle =
      route.name === 'episode' || route.name === 'finale' ? state.p.completed.find((c) => c.id === route.episodeId)?.title : undefined;
    const titles: Record<Route['name'], string> = {
      scene: 'PLOT TWIST — What’s your plot today?',
      envelopes: 'Choose your envelope · PLOT TWIST',
      play: 'Episode in progress · PLOT TWIST',
      finale: episodeTitle ? `Plot twist! ${episodeTitle} · PLOT TWIST` : 'Plot twist! · PLOT TWIST',
      series: 'My Series · PLOT TWIST',
      episode: episodeTitle ? `${episodeTitle} · My Series · PLOT TWIST` : 'Episode · My Series · PLOT TWIST',
    };
    document.title = titles[route.name];
  }, [route, state.p.completed]);

  return (
    <div id="app" data-vibe={VIBE[vibe]} className="grain relative min-h-dvh">
      <div className="app-backdrop" aria-hidden="true" />
      {/* The hash router owns '#…', so the skip link moves focus itself instead of navigating. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-full focus:bg-ivory focus:px-4 focus:py-2 focus:text-ink-950"
        onClick={(e) => {
          e.preventDefault();
          const target = mainRef.current?.querySelector<HTMLElement>('h1, [data-stage-heading]') ?? mainRef.current;
          if (!target) return;
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: 'start' });
        }}
      >
        Skip to content
      </a>
      <div className="relative z-10 mx-auto min-h-dvh max-w-[480px]">
        {route.name !== 'play' && <TopBar onStatus={() => setStatusOpen(true)} />}
        <StorageBanner />
        <main id="main" ref={mainRef} key={routeKey} tabIndex={-1} className="overflow-x-clip outline-none">
          <Screen route={route} />
        </main>
      </div>
      <Toasts />
      <DirectorSheet open={statusOpen} onClose={() => setStatusOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
