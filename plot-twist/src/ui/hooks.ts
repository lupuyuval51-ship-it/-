import { useEffect, useRef, useState, type RefObject } from 'react';

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
  return (window.history.state as { sheet?: string } | null)?.sheet === key;
}

/** Call from the click that opens the sheet (not from an effect, which StrictMode replays). */
export function pushSheetEntry(key: string): void {
  if (!sheetOnTop(key)) window.history.pushState({ sheet: key }, '');
}

/** Call when the sheet closes any other way (X, Escape, backdrop), so the entry doesn't linger. */
export function dropSheetEntry(key: string): void {
  if (sheetOnTop(key)) window.history.back();
}

/** Closes the sheet when Back pops its entry. */
export function useCloseOnBack(open: boolean, key: string, onClose: () => void): void {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onPop = () => {
      if (!sheetOnTop(key)) closeRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open, key]);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Traps Tab focus inside `ref` while active and restores focus on close. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    window.setTimeout(() => (first ?? node)?.focus({ preventScroll: true }), 30);
    const onKey = (e: KeyboardEvent) => {
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
