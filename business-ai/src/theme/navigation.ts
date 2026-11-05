import type { Theme } from 'expo-router';
import type { Locale } from '@/i18n/types';
import { fontStyleFor } from './fonts';
import type { ColorScheme, Palette } from './tokens';

/** Theme for expo-router's <ThemeProvider> (React Navigation): headers, tab bars, card backgrounds. */
export function buildNavigationTheme(scheme: ColorScheme, colors: Palette, locale: Locale, fontsAvailable: boolean): Theme {
  const font = (weight: 400 | 500 | 600) => {
    const style = fontStyleFor(locale, weight, fontsAvailable);
    return {
      fontFamily: style.fontFamily ?? 'System',
      fontWeight: (style.fontWeight === 'normal' ? 'normal' : String(style.fontWeight)) as Theme['fonts']['regular']['fontWeight'],
    };
  };
  return {
    dark: scheme === 'dark',
    colors: {
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    fonts: {
      regular: font(400),
      medium: font(500),
      bold: font(600),
      heavy: font(600),
    },
  };
}
