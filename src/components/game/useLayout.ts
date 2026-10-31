"use client";

import { useSyncExternalStore } from "react";
import { computeLayout, DEFAULT_LAYOUT, type Layout } from "@/lib/layout";

let cached: Layout = DEFAULT_LAYOUT;
let seen = { w: DEFAULT_LAYOUT.width, h: DEFAULT_LAYOUT.height };

/**
 * The live layout, the same object while the window keeps its size, so useSyncExternalStore does not re-render in a loop.
 * Compared on the raw size: computeLayout normalises it (a 0 × 0 window, as a WebView has before its first layout, becomes a
 * default phone), so comparing with its output built a new object on every call. Exported for the unit tests.
 */
export function layoutSnapshot(): Layout {
  const w = window.innerWidth, h = window.innerHeight;
  if (!Object.is(w, seen.w) || !Object.is(h, seen.h)) {
    seen = { w, h };
    cached = computeLayout(w, h);
  }
  return cached;
}

function subscribe(cb: () => void) {
  window.addEventListener("resize", cb);
  window.addEventListener("orientationchange", cb);
  return () => {
    window.removeEventListener("resize", cb);
    window.removeEventListener("orientationchange", cb);
  };
}

/** Current viewport classification (portrait phone on the server / first paint, then live). */
export function useLayout(): Layout {
  return useSyncExternalStore(subscribe, layoutSnapshot, () => DEFAULT_LAYOUT);
}
