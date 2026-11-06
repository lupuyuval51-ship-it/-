import { forwardRef, useCallback } from 'react';
import { Pressable as RNPressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { tapFeedback } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export interface ScalePressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale applied while pressed. */
  pressedScale?: number;
  haptic?: boolean;
}

/**
 * A Pressable with a subtle press-down scale. Every tappable surface in the app
 * uses it so feedback feels consistent.
 */
export const ScalePressable = forwardRef<View, ScalePressableProps>(function ScalePressable({ style, pressedScale = 0.98, haptic = false, onPressIn, onPressOut, onPress, ...rest }, ref) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const handleIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      scale.set(withTiming(pressedScale, { duration: motion.fast }));
      onPressIn?.(e);
    },
    [onPressIn, pressedScale, scale],
  );
  const handleOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      scale.set(withTiming(1, { duration: motion.base }));
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );
  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (e) => {
      if (haptic) void tapFeedback();
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return <AnimatedPressable ref={ref} {...rest} onPressIn={handleIn} onPressOut={handleOut} onPress={handlePress} style={[animated, style]} />;
});
