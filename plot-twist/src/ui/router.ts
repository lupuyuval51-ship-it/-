import { useEffect, useState } from 'react';

/** Hash routes keep the app deployable as static files and make Back work on phones. */
export type Route =
  | { name: 'scene' }
  | { name: 'envelopes' }
  | { name: 'play' }
  | { name: 'finale'; episodeId: string }
  | { name: 'series' }
  | { name: 'episode'; episodeId: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  switch (parts[0]) {
    case 'envelopes':
      return { name: 'envelopes' };
    case 'play':
      return { name: 'play' };
    case 'finale':
      return parts[1] ? { name: 'finale', episodeId: decodeURIComponent(parts[1]) } : { name: 'series' };
    case 'series':
      return parts[1] ? { name: 'episode', episodeId: decodeURIComponent(parts[1]) } : { name: 'series' };
    default:
      return { name: 'scene' };
  }
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case 'scene':
      return '#/';
    case 'envelopes':
      return '#/envelopes';
    case 'play':
      return '#/play';
    case 'finale':
      return `#/finale/${encodeURIComponent(route.episodeId)}`;
    case 'series':
      return '#/series';
    case 'episode':
      return `#/series/${encodeURIComponent(route.episodeId)}`;
  }
}

export function navigate(route: Route, opts: { replace?: boolean } = {}): void {
  const hash = routeHash(route);
  if (window.location.hash === hash) return;
  if (opts.replace) {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
