import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { DENSE_MAX_FONT_SCALE, layout, radii, spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface SegmentOption<V extends string> {
  value: V;
  label: string;
  /** Screen-reader label when `label` is abbreviated. */
  accessibilityLabel?: string;
}

export interface SegmentedControlProps<V extends string> {
  options: readonly SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  /** Stretch segments to fill the width (default true). False hugs content. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** 2–4 mutually exclusive options. Calm track; the selected segment is a raised surface. */
export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
  fullWidth = true,
  style,
  testID,
}: SegmentedControlProps<V>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        styles.track,
        { backgroundColor: colors.backgroundAlt, alignSelf: fullWidth ? 'stretch' : 'flex-start', opacity: disabled ? 0.4 : 1 },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => {
              if (!selected) onChange(option.value);
            }}
            hitSlop={{ top: 4, bottom: 4 }}
            testID={testID ? `${testID}-${option.value}` : undefined}
            style={[
              styles.segment,
              fullWidth ? styles.segmentFill : null,
              selected
                ? { backgroundColor: colors.surface, borderColor: colors.borderStrong }
                : { backgroundColor: 'transparent', borderColor: 'transparent' },
            ]}
          >
            <Text
              variant="callout"
              weight={selected ? 500 : 400}
              tone={selected ? 'default' : 'secondary'}
              align="center"
              numberOfLines={1}
              maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radii.control,
    padding: 2,
    minHeight: layout.compactControlHeight,
  },
  segment: {
    minHeight: layout.compactControlHeight - 4,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radii.control - 1,
    borderWidth: 1,
  },
  segmentFill: { flex: 1 },
});
