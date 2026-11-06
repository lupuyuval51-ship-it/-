import { useEffect } from 'react';
import { StyleSheet, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  round?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Pulsing placeholder block used for loading states. */
export function Skeleton({ width = '100%', height = 16, round = false, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 900 }), -1, true));
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { width, height, backgroundColor: colors.skeleton, borderRadius: round ? height / 2 : radius.sm }, animated, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
