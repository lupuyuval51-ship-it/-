import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '@lupu-fit/shared';

type Tree = { [k: string]: string | Tree };
const mods = import.meta.glob<{ default: { en: Tree; he: Tree } }>('./features/*.ts', { eager: true });

function merge(a: Tree, b: Tree): Tree {
  for (const [k, v] of Object.entries(b)) {
    const cur = a[k];
    if (typeof v === 'string') { if (cur !== undefined) throw new Error(`i18n key collision: ${k}`); a[k] = v; }
    else a[k] = merge(typeof cur === 'object' && cur !== null ? cur : {}, v);
  }
  return a;
}
export const DICT: Record<Language, Tree> = { en: {}, he: {} };
for (const m of Object.values(mods)) { merge(DICT.en, structuredClone(m.default.en)); merge(DICT.he, structuredClone(m.default.he)); }

export function lookup(lang: Language, key: string): string | undefined {
  let cur: string | Tree | undefined = DICT[lang];
  for (const part of key.split('.')) { if (typeof cur !== 'object' || cur === null) return undefined; cur = cur[part]; }
  return typeof cur === 'string' ? cur : undefined;
}
export type TFn = (key: string, params?: Record<string, string | number>) => string;
export function makeT(lang: Language): TFn {
  return (key, params) => {
    const s = lookup(lang, key) ?? lookup('en', key);
    if (s === undefined) { if (import.meta.env.DEV) console.warn(`[i18n] missing key ${key}`); return key; }
    return params ? s.replace(/\{(\w+)\}/g, (_, p: string) => String(params[p] ?? `{${p}}`)) : s;
  };
}

const STORE = 'lf_lang';
const initial = (): Language => {
  try { const v = localStorage.getItem(STORE); if (v === 'he' || v === 'en') return v; } catch { /* storage unavailable */ }
  return typeof navigator !== 'undefined' && navigator.language && !navigator.language.startsWith('he') && navigator.language !== '' && !navigator.language.startsWith('iw') ? 'en' : 'he';
};

interface Ctx { lang: Language; dir: 'rtl' | 'ltr'; setLang: (l: Language) => void; t: TFn }
const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children, initialLang }: { children: ReactNode; initialLang?: Language }): ReactNode {
  const [lang, setLangState] = useState<Language>(initialLang ?? initial());
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = dir; }, [lang, dir]);
  const setLang = useCallback((l: Language) => { setLangState(l); try { localStorage.setItem(STORE, l); } catch { /* ignore */ } }, []);
  const value = useMemo<Ctx>(() => ({ lang, dir, setLang, t: makeT(lang) }), [lang, dir, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
export function useLang(): Ctx { const c = useContext(LangContext); if (!c) throw new Error('LangProvider missing'); return c; }
export function useT(): TFn { return useLang().t; }

/** Locale-aware helpers. Numbers are always Latin digits so `.num` readouts stay consistent in both languages. */
export const fmt = {
  num: (n: number, digits = 0): string => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n),
  date: (iso: string, lang: Language, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string => new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', opts).format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)),
  duration: (sec: number): string => { const m = Math.floor(sec / 60); const s = Math.round(sec % 60); return `${m}:${String(s).padStart(2, '0')}`; },
};
