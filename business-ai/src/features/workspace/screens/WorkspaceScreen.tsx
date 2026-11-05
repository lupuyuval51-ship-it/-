/**
 * Workspace tab — a calm index of everything beyond the four main tabs, grouped by intent,
 * with live counts where they help decide where to go.
 */
import { useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ListRow, Screen, Section } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useGoals } from '@/features/manage/api';
import { useRoadmap } from '@/features/roadmap/api';
import { useEntitlement } from '@/features/settings/api';
import { useT } from '@/i18n/I18nProvider';
import { qk } from '@/lib/queryKeys';
import { spacing } from '@/theme/tokens';

export default function WorkspaceScreen() {
  const t = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const active = useActiveBusiness();
  const businessId = active.businessId;
  const roadmap = useRoadmap(businessId);
  const goals = useGoals(businessId);
  const entitlement = useEntitlement();
  const [refreshing, setRefreshing] = useState(false);

  const go = (href: string) => () => router.push(href as Href);

  const openTasks = roadmap.data ? roadmap.tasks.filter((task) => task.status !== 'done').length : null;
  const activeGoals = goals.data ? goals.goals.filter((g) => g.status === 'active').length : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      active.refetch();
      entitlement.refetch();
      if (businessId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: qk.b(businessId, 'roadmap') }),
          queryClient.invalidateQueries({ queryKey: qk.b(businessId, 'goals') }),
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [active, entitlement, businessId, queryClient]);

  return (
    <Screen edges={['top']} title={t('home.workspace.title')} refreshing={refreshing} onRefresh={() => void onRefresh()} gap={spacing[8]} testID="workspace-tab">
      <Section title={t('home.workspace.groups.work')} titleVariant="overline" separated>
        <ListRow
          title={t('home.workspace.tasks.title')}
          subtitle={t('home.workspace.tasks.description')}
          value={
            openTasks === null ? undefined : openTasks === 0 ? t('home.workspace.tasks.none') : t('home.workspace.tasks.count', { count: openTasks })
          }
          numericValue
          accessibilityRole="link"
          onPress={go('/roadmap/tasks')}
        />
        <ListRow
          title={t('home.workspace.roadmap.title')}
          subtitle={t('home.workspace.roadmap.description')}
          accessibilityRole="link"
          onPress={go('/roadmap')}
        />
      </Section>

      <Section title={t('home.workspace.groups.grow')} titleVariant="overline" separated>
        <ListRow
          title={t('home.workspace.marketing.title')}
          subtitle={t('home.workspace.marketing.description')}
          accessibilityRole="link"
          onPress={go('/marketing')}
        />
        <ListRow
          title={t('home.workspace.launch.title')}
          subtitle={t('home.workspace.launch.description')}
          accessibilityRole="link"
          onPress={go('/launch')}
        />
      </Section>

      <Section title={t('home.workspace.groups.manage')} titleVariant="overline" separated>
        <ListRow
          title={t('home.workspace.performance.title')}
          subtitle={t('home.workspace.performance.description')}
          accessibilityRole="link"
          onPress={go('/manage')}
        />
        <ListRow
          title={t('home.workspace.transactions.title')}
          subtitle={t('home.workspace.transactions.description')}
          accessibilityRole="link"
          onPress={go('/manage/transactions')}
        />
        <ListRow
          title={t('home.workspace.goals.title')}
          subtitle={t('home.workspace.goals.description')}
          value={activeGoals ? t('home.workspace.goals.count', { count: activeGoals }) : undefined}
          numericValue
          accessibilityRole="link"
          onPress={go('/manage/goals')}
        />
      </Section>

      <Section title={t('home.workspace.groups.account')} titleVariant="overline" separated>
        <ListRow
          title={t('home.workspace.businesses.title')}
          subtitle={t('home.workspace.businesses.description')}
          value={active.business?.name}
          accessibilityRole="link"
          onPress={go('/businesses')}
        />
        <ListRow
          title={t('home.workspace.subscription.title')}
          subtitle={t('home.workspace.subscription.description')}
          value={entitlement.isLoading ? undefined : t(`settings.subscription.tier.${entitlement.tier}`)}
          accessibilityRole="link"
          onPress={go('/settings/subscription')}
        />
        <ListRow
          title={t('home.workspace.settings.title')}
          subtitle={t('home.workspace.settings.description')}
          accessibilityRole="link"
          onPress={go('/settings')}
          testID="open-settings"
        />
      </Section>
    </Screen>
  );
}
