import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { readFlag, readString, STORAGE_KEYS, writeFlag, writeString } from '@/lib/storage';
import { applyNativeLocaleDirection, applyWebDocumentLocale, effectiveIsRTL, reconcileNativeDirection } from './direction';
import { translate, type TranslationKey } from './translate';
import { DEFAULT_LOCALE, isLocale, type Locale, type TranslateVars } from './types';

export type LocaleChangeSource = 'user' | 'profile';

export interface LocaleContextValue {
  locale: Locale;
  /** Layout direction in effect (use for mirroring icons and choosing start/end). */
  isRTL: boolean;
  /** False until the stored preference has been read (the splash screen covers this). */
  ready: boolean;
  /**
   * Changes the language. Persists locally; on native reloads the app when the layout direction
   * changes (the promise then never resolves in practice). `source: 'user'` (default) marks the
   * choice as pending sync to `profiles.locale`; `'profile'` adopts the account preference.
   */
  setLocale: (next: Locale, options?: { source?: LocaleChangeSource }) => Promise<void>;
  /** True when the user picked a language on this device that is not yet saved to the profile. */
  pendingProfileSync: boolean;
  markProfileSynced: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface State {
  locale: Locale;
  ready: boolean;
  pendingProfileSync: boolean;
}

export interface I18nProviderProps {
  children: ReactNode;
  /** Skips storage (tests, previews). */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [state, setState] = useState<State>(() => ({
    locale: initialLocale ?? DEFAULT_LOCALE,
    ready: initialLocale !== undefined,
    pendingProfileSync: false,
  }));

  useEffect(() => {
    if (initialLocale !== undefined) return;
    let cancelled = false;
    void (async () => {
      const [stored, pending] = await Promise.all([readString(STORAGE_KEYS.locale), readFlag(STORAGE_KEYS.localePendingSync)]);
      const locale = isLocale(stored) ? stored : DEFAULT_LOCALE;
      if (Platform.OS !== 'web') {
        const result = await reconcileNativeDirection(locale);
        if (result === 'reloading') return; // keep the splash screen up while the app reloads
      }
      if (!cancelled) setState({ locale, ready: true, pendingProfileSync: pending });
    })();
    return () => {
      cancelled = true;
    };
  }, [initialLocale]);

  useEffect(() => {
    applyWebDocumentLocale(state.locale);
  }, [state.locale]);

  const setLocale = useCallback(async (next: Locale, options?: { source?: LocaleChangeSource }) => {
    const fromUser = (options?.source ?? 'user') === 'user';
    await Promise.all([writeString(STORAGE_KEYS.locale, next), writeFlag(STORAGE_KEYS.localePendingSync, fromUser)]);
    if (Platform.OS !== 'web') {
      const result = await applyNativeLocaleDirection(next);
      if (result === 'reloading') return;
    }
    setState((s) => ({ ...s, locale: next, pendingProfileSync: fromUser }));
  }, []);

  const markProfileSynced = useCallback(() => {
    void writeFlag(STORAGE_KEYS.localePendingSync, false);
    setState((s) => (s.pendingProfileSync ? { ...s, pendingProfileSync: false } : s));
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale: state.locale,
      isRTL: effectiveIsRTL(state.locale),
      ready: state.ready,
      setLocale,
      pendingProfileSync: state.pendingProfileSync,
      markProfileSynced,
    }),
    [state, setLocale, markProfileSynced],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale(): LocaleContextValue {
  const ctx = use(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside <I18nProvider>');
  return ctx;
}

export type TFunction = (key: TranslationKey, vars?: TranslateVars) => string;

/** `const t = useT(); t('common.actions.save'); t('common.due.inDays', { count: 3 })` */
export function useT(): TFunction {
  const { locale } = useLocale();
  return useCallback((key: TranslationKey, vars?: TranslateVars) => translate(locale, key, vars), [locale]);
}

/** Start/end text alignment that is correct on native (logical) and web (explicit). */
export function useTextAlign(): { start: 'left' | 'right' | 'start'; end: 'left' | 'right' | 'end' } {
  const { isRTL } = useLocale();
  if (Platform.OS === 'web') return isRTL ? { start: 'right', end: 'left' } : { start: 'left', end: 'right' };
  return { start: 'start', end: 'end' };
}
