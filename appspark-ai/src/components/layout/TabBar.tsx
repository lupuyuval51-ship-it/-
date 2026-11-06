import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ScalePressable } from '@/components/ui/Pressable';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radius, space } from '@/theme/tokens';

/** Floating tab bar container: one elevated pill holding the triggers. */
export function AppTabBar({ children, style, ...rest }: TabListProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
      <View
        {...rest}
        accessibilityRole="tablist"
        style={[styles.bar, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }, Platform.OS === 'web' && styles.webShadow, style]}>
        {children}
      </View>
    </View>
  );
}

export interface TabButtonProps extends TabTriggerSlotProps {
  icon: IconName;
  label: string;
}

/** A single tab trigger: icon, label and an accent dot when focused. */
export const TabButton = forwardRef<View, TabButtonProps>(function TabButton({ icon, label, isFocused, style, ...rest }, ref) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <ScalePressable
      ref={ref}
      {...rest}
      haptic
      pressedScale={0.94}
      accessibilityRole="tab"
      accessibilityState={{ selected: Boolean(isFocused) }}
      accessibilityLabel={t('a11y.tab', { name: label })}
      style={[style as object, styles.item]}>
      <Icon name={icon} size={21} color={isFocused ? 'text' : 'textTertiary'} strokeWidth={isFocused ? 2 : 1.75} />
      <AppText variant="caption" weight={isFocused ? 'semibold' : 'medium'} color={isFocused ? 'text' : 'textTertiary'} align="center">
        {label}
      </AppText>
      <View style={[styles.dot, { backgroundColor: isFocused ? colors.accent : 'transparent' }]} />
    </ScalePressable>
  );
});

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.sm,
  },
  webShadow: {
    boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
  } as object,
  item: {
    flex: 1,
    height: 56,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
