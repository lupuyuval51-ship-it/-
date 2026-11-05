import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Forecast } from '@domain/finance';
import { Divider, Text, type TextTone } from '@/components/ui';
import { isolate } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { DENSE_MAX_FONT_SCALE, spacing } from '@/theme/tokens';
import type { FinanceFormat } from '../hooks';
import { calendarMonthLabel, forecastTotalCostsMinor, monthCostsMinor } from '../mapping';
import type { MonthLabelMode } from '../store';

export interface ForecastTableProps {
  forecast: Forecast;
  format: FinanceFormat;
  labels: MonthLabelMode;
  /** Month 1 = this calendar month. */
  start: Date;
}

function Cell({ children, tone = 'default', strong = false, first = false }: { children: string; tone?: TextTone; strong?: boolean; first?: boolean }) {
  return (
    <Text
      variant="caption"
      tone={tone}
      weight={strong ? 500 : 400}
      numeric
      align={first ? 'start' : 'end'}
      numberOfLines={1}
      maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
      style={first ? styles.first : styles.cell}
    >
      {children}
    </Text>
  );
}

/** Month-by-month cash flow. Negative cash uses danger-tone text (no fills). Mirrors in RTL. */
export function ForecastTable({ forecast, format, labels, start }: ForecastTableProps) {
  const t = useT();
  const { locale } = useLocale();
  const rows = useMemo(
    () =>
      forecast.months.map((m) => {
        const label = labels === 'calendar' ? isolate(calendarMonthLabel(start, m.month, locale)) : format.int(m.month);
        const spoken = labels === 'calendar' ? label : t('finance.headline.monthN', { month: m.month });
        const costs = monthCostsMinor(m);
        return {
          key: m.month,
          label,
          revenue: format.cell(m.revenueMinor),
          costs: format.cell(costs),
          net: format.cell(m.netMinor),
          cash: format.cell(m.cashBalanceMinor),
          negativeCash: m.cashBalanceMinor < 0,
          a11y: t('finance.forecast.rowA11y', {
            month: spoken,
            revenue: format.money(m.revenueMinor),
            costs: format.money(costs),
            net: format.money(m.netMinor),
            cash: format.money(m.cashBalanceMinor),
          }),
        };
      }),
    [forecast, format, labels, start, locale, t],
  );
  const totalCosts = forecastTotalCostsMinor(forecast.months);

  return (
    <View accessibilityRole="list" testID="finance-forecast-table">
      <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Cell first tone="secondary">
          {t('finance.forecast.columns.month')}
        </Cell>
        <Cell tone="secondary">{t('finance.forecast.columns.revenue')}</Cell>
        <Cell tone="secondary">{t('finance.forecast.columns.costs')}</Cell>
        <Cell tone="secondary">{t('finance.forecast.columns.net')}</Cell>
        <Cell tone="secondary">{t('finance.forecast.columns.cash')}</Cell>
      </View>
      <Divider />
      <View
        style={styles.row}
        accessible
        accessibilityLabel={`${t('finance.forecast.opening')}: ${t('finance.forecast.columns.cash')} ${format.money(forecast.openingCashMinor)}`}
      >
        <Cell first tone="secondary">
          {t('finance.forecast.opening')}
        </Cell>
        <Cell tone="secondary">{''}</Cell>
        <Cell tone="secondary">{''}</Cell>
        <Cell tone="secondary">{''}</Cell>
        <Cell tone={forecast.openingCashMinor < 0 ? 'danger' : 'default'}>{format.cell(forecast.openingCashMinor)}</Cell>
      </View>
      {rows.map((r) => (
        <View key={r.key} style={styles.row} accessible accessibilityLabel={r.a11y}>
          <Cell first tone="secondary">
            {r.label}
          </Cell>
          <Cell>{r.revenue}</Cell>
          <Cell>{r.costs}</Cell>
          <Cell>{r.net}</Cell>
          <Cell tone={r.negativeCash ? 'danger' : 'default'}>{r.cash}</Cell>
        </View>
      ))}
      <Divider />
      <View
        style={styles.row}
        accessible
        accessibilityLabel={t('finance.forecast.rowA11y', {
          month: t('finance.forecast.total'),
          revenue: format.money(forecast.totalRevenueMinor),
          costs: format.money(totalCosts),
          net: format.money(forecast.totalNetMinor),
          cash: format.money(forecast.endingCashMinor),
        })}
      >
        <Cell first strong>
          {t('finance.forecast.total')}
        </Cell>
        <Cell strong>{format.cell(forecast.totalRevenueMinor)}</Cell>
        <Cell strong>{format.cell(totalCosts)}</Cell>
        <Cell strong>{format.cell(forecast.totalNetMinor)}</Cell>
        <Cell strong tone={forecast.endingCashMinor < 0 ? 'danger' : 'default'}>
          {format.cell(forecast.endingCashMinor)}
        </Cell>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: 36, paddingVertical: spacing[1] },
  first: { flex: 0.9 },
  cell: { flex: 1.2 },
});
