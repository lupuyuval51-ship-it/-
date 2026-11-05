import type { ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useLocale, useTextAlign } from '@/i18n/I18nProvider';
import { fontStyleFor } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import { typography, type FontWeight, type Palette, type TypeVariant } from '@/theme/tokens';

export type TextTone = 'default' | 'secondary' | 'accent' | 'danger' | 'warning' | 'onAccent' | 'inherit';

export interface TextProps extends Omit<RNTextProps, 'style'> {
  /** Type scale step (ARCHITECTURE §7.2). Default `body`. */
  variant?: TypeVariant;
  /** Semantic color. `inherit` leaves color to the parent (nested text). Default `default`. */
  tone?: TextTone;
  /** Overrides the variant's weight (400 / 500 / 600). */
  weight?: FontWeight;
  /** Logical alignment. Default `start` (right in Hebrew, left in English). */
  align?: 'start' | 'center' | 'end';
  /** Tabular figures for numbers that line up (amounts, counts, dates). */
  numeric?: boolean;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

const HEADER_VARIANTS: ReadonlySet<TypeVariant> = new Set(['display', 'title', 'heading']);

export function toneColor(colors: Palette, tone: TextTone): string | undefined {
  switch (tone) {
    case 'default':
      return colors.text;
    case 'secondary':
      return colors.textSecondary;
    case 'accent':
      return colors.accent;
    case 'danger':
      return colors.danger;
    case 'warning':
      return colors.warning;
    case 'onAccent':
      return colors.onAccent;
    case 'inherit':
      return undefined;
  }
}

/**
 * The only text component screens should use. Picks Heebo (Hebrew) or Inter (English) by the
 * current language AND weight, applies the type scale, and aligns to the logical start.
 * Font scaling stays enabled; pass `maxFontSizeMultiplier` only on dense UI.
 */
export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  align = 'start',
  numeric = false,
  style,
  accessibilityRole,
  children,
  ...rest
}: TextProps) {
  const { colors, fontsAvailable } = useTheme();
  const { locale } = useLocale();
  const textAlign = useTextAlign();
  const type = typography[variant];
  const latin = locale === 'en';

  const color = toneColor(colors, tone);
  const base: TextStyle = {
    ...fontStyleFor(locale, weight ?? type.weight, fontsAvailable),
    fontSize: type.fontSize,
    lineHeight: type.lineHeight,
    letterSpacing: latin ? type.letterSpacingLatin : 0,
    textAlign: align === 'center' ? 'center' : align === 'end' ? textAlign.end : textAlign.start,
    ...(color ? { color } : null),
    ...(latin && type.uppercaseLatin ? { textTransform: 'uppercase' as const } : null),
    ...(numeric ? { fontVariant: ['tabular-nums' as const] } : null),
  };

  return (
    <RNText accessibilityRole={accessibilityRole ?? (HEADER_VARIANTS.has(variant) ? 'header' : undefined)} style={[base, style]} {...rest}>
      {children}
    </RNText>
  );
}
