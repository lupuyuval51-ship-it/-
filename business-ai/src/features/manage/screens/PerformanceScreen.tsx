/**
 * Performance (/manage): this month vs last month, plan vs actual, active goals, business stage
 * and advisor shortcuts grounded in the actual results.
 */
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter, type Href } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ChoiceList, EmptyState, ErrorState, InlineNotice, ListRow, LoadingState, Screen, Section, Text, useNotice } from '@/components/ui';
import { BUSINESS_STAGES, useActiveBusiness, useUpdateBusiness, type Business, type BusinessStage } from '@/features/business/api';
import { useFinanceInputs, useFinanceSummary } from '@/features/finance/api';
import { advisorHref } from '@/features/home/next-action';
import { hasFinanceInputs } from '@/features/home/derive';
import { usePlanState } from '@/features/plan/api';
import { useRoadmap } from '@/features/roadmap/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatMoney, toISODate } from '@/i18n/format';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { qk } from '@/lib/queryKeys';
import { spacing } from '@/theme/tokens';
import { useGoals, useTransactions } from '../api';
import { GoalProgressRow } from '../components/GoalProgressRow';
import { formatMonth } from '../format';
import { monthKey, monthOverMonth, planStartDate, planVsActual, previousMonthKey, type Delta, type MonthTotals } from '../logic';

export default function PerformanceScreen() {
  const t = useT();
  const active = useActiveBusiness();
  const business = active.business;

  return (
    <>
      <Stack.Screen options={{ title: t('manage.performance.title') }} />
      {business ? (
        <PerformanceBody business={business} />
      ) : (
        <Screen edges={['bottom']}>
          {active.isLoading ? <LoadingState variant="screen" /> : active.error ? <ErrorState error={active.error} onRetry={active.refetch} /> : null}
        </Screen>
      )}
    </>
  );
}

