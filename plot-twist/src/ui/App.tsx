import { useEffect, useState } from 'react';
import type { Weirdness } from '../../shared/types.ts';
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

function Shell() {
  const route = useRoute();
  const vibe = useVibe(route);
  const [statusOpen, setStatusOpen] = useState(false);
  const routeKey = route.name === 'finale' || route.name === 'episode' ? `${route.name}:${route.episodeId}` : route.name;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [routeKey]);

  useEffect(() => {
    const titles: Record<Route['name'], string> = {
      scene: 'PLOT TWIST — What’s your plot today?',
      envelopes: 'Choose your envelope · PLOT TWIST',
      play: 'Episode in progress · PLOT TWIST',
      finale: 'Plot twist! · PLOT TWIST',
      series: 'My Series · PLOT TWIST',
      episode: 'Episode · PLOT TWIST',
    };
    document.title = titles[route.name];
  }, [route.name]);

  return (
    <div id="app" data-vibe={VIBE[vibe]} className="grain relative min-h-dvh">
      <div className="app-backdrop" aria-hidden="true" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-full focus:bg-ivory focus:px-4 focus:py-2 focus:text-ink-950">
        Skip to content
      </a>
      <div className="relative z-10 mx-auto min-h-dvh max-w-[480px]">
        {route.name !== 'play' && <TopBar onStatus={() => setStatusOpen(true)} />}
        <StorageBanner />
        <main id="main" key={routeKey}>
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
