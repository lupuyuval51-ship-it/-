import type { NativeStackNavigationOptions } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useLocale } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/lib/a11y';
import { fontStyleFor } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/tokens';

/**
 * Minimal header for stack screens: app background, hairline bottom border (no shadow), title in
 * the heading font of the current language, icon-only back button (mirrored by the native header
 * in RTL; on web through the navigation LocaleProvider direction).
 */
export function useStackScreenOptions(): NativeStackNavigationOptions {
  const { colors, fontsAvailable } = useTheme();
  const { locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const font = fontStyleFor(locale, typography.heading.weight, fontsAvailable);
  return {
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerBackground: () => (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]} />
    ),
    headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: font.fontFamily, fontSize: typography.heading.fontSize, color: colors.text },
    headerBackButtonDisplayMode: 'minimal',
    headerBackTitle: undefined,
    contentStyle: { backgroundColor: colors.background },
    animation: reduceMotion ? 'none' : 'default',
  };
}
