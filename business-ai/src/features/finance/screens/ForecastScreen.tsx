/** `/finance/forecast` — month-by-month cash flow for the selected scenario. */
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { forecast as runForecast } from '@domain/finance';
import { EmptyState, InlineNotice, Screen, Section, SegmentedControl, Text } from '@/components/ui';
import { currencySymbol, isolate } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { FigureRow } from '../components/FigureRow';
import { FinanceGate, type ReadyFinance } from '../components/FinanceGate';
import { ForecastTable } from '../components/ForecastTable';
import { ScenarioControl } from '../components/ScenarioControl';
import { useActiveFinance, useFinanceFormat } from '../hooks';
import { calendarMonthLabel, lineCount } from '../mapping';
import { useFinanceUiStore, useSelectedScenario, type MonthLabelMode } from '../store';

export default function ForecastScreen() {
  const t = useT();
  const finance = useActiveFinance();
  return (
    <Screen
      edges={['bottom']}
      refreshing={finance.isRefetching}
      onRefresh={finance.businessId ? () => void finance.refetch() : undefined}
      testID="finance-forecast"
    >
      <Stack.Screen options={{ title: t('finance.forecast.title') }} />
      <FinanceGate finance={finance}>{(ready) => <ForecastContent ready={ready} />}</FinanceGate>
    </Screen>
  );
}

function ForecastContent({ ready }: { ready: ReadyFinance }) {
  const t = useT();
  const { locale } = useLocale();
  const format = useFinanceFormat(ready.currency);
  const [scenario, setScenario] = useSelectedScenario(ready.businessId);
  const labels = useFinanceUiStore((s) => s.monthLabels);
  const setLabels = useFinanceUiStore((s) => s.setMonthLabels);
  // Month 1 = the current calendar month; fixed for the lifetime of the screen.
  const [start] = useState(() => new Date());
  const result = useMemo(() => runForecast(ready.inputs, scenario), [ready.inputs, scenario]);

  if (lineCount(ready.lines) === 0) {
    return (
      <EmptyState
        title={t('finance.forecast.emptyTitle')}
        body={t('finance.forecast.emptyBody')}
        action={{
          label: t('finance.empty.addRevenue'),
          variant: 'primary',
          onPress: () => router.push({ pathname: '/finance/line/[kind]/[id]', params: { kind: 'revenue', id: 'new' } }),
        }}
      />
    );
  }

  const when = (month: number) =>
    month === 0
      ? t('finance.forecast.opening')
      : labels === 'calendar'
        ? isolate(calendarMonthLabel(start, month, locale))
        : t('finance.headline.monthN', { month });

  return (
    <>
      <Text variant="body" tone="secondary">
        {t('finance.forecast.intro')}
      </Text>
      <ScenarioControl value={scenario} onChange={setScenario} />

      {result.clamped ? (
        <InlineNotice tone="warning" message={t('finance.headline.clamped')} />
      ) : (
        <>
          <Section separated>
            <FigureRow
              label={t('finance.forecast.summary.openingCash')}
              value={format.money(result.openingCashMinor)}
              valueTone={result.openingCashMinor < 0 ? 'danger' : 'default'}
            />
            <FigureRow
              label={t('finance.forecast.summary.endingCash')}
              value={format.money(result.endingCashMinor)}
              valueTone={result.endingCashMinor < 0 ? 'danger' : 'default'}
            />
            <FigureRow
              label={t('finance.forecast.summary.lowestCash')}
              value={format.money(result.lowestCashMinor)}
              valueTone={result.lowestCashMinor < 0 ? 'danger' : 'default'}
              detail={when(result.lowestCashMonth)}
            />
            <FigureRow
              label={t('finance.headline.runway')}
              value={
                result.cashOutMonth === null
                  ? t('finance.headline.cashLastsForecast')
                  : result.cashOutMonth === 0
                    ? t('finance.headline.cashNegativeAtStart')
                    : t('finance.headline.cashOutMonth', { month: result.cashOutMonth })
              }
              valueTone={result.cashOutMonth === null ? 'default' : 'danger'}
            />
          </Section>

          <View style={styles.tableHeader}>
            <SegmentedControl<MonthLabelMode>
              accessibilityLabel={t('finance.forecast.labelsA11y')}
              options={[
                { value: 'relative', label: t('finance.forecast.labels.relative') },
                { value: 'calendar', label: t('finance.forecast.labels.calendar') },
              ]}
              value={labels}
              onChange={setLabels}
              fullWidth={false}
              testID="finance-forecast-labels"
            />
          </View>
          <ForecastTable forecast={result} format={format} labels={labels} start={start} />
          <Text variant="caption" tone="secondary">
            {t('finance.forecast.compactNote', { currency: currencySymbol(ready.currency, locale) })}
          </Text>
        </>
      )}
      <Text variant="caption" tone="secondary">
        {t('finance.disclaimer')}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  tableHeader: { gap: spacing[2] },
});