function PerformanceBody({ business }: { business: Business }) {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const businessId = business.id;
  const currency = business.currency;
  const txs = useTransactions(businessId);
  const goals = useGoals(businessId);
  const [refreshing, setRefreshing] = useState(false);

  const month = monthKey(toISODate(new Date())) ?? '';
  const previous = previousMonthKey(month);
  const comparison = monthOverMonth(txs.transactions, month);
  const money = (minor: number, signed = false) => formatMoney(minor, currency, locale, { signed });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: qk.b(businessId) });
    } finally {
      setRefreshing(false);
    }
  }, [businessId, queryClient]);

  if (txs.isLoading) {
    return (
      <Screen edges={['bottom']}>
        <LoadingState variant="screen" />
      </Screen>
    );
  }
  if (txs.error && !txs.data) {
    return (
      <Screen edges={['bottom']}>
        <ErrorState error={txs.error} onRetry={() => void txs.refetch()} />
      </Screen>
    );
  }

  const monthLabel = formatMonth(month, locale);
  const prevLabel = formatMonth(previous, locale);
  const advisorVars = {
    month: monthLabel,
    income: money(comparison.current.incomeMinor),
    expenses: money(comparison.current.expenseMinor),
    net: money(comparison.current.netMinor, true),
  };

  const deltaSubtitle = (d: Delta) => {
    if (comparison.previous.count === 0) return undefined;
    if (d.deltaMinor === 0) return t('manage.performance.noChange', { month: prevLabel });
    return t('manage.performance.vsPrevious', { month: prevLabel, delta: money(d.deltaMinor, true) });
  };

  const activeGoals = goals.goals.filter((g) => g.status === 'active');

  return (
    <Screen edges={['bottom']} refreshing={refreshing} onRefresh={() => void onRefresh()} gap={spacing[10]}>
      {txs.transactions.length === 0 ? (
        <EmptyState
          title={t('manage.performance.empty.title')}
          body={t('manage.performance.empty.body')}
          action={{ label: t('manage.performance.addTransaction'), onPress: () => router.push('/manage/transaction/new' as Href), variant: 'primary' }}
        />
      ) : (
        <Section
          title={t('manage.performance.monthHeading', { month: monthLabel })}
          description={comparison.previous.count === 0 ? t('manage.performance.noPrevious', { month: prevLabel }) : undefined}
          action={{ label: t('manage.performance.allTransactions'), onPress: () => router.push('/manage/transactions' as Href) }}
        >
          <View>
            <ListRow title={t('manage.performance.income')} subtitle={deltaSubtitle(comparison.income)} value={money(comparison.current.incomeMinor)} numericValue />
            <ListRow
              title={t('manage.performance.expenses')}
              subtitle={deltaSubtitle(comparison.expenses)}
              value={money(comparison.current.expenseMinor)}
              numericValue
            />
            <ListRow title={t('manage.performance.net')} subtitle={deltaSubtitle(comparison.net)} value={money(comparison.current.netMinor, true)} numericValue />
          </View>
          <Button
            variant="secondary"
            size="compact"
            icon="plus"
            label={t('manage.performance.addTransaction')}
            onPress={() => router.push('/manage/transaction/new' as Href)}
          />
        </Section>
      )}

      <PlanVsActualSection business={business} month={month} actual={comparison.current} />

      <Section
        title={t('manage.performance.goals.heading')}
        action={
          goals.goals.length > 0
            ? { label: t('manage.performance.goals.all'), onPress: () => router.push('/manage/goals' as Href) }
            : { label: t('manage.performance.goals.add'), onPress: () => router.push('/manage/goal/new' as Href) }
        }
        separated={activeGoals.length > 0}
      >
        {goals.isLoading ? (
          <LoadingState variant="list" count={2} />
        ) : goals.error && !goals.data ? (
          <ErrorState error={goals.error} onRetry={() => void goals.refetch()} />
        ) : activeGoals.length === 0 ? (
          <Text variant="callout" tone="secondary">
            {t('manage.performance.goals.empty')}
          </Text>
        ) : (
          activeGoals.map((goal) => (
            <GoalProgressRow
              key={goal.id}
              goal={goal}
              transactions={txs.transactions}
              currency={currency}
              onPress={() => router.push(`/manage/goal/${encodeURIComponent(goal.id)}` as Href)}
            />
          ))
        )}
      </Section>

      <StageSection business={business} />

      <Section title={t('manage.performance.advisor.heading')} description={t('manage.performance.advisor.hint')}>
        <View style={styles.buttons}>
          <Button
            variant="secondary"
            label={t('manage.performance.advisor.priorities')}
            onPress={() => router.push(advisorHref(t('manage.performance.advisor.prioritiesPrompt', advisorVars)) as Href)}
          />
          <Button
            variant="secondary"
            label={t('manage.performance.advisor.strategy')}
            onPress={() => router.push(advisorHref(t('manage.performance.advisor.strategyPrompt', advisorVars)) as Href)}
          />
        </View>
      </Section>
    </Screen>
  );
}

