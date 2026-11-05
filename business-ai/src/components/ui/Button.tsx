import { ActivityIndicator, Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radii, spacing, type Palette } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive';

export interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  /**
   * primary: the one main action of a screen (accent). secondary: hairline outline.
   * quiet: text-only (links, tertiary actions). destructive: outline with danger text.
   */
  variant?: ButtonVariant;
  /** `regular` 48pt (default) or `compact` 36pt (hit area still ≥ 44pt). */
  size?: 'regular' | 'compact';
  loading?: boolean;
  disabled?: boolean;
  /** Leading icon (sparingly). */
  icon?: IconName;
  /** Stretch to the container width (default for primary buttons in forms is up to the caller). */
  fullWidth?: boolean;
  /** Quiet buttons only: no horizontal padding, aligns with surrounding text. */
  inline?: boolean;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

interface VariantColors {
  background: string;
  pressed: string;
  border: string;
  text: string;
}

function variantColors(variant: ButtonVariant, colors: Palette): VariantColors {
  switch (variant) {
    case 'primary':
      return { background: colors.accent, pressed: colors.accentPressed, border: colors.accent, text: colors.onAccent };
    case 'secondary':
      return { background: 'transparent', pressed: colors.backgroundAlt, border: colors.borderStrong, text: colors.text };
    case 'destructive':
      return { background: 'transparent', pressed: colors.dangerSoft, border: colors.borderStrong, text: colors.danger };
    case 'quiet':
      return { background: 'transparent', pressed: colors.backgroundAlt, border: 'transparent', text: colors.text };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  inline = false,
  accessibilityHint,
  testID,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const c = variantColors(variant, colors);
  const height = size === 'compact' ? layout.compactControlHeight : layout.controlHeight;
  const inactive = disabled || loading;
  const isInline = inline && variant === 'quiet';
  const slop = Math.max(0, (layout.touchTarget - height) / 2);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={isInline ? { top: 12, bottom: 12, left: 8, right: 8 } : slop}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: isInline ? undefined : height,
          paddingHorizontal: isInline ? 0 : size === 'compact' ? spacing[3] : spacing[5],
          backgroundColor: pressed && !isInline ? c.pressed : c.background,
          borderColor: c.border,
          borderWidth: variant === 'quiet' ? 0 : 1,
          opacity: disabled ? 0.4 : isInline && pressed ? 0.6 : 1,
        },
        fullWidth ? styles.fullWidth : styles.hug,
        style,
      ]}
    >
      <View style={[styles.content, loading ? styles.hidden : null]}>
        {icon ? <Icon name={icon} size={size === 'compact' ? 16 : 18} color={c.text} /> : null}
        <Text variant={size === 'compact' ? 'callout' : 'bodyStrong'} weight={500} style={{ color: c.text }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {loading ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator size="small" color={c.text} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  hug: { alignSelf: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  hidden: { opacity: 0 },
  spinner: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, alignItems: 'center', justifyContent: 'center' },
});
