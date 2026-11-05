import { Heebo_400Regular } from '@expo-google-fonts/heebo/400Regular';
import { Heebo_500Medium } from '@expo-google-fonts/heebo/500Medium';
import { Heebo_600SemiBold } from '@expo-google-fonts/heebo/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import Feather from '@expo/vector-icons/Feather';
import type { TextStyle } from 'react-native';
import type { Locale } from '@/i18n/types';
import { fontFamilies, type FontWeight } from './tokens';

/**
 * Font map for `useFonts`. Only the six faces we use are bundled (per-weight subpath imports),
 * plus the Feather icon font so icons never flash on web.
 */
export const FONT_SOURCES = {
  [fontFamilies.he[400]]: Heebo_400Regular,
  [fontFamilies.he[500]]: Heebo_500Medium,
  [fontFamilies.he[600]]: Heebo_600SemiBold,
  [fontFamilies.en[400]]: Inter_400Regular,
  [fontFamilies.en[500]]: Inter_500Medium,
  [fontFamilies.en[600]]: Inter_600SemiBold,
  ...Feather.font,
};

const SYSTEM_WEIGHT: Record<FontWeight, TextStyle['fontWeight']> = { 400: '400', 500: '500', 600: '600' };

/**
 * Font style for a language and weight. With custom fonts loaded, the weight is encoded in the
 * family (Android cannot synthesize weights for custom families), so `fontWeight` stays normal.
 */
export function fontStyleFor(locale: Locale, weight: FontWeight, fontsAvailable: boolean): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  if (!fontsAvailable) return { fontWeight: SYSTEM_WEIGHT[weight] };
  return { fontFamily: fontFamilies[locale][weight], fontWeight: 'normal' };
}
