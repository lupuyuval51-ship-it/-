"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "lupu:theme";

function apply(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    try {
      setPref((localStorage.getItem(KEY) as ThemePref) || "system");
    } catch {
      /* מצב פרטי */
    }
  }, []);
  useEffect(() => {
    if (pref !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const h = () => apply("system");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [pref]);
  const set = useCallback((next: ThemePref) => {
    setPref(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* מתעלמים */
    }
    apply(next);
  }, []);
  return { pref, set };
}
