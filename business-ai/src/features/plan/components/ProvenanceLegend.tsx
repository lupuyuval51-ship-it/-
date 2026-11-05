import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BASIS_VALUES } from '@domain/plan';
import { BasisTag, ListRow, Sheet, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';

/** Explanation of the four provenance labels (body of the legend sheet; also used inline). */
export function ProvenanceLegendBody() {
  const t = useT();
  return (
    <View style={styles.body}>
      <Text variant="callout" tone="secondary">
        {t('plan.legend.intro')}
      </Text>
      {BASIS_VALUES.map((basis) => (
        <View key={basis} style={styles.item}>
          <BasisTag basis={basis} />
          <Text variant="callout">{t(`plan.legend.${basis}`)}</Text>
        </View>
      ))}
    </View>
  );
}

/** A quiet info row that opens the provenance legend in a sheet. */
export function ProvenanceLegendRow() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <ListRow
        icon="info"
        title={t('plan.legend.row')}
        subtitle={t('plan.legend.rowHint')}
        onPress={() => setOpen(true)}
        accessibilityHint={t('plan.a11y.legend')}
        testID="plan-legend-row"
      />
      <Sheet visible={open} onClose={() => setOpen(false)} title={t('plan.legend.title')} testID="plan-legend-sheet">
        <ProvenanceLegendBody />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing[5] },
  item: { gap: spacing[2] },
});
