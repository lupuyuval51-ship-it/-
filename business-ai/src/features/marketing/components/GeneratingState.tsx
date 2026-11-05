import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/lib/a11y';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export interface GeneratingStateProps {
  /** Translated name of what is being generated (the kind). */
  kindTitle: string;
  testID?: string;
}

/** Calm pending state while the AI writes a marketing draft (no fake progress). */
export function GeneratingState({ kindTitle, testID }: GeneratingStateProps) {
  const t = useT();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  return (
    <View style={styles.root} accessibilityLiveRegion="polite" accessible accessibilityLabel={`${t('marketing.new.generatingTitle')}. ${kindTitle}`} testID={testID}>
      <View style={styles.titleRow}>
        {reduced ? null : <ActivityIndicator size="small" color={colors.textSecondary} />}
        <Text variant="heading" style={styles.flex}>
          {t('marketing.new.generatingTitle')}
        </Text>
      </View>
      <Text variant="callout" tone="secondary">
        {kindTitle}
      </Text>
      <Text variant="body" tone="secondary">
        {t('marketing.new.generatingBody')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2], paddingVertical: spacing[4] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  flex: { flex: 1 },
});
