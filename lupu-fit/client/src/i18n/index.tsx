import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Language } from '@lupu-fit/shared';
import { IS_DEVICE } from '../env.ts';
import { idbStore, overlayTree, type StoredLang } from './custom/translate.ts';

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

function lookupRaw(lang: Language, key: string): string | undefined {
  let cur: string | Tree | undefined = DICT[lang];
  for (const part of key.split('.')) { if (typeof cur !== 'object' || cur === null) return undefined; cur = cur[part]; }
  return typeof cur === 'string' ? cur : undefined;
}
/** Device Mode (standalone build: no account, no server) prefers `dev.<key>` (features/deviceCopy.ts) over `<key>`; hosted never reads `dev.*`. */
export function lookup(lang: Language, key: string): string | undefined {
  return (IS_DEVICE ? lookupRaw(lang, `dev.${key}`) : undefined) ?? lookupRaw(lang, key);
}
export type TFn = (key: string, params?: Record<string, string | number>) => string;
function lookupIn(tree: Tree | null, key: string): string | undefined {
  let cur: string | Tree | undefined = tree ?? undefined;
  for (const part of key.split('.')) { if (typeof cur !== 'object' || cur === null) return undefined; cur = cur[part]; }
  return typeof cur === 'string' ? cur : undefined;
}
/** The count of a message: `n`, or the only parameter. Bidi isolates (used to keep numbers LTR) are ignored. */
function countOf(params: Record<string, string | number>): number | undefined {
  const vals = Object.values(params);
  const v = 'n' in params ? params.n : vals.length === 1 ? vals[0] : undefined;
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return undefined;
  const s = v.replace(/[\u200e\u200f\u2066-\u2069]/g, '').trim();
  return /^\d+$/.test(s) ? Number(s) : undefined;
}
/**
 * `overlay` is a machine-translated tree (custom language); any key it lacks falls back to English.
 * Singular: when the count is 1 and a sibling `<key>One` exists, that variant is used ("1 workouts" / "1 אימונים" never render).
 */
export function makeT(lang: Language, overlay: Tree | null = null): TFn {
  const find = (k: string): string | undefined => (overlay ? lookupIn(overlay, k) : undefined) ?? lookup(lang, k) ?? lookup('en', k);
  return (key, params) => {
    const s = (params && countOf(params) === 1 ? find(`${key}One`) : undefined) ?? find(key);
    if (s === undefined) { if (import.meta.env.DEV) console.warn(`[i18n] missing key ${key}`); return key; }
    return params ? s.replace(/\{(\w+)\}/g, (_, p: string) => String(params[p] ?? `{${p}}`)) : s;
  };
}

const STORE = 'lf_lang';
const META = 'lf_lang_custom';
export interface CustomMeta { code: string; name: string; dir: 'rtl' | 'ltr' }
const readCustom = (): CustomMeta | null => {
  try {
    if (localStorage.getItem(STORE) !== (JSON.parse(localStorage.getItem(META) ?? 'null') as CustomMeta | null)?.code) return null;
    const m = JSON.parse(localStorage.getItem(META) ?? 'null') as CustomMeta | null;
    return m && typeof m.code === 'string' && typeof m.name === 'string' ? { code: m.code, name: m.name, dir: m.dir === 'rtl' ? 'rtl' : 'ltr' } : null;
  } catch { return null; }
};
const initial = (): Language => {
  try { const v = localStorage.getItem(STORE); if (v === 'he' || v === 'en') return v; if (v && readCustom()) return 'en'; } catch { /* storage unavailable */ }
  return typeof navigator !== 'undefined' && navigator.language && !navigator.language.startsWith('he') && navigator.language !== '' && !navigator.language.startsWith('iw') ? 'en' : 'he';
};

