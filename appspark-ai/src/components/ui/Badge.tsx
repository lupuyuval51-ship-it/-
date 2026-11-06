import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** Small, quiet label for metadata (difficulty, status, source). */
export function Badge({ label, tone = 'neutral', icon, style }: BadgeProps) {
  const { colors } = useTheme();
  const background =
    tone === 'accent' ? colors.accentSoft : tone === 'success' ? colors.successSoft : tone === 'warning' ? colors.warningSoft : tone === 'danger' ? colors.dangerSoft : colors.surfaceElevated;
  const color = tone === 'accent' ? 'accent' : tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : tone === 'danger' ? 'danger' : 'textSecondary';
  return (
    <View style={[styles.base, { backgroundColor: background, borderColor: tone === 'neutral' ? colors.border : 'transparent' }, style]}>
      {icon ? <Icon name={icon} size={12} color={color} /> : null}
      <AppText variant="caption" weight="medium" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
});
