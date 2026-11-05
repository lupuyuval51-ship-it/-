import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radii, spacing } from '@/theme/tokens';
import { Icon } from './Icon';
import { Text } from './Text';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Strike-through + secondary tone for the label when checked (task lists). */
  strikeWhenChecked?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Checkbox({ checked, onChange, label, description, disabled = false, strikeWhenChecked = false, style, testID }: CheckboxProps) {
  const { colors } = useTheme();
  const struck = strikeWhenChecked && checked;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={description ? `${label}. ${description}` : label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      testID={testID}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }, style]}
    >
      <View
        style={[
          styles.box,
          checked ? { backgroundColor: colors.accent, borderColor: colors.accent } : { backgroundColor: colors.surface, borderColor: colors.borderStrong },
        ]}
      >
        {checked ? <Icon name="check" size={15} tone="onAccent" /> : null}
      </View>
      <View style={styles.text}>
        <Text variant="body" tone={struck ? 'secondary' : 'default'} style={struck ? styles.struck : null}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const BOX = 22;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], minHeight: layout.touchTarget, paddingVertical: (layout.touchTarget - 24) / 2 },
  box: {
    width: BOX,
    height: BOX,
    marginTop: 1,
    borderRadius: radii.control,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  struck: { textDecorationLine: 'line-through' },
});
