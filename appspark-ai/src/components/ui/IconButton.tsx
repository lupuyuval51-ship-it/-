import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius } from '@/theme/tokens';

import type { TextColor } from './AppText';
import { Icon, type IconName } from './Icon';
import { ScalePressable } from './Pressable';

export interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: 'plain' | 'surface' | 'accent';
  size?: number;
  color?: TextColor;
  filled?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({ icon, onPress, accessibilityLabel, variant = 'surface', size = 20, color, filled, disabled, style, testID }: IconButtonProps) {
  const { colors } = useTheme();
  const background = variant === 'surface' ? colors.surfaceElevated : variant === 'accent' ? colors.accent : 'transparent';
  const resolvedColor: TextColor = color ?? (variant === 'accent' ? 'textOnAccent' : 'text');
  return (
    <ScalePressable
      onPress={onPress}
      disabled={disabled}
      haptic
      pressedScale={0.92}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.base, { backgroundColor: background, borderColor: colors.border, opacity: disabled ? 0.5 : 1 }, variant === 'surface' && styles.bordered, style]}>
      <Icon name={icon} size={size} color={resolvedColor} filled={filled} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: hit,
    height: hit,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
