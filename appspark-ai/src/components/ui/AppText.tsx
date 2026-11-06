import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useI18n } from '@/i18n';
import { fonts, sansFor, type FontWeightKey } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { type Palette, type TypeVariant, type as typeScale } from '@/theme/tokens';

export type TextColor = keyof Pick<
  Palette,
  'text' | 'textSecondary' | 'textTertiary' | 'accent' | 'danger' | 'success' | 'warning' | 'textOnAccent'
>;

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  weight?: FontWeightKey;
  color?: TextColor;
  /** Use the editorial serif. Defaults to true for display and title variants. */
  serif?: boolean;
  align?: 'start' | 'center' | 'end';
  /** Force a writing direction, e.g. for English brand names inside Hebrew UI. */
  forceLtr?: boolean;
}

export function AppText({
  variant = 'body',
  weight,
  color = 'text',
  serif,
  align = 'start',
  forceLtr,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const { isRTL, locale } = useI18n();
  const useSerif = serif ?? (variant === 'display' || variant === 'title');
  const resolvedWeight: FontWeightKey = weight ?? (variant === 'display' || variant === 'title' || variant === 'heading' ? 'semibold' : 'regular');

  const fontFamily = variant === 'mono' ? fonts.mono : useSerif ? (resolvedWeight === 'bold' || resolvedWeight === 'semibold' ? fonts.serifBold : fonts.serif) : sansFor(resolvedWeight);

  const rtl = forceLtr ? false : isRTL;
  // 'left' means "start" on both native (I18nManager) and web (react-native-web
  // emits [dir]-scoped rules), so logical alignment stays correct in RTL.
  const textAlign: TextStyle['textAlign'] = align === 'center' ? 'center' : align === 'end' ? 'right' : 'left';

  return (
    <Text
      {...(Platform.OS === 'web' ? { lang: forceLtr ? 'en' : locale, dir: forceLtr ? 'ltr' : undefined } : {})}
      {...rest}
      style={[
        styles.base,
        typeScale[variant],
        { fontFamily, color: colors[color], textAlign, writingDirection: rtl ? 'rtl' : 'ltr' },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
