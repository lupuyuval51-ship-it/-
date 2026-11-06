import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { ScalePressable } from './Pressable';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

/** Selectable pill. Selected state uses the accent tint, never a loud fill. */
export function Chip({ label, selected = false, onPress, icon, size = 'md', style, accessibilityLabel, testID }: ChipProps) {
  const { colors } = useTheme();
  return (
    <ScalePressable
      onPress={onPress}
      disabled={!onPress}
      haptic
      pressedScale={0.96}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surfaceElevated,
          borderColor: selected ? colors.accentBorder : colors.border,
        },
        style,
      ]}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 13 : 15} color={selected ? 'accent' : 'textSecondary'} /> : null}
      <AppText variant={size === 'sm' ? 'caption' : 'bodySmall'} weight={selected ? 'semibold' : 'medium'} color={selected ? 'text' : 'textSecondary'}>
        {label}
      </AppText>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  md: {
    paddingHorizontal: space.md + 2,
    height: 36,
  },
  sm: {
    paddingHorizontal: space.sm + 2,
    height: 28,
  },
});
