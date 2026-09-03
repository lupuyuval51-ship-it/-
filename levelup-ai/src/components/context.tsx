"use client";
import { createContext, useContext } from "react";
import type { Locale, MessageKey } from "@/lib/i18n";
export type AppContextType = {
  state: any;
  catalog: any;
  locale: Locale;
  t: (key: MessageKey) => string;
  l: (value: any) => string;
  refresh: () => Promise<void>;
  setState: (state: any) => void;
  toast: (message: string) => void;
  go: (path: string) => void;
  setLocale: (value: Locale) => void;
  setTheme: (value: string) => void;
  theme: string;
  logout: () => Promise<void>;
  /** Opens a passwordless account and returns the fresh state. */
  start: () => Promise<any>;
};
export const AppContext = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppContext);
