import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, type SpacingKey } from '@/theme/tokens';

export interface SurfaceProps {
  children?: ReactNode;
  /** Inner padding (spacing key). Default 4 (16pt). */
  padding?: SpacingKey;
  /** `raised` (surface color + hairline, default) or `sunken` (backgroundAlt, no border). */
  tone?: 'raised' | 'sunken';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A quiet container. Use rarely — never nest surfaces. */
export function Surface({ children, padding = 4, tone = 'raised', style, testID }: SurfaceProps) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        { padding: spacing[padding] },
        tone === 'raised'
          ? { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }
          : { backgroundColor: colors.backgroundAlt },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.surface, alignSelf: 'stretch' },
});
