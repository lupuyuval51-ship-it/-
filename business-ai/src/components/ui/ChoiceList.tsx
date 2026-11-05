import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ChoiceListProps<V extends string> {
  options: readonly ChoiceOption<V>[];
  /** Selected value, or null for none. */
  value: V | null;
  onChange: (value: V) => void;
  /** Group label read by screen readers (visible label is up to the caller). */
  accessibilityLabel?: string;
  /** Translated error shown under the list. */
  error?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Single-select list of option rows (radio semantics). Selected row: accent outline + check. */
export function ChoiceList<V extends string>({ options, value, onChange, accessibilityLabel, error, style, testID }: ChoiceListProps<V>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[styles.list, style]} testID={testID}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.description ? `${option.label}. ${option.description}` : option.label}
            accessibilityState={{ checked: selected, disabled: option.disabled }}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
            testID={testID ? `${testID}-${option.value}` : undefined}
            style={({ pressed }) => [
              styles.row,
              {
                borderColor: selected ? colors.accent : colors.borderStrong,
                backgroundColor: selected ? colors.accentSoft : pressed ? colors.backgroundAlt : colors.surface,
                opacity: option.disabled ? 0.4 : 1,
              },
            ]}
          >
            <View style={styles.text}>
              <Text variant="body" weight={selected ? 500 : 400}>
                {option.label}
              </Text>
              {option.description ? (
                <Text variant="caption" tone="secondary">
                  {option.description}
                </Text>
              ) : null}
            </View>
            <View style={styles.indicator}>{selected ? <Icon name="check" size={18} tone="accent" /> : null}</View>
          </Pressable>
        );
      })}
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing[2], alignSelf: 'stretch' },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderRadius: radii.control,
  },
  text: { flex: 1, gap: 2 },
  indicator: { width: 20, alignItems: 'center' },
});
