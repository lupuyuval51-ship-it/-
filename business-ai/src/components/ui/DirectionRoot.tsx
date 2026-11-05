import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { useLocale } from '@/i18n/I18nProvider';

/** react-native-web accepts `dir`/`lang` on View; React Native's types do not declare them. */
type WebDirProps = ViewProps & { dir?: 'ltr' | 'rtl'; lang?: string };
const WebView = View as unknown as (props: WebDirProps) => ReactNode;

export interface DirectionRootProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Establishes the writing direction for react-native-web, which resolves logical styles
 * (marginStart, paddingEnd, start/end) from the nearest `dir` attribute's React context — not
 * from <html dir>. Wrap the app root and every portal (Modal) with it. A plain View on native,
 * where I18nManager already drives layout.
 */
export function DirectionRoot({ children, style, testID }: DirectionRootProps) {
  const { locale, isRTL } = useLocale();
  if (Platform.OS !== 'web') {
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <WebView dir={isRTL ? 'rtl' : 'ltr'} lang={locale} style={style} testID={testID}>
      {children}
    </WebView>
  );
}
