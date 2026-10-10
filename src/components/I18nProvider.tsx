"use client";

import { createContext, useContext, useMemo } from "react";
import { dirOf, makeT, type Dictionary, type Locale, type TFn } from "@/lib/i18n";

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: TFn;
}

const Ctx = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(() => ({ locale, dir: dirOf(locale), t: makeT(dict) }), [locale, dict]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useI18n(): I18nValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("I18nProvider is missing");
  return v;
}

export const useT = (): TFn => useI18n().t;
export const useLocale = (): Locale => useI18n().locale;
export const useDir = (): "rtl" | "ltr" => useI18n().dir;
