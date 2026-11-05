/**
 * Finance tab: scenario switch, headline estimates (typographic list), and sections that lead to
 * the editors and tools. All figures come from `@domain/finance` via memoized hooks.
 */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { grossMarginPct, monthlyFixedCostsMinor, runwayMonths, totalStartupCostsMinor, type FinanceSummary } from '@domain/finance';
import { Button, InlineNotice, ListRow, Screen, Section, Text } from '@/components/ui';
import { useT, type TFunction } from '@/i18n/I18nProvider';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useActiveProposal, useFinanceSummary, useProposeAssumptions } from '../api';
import { FigureRow, type FigureRowProps } from '../components/FigureRow';
import { FinanceGate, type ReadyFinance } from '../components/FinanceGate';
import { LineRow } from '../components/LineRow';
import { CapitalSheet, HorizonSheet } from '../components/ModelSheets';
import { ScenarioControl } from '../components/ScenarioControl';
import { useActiveFinance, useFinanceFormat, type FinanceFormat } from '../hooks';
import { isFinanceEmpty } from '../mapping';
import { useSelectedScenario } from '../store';

export default function FinanceScreen() {
  const t = useT();
  const finance = useActiveFinance();
  return (
    <Screen
      title={t('finance.title')}
      edges={['top']}
      refreshing={finance.isRefetching}
      onRefresh={finance.businessId ? () => void finance.refetch() : undefined}
      testID="finance-screen"
    >
      <FinanceGate finance={finance}>{(ready) => <FinanceContent ready={ready} />}</FinanceGate>
    </Screen>
  );
}

function FinanceContent({ ready }: { ready: ReadyFinance }) {
  const t = useT();
  const online = useIsOnline();
  const { businessId, inputs, model, lines, currency } = ready;
  const [scenario, setScenario] = useSelectedScenario(businessId);
  const summary = useFinanceSummary(businessId, scenario);
  const runway = useMemo(() => runwayMonths(inputs, scenario), [inputs, scenario]);
  const totals = useMemo(
    () => ({ startup: totalStartupCostsMinor(inputs), recurring: monthlyFixedCostsMinor(inputs, 'expected') }),
    [inputs],
  );
  const format = useFinanceFormat(currency);
  const proposal = useActiveProposal(businessId);
  const propose = useProposeAssumptions(businessId);
  const [sheet, setSheet] = useState<'capital' | 'horizon' | null>(null);

  const empty = isFinanceEmpty(model, lines);
  const pendingCount = proposal.pending.length;

  const askAi = () =>
    propose.mutate(undefined, {
      onSuccess: () => router.push('/finance/proposal'),
    });

  const proposalNotice =
    pendingCount > 0 ? (
      <InlineNotice
        tone="info"
        title={t('finance.proposalNotice.title')}
        message={t('finance.proposalNotice.body', { count: pendingCount })}
        action={{ label: t('finance.proposalNotice.action'), onPress: () => router.push('/finance/proposal') }}
        testID="finance-proposal-notice"
      />
    ) : null;

  const sheets = (
    <>
      <CapitalSheet
        visible={sheet === 'capital'}
        onClose={() => setSheet(null)}
        businessId={businessId}
        currentMinor={model.starting_capital_minor}
        currency={currency}
      />
      <HorizonSheet visible={sheet === 'horizon'} onClose={() => setSheet(null)} businessId={businessId} currentMonths={model.forecast_months} />
    </>
  );

  if (empty) {
    return (
      <>
        {proposalNotice}
        <View style={styles.empty} testID="finance-empty">
          <View style={styles.emptyText}>
            <Text variant="title">{t('finance.empty.title')}</Text>
            <Text variant="body" tone="secondary">
              {t('finance.empty.body')}
            </Text>
          </View>
          <Button
            label={t('finance.empty.addRevenue')}
            onPress={() => router.push({ pathname: '/finance/line/[kind]/[id]', params: { kind: 'revenue', id: 'new' } })}
            testID="finance-add-first-stream"
          />
          {pendingCount === 0 ? (
            <Button
              variant="secondary"
              label={t('finance.empty.askAi')}
              onPress={askAi}
              loading={propose.isPending}
              disabled={!online}
              testID="finance-ask-ai"
            />
          ) : null}
          {propose.error ? <InlineNotice tone="error" message={t(toAppError(propose.error).messageKey)} /> : null}
        </View>
      </>
    );
  }

  return (
    <>
      {proposalNotice}
      <ScenarioControl value={scenario} onChange={setScenario} />
      {summary ? <Headline summary={summary} runway={runway} streamCount={lines.revenueStreams.length} format={format} t={t} /> : null}

      <Section title={t('finance.sections.startingPoint')} separated>
        <ListRow
          title={t('finance.sections.startingCapital')}
          value={format.money(model.starting_capital_minor)}
          numericValue
          onPress={() => setSheet('capital')}
          testID="finance-starting-capital"
        />
        <ListRow
          title={t('finance.sections.forecastHorizon')}
          value={t('finance.horizon.monthsValue', { count: model.forecast_months })}
          onPress={() => setSheet('horizon')}
          testID="finance-horizon"
        />
      </Section>

      <Section title={t('finance.sections.startupCosts')} separated>
        <ListRow
          title={t('finance.lists.startup.total')}
          subtitle={
            lines.startupCosts.length > 0 ? t('finance.sections.itemsCount', { count: lines.startupCosts.length }) : t('finance.sections.startupCostsHint')
          }
          value={format.money(totals.startup)}
          numericValue
          accessibilityRole="link"
          onPress={() => router.push('/finance/startup-costs')}
          testID="finance-startup-costs"
        />
      </Section>

      <Section title={t('finance.sections.recurringExpenses')} separated>
        <ListRow
          title={t('finance.lists.expense.total')}
          subtitle={
            lines.recurringExpenses.length > 0
              ? t('finance.sections.itemsCount', { count: lines.recurringExpenses.length })
              : t('finance.sections.recurringExpensesHint')
          }
          value={format.money(totals.recurring)}
          numericValue
          accessibilityRole="link"
          onPress={() => router.push('/finance/expenses')}
          testID="finance-expenses"
        />
      </Section>

      <Section
        title={t('finance.sections.revenueStreams')}
        action={{ label: t('finance.sections.manage'), onPress: () => router.push('/finance/revenue') }}
        separated
      >
        {lines.revenueStreams.map((s) => {
          const margin = format.pct(grossMarginPct(s.unitPriceMinor, s.unitVariableCostMinor));
          return (
            <LineRow
              key={s.id}
              label={s.label}
              basis={s.basis}
              detail={t('finance.lists.streamSubtitle', { price: format.money(s.unitPriceMinor), units: format.qty(s.monthlyUnits) })}
              value={margin ? t('finance.sections.margin', { pct: margin }) : t('finance.sections.noPrice')}
              onPress={() => router.push({ pathname: '/finance/line/[kind]/[id]', params: { kind: 'revenue', id: s.id } })}
            />
          );
        })}
        <ListRow
          title={t('finance.sections.addStream')}
          icon="plus"
          onPress={() => router.push({ pathname: '/finance/line/[kind]/[id]', params: { kind: 'revenue', id: 'new' } })}
          chevron={false}
          testID="finance-add-stream"
        />
      </Section>

      <Section title={t('finance.sections.tools')} separated>
        <ListRow
          title={t('finance.sections.pricing')}
          subtitle={t('finance.sections.pricingHint')}
          accessibilityRole="link"
          onPress={() => router.push('/finance/pricing')}
        />
        <ListRow
          title={t('finance.sections.scenarios')}
          subtitle={t('finance.sections.scenariosHint')}
          accessibilityRole="link"
          onPress={() => router.push('/finance/scenarios')}
        />
        <ListRow
          title={t('finance.sections.forecast')}
          subtitle={t('finance.sections.forecastHint')}
          accessibilityRole="link"
          onPress={() => router.push('/finance/forecast')}
        />
      </Section>
      {sheets}
    </>
  );
}

