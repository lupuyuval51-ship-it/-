"use client";

import { useSyncExternalStore } from "react";
import { computeLayout, DEFAULT_LAYOUT, type Layout } from "@/lib/layout";

let cached: Layout = DEFAULT_LAYOUT;

function snapshot(): Layout {
  // Keep the same object while nothing changed so useSyncExternalStore does not re-render in a loop.
  if (window.innerWidth !== cached.width || window.innerHeight !== cached.height) cached = computeLayout(window.innerWidth, window.innerHeight);
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
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_LAYOUT);
}
