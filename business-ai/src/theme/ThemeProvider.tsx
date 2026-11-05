import * as SystemUI from 'expo-system-ui';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { readFlag, readString, STORAGE_KEYS, writeFlag, writeString } from '@/lib/storage';
import { palettes, type ColorScheme, type Palette } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export interface ThemeContextValue {
  /** Resolved scheme in use. */
  scheme: ColorScheme;
  isDark: boolean;
  colors: Palette;
  preference: ThemePreference;
  /** `source: 'user'` (default) marks the choice as pending sync to `profiles.theme`. */
  setPreference: (next: ThemePreference, options?: { source?: 'user' | 'profile' }) => void;
  pendingProfileSync: boolean;
  markProfileSynced: () => void;
  /** False until the stored preference has been read. */
  ready: boolean;
  /** Custom fonts (Heebo/Inter) loaded. When false, Text falls back to the system font. */
  fontsAvailable: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  fontsAvailable: boolean;
  /** Skips storage (tests, previews). */
  initialPreference?: ThemePreference;
}

interface State {
  preference: ThemePreference;
  ready: boolean;
  pendingProfileSync: boolean;
}

function applyNativeAppearance(preference: ThemePreference) {
  if (Platform.OS === 'web') return;
  try {
    // Native chrome (keyboard, alerts, date pickers, iOS header) follows the app's choice.
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  } catch {
    // Older runtimes: ignore.
  }
}

export function ThemeProvider({ children, fontsAvailable, initialPreference }: ThemeProviderProps) {
  const [state, setState] = useState<State>(() => ({
    preference: initialPreference ?? 'system',
    ready: initialPreference !== undefined,
    pendingProfileSync: false,
  }));
  const systemScheme = useColorScheme();

  useEffect(() => {
    if (initialPreference !== undefined) return;
    let cancelled = false;
    void (async () => {
      const [stored, pending] = await Promise.all([readString(STORAGE_KEYS.theme), readFlag(STORAGE_KEYS.themePendingSync)]);
      if (cancelled) return;
      const preference = isThemePreference(stored) ? stored : 'system';
      applyNativeAppearance(preference);
      setState({ preference, ready: true, pendingProfileSync: pending });
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPreference]);

  const scheme: ColorScheme =
    state.preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : state.preference;
  const colors = palettes[scheme];

  useEffect(() => {
    // Root view background (avoids white flashes behind transitions / keyboard on native).
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.colorScheme = scheme;
      document.body.style.backgroundColor = colors.background;
    }
  }, [colors.background, scheme]);

  const setPreference = useCallback((next: ThemePreference, options?: { source?: 'user' | 'profile' }) => {
    const fromUser = (options?.source ?? 'user') === 'user';
    applyNativeAppearance(next);
    setState((s) => ({ ...s, preference: next, pendingProfileSync: fromUser }));
    void writeString(STORAGE_KEYS.theme, next);
    void writeFlag(STORAGE_KEYS.themePendingSync, fromUser);
  }, []);

  const markProfileSynced = useCallback(() => {
    void writeFlag(STORAGE_KEYS.themePendingSync, false);
    setState((s) => (s.pendingProfileSync ? { ...s, pendingProfileSync: false } : s));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      isDark: scheme === 'dark',
      colors,
      preference: state.preference,
      setPreference,
      pendingProfileSync: state.pendingProfileSync,
      markProfileSynced,
      ready: state.ready,
      fontsAvailable,
    }),
    [scheme, colors, state, setPreference, markProfileSynced, fontsAvailable],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
