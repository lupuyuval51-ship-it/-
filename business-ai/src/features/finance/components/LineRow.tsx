import { Pressable, StyleSheet, View } from 'react-native';
import type { Basis } from '@domain/plan';
import { BasisTag, Icon, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';

export interface LineRowProps {
  label: string;
  value: string;
  /** Under the label, after the provenance tag (category, unit economics). */
  detail?: string;
  basis: Basis;
  onPress: () => void;
  testID?: string;
}

/** A finance line in a list: label, provenance, amount, chevron. Opens the editor. */
export function LineRow({ label, value, detail, basis, onPress, testID }: LineRowProps) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[label, value, detail, t('common.basisA11y', { basis: t(`common.basis.${basis}`) })].filter(Boolean).join(', ')}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
    >
      <View style={styles.text}>
        <Text variant="body">{label}</Text>
        <View style={styles.meta}>
          <BasisTag basis={basis} />
          {detail ? (
            <Text variant="caption" tone="secondary" numeric style={styles.detail}>
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
      <Text variant="callout" numeric numberOfLines={1} style={styles.value}>
        {value}
      </Text>
      <Icon name="chevron-right" size={18} tone="secondary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    marginHorizontal: -spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radii.control,
  },
  text: { flex: 1, gap: spacing[1] },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing[2] },
  detail: { flexShrink: 1 },
  value: { maxWidth: '45%' },
});
