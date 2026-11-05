/** Lists of startup costs, recurring expenses or revenue streams, with totals and "add". */
import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { grossMarginPct, monthlyFixedCostsMinor, summarize, totalStartupCostsMinor } from '@domain/finance';
import { Button, Divider, EmptyState, Screen, Section, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { FigureRow } from '../components/FigureRow';
import { FinanceGate, readyFinance, type ReadyFinance } from '../components/FinanceGate';
import { LineRow } from '../components/LineRow';
import { useActiveFinance, useFinanceFormat } from '../hooks';
import { linesOfKind, type FinanceLine, type LineKind } from '../mapping';

function openEditor(kind: LineKind, id: string) {
  router.push({ pathname: '/finance/line/[kind]/[id]', params: { kind, id } });
}

export function LineListScreen({ kind }: { kind: LineKind }) {
  const t = useT();
  const finance = useActiveFinance();
  const ready = readyFinance(finance);
  const hasLines = ready ? linesOfKind(ready.lines, kind).length > 0 : false;
  return (
    <Screen
      edges={['bottom']}
      refreshing={finance.isRefetching}
      onRefresh={finance.businessId ? () => void finance.refetch() : undefined}
      footer={ready && hasLines ? <Button label={t(`finance.lists.${kind}.add`)} onPress={() => openEditor(kind, 'new')} fullWidth testID={`finance-${kind}-add`} /> : undefined}
      testID={`finance-${kind}-list`}
    >
      <Stack.Screen options={{ title: t(`finance.lists.${kind}.title`) }} />
      <FinanceGate finance={finance}>{(r) => <LineListContent kind={kind} ready={r} />}</FinanceGate>
    </Screen>
  );
}

function LineListContent({ kind, ready }: { kind: LineKind; ready: ReadyFinance }) {
  const t = useT();
  const format = useFinanceFormat(ready.currency);
  const lines = linesOfKind(ready.lines, kind);
  const total = useMemo(() => {
    if (kind === 'startup') return totalStartupCostsMinor(ready.inputs);
    if (kind === 'expense') return monthlyFixedCostsMinor(ready.inputs, 'expected');
    return summarize(ready.inputs, 'expected').month1RevenueMinor;
  }, [kind, ready.inputs]);

  if (lines.length === 0) {
    return (
      <View style={styles.gap}>
        <Text variant="body" tone="secondary">
          {t(`finance.lists.${kind}.intro`)}
        </Text>
        <EmptyState
          title={t(`finance.lists.${kind}.emptyTitle`)}
          body={t(`finance.lists.${kind}.emptyBody`)}
          action={{ label: t(`finance.lists.${kind}.add`), onPress: () => openEditor(kind, 'new'), variant: 'primary' }}
          testID={`finance-${kind}-empty`}
        />
      </View>
    );
  }

  const valueOf = (line: FinanceLine): { value: string; detail?: string } => {
    if (line.kind === 'startup') return { value: format.money(line.amountMinor), detail: line.category || undefined };
    if (line.kind === 'expense') return { value: format.money(line.monthlyAmountMinor), detail: line.category || undefined };
    const margin = format.pct(grossMarginPct(line.unitPriceMinor, line.unitVariableCostMinor));
    return {
      value: margin ? t('finance.sections.margin', { pct: margin }) : t('finance.sections.noPrice'),
      detail: t('finance.lists.streamSubtitle', { price: format.money(line.unitPriceMinor), units: format.qty(line.monthlyUnits) }),
    };
  };

  return (
    <>
      <Text variant="body" tone="secondary">
        {t(`finance.lists.${kind}.intro`)}
      </Text>
      <Section separated>
        {lines.map((line) => {
          const { value, detail } = valueOf(line);
          return (
            <LineRow
              key={line.id}
              label={line.label}
              basis={line.basis}
              value={value}
              detail={detail}
              onPress={() => openEditor(kind, line.id)}
              testID={`finance-line-${line.id}`}
            />
          );
        })}
      </Section>
      <View>
        <Divider />
        <FigureRow label={t(`finance.lists.${kind}.total`)} value={format.money(total)} strong testID={`finance-${kind}-total`} />
        {kind === 'revenue' ? (
          <Text variant="caption" tone="secondary">
            {t('finance.disclaimer')}
          </Text>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing[6] },
});
