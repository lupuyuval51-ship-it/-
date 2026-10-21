"use client";

import { useEffect, type RefObject } from "react";
import { dialogTabTarget, focusReturnTarget, removedOpener, type Activation } from "./focusReturn";

/** Candidates for the Tab order; `focusablesIn` keeps the ones that really are in it (`<summary>`: the pause menu's "Controls"). */
export const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, details > summary:first-of-type, [tabindex]';

/**
 * Can take the focus: not disabled (a disabled fieldset included), not inside something hidden, inert or aria-hidden within the
 * dialog, and drawn (`display: none` / `visibility: hidden`, where the browser can tell).
 */
export function reachable(el: HTMLElement, root: HTMLElement): boolean {
  if (el.matches(":disabled")) return false;
  for (let n: HTMLElement | null = el; n && n !== root; n = n.parentElement) {
    if (n.hidden || n.hasAttribute("inert") || n.getAttribute("aria-hidden") === "true") return false;
  }
  return typeof el.checkVisibility !== "function" || el.checkVisibility({ checkVisibilityCSS: true, visibilityProperty: true });
}

/** The dialog's controls in Tab order (roving radios that are not the tab stop, `tabindex="-1"`, are left out). */
export const focusablesIn = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.tabIndex >= 0 && reachable(el, root));

/** Something the focus can really be given back to: still on the page, and not the page itself (focusing <body> does nothing). */
const usable = (el: HTMLElement): boolean => el.isConnected && el !== document.body && el !== document.documentElement;

// The control the player activated last (outside any dialog). The floating "interact" button is removed from the page in the same
// render that opens its dialog, so the dialog cannot see it as the focused element any more; see `focusReturn.ts`.
let lastActivation: Activation<HTMLElement> | null = null;
if (typeof document !== "undefined" && typeof document.addEventListener === "function") { // (not on the server, nor under the tests' partial `document`)
  document.addEventListener("click", (e) => {
    const el = e.target instanceof Element ? e.target.closest<HTMLElement>("button, a[href], [role='button']") : null;
    lastActivation = el && !el.closest('[role="dialog"]') ? { el, id: el.getAttribute("data-testid"), at: performance.now() } : null;
  }, true);
}

/**
 * Modal behaviour for the in-game panels (TalkBack / keyboard): focus moves into the dialog when it opens, Tab and
 * Shift+Tab cycle inside it, and focus returns to what had it before (the HUD button or the canvas) when it closes.
 * `initial` picks the first focus target (default: the first focusable element).
 */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, initial?: string): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement instanceof HTMLElement && usable(document.activeElement) ? document.activeElement : null;
    const opener = previous ? null : removedOpener(lastActivation, performance.now(), (el) => el.isConnected);
    // the first match that can take the focus (a disabled answer control is skipped), else the first control, else the box itself
    const wanted = initial ? [...root.querySelectorAll<HTMLElement>(initial)].find((el) => reachable(el, root)) : undefined;
    const first = wanted ?? focusablesIn(root)[0];
    first?.focus();
    if (!first || !root.contains(document.activeElement)) {
      root.tabIndex = -1;
      root.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusablesIn(root);
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = dialogTabTarget(e.shiftKey, active, items, {
        inside: (el) => root.contains(el),
        isRoot: (el) => el === root,
        precedes: (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      });
      if (target === null) return;
      e.preventDefault();
      (target === -1 ? root : items[target])?.focus();
    };
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("keydown", onKey);
      focusReturnTarget(previous, opener, usable, (id) => document.querySelector<HTMLElement>(`[data-testid="${CSS.escape(id)}"]`))?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per open dialog
  }, []);
}
