import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radii } from '@/theme/tokens';

export interface ProgressBarProps {
  /** 0…1 (clamped). */
  value: number;
  /** accent (default) for progress; warning/danger for limits nearly/fully used. */
  tone?: 'accent' | 'warning' | 'danger';
  /** What is progressing, for screen readers. */
  accessibilityLabel?: string;
  /** Default 4. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Thin, calm progress line. */
export function ProgressBar({ value, tone = 'accent', accessibilityLabel, height = 4, style, testID }: ProgressBarProps) {
  const { colors } = useTheme();
  const t = useT();
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const percent = Math.round(clamped * 100);
  const fill = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.accent;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: t('common.a11y.progress', { value: percent }) }}
      testID={testID}
      style={[styles.track, { height, backgroundColor: colors.border }, style]}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { alignSelf: 'stretch', borderRadius: radii.control, overflow: 'hidden', flexDirection: 'row' },
  fill: { height: '100%', borderRadius: radii.control },
});
