"use client";
import { useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { translate, localized, dirOf } from "./index";
import type { Locale, Localized } from "@/lib/types";

export function useLocale(): Locale {
  return useAppStore((s) => s.settings.locale);
}

/** Returns t(key, vars), l(localized) and the current locale/direction. */
export function useT() {
  const locale = useLocale();
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);
  const l = useCallback((value: Localized | undefined | null) => localized(locale, value), [locale]);
  return { t, l, locale, dir: dirOf(locale), isRtl: locale === "he" };
}
