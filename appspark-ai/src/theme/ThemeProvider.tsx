import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { usePreferences } from '@/store/preferences';

import { palettes, type ColorScheme, type Palette } from './tokens';

export interface Theme {
  scheme: ColorScheme;
  isDark: boolean;
  colors: Palette;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const mode = usePreferences((s) => s.themeMode);

  const scheme: ColorScheme = mode === 'system' ? (system === 'light' ? 'light' : 'dark') : mode;

  const value = useMemo<Theme>(
    () => ({ scheme, isDark: scheme === 'dark', colors: palettes[scheme] }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback keeps components usable in isolated tests.
    return { scheme: 'dark', isDark: true, colors: palettes.dark };
  }
  return ctx;
}

/**
 * Derives a muted tint for an idea or category from its hue. Used for the
 * identity tiles so each idea has its own colour without shouting.
 */
export function identityTint(hue: number, scheme: ColorScheme): { background: string; foreground: string; border: string } {
  if (scheme === 'dark') {
    return {
      background: `hsl(${hue}, 26%, 19%)`,
      foreground: `hsl(${hue}, 62%, 72%)`,
      border: `hsla(${hue}, 40%, 60%, 0.22)`,
    };
  }
  return {
    background: `hsl(${hue}, 42%, 92%)`,
    foreground: `hsl(${hue}, 48%, 32%)`,
    border: `hsla(${hue}, 40%, 40%, 0.2)`,
  };
}
