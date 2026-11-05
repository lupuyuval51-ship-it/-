import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PLAN_SECTION_KEYS, type PlanSectionKey } from '@domain/plan';
import { Icon, Section, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/lib/a11y';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { useNow } from '../hooks';
import { elapsedSince, formatElapsed } from '../logic';

export interface GeneratingViewProps {
  startedAt: string;
  /** Sections already written into the generating version (real progress, may be empty). */
  writtenKeys: readonly PlanSectionKey[];
}

/**
 * Calm progress while the plan is written in the background: the 15 section titles with their
 * real state (written / writing), elapsed time and a note that it is safe to leave.
 */
export function GeneratingView({ startedAt, writtenKeys }: GeneratingViewProps) {
  const t = useT();
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const now = useNow(1000);
  const elapsed = formatElapsed(elapsedSince(startedAt, now));
  const written = new Set(writtenKeys);

  return (
    <View style={styles.root} testID="plan-generating">
      <View style={styles.intro}>
        <View style={styles.titleRow}>
          {reduced ? null : <ActivityIndicator size="small" color={colors.textSecondary} />}
          <Text variant="title" style={styles.flex}>
            {t('plan.generating.title')}
          </Text>
        </View>
        <Text variant="body" tone="secondary">
          {t('plan.generating.body')}
        </Text>
        <Text
          variant="callout"
          tone="secondary"
          numeric
          accessibilityLabel={t('plan.generating.a11yProgress', { time: elapsed })}
          accessibilityLiveRegion="none"
        >
          {t('plan.generating.elapsed', { time: elapsed })}
        </Text>
      </View>

      <Section separated>
        {PLAN_SECTION_KEYS.map((key) => {
          const done = written.has(key);
          const title = t(`plan.sections.${key}`);
          const state = done ? t('plan.generating.written') : t('plan.generating.writing');
          return (
            <View key={key} style={styles.row} accessible accessibilityLabel={t('plan.a11y.sectionState', { title, state })}>
              <Text variant="body" tone={done ? 'default' : 'secondary'} style={styles.flex}>
                {title}
              </Text>
              {done ? (
                <Icon name="check" size={16} tone="accent" />
              ) : (
                <Text variant="caption" tone="secondary">
                  {state}
                </Text>
              )}
            </View>
          );
        })}
      </Section>

      <Text variant="callout" tone="secondary">
        {t('plan.generating.background')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[8] },
  intro: { gap: spacing[3] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 44, paddingVertical: spacing[2] },
});