function PlanVsActualSection({ business, month, actual }: { business: Business; month: string; actual: MonthTotals }) {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const finance = useFinanceInputs(business.id);
  const summary = useFinanceSummary(business.id, 'expected');
  const roadmap = useRoadmap(business.id);
  const plan = usePlanState(business.id);
  const currency = finance.currency || business.currency;
  const money = (minor: number, signed = false) => formatMoney(minor, currency, locale, { signed });

  const loading = finance.isLoading || roadmap.isLoading || plan.isLoading;
  const roadmapStart = roadmap.phases.find((p) => p.phase === 'days_30')?.starts_on ?? null;
  const planCreated = plan.plan?.created_at ? toISODate(new Date(plan.plan.created_at)) : null;
  const start = planStartDate({ roadmapStartsOn: roadmapStart, planCreatedOn: planCreated });
  const result = planVsActual(summary?.forecast, start, month, actual);
  const hasModel = hasFinanceInputs(finance.inputs);

  let body: ReactNode;
  if (loading) body = <LoadingState variant="list" count={3} />;
  else if (finance.error && !finance.inputs) body = <ErrorState error={finance.error} onRetry={() => void finance.refetch()} />;
  else if (!hasModel)
    body = (
      <View style={styles.message}>
        <Text variant="callout" tone="secondary">
          {t('manage.performance.planVsActual.noModel')}
        </Text>
        <Button variant="quiet" inline label={t('manage.performance.planVsActual.setup')} onPress={() => router.push('/finance' as Href)} />
      </View>
    );
  else if (result.status !== 'compared' || !result.planned || !result.variance) {
    const key =
      result.status === 'beyond_horizon'
        ? 'manage.performance.planVsActual.beyondHorizon'
        : result.status === 'before_start'
          ? 'manage.performance.planVsActual.beforeStart'
          : 'manage.performance.planVsActual.noStart';
    body = (
      <View style={styles.message}>
        <Text variant="callout" tone="secondary">
          {t(key)}
        </Text>
        {result.status === 'beyond_horizon' ? (
          <Button variant="quiet" inline label={t('manage.performance.planVsActual.openForecast')} onPress={() => router.push('/finance/forecast' as Href)} />
        ) : null}
      </View>
    );
  } else {
    const rows = [
      { key: 'revenue', label: t('manage.performance.planVsActual.revenue'), actual: result.actual.incomeMinor, planned: result.planned.revenueMinor, diff: result.variance.revenueMinor },
      { key: 'costs', label: t('manage.performance.planVsActual.costs'), actual: result.actual.expenseMinor, planned: result.planned.costsMinor, diff: result.variance.costsMinor },
      { key: 'net', label: t('manage.performance.planVsActual.net'), actual: result.actual.netMinor, planned: result.planned.netMinor, diff: result.variance.netMinor },
    ];
    body = (
      <View>
        {rows.map((r) => (
          <ListRow
            key={r.key}
            title={r.label}
            subtitle={t('manage.performance.planVsActual.rowSubtitle', { planned: money(r.planned, r.key === 'net'), difference: money(r.diff, true) })}
            value={money(r.actual, r.key === 'net')}
            numericValue
          />
        ))}
      </View>
    );
  }

  return (
    <Section
      title={t('manage.performance.planVsActual.heading')}
      description={result.status === 'compared' && hasModel && !loading ? t('manage.performance.planVsActual.note', { index: result.monthIndex ?? 1 }) : undefined}
    >
      {body}
    </Section>
  );
}

function StageSection({ business }: { business: Business }) {
  const t = useT();
  const router = useRouter();
  const notice = useNotice();
  const online = useIsOnline();
  const update = useUpdateBusiness();
  const [error, setError] = useState<unknown>(null);
  const stageLabel = (stage: BusinessStage) => t(`business.stage.${stage}`);

  const onChange = (stage: BusinessStage) => {
    if (stage === business.stage) return;
    setError(null);
    update.mutate(
      { id: business.id, patch: { stage } },
      {
        onSuccess: (b) => notice.show({ message: t('manage.performance.stage.saved', { stage: stageLabel(b.stage) }) }),
        onError: (e) => setError(e),
      },
    );
  };

  const shownStage = update.isPending && update.variables ? (update.variables.patch.stage ?? business.stage) : business.stage;

  return (
    <Section title={t('manage.performance.stage.heading')} description={t('manage.performance.stage.hint')}>
      <ChoiceList
        accessibilityLabel={t('manage.performance.stage.heading')}
        options={BUSINESS_STAGES.map((stage) => ({ value: stage, label: stageLabel(stage), disabled: !online || update.isPending }))}
        value={shownStage}
        onChange={onChange}
      />
      {error ? <InlineNotice tone="error" message={t(toAppError(error).messageKey)} onDismiss={() => setError(null)} /> : null}
      <Button
        variant="secondary"
        label={t('manage.performance.stage.updatePlans')}
        onPress={() => router.push(advisorHref(t('manage.performance.stage.updatePlansPrompt', { stage: stageLabel(business.stage) })) as Href)}
        style={styles.hug}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: spacing[3], alignItems: 'flex-start' },
  message: { gap: spacing[2], alignItems: 'flex-start' },
  hug: { alignSelf: 'flex-start' },
});