/** Module-level mirror of the active custom language for non-React callers (fmt.date, coach request hint). */
let activeCustom: CustomMeta | null = null;
/** Optional coach hint: spread into the coach request body. Empty for built-in languages. */
export const uiLanguageHint = (): { uiLanguage?: { code: string; name: string } } => (activeCustom ? { uiLanguage: { code: activeCustom.code, name: activeCustom.name } } : {});
const localeFor = (lang: Language): string => {
  if (activeCustom && !activeCustom.code.startsWith('x-')) { try { if (Intl.DateTimeFormat.supportedLocalesOf(activeCustom.code).length > 0) return activeCustom.code; } catch { /* fall through */ } }
  return lang === 'he' ? 'he-IL' : 'en-GB';
};

interface Ctx { lang: Language; dir: 'rtl' | 'ltr'; setLang: (l: Language) => void; t: TFn; custom: CustomMeta | null; activateCustom: (l: Pick<StoredLang, 'code' | 'name' | 'dir' | 'entries'>) => void }
const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children, initialLang, initialCustom, store = idbStore }: { children: ReactNode; initialLang?: Language; initialCustom?: CustomMeta; store?: typeof idbStore }): ReactNode {
  const [lang, setLangState] = useState<Language>(initialLang ?? initial());
  const [custom, setCustom] = useState<CustomMeta | null>(() => initialCustom ?? (initialLang ? null : readCustom()));
  const [overlay, setOverlay] = useState<Tree | null>(null);
  activeCustom = custom;
  const dir = custom ? custom.dir : lang === 'he' ? 'rtl' : 'ltr';
  const htmlLang = custom ? (custom.code.startsWith('x-') ? 'und' : custom.code) : lang;
  useEffect(() => { document.documentElement.lang = htmlLang; document.documentElement.dir = dir; }, [htmlLang, dir]);
  const code = custom?.code;
  const loaded = useRef<string | null>(null); // code whose overlay was set directly by activateCustom (no store round trip needed)
  useEffect(() => {
    if (!code) { setOverlay(null); return; }
    if (loaded.current === code) return;
    let live = true;
    void store.get(code).then((s) => {
      if (!live) return;
      if (s) setOverlay(overlayTree(s));
      else { // translation was deleted / storage cleared: return to a built-in language instead of silently showing English under an RTL/LTR guess
        setCustom(null); setLangState('en'); try { localStorage.setItem(STORE, 'en'); localStorage.removeItem(META); } catch { /* ignore */ }
      }
    });
    return () => { live = false; };
  }, [code, store]);
  const setLang = useCallback((l: Language) => {
    loaded.current = null; setCustom(null); setOverlay(null); setLangState(l);
    try { localStorage.setItem(STORE, l); localStorage.removeItem(META); } catch { /* ignore */ }
  }, []);
  const activateCustom = useCallback<Ctx['activateCustom']>((l) => {
    const meta: CustomMeta = { code: l.code, name: l.name, dir: l.dir };
    loaded.current = meta.code; activeCustom = meta; setLangState('en'); setCustom(meta); setOverlay(overlayTree(l as StoredLang));
    try { localStorage.setItem(STORE, l.code); localStorage.setItem(META, JSON.stringify(meta)); } catch { /* ignore */ }
  }, []);
  const value = useMemo<Ctx>(() => ({ lang, dir, setLang, t: makeT(lang, overlay), custom, activateCustom }), [lang, dir, setLang, overlay, custom, activateCustom]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
export function useLang(): Ctx { const c = useContext(LangContext); if (!c) throw new Error('LangProvider missing'); return c; }
export function useT(): TFn { return useLang().t; }

/** Locale-aware helpers. Numbers are always Latin digits so `.num` readouts stay consistent in every language; dates use the active locale (custom languages included). */
export const fmt = {
  num: (n: number, digits = 0): string => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n),
  date: (iso: string, lang: Language, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string => new Intl.DateTimeFormat(localeFor(lang), opts).format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)),
  duration: (sec: number): string => { const m = Math.floor(sec / 60); const s = Math.round(sec % 60); return `${m}:${String(s).padStart(2, '0')}`; },
};
