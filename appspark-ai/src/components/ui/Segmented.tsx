import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { ScalePressable } from './Pressable';

export interface Segment<V extends string> {
  value: V;
  label: string;
  count?: number;
}

export interface SegmentedProps<V extends string> {
  segments: readonly Segment<V>[];
  value: V;
  onChange: (value: V) => void;
}

/** Compact segmented control used for in-screen tabs. */
export function Segmented<V extends string>({ segments, value, onChange }: SegmentedProps<V>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} accessibilityRole="tablist">
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <ScalePressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            haptic
            pressedScale={0.97}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
            <AppText variant="bodySmall" weight={selected ? 'semibold' : 'medium'} color={selected ? 'text' : 'textSecondary'} align="center">
              {segment.label}
              {typeof segment.count === 'number' ? ` · ${segment.count}` : ''}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
});
