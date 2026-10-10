"use client";

import { useEffect, type RefObject } from "react";
import { trapTarget } from "@/lib/game/a11y/scene";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const focusablesIn = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hidden && el.getAttribute("aria-hidden") !== "true");

/**
 * Modal behaviour for the in-game panels (TalkBack / keyboard): focus moves into the dialog when it opens, Tab and
 * Shift+Tab cycle inside it, and focus returns to what had it before (the HUD button or the canvas) when it closes.
 * `initial` picks the first focus target (default: the first focusable element).
 */
export function useDialogFocus(ref: RefObject<HTMLElement | null>, initial?: string): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
      if (previous && previous.isConnected) previous.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per open dialog
  }, []);
}
