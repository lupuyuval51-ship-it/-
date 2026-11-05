import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useT } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/lib/a11y';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export interface LoadingStateProps {
  /** list: rows (title + subtitle) · text: paragraph lines · screen: title + paragraph + rows. */
  variant?: 'list' | 'text' | 'screen';
  /** Number of rows / lines. Default 3. */
  count?: number;
  /** Screen-reader label. Default "Loading". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function Bar({ width, height = 12, color }: { width: DimensionValue; height?: number; color: string }) {
  return <View style={{ width, height, borderRadius: radii.control, backgroundColor: color }} />;
}

/** Quiet skeleton with a slow opacity pulse (static when reduce motion is on). */
export function LoadingState({ variant = 'list', count = 3, accessibilityLabel, style, testID }: LoadingStateProps) {
  const { colors } = useTheme();
  const t = useT();
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, opacity]);

  const tone = colors.backgroundAlt;
  const rows = Array.from({ length: count }, (_, i) => i);
  const widths: DimensionValue[] = ['72%', '56%', '64%', '48%', '68%'];

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? t('common.a11y.loading')}
      accessibilityState={{ busy: true }}
      testID={testID}
      style={[styles.container, { opacity }, style]}
    >
      {variant === 'screen' ? (
        <View style={styles.block}>
          <Bar width="52%" height={24} color={tone} />
          <Bar width="88%" color={tone} />
          <Bar width="70%" color={tone} />
        </View>
      ) : null}
      {variant === 'text'
        ? rows.map((i) => <Bar key={i} width={i === count - 1 ? '58%' : '100%'} color={tone} />)
        : rows.map((i) => (
            <View key={i} style={styles.row}>
              <Bar width={widths[i % widths.length] ?? '60%'} height={14} color={tone} />
              <Bar width="34%" height={10} color={tone} />
            </View>
          ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[5], paddingVertical: spacing[4], alignSelf: 'stretch' },
  block: { gap: spacing[3], marginBottom: spacing[2] },
  row: { gap: spacing[2] },
});
