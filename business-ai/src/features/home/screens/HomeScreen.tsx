/**
 * Home tab — answers "What should I do next?".
 * Business header → Next step (the one primary action) → Today → Roadmap → Budget → Milestones.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { runwayMonths } from '@domain/finance';
import { Button, EmptyState, ErrorState, Icon, ListRow, LoadingState, ProgressBar, Screen, Section, Text } from '@/components/ui';
import { useActiveBusiness, type Business } from '@/features/business/api';
import { useFinanceInputs, useFinanceSummary } from '@/features/finance/api';
import { useTransactions } from '@/features/manage/api';
import { formatMonth } from '@/features/manage/format';
import { monthKey, totalsForMonth } from '@/features/manage/logic';
import { usePlanState } from '@/features/plan/api';
import { useRoadmap, useRoadmapProgress, useTasksDue, useToggleTask, type RoadmapPhase } from '@/features/roadmap/api';
import { TaskRow } from '@/features/roadmap/components/TaskRow';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate, formatMoney, toISODate } from '@/i18n/format';
import { qk } from '@/lib/queryKeys';
import { useIsOnline } from '@/lib/net';
import { layout, spacing } from '@/theme/tokens';
import { blockersByTask, hasFinanceInputs, planStatusOf, toNextActionTasks, upcomingMilestones } from '../derive';
import { nextAction } from '../next-action';

const PHASES: readonly RoadmapPhase[] = ['days_30', 'days_60', 'days_90'];
const TODAY_LIMIT = 5;

export default function HomeScreen() {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const active = useActiveBusiness();
  const { business, businessId } = active;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      active.refetch();
      if (businessId) await queryClient.invalidateQueries({ queryKey: qk.b(businessId) });
    } finally {
      setRefreshing(false);
    }
  }, [active, businessId, queryClient]);

  if (!business) {
    return (
      <Screen edges={['top']} title={t('home.title')} testID="home-tab">
        {active.isLoading ? (
          <LoadingState variant="screen" />
        ) : active.error ? (
          <ErrorState error={active.error} onRetry={active.refetch} />
        ) : (
          <EmptyState
            title={t('home.noBusiness.title')}
            body={t('home.noBusiness.body')}
            action={{ label: t('home.noBusiness.action'), onPress: () => router.push('/businesses' as Href), variant: 'primary' }}
          />
        )}
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} refreshing={refreshing} onRefresh={() => void onRefresh()} gap={spacing[10]} testID="home-tab">
      <BusinessHeader business={business} onPress={() => router.push('/businesses' as Href)} />
      <HomeBody business={business} />
    </Screen>
  );
}

function BusinessHeader({ business, onPress }: { business: Business; onPress: () => void }) {
  const t = useT();
  const stage = t(`business.stage.${business.stage}`);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.businessA11y', { name: business.name, stage })}
      onPress={onPress}
      hitSlop={spacing[2]}
      style={({ pressed }) => [styles.header, pressed && styles.pressed]}
    >
      <View style={styles.headerText}>
        <Text variant="title" numberOfLines={2}>
          {business.name}
        </Text>
        <Text variant="callout" tone="secondary">
          {stage}
        </Text>
      </View>
      <Icon name="chevron-down" size={20} tone="secondary" />
    </Pressable>
  );
}

function HomeBody({ business }: { business: Business }) {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const online = useIsOnline();
  const businessId = business.id;
  const today = toISODate(new Date());

  const plan = usePlanState(businessId);
  const roadmap = useRoadmap(businessId);
  const progress = useRoadmapProgress(businessId);
  const due = useTasksDue(businessId, { through: 'today' });
  const toggle = useToggleTask(businessId);
  const finance = useFinanceInputs(businessId);
  const summary = useFinanceSummary(businessId, 'expected');
  const txs = useTransactions(businessId);

  const hasRoadmap = !!roadmap.data && !roadmap.isEmpty;
  const financeReady = !!finance.inputs && hasFinanceInputs(finance.inputs);
  const blockers = useMemo(() => blockersByTask(roadmap.tasks, roadmap.dependencies), [roadmap.tasks, roadmap.dependencies]);

  const action =
    plan.isLoading || roadmap.isLoading || finance.isLoading || plan.error || roadmap.error
      ? null
      : nextAction({
          onboardingComplete: business.onboarding_completed_at !== null,
          planStatus: planStatusOf(plan),
          hasRoadmap,
          tasks: toNextActionTasks(roadmap.tasks, roadmap.dependencies),
          milestones: roadmap.milestones,
          // An unreadable model is not a reason to nag; the Budget section shows the error.
          hasFinanceInputs: finance.error ? true : financeReady,
          today,
          locale,
        });

  const nextError = plan.error ?? roadmap.error;

  return (
    <>
      <Section title={t('home.next.heading')} titleVariant="overline">
        {nextError ? (
          <ErrorState
            error={nextError}
            onRetry={() => {
              void plan.refetch();
              void roadmap.refetch();
            }}
          />
        ) : !action ? (
          <LoadingState variant="text" count={2} />
        ) : (
          <View style={styles.next}>
            <View style={styles.nextText}>
              <Text variant="heading">{t(action.titleKey, action.vars)}</Text>
              <Text variant="callout" tone="secondary">
                {t(action.bodyKey, action.vars)}
              </Text>
            </View>
            <Button variant="primary" label={t(action.ctaKey)} onPress={() => router.push(action.href as Href)} />
          </View>
        )}
      </Section>

      {hasRoadmap ? (
        <Section
          title={t('home.today.heading')}
          action={{ label: t('home.today.allTasks'), onPress: () => router.push('/roadmap/tasks' as Href) }}
          separated={due.tasks.length > 0}
        >
          {due.tasks.length === 0 ? (
            <Text variant="callout" tone="secondary">
              {t('home.today.empty')}
            </Text>
          ) : (
            due.tasks.slice(0, TODAY_LIMIT).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                blockedBy={blockers.get(task.id)}
                toggleDisabled={!online}
                onToggle={() => toggle.mutate({ id: task.id, done: task.status !== 'done' })}
                onPress={() => router.push(`/roadmap/task/${encodeURIComponent(task.id)}` as Href)}
              />
            ))
          )}
          {due.tasks.length > TODAY_LIMIT ? (
            <Text variant="caption" tone="secondary" style={styles.more}>
              {t('home.today.more', { count: due.tasks.length - TODAY_LIMIT })}
            </Text>
          ) : null}
        </Section>
      ) : null}

      <Section title={t('home.roadmap.heading')} action={hasRoadmap ? { label: t('home.roadmap.open'), onPress: () => router.push('/roadmap' as Href) } : undefined}>
        {roadmap.isLoading ? (
          <LoadingState variant="text" count={3} />
        ) : roadmap.error ? null : !hasRoadmap ? (
          <Text variant="callout" tone="secondary">
            {t('home.roadmap.empty')}
          </Text>
        ) : (
          <View style={styles.phases}>
            {PHASES.map((phase) => {
              const p = progress.byPhase[phase];
              const label = t(`home.roadmap.phase.${phase}`);
              return (
                <View key={phase} style={styles.phase} accessible accessibilityLabel={t('home.roadmap.progressA11y', { phase: label, done: p.done, total: p.total })}>
                  <View style={styles.phaseRow}>
                    <Text variant="callout" style={styles.flex}>
                      {label}
                    </Text>
                    <Text variant="caption" tone="secondary" numeric>
                      {p.total === 0 ? t('home.roadmap.noTasks') : t('home.roadmap.progress', { done: p.done, total: p.total })}
                    </Text>
                  </View>
                  <ProgressBar value={p.total === 0 ? 0 : p.done / p.total} height={2} />
                </View>
              );
            })}
          </View>
        )}
      </Section>

      <BudgetSection
        isLoading={finance.isLoading}
        error={finance.error}
        onRetry={() => void finance.refetch()}
        currency={finance.currency || business.currency}
        hasInputs={financeReady}
        startingCapitalMinor={finance.inputs?.startingCapitalMinor ?? 0}
        startupCostsMinor={summary?.startupCostsMinor ?? 0}
        monthlyFixedMinor={summary?.monthlyFixedCostsMinor ?? 0}
        runway={finance.inputs ? runwayMonths(finance.inputs, 'expected') : null}
        horizon={summary?.forecast.months.length ?? finance.inputs?.forecastMonths ?? 0}
        actual={txs.transactions.length > 0 ? totalsForMonth(txs.transactions, monthKey(today) ?? '') : null}
      />

      {hasRoadmap ? <MilestonesSection milestones={roadmap.milestones} /> : null}
    </>
  );
}

interface BudgetSectionProps {
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  currency: string;
  hasInputs: boolean;
  startingCapitalMinor: number;
  startupCostsMinor: number;
  monthlyFixedMinor: number;
  runway: number | null;
  horizon: number;
  actual: { month: string; incomeMinor: number; expenseMinor: number; netMinor: number } | null;
}

function BudgetSection(props: BudgetSectionProps) {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const money = (minor: number, signed = false) => formatMoney(minor, props.currency, locale, { signed });

  const runwayText =
    props.runway === null
      ? t('home.budget.runwayBeyond', { count: props.horizon })
      : props.runway === 0
        ? t('home.budget.runwayLessThanMonth')
        : t('home.budget.runwayMonths', { count: props.runway });

  return (
    <Section
      title={t('home.budget.heading')}
      description={props.hasInputs ? t('home.budget.estimateNote') : undefined}
      action={props.hasInputs ? { label: t('home.budget.open'), onPress: () => router.push('/finance' as Href) } : undefined}
    >
      {props.isLoading ? (
        <LoadingState variant="list" count={2} />
      ) : props.error ? (
        <ErrorState error={props.error} onRetry={props.onRetry} />
      ) : !props.hasInputs ? (
        <View style={styles.emptyBlock}>
          <Text variant="callout" tone="secondary">
            {t('home.budget.empty')}
          </Text>
          <Button variant="quiet" inline label={t('home.budget.setup')} onPress={() => router.push('/finance' as Href)} />
        </View>
      ) : (
        <View>
          <ListRow title={t('home.budget.startingCapital')} value={money(props.startingCapitalMinor)} numericValue />
          <ListRow title={t('home.budget.startupCosts')} value={money(props.startupCostsMinor)} numericValue />
          <ListRow title={t('home.budget.monthlyFixed')} value={money(props.monthlyFixedMinor)} numericValue />
          <ListRow title={t('home.budget.runway')} value={runwayText} numericValue />
        </View>
      )}

      {props.actual ? (
        <View style={styles.actual}>
          <Text variant="overline" tone="secondary">
            {t('home.budget.actualHeading', { month: formatMonth(props.actual.month, locale) })}
          </Text>
          <View>
            <ListRow title={t('home.budget.actualIncome')} value={money(props.actual.incomeMinor)} numericValue />
            <ListRow title={t('home.budget.actualExpenses')} value={money(props.actual.expenseMinor)} numericValue />
            <ListRow title={t('home.budget.actualNet')} value={money(props.actual.netMinor, true)} numericValue />
          </View>
          <Button variant="quiet" inline label={t('home.budget.actualOpen')} onPress={() => router.push('/manage' as Href)} />
        </View>
      ) : null}
    </Section>
  );
}

function MilestonesSection({ milestones }: { milestones: Parameters<typeof upcomingMilestones>[0] }) {
  const t = useT();
  const { locale } = useLocale();
  const upcoming = upcomingMilestones(milestones, 3);
  return (
    <Section title={t('home.milestones.heading')} separated={upcoming.length > 0}>
      {upcoming.length === 0 ? (
        <Text variant="callout" tone="secondary">
          {t('home.milestones.empty')}
        </Text>
      ) : (
        upcoming.map((m) => (
          <ListRow
            key={m.id}
            title={m.title}
            value={m.target_date ? formatDate(m.target_date, locale, { style: 'medium' }) : t('home.milestones.noDate')}
            numericValue
          />
        ))
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    minHeight: layout.touchTarget,
  },
  headerText: { flex: 1, gap: spacing[1] },
  pressed: { opacity: 0.6 },
  next: { gap: spacing[4], alignItems: 'flex-start' },
  nextText: { gap: spacing[2], alignSelf: 'stretch' },
  more: { paddingTop: spacing[2] },
  phases: { gap: spacing[4] },
  phase: { gap: spacing[2] },
  phaseRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[3] },
  emptyBlock: { gap: spacing[2], alignItems: 'flex-start' },
  actual: { gap: spacing[2], paddingTop: spacing[4] },
});
