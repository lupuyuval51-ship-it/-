import { StyleSheet, View } from 'react-native';
import { SCENARIO_KEYS, type Forecast, type ScenarioKey } from '@domain/finance';
import { Divider, Text, type TextTone } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { DENSE_MAX_FONT_SCALE, spacing } from '@/theme/tokens';
import type { FinanceFormat } from '../hooks';

interface Metric {
  key: string;
  label: string;
  value: (f: Forecast) => { text: string; spoken: string; tone?: TextTone };
}

/** Three scenarios side by side: total revenue, total net, ending cash, lowest cash, cash-out month. */
export function ScenarioCompareTable({ forecasts, format }: { forecasts: Record<ScenarioKey, Forecast>; format: FinanceFormat }) {
  const t = useT();
  const money = (minor: number) => ({ text: format.cell(minor), spoken: format.money(minor), tone: (minor < 0 ? 'danger' : 'default') as TextTone });
  const metrics: Metric[] = [
    { key: 'revenue', label: t('finance.scenarios.compare.totalRevenue'), value: (f) => ({ ...money(f.totalRevenueMinor), tone: 'default' }) },
    { key: 'net', label: t('finance.scenarios.compare.totalNet'), value: (f) => money(f.totalNetMinor) },
    { key: 'ending', label: t('finance.scenarios.compare.endingCash'), value: (f) => money(f.endingCashMinor) },
    { key: 'lowest', label: t('finance.scenarios.compare.lowestCash'), value: (f) => money(f.lowestCashMinor) },
    {
      key: 'cashOut',
      label: t('finance.scenarios.compare.cashOut'),
      value: (f) => {
        if (f.cashOutMonth === null) {
          const never = t('finance.scenarios.compare.never');
          return { text: never, spoken: never, tone: 'secondary' };
        }
        const text = f.cashOutMonth === 0 ? t('finance.scenarios.compare.atStart') : t('finance.scenarios.compare.monthShort', { month: f.cashOutMonth });
        return { text, spoken: text, tone: 'danger' };
      },
    },
  ];

  return (
    <View testID="finance-scenario-compare">
      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.label} />
        {SCENARIO_KEYS.map((k) => (
          <Text key={k} variant="caption" weight={500} tone="secondary" align="end" numberOfLines={1} maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.cell}>
            {t(`finance.scenario.${k}`)}
          </Text>
        ))}
      </View>
      <Divider />
      {metrics.map((m) => {
        const values = SCENARIO_KEYS.map((k) => ({ key: k, ...m.value(forecasts[k]) }));
        return (
          <View
            key={m.key}
            style={styles.row}
            accessible
            accessibilityLabel={`${m.label}: ${values.map((v) => `${t(`finance.scenario.${v.key}`)} ${v.spoken}`).join(', ')}`}
          >
            <Text variant="caption" tone="secondary" style={styles.label}>
              {m.label}
            </Text>
            {values.map((v) => (
              <Text
                key={v.key}
                variant="caption"
                tone={v.tone ?? 'default'}
                weight={v.key === 'expected' ? 500 : 400}
                numeric
                align="end"
                numberOfLines={1}
                maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
                style={styles.cell}
              >
                {v.text}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: 40, paddingVertical: spacing[1] },
  label: { flex: 1.3 },
  cell: { flex: 1 },
});
