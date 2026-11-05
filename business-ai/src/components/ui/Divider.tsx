import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, type SpacingKey } from '@/theme/tokens';

export interface DividerProps {
  /** Vertical margin around the line (spacing scale key). Default 0. */
  spacing?: SpacingKey;
  style?: StyleProp<ViewStyle>;
}

/** Hairline separator. */
export function Divider({ spacing: space = 0, style }: DividerProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing[space] }, style]}
    />
  );
}
