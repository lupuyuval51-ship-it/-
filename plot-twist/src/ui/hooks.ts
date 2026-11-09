import { useEffect, useRef, useState, type RefObject } from 'react';
import { entryState } from './router.ts';

/** Re-renders every `intervalMs` while enabled; returns the current time. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs, enabled]);
  return now;
}

export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => {
    const attr = document.documentElement.getAttribute('data-motion');
    if (attr === 'reduce') return true;
    if (attr === 'full') return false;
    return window.matchMedia?.(query).matches ?? false;
  });
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    const read = () => {
      const attr = document.documentElement.getAttribute('data-motion');
      setReduced(attr === 'reduce' ? true : attr === 'full' ? false : (mq?.matches ?? false));
    };
    mq?.addEventListener('change', read);
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    return () => {
      mq?.removeEventListener('change', read);
      obs.disconnect();
    };
  }, []);
  return reduced;
}

let inertCount = 0;

/** True while any modal (a sheet, the paused screen) is open. */
export function dialogOpen(): boolean {
  return inertCount > 0;
}

/**
 * While any dialog is open, the app behind it is inert: not focusable, not clickable and
 * hidden from assistive tech (swipe / browse mode can't wander out of the dialog).
 * Dialogs and live regions are portaled to <body>, outside #root, so they stay live.
 * Counted, so overlapping dialogs can't release each other.
 */
export function useInertApp(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.getElementById('root');
    inertCount += 1;
    root?.setAttribute('inert', '');
    return () => {
      inertCount = Math.max(0, inertCount - 1);
      if (inertCount === 0) root?.removeAttribute('inert');
    };
  }, [active]);
}

let scrollLocks = 0;
let unlockedOverflow = '';

/**
 * Stops the page behind a dialog from scrolling. Counted like `useInertApp`: two dialogs that
 * open and close in any order always leave the page scrollable once the last one closes.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (scrollLocks === 0) {
      unlockedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    scrollLocks += 1;
    return () => {
      scrollLocks = Math.max(0, scrollLocks - 1);
      if (scrollLocks === 0) document.body.style.overflow = unlockedOverflow;
    };
  }, [active]);
}

// ── Back closes a sheet ──────────────────────────────────────────────
// A sheet opened by the user gets its own history entry (same URL), so the phone's Back
// gesture closes the sheet instead of leaving the screen underneath it.

export function sheetOnTop(key: string): boolean {
  return entryState()?.sheet === key;
}

/** Call from the click that opens the sheet (not from an effect, which StrictMode replays). */
export function pushSheetEntry(key: string): void {
  if (!sheetOnTop(key)) window.history.pushState({ sheet: key }, '');
}

/** Call when the sheet closes any other way (X, Escape, backdrop), so the entry doesn't linger. */
export function dropSheetEntry(key: string): void {
  if (sheetOnTop(key)) window.history.back();
}

/** Sheets that are open right now, by history key (counted). */
const openSheets = new Map<string, number>();

/** Closes the sheet when Back pops its entry. */
export function useCloseOnBack(open: boolean, key: string, onClose: () => void): void {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    openSheets.set(key, (openSheets.get(key) ?? 0) + 1);
    const onPop = () => {
      if (!sheetOnTop(key)) closeRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      const left = (openSheets.get(key) ?? 1) - 1;
      if (left > 0) openSheets.set(key, left);
      else openSheets.delete(key);
    };
  }, [open, key]);
}

/**
 * The same, for a sheet that opens from state rather than from a click: the entry is pushed
 * when the sheet opens and dropped when it closes any other way, or goes away while open.
 * StrictMode's replayed mount effects can't double it: the push is guarded, and only a sheet
 * that really was open drops its entry.
 */
export function useSheetHistory(open: boolean, key: string | undefined, onClose: () => void): void {
  const pushed = useRef(false);
  useEffect(() => {
    if (!key) return;
    if (open) {
      pushSheetEntry(key);
      pushed.current = true;
    } else if (pushed.current) {
      pushed.current = false;
      dropSheetEntry(key);
    }
  }, [open, key]);
  useEffect(
    () => () => {
      if (!key || !pushed.current) return;
      pushed.current = false;
      dropSheetEntry(key);
    },
    [key],
  );
  useCloseOnBack(open && Boolean(key), key ?? '', onClose);
}

/**
 * A sheet's entry can outlive its sheet: a reload with the sheet open (or a phone reloading a
 * discarded tab), or Forward after it was closed. Nothing shows for it, so the next Back would
 * seem to do nothing. Such an entry is stepped over, at startup and whenever history lands on one.
 * Install once, before the app renders. Returns the uninstall function.
 */
export function installSheetHistoryGuard(): () => void {
  const skipStale = () => {
    const key = entryState()?.sheet;
    if (key && !openSheets.has(key)) window.history.back();
  };
  skipStale();
  window.addEventListener('popstate', skipStale);
  return () => window.removeEventListener('popstate', skipStale);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open focus traps, innermost last: only the top one handles Escape and Tab. */
const trapStack: object[] = [];

/** Traps Tab focus inside `ref` while active and restores focus on close. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const token = {};
    trapStack.push(token);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    window.setTimeout(() => (first ?? node)?.focus({ preventScroll: true }), 30);
    const onKey = (e: KeyboardEvent) => {
      // A dialog under another one leaves the keys to the one on top (one Escape, one dialog).
      if (trapStack[trapStack.length - 1] !== token) return;
      if (e.key === 'Escape' && escapeRef.current) {
        e.stopPropagation();
        escapeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const at = trapStack.lastIndexOf(token);
      if (at >= 0) trapStack.splice(at, 1);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [active, ref]);
}

/** Formats milliseconds as m:ss or h:mm:ss. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function formatCost(cost: { min: number; max: number }): string {
  if (cost.max === 0) return 'Free';
  if (cost.min === cost.max) return `₪${cost.max}`;
  return `₪${cost.min}–${cost.max}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
