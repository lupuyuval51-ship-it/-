import { ActivityIndicator, Pressable, StyleSheet, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radii } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import type { TextTone } from './Text';

export interface IconButtonProps {
  icon: IconName;
  /** Required: icon-only controls must be labelled for screen readers. */
  accessibilityLabel: string;
  onPress?: (event: GestureResponderEvent) => void;
  /** `quiet` (default, no chrome) or `secondary` (hairline outline). */
  variant?: 'quiet' | 'secondary';
  /** 44pt (default) or 36pt visual size with a 44pt hit area. */
  size?: 'regular' | 'compact';
  tone?: Exclude<TextTone, 'inherit' | 'onAccent'>;
  disabled?: boolean;
  loading?: boolean;
  /** Force RTL mirroring on/off (directional icons mirror automatically). */
  mirror?: boolean;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'quiet',
  size = 'regular',
  tone = 'default',
  disabled = false,
  loading = false,
  mirror,
  accessibilityHint,
  testID,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const box = size === 'compact' ? layout.compactControlHeight : layout.touchTarget;
  const slop = Math.max(0, (layout.touchTarget - box) / 2);
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={slop}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          width: box,
          height: box,
          backgroundColor: pressed ? colors.backgroundAlt : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.borderStrong,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : (
        <Icon name={icon} size={size === 'compact' ? 18 : 20} tone={tone} mirror={mirror} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.control, alignItems: 'center', justifyContent: 'center' },
});
