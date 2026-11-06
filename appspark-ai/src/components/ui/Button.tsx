import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { hit, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { ScalePressable } from './Pressable';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconEnd?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'secondary'
        ? colors.surfaceElevated
        : variant === 'danger'
          ? colors.dangerSoft
          : 'transparent';
  const textColor = variant === 'primary' ? 'textOnAccent' : variant === 'danger' ? 'danger' : 'text';
  const borderColor = variant === 'outline' ? colors.borderStrong : 'transparent';
  const height = size === 'sm' ? 36 : size === 'lg' ? 52 : hit;
  const paddingHorizontal = size === 'sm' ? space.md : size === 'lg' ? space.xxl : space.xl;
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <ScalePressable
      onPress={onPress}
      disabled={isDisabled}
      haptic={variant === 'primary'}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={[
        styles.base,
        { backgroundColor: background, borderColor, height, paddingHorizontal, opacity: isDisabled ? 0.55 : 1 },
        variant === 'outline' && styles.outline,
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textOnAccent : colors.text} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={iconSize} color={textColor} /> : null}
          <AppText variant={size === 'sm' ? 'bodySmall' : 'body'} weight="semibold" color={textColor} align="center">
            {label}
          </AppText>
          {iconEnd ? <Icon name={iconEnd} size={iconSize} color={textColor} /> : null}
        </View>
      )}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderWidth: 0,
  },
  outline: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
