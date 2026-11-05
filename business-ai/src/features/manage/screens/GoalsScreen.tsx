/**
 * /manage/goals — business goals grouped by status with thin progress lines.
 */
import { Stack, useRouter, type Href } from 'expo-router';
import { Button, EmptyState, ErrorState, LoadingState, Screen, Section } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useT } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translate';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useGoals, useTransactions } from '../api';
import { GoalProgressRow } from '../components/GoalProgressRow';
import { GOAL_STATUSES } from '../logic';

const GROUP_TITLES: Record<(typeof GOAL_STATUSES)[number], TranslationKey> = {
  active: 'manage.goals.groups.active',
  achieved: 'manage.goals.groups.achieved',
  dropped: 'manage.goals.groups.dropped',
};

export default function GoalsScreen() {
  const t = useT();
  const router = useRouter();
  const online = useIsOnline();
  const active = useActiveBusiness();
  const businessId = active.businessId;
  const currency = active.business?.currency ?? 'ILS';
  const goals = useGoals(businessId);
  const txs = useTransactions(businessId);
  const add = () => router.push('/manage/goal/new' as Href);

  const header = <Stack.Screen options={{ title: t('manage.goals.title') }} />;

  if (goals.isLoading || txs.isLoading || (!businessId && active.isLoading)) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <LoadingState variant="list" count={4} />
        </Screen>
      </>
    );
  }
  if (goals.error && !goals.data) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <ErrorState error={goals.error} onRetry={() => void goals.refetch()} />
        </Screen>
      </>
    );
  }

  const hasAny = goals.goals.length > 0;

  return (
    <>
      {header}
      <Screen
        edges={['bottom']}
        refreshing={goals.isRefetching}
        onRefresh={() => {
          void goals.refetch();
          void txs.refetch();
        }}
        footer={hasAny ? <Button variant="primary" icon="plus" label={t('manage.goals.add')} onPress={add} disabled={!online} fullWidth /> : undefined}
        gap={spacing[8]}
      >
        {!hasAny ? (
          <EmptyState
            title={t('manage.goals.empty.title')}
            body={t('manage.goals.empty.body')}
            action={{ label: t('manage.goals.add'), onPress: add, variant: 'primary' }}
          />
        ) : (
          GOAL_STATUSES.map((status) => {
            const items = goals.goals.filter((g) => g.status === status);
            if (items.length === 0) return null;
            return (
              <Section key={status} title={t(GROUP_TITLES[status])} titleVariant="overline" separated>
                {items.map((goal) => (
                  <GoalProgressRow
                    key={goal.id}
                    goal={goal}
                    transactions={txs.transactions}
                    currency={currency}
                    onPress={() => router.push(`/manage/goal/${encodeURIComponent(goal.id)}` as Href)}
                  />
                ))}
              </Section>
            );
          })
        )}
      </Screen>
    </>
  );
}
