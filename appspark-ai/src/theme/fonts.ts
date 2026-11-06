import { Platform } from 'react-native';

/**
 * Font families. The app bundles Heebo (sans, Hebrew + Latin) and
 * Frank Ruhl Libre (editorial serif, Hebrew + Latin). Both are loaded in the
 * root layout with `useFonts`; while they load, the platform fallbacks below keep
 * text readable instead of blank.
 */
export const fonts = {
  sans: 'Heebo_400Regular',
  sansMedium: 'Heebo_500Medium',
  sansSemiBold: 'Heebo_600SemiBold',
  sansBold: 'Heebo_700Bold',
  serif: 'FrankRuhlLibre_500Medium',
  serifBold: 'FrankRuhlLibre_700Bold',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, SFMono-Regular, Menlo, monospace' }) as string,
} as const;

export type FontWeightKey = 'regular' | 'medium' | 'semibold' | 'bold';

export function sansFor(weight: FontWeightKey): string {
  switch (weight) {
    case 'medium':
      return fonts.sansMedium;
    case 'semibold':
      return fonts.sansSemiBold;
    case 'bold':
      return fonts.sansBold;
    default:
      return fonts.sans;
  }
}