function Headline({
  summary,
  runway,
  streamCount,
  format,
  t,
}: {
  summary: FinanceSummary;
  runway: number | null;
  streamCount: number;
  format: FinanceFormat;
  t: TFunction;
}) {
  const f = summary.forecast;
  if (f.clamped) {
    return <InlineNotice tone="warning" message={t('finance.headline.clamped')} testID="finance-clamped" />;
  }
  const monthOrNone = (m: number | null): Pick<FigureRowProps, 'value' | 'valueTone'> =>
    m === null ? { value: t('finance.headline.notWithinForecast'), valueTone: 'secondary' } : { value: t('finance.headline.monthN', { month: m }) };

  const be = summary.breakEven;
  const breakEven: Pick<FigureRowProps, 'value' | 'valueTone' | 'detail'> =
    streamCount === 0
      ? { value: t('finance.headline.breakEvenNoRevenue'), valueTone: 'secondary' }
      : be.monthlyRevenueNeededMinor === null
        ? { value: t('finance.headline.breakEvenUnreachable'), valueTone: 'warning' }
        : {
            value: format.money(be.monthlyRevenueNeededMinor),
            detail: be.unitsNeeded !== null ? t('finance.headline.breakEvenUnits', { count: be.unitsNeeded }) : undefined,
          };

  const runwayRow: Pick<FigureRowProps, 'value' | 'valueTone' | 'detail' | 'detailTone'> =
    f.cashOutMonth === null
      ? { value: t('finance.headline.cashLastsForecast') }
      : f.cashOutMonth === 0
        ? { value: t('finance.headline.cashNegativeAtStart'), valueTone: 'danger' }
        : {
            value: t('finance.headline.runwayMonths', { count: runway ?? 0 }),
            detail: t('finance.headline.cashOutMonth', { month: f.cashOutMonth }),
            detailTone: 'danger',
          };

  return (
    <Section title={t('finance.headline.title')} description={t('finance.disclaimer')} titleVariant="overline" separated testID="finance-headline">
      <FigureRow
        label={t('finance.headline.openingCash')}
        value={format.money(f.openingCashMinor)}
        valueTone={f.openingCashMinor < 0 ? 'danger' : 'default'}
        testID="finance-figure-opening"
      />
      <FigureRow label={t('finance.headline.monthlyFixedCosts')} value={format.money(summary.monthlyFixedCostsMinor)} testID="finance-figure-fixed" />
      <FigureRow label={t('finance.headline.month1Revenue')} value={format.money(summary.month1RevenueMinor)} testID="finance-figure-revenue" />
      <FigureRow label={t('finance.headline.breakEvenRevenue')} {...breakEven} testID="finance-figure-breakeven" />
      <FigureRow label={t('finance.headline.runway')} {...runwayRow} testID="finance-figure-runway" />
      <FigureRow label={t('finance.headline.firstProfitableMonth')} {...monthOrNone(f.firstProfitableMonth)} testID="finance-figure-profitable" />
      <FigureRow label={t('finance.headline.paybackMonth')} {...monthOrNone(f.breakEvenMonth)} testID="finance-figure-payback" />
    </Section>
  );
}

const styles = StyleSheet.create({
  empty: { gap: spacing[4] },
  emptyText: { gap: spacing[2] },
});
