/**
 * Transactions (/manage/transactions): actual income and expenses grouped by month, with a kind
 * filter, totals and an add action.
 */
import { Stack, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, EmptyState, ErrorState, ListRow, LoadingState, Screen, Section, SegmentedControl, Text } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate, formatMoney } from '@/i18n/format';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { MAX_TRANSACTIONS, useTransactions, type TransactionRow } from '../api';
import { formatMonth } from '../format';
import { filterByKind, groupByMonth, sumTransactions, type KindFilter } from '../logic';

/** Months rendered per "show earlier" step (keeps long histories light in a ScrollView). */
const MONTHS_PER_PAGE = 6;

export default function TransactionsScreen() {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const online = useIsOnline();
  const active = useActiveBusiness();
  const businessId = active.businessId;
  const currency = active.business?.currency ?? 'ILS';
  const txs = useTransactions(businessId);
  const [filter, setFilter] = useState<KindFilter>('all');
  const [monthsShown, setMonthsShown] = useState(MONTHS_PER_PAGE);

  const money = (minor: number, signed = false) => formatMoney(minor, currency, locale, { signed });
  const filtered = filterByKind(txs.transactions, filter);
  const groups = groupByMonth(filtered);
  const totals = sumTransactions(filtered);
  const add = () => router.push((filter === 'expense' ? '/manage/transaction/new?kind=expense' : '/manage/transaction/new') as Href);
  const hasAny = txs.transactions.length > 0;

  const header = <Stack.Screen options={{ title: t('manage.transactions.title') }} />;

  if (txs.isLoading || (!businessId && active.isLoading)) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <LoadingState variant="list" count={6} />
        </Screen>
      </>
    );
  }
  if (txs.error && !txs.data) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <ErrorState error={txs.error} onRetry={() => void txs.refetch()} />
        </Screen>
      </>
    );
  }

  return (
    <>
      {header}
      <Screen
        edges={['bottom']}
        refreshing={txs.isRefetching}
        onRefresh={() => void txs.refetch()}
        footer={hasAny ? <Button variant="primary" icon="plus" label={t('manage.transactions.add')} onPress={add} disabled={!online} fullWidth /> : undefined}
        gap={spacing[8]}
      >
        {!hasAny ? (
          <EmptyState
            title={t('manage.transactions.empty.title')}
            body={t('manage.transactions.empty.body')}
            action={{ label: t('manage.transactions.add'), onPress: add, variant: 'primary' }}
          />
        ) : (
          <>
            <View style={styles.top}>
              <SegmentedControl
                accessibilityLabel={t('manage.transactions.filter.label')}
                options={[
                  { value: 'all', label: t('manage.transactions.filter.all') },
                  { value: 'income', label: t('manage.transactions.filter.income') },
                  { value: 'expense', label: t('manage.transactions.filter.expense') },
                ]}
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  setMonthsShown(MONTHS_PER_PAGE);
                }}
              />
              <View>
                {filter !== 'expense' ? <ListRow title={t('manage.transactions.totals.income')} value={money(totals.incomeMinor)} numericValue /> : null}
                {filter !== 'income' ? <ListRow title={t('manage.transactions.totals.expenses')} value={money(totals.expenseMinor)} numericValue /> : null}
                {filter === 'all' ? <ListRow title={t('manage.transactions.totals.net')} value={money(totals.netMinor, true)} numericValue /> : null}
              </View>
              {txs.truncated ? (
                <Text variant="caption" tone="secondary">
                  {t('manage.transactions.truncated', { count: MAX_TRANSACTIONS })}
                </Text>
              ) : null}
            </View>

            {groups.length === 0 ? (
              <Text variant="callout" tone="secondary">
                {filter === 'income' ? t('manage.transactions.emptyFiltered.income') : t('manage.transactions.emptyFiltered.expense')}
              </Text>
            ) : (
              groups.slice(0, monthsShown).map((group) => (
                <Section
                  key={group.month}
                  title={formatMonth(group.month, locale)}
                  description={t('manage.transactions.monthSummary', {
                    income: money(group.totals.incomeMinor),
                    expenses: money(group.totals.expenseMinor),
                  })}
                  separated
                >
                  {group.items.map((tx) => (
                    <TransactionListRow key={tx.id} tx={tx} currency={currency} onPress={() => router.push(`/manage/transaction/${encodeURIComponent(tx.id)}` as Href)} />
                  ))}
                </Section>
              ))
            )}

            {groups.length > monthsShown ? (
              <Button variant="quiet" label={t('manage.transactions.showEarlier')} icon="chevron-down" onPress={() => setMonthsShown((n) => n + MONTHS_PER_PAGE)} />
            ) : null}
          </>
        )}
      </Screen>
    </>
  );
}

function TransactionListRow({ tx, currency, onPress }: { tx: TransactionRow; currency: string; onPress: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const amount = formatMoney(tx.kind === 'income' ? tx.amount_minor : -tx.amount_minor, currency, locale, { signed: true });
  const date = formatDate(tx.occurred_on, locale, { style: 'short' });
  const category = tx.category || t('manage.transactions.uncategorized');
  const note = tx.note.split('\n')[0]?.trim();
  return (
    <ListRow
      title={category}
      subtitle={note ? `${date} · ${note}` : date}
      value={amount}
      numericValue
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  top: { gap: spacing[4] },
});
