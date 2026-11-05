import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Short value at the end (e.g. "₪1,200", "Hebrew"). */
  value?: string;
  /** Leading icon (sparingly). */
  icon?: IconName;
  onPress?: (event: GestureResponderEvent) => void;
  /** Show a chevron (mirrored in RTL). Default: true when `onPress` is set. */
  chevron?: boolean;
  /** Custom trailing element (replaces value + chevron). */
  trailing?: ReactNode;
  /** Danger tone for the title (destructive rows). */
  destructive?: boolean;
  disabled?: boolean;
  /** Tabular figures for the value. */
  numericValue?: boolean;
  accessibilityHint?: string;
  /** `button` (default for pressable rows) or `link` (navigates). */
  accessibilityRole?: 'button' | 'link';
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function ListRow({
  title,
  subtitle,
  value,
  icon,
  onPress,
  chevron,
  trailing,
  destructive = false,
  disabled = false,
  numericValue = false,
  accessibilityHint,
  accessibilityRole,
  testID,
  style,
}: ListRowProps) {
  const { colors } = useTheme();
  const showChevron = chevron ?? !!onPress;
  const content = (
    <>
      {icon ? <Icon name={icon} size={20} tone={destructive ? 'danger' : 'secondary'} /> : null}
      <View style={styles.text}>
        <Text variant="body" tone={destructive ? 'danger' : 'default'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (
        <>
          {value ? (
            <Text variant="callout" tone="secondary" numeric={numericValue} numberOfLines={1} style={styles.value}>
              {value}
            </Text>
          ) : null}
          {showChevron ? <Icon name="chevron-right" size={18} tone="secondary" /> : null}
        </>
      )}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, style]} testID={testID} accessible accessibilityLabel={value ? `${title}, ${value}` : title}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        styles.pressable,
        { backgroundColor: pressed ? colors.backgroundAlt : 'transparent', opacity: disabled ? 0.4 : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  pressable: {
    marginHorizontal: -spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radii.control,
  },
  text: { flex: 1, gap: 2 },
  value: { maxWidth: '45%' },
});
