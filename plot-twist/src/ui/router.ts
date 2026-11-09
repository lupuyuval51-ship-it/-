import { useMemo, useSyncExternalStore } from 'react';

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

/**
 * What the app keeps in `history.state`:
 * - `sheet`: a sheet's own entry (same URL as the entry below it), so Back closes the sheet.
 * - `from`: the URL of the entry this one was pushed on top of.
 */
export interface EntryState {
  sheet?: string;
  from?: string;
}

export function entryState(): EntryState | null {
  const s: unknown = window.history.state;
  return s && typeof s === 'object' ? (s as EntryState) : null;
}

const currentHash = () => window.location.hash || '#/';

export function navigate(route: Route, opts: { replace?: boolean } = {}): void {
  const hash = routeHash(route);
  const here = currentHash();
  if (here === hash) return;
  const state = entryState();
  if (opts.replace || state?.sheet) {
    // A replaced entry still sits on the same entry below. A sheet's entry is replaced by the
    // screen it led to, so Back from that screen skips the closed sheet.
    const from = state?.sheet ? here : state?.from;
    window.history.replaceState(from ? { from } : null, '', hash);
  } else {
    window.history.pushState({ from: here }, '', hash);
  }
  // pushState/replaceState fire no event of their own.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/**
 * True when the entry below the current one is `hash` (it was pushed from there), so stepping
 * back lands on it instead of stacking a duplicate.
 */
export function cameFrom(route: Route): boolean {
  return entryState()?.from === routeHash(route);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

/**
 * The route always follows the URL. An external store (not state set by a listener) also
 * catches a redirect that a screen makes while the app is first mounting — before any
 * listener is attached — instead of leaving the old screen up under the new URL.
 */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, currentHash, currentHash);
  return useMemo(() => parseRoute(hash), [hash]);
}
