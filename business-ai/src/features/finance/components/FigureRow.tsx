import { StyleSheet, View } from 'react-native';
import { Text, type TextTone } from '@/components/ui';
import { spacing } from '@/theme/tokens';

export interface FigureRowProps {
  label: string;
  value: string;
  /** Second line under the value (e.g. "About 40 units a month"). */
  detail?: string;
  valueTone?: Extract<TextTone, 'default' | 'secondary' | 'danger' | 'warning'>;
  detailTone?: Extract<TextTone, 'secondary' | 'danger' | 'warning'>;
  /** Emphasize the value (totals). */
  strong?: boolean;
  testID?: string;
}

/** One labelled figure in a typographic list: label at the start, value at the end. No card. */
export function FigureRow({ label, value, detail, valueTone = 'default', detailTone = 'secondary', strong = false, testID }: FigureRowProps) {
  return (
    <View style={styles.row} accessible accessibilityLabel={[label, value, detail].filter(Boolean).join(', ')} testID={testID}>
      <Text variant="callout" tone="secondary" style={styles.label}>
        {label}
      </Text>
      <View style={styles.values}>
        <Text variant={strong ? 'heading' : 'bodyStrong'} tone={valueTone} numeric align="end">
          {value}
        </Text>
        {detail ? (
          <Text variant="caption" tone={detailTone} numeric align="end">
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 48,
  },
  label: { flex: 1, paddingTop: 1 },
  values: { flexShrink: 1, maxWidth: '58%', alignItems: 'flex-end', gap: 2 },
});
