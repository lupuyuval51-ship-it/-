import { StyleSheet, View } from 'react-native';

import { space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Chip } from './Chip';
import type { IconName } from './Icon';

export interface Option<V extends string> {
  value: V;
  label: string;
  icon?: IconName;
}

interface BaseProps<V extends string> {
  label?: string;
  hint?: string;
  options: readonly Option<V>[];
  size?: 'sm' | 'md';
  testID?: string;
}

function Frame({ label, hint, children, testID }: { label?: string; hint?: string; children: React.ReactNode; testID?: string }) {
  return (
    <View style={styles.group} testID={testID}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="bodySmall" weight="medium" color="textSecondary">
            {label}
          </AppText>
          {hint ? (
            <AppText variant="caption" color="textTertiary">
              {hint}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <View style={styles.wrap}>{children}</View>
    </View>
  );
}

export interface OptionGroupProps<V extends string> extends BaseProps<V> {
  value: V | null;
  onChange: (value: V) => void;
  /** Allow tapping the selected option again to clear it. */
  clearable?: boolean;
  onClear?: () => void;
}

/** Labelled group of chips for single selection. */
export function OptionGroup<V extends string>({ label, hint, options, size = 'md', testID, value, onChange, clearable, onClear }: OptionGroupProps<V>) {
  return (
    <Frame label={label} hint={hint} testID={testID}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Chip
            key={option.value}
            label={option.label}
            icon={option.icon}
            size={size}
            selected={selected}
            onPress={() => {
              if (selected && clearable) onClear?.();
              else onChange(option.value);
            }}
          />
        );
      })}
    </Frame>
  );
}

export interface MultiOptionGroupProps<V extends string> extends BaseProps<V> {
  value: readonly V[];
  onChange: (value: V[]) => void;
}

/** Labelled group of chips for multiple selection. */
export function MultiOptionGroup<V extends string>({ label, hint, options, size = 'md', testID, value, onChange }: MultiOptionGroupProps<V>) {
  return (
    <Frame label={label} hint={hint} testID={testID}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <Chip
            key={option.value}
            label={option.label}
            icon={option.icon}
            size={size}
            selected={selected}
            onPress={() => onChange(selected ? value.filter((v) => v !== option.value) : [...value, option.value])}
          />
        );
      })}
    </Frame>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: space.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});
