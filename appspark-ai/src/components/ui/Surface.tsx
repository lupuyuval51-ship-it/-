import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius as radii, space } from '@/theme/tokens';

export interface SurfaceProps extends ViewProps {
  variant?: 'surface' | 'elevated' | 'selected' | 'transparent' | 'accentSoft';
  bordered?: boolean;
  radius?: keyof typeof radii;
  padding?: keyof typeof space | 0;
}

export function Surface({ variant = 'surface', bordered = true, radius = 'lg', padding = 'lg', style, ...rest }: SurfaceProps) {
  const { colors } = useTheme();
  const backgroundColor =
    variant === 'surface'
      ? colors.surface
      : variant === 'elevated'
        ? colors.surfaceElevated
        : variant === 'selected'
          ? colors.surfaceSelected
          : variant === 'accentSoft'
            ? colors.accentSoft
            : 'transparent';
  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor,
          borderRadius: radii[radius],
          padding: padding === 0 ? 0 : space[padding],
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
          borderColor: variant === 'accentSoft' ? colors.accentBorder : colors.border,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
