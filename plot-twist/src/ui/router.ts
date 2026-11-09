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
 * - `idx`: the entry's place in this tab's history, so a history move can tell Back from Forward.
 */
export interface EntryState {
  sheet?: string;
  from?: string;
  idx?: number;
}

export function entryState(): EntryState | null {
  const s: unknown = window.history.state;
  return s && typeof s === 'object' ? (s as EntryState) : null;
}

const currentHash = () => window.location.hash || '#/';

function idxOf(state: EntryState | null): number | null {
  const i = state?.idx;
  return typeof i === 'number' && Number.isFinite(i) ? i : null;
}

/** How the current entry was reached: a history step back or forward, a new entry, or (null) a page load. */
export type HistoryMove = 'back' | 'forward' | 'new' | null;
let lastIdx = 0;
let lastMove: HistoryMove = null;

export function historyMove(): HistoryMove {
  return lastMove;
}

/** The entry the app is about to push: one past the current one. */
export function nextIdx(): number {
  return (idxOf(entryState()) ?? lastIdx) + 1;
}

/** Notes a new entry the app pushed or replaced itself (no popstate fires for those). */
function landed(idx: number): void {
  lastIdx = idx;
  lastMove = 'new';
  settled();
}

/** History moved on: a step that leaveFor is waiting on happened (or the user went elsewhere). */
function settled(): void {
  leaving = null;
  window.clearTimeout(stuckTimer);
}

/**
 * Numbers history entries and tells history moves apart. Install once, before anything else
 * listens to popstate (main.tsx), so every later listener already knows which way it went.
 */
export function installHistoryIndex(): () => void {
  const state = entryState();
  const at = idxOf(state);
  // One address for Home: a bare URL becomes #/ (the same screen), so every Home entry is alike.
  const home = window.location.hash ? undefined : '#/';
  if (at === null || home) window.history.replaceState({ ...(state ?? {}), idx: at ?? 0 }, '', home);
  lastIdx = at ?? 0;
  lastMove = null;
  /** A plain entry the browser just made (a typed address, a link): one past where we were. */
  const stampNew = () => {
    const s = entryState();
    if (idxOf(s) !== null) return false;
    lastIdx += 1;
    lastMove = 'new';
    window.history.replaceState({ ...(s ?? {}), idx: lastIdx }, '');
    return true;
  };
  const onPop = () => {
    settled();
    if (stampNew()) return;
    const i = idxOf(entryState())!;
    lastMove = i > lastIdx ? 'forward' : i < lastIdx ? 'back' : lastMove;
    lastIdx = i;
  };
  // Browsers that make a fragment entry without a popstate still fire hashchange for it.
  const onHash = () => void stampNew();
  window.addEventListener('popstate', onPop);
  window.addEventListener('hashchange', onHash);
  return () => {
    window.removeEventListener('popstate', onPop);
    window.removeEventListener('hashchange', onHash);
  };
}

export function navigate(route: Route, opts: { replace?: boolean } = {}): void {
  const hash = routeHash(route);
  const here = currentHash();
  if (here === hash) return;
  const state = entryState();
  if (opts.replace || state?.sheet) {
    // A replaced entry still sits on the same entry below. A sheet's entry is replaced by the
    // screen it led to, so Back from that screen skips the closed sheet.
    const from = state?.sheet ? here : state?.from;
    const idx = idxOf(state) ?? lastIdx;
    window.history.replaceState(from ? { from, idx } : { idx }, '', hash);
    landed(idx);
  } else {
    const idx = nextIdx();
    window.history.pushState({ from: here, idx }, '', hash);
    landed(idx);
  }
  // pushState/replaceState fire no event of their own.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Pushes a same-URL entry (a sheet's), numbered like the rest. */
export function pushEntry(state: Omit<EntryState, 'idx'>): void {
  const idx = nextIdx();
  window.history.pushState({ ...state, idx }, '');
  landed(idx);
}

/**
 * True when the entry below the current one is `hash` (it was pushed from there), so stepping
 * back lands on it instead of stacking a duplicate.
 */
export function cameFrom(route: Route): boolean {
  return entryState()?.from === routeHash(route);
}

/** In-app "back to" links: a step back when that screen is the entry below, so history doesn't grow. */
export function goBackTo(route: Route): void {
  if (cameFrom(route)) window.history.back();
  else navigate(route);
}

/** How long a history step may take before the fallback runs (it may have had nowhere to go). */
const STEP_FALLBACK_MS = 400;
let leaving: { idx: number | null; hash: string } | null = null;
let stuckTimer = 0;

/**
 * Leaves a screen that has nothing to show (its episode or draw is gone) without leaving a dead
 * entry behind, where Back or Forward would only land on it to be sent on again:
 * - just reached by Forward (`arrived`): carry on forward, to where the user was heading;
 * - the entry below is `target` (or `stepBack` says the entry below leaves too): step back;
 * - otherwise: this entry becomes `target`.
 * A step with nowhere to go falls through to the next way. Calling it again for the same entry
 * (React StrictMode replays effects) does nothing more.
 */
export function leaveFor(target: Route, opts: { arrived?: boolean; stepBack?: boolean } = {}): void {
  const here = { idx: idxOf(entryState()), hash: currentHash() };
  if (leaving && leaving.idx === here.idx && leaving.hash === here.hash) return;
  leaving = here;
  const stillHere = () => currentHash() === here.hash && idxOf(entryState()) === here.idx;
  const thenIfStuck = (next: () => void) => {
    window.clearTimeout(stuckTimer);
    stuckTimer = window.setTimeout(() => {
      if (!stillHere()) return;
      leaving = null;
      next();
    }, STEP_FALLBACK_MS);
  };
  const replace = () => navigate(target, { replace: true });
  const backOrReplace = () => {
    if (opts.stepBack || cameFrom(target)) {
      leaving = here;
      window.history.back();
      thenIfStuck(replace);
    } else replace();
  };
  if (opts.arrived && lastMove === 'forward') {
    window.history.forward();
    thenIfStuck(backOrReplace);
  } else backOrReplace();
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
