"use client";

import { useEffect, type RefObject } from "react";
import { trapTarget } from "@/lib/game/a11y/scene";
import { focusReturnTarget, removedOpener, type Activation } from "./focusReturn";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const focusablesIn = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hidden && el.getAttribute("aria-hidden") !== "true");

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
    const first = (initial ? root.querySelector<HTMLElement>(initial) : null) ?? focusablesIn(root)[0];
    if (first) first.focus();
    else {
      root.tabIndex = -1;
      root.focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusablesIn(root);
      const target = trapTarget(e.shiftKey, items.indexOf(document.activeElement as HTMLElement), items.length);
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
