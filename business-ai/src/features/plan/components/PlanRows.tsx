import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, ProgressBar, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export interface SectionTocRowProps {
  index: number;
  title: string;
  /** First line of the summary. */
  preview?: string;
  /** Quiet provenance mix ("3 estimates · 2 assumptions"). */
  provenance?: string;
  /** Small trailing note (e.g. "Differs from the current version"). */
  note?: string;
  onPress?: () => void;
  /** Shown instead of the preview when the section is missing. */
  missingLabel?: string;
  testID?: string;
}

/** Table-of-contents row: number, title, first line of the summary, provenance mix. */
export function SectionTocRow({ index, title, preview, provenance, note, onPress, missingLabel, testID }: SectionTocRowProps) {
  const t = useT();
  const { colors } = useTheme();
  const disabled = !onPress;
  const a11yLabel = [t('plan.a11y.sectionRow', { title, preview: preview || missingLabel || '' }), provenance ? t('plan.a11y.provenance', { mix: provenance }) : null, note]
    .filter(Boolean)
    .join('. ');
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
    >
      <Text variant="callout" tone="secondary" numeric style={styles.index}>
        {index}
      </Text>
      <View style={styles.text}>
        <Text variant="bodyStrong" tone={disabled ? 'secondary' : 'default'}>
          {title}
        </Text>
        {preview ? (
          <Text variant="callout" tone="secondary" numberOfLines={2}>
            {preview}
          </Text>
        ) : missingLabel ? (
          <Text variant="callout" tone="secondary">
            {missingLabel}
          </Text>
        ) : null}
        {provenance || note ? (
          <Text variant="caption" tone="secondary" style={styles.meta}>
            {[provenance, note].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>
      {disabled ? null : <Icon name="chevron-right" size={18} tone="secondary" style={styles.chevron} />}
    </Pressable>
  );
}

export interface RoadmapRowProps {
  total: number;
  done: number;
  loading: boolean;
  onPress: () => void;
}

/** Link to the roadmap with real task progress. */
export function RoadmapRow({ total, done, loading, onPress }: RoadmapRowProps) {
  const t = useT();
  const { colors } = useTheme();
  const label = loading ? t('plan.ready.roadmapLoading') : total > 0 ? t('plan.ready.roadmapProgress', { done, total }) : t('plan.ready.roadmapEmpty');
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${t('plan.ready.roadmapRow')}, ${label}`}
      onPress={onPress}
      testID="plan-roadmap-row"
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
    >
      <Icon name="flag" size={18} tone="secondary" style={styles.leadIcon} />
      <View style={styles.text}>
        <Text variant="bodyStrong">{t('plan.ready.roadmapRow')}</Text>
        <Text variant="callout" tone="secondary" numeric>
          {label}
        </Text>
        {total > 0 ? <ProgressBar value={done / total} style={styles.progress} /> : null}
      </View>
      <Icon name="chevron-right" size={18} tone="secondary" style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    marginHorizontal: -spacing[2],
    borderRadius: radii.control,
    minHeight: 56,
  },
  index: { minWidth: 20, paddingTop: 1 },
  leadIcon: { marginTop: 3, width: 20 },
  text: { flex: 1, gap: spacing[1] },
  meta: { marginTop: 2 },
  progress: { marginTop: spacing[2] },
  chevron: { marginTop: 3 },
});
