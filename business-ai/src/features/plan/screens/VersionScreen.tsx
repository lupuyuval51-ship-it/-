/** Route /plan/version/[id]: read-only view of one version + "Restore this version". */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PLAN_SECTION_KEYS, type PlanSectionContent, type PlanSectionKey } from '@domain/plan';
import { Button, Divider, EmptyState, ErrorState, InlineNotice, LoadingState, Screen, Text, useConfirm, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { formatDate } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { usePlanState, usePlanVersion, useRestoreVersion, type SectionMap } from '../api';
import { SectionContentView } from '../components/SectionContentView';
import { changedSectionKeys } from '../logic';
import { actionErrorText } from '../text';

function contents(map: SectionMap): Partial<Record<PlanSectionKey, PlanSectionContent>> {
  const out: Partial<Record<PlanSectionKey, PlanSectionContent>> = {};
  for (const key of PLAN_SECTION_KEYS) {
    const row = map[key];
    if (row) out[key] = row.content;
  }
  return out;
}

export default function VersionScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const confirm = useConfirm();
  const notice = useNotice();
  const online = useIsOnline();
  const params = useLocalSearchParams<{ id?: string }>();
  const versionId = typeof params.id === 'string' ? params.id : null;
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const version = usePlanVersion(businessId, versionId);
  const plan = usePlanState(businessId);
  const restore = useRestoreVersion(businessId);

  const data = version.data;
  const title = data ? t('plan.version.title', { number: data.version_number }) : t('plan.history.title');
  const header = <Stack.Screen options={{ title }} />;

  if ((!businessId && businessLoading) || version.isLoading) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <LoadingState variant="text" count={8} />
      </Screen>
    );
  }
  if (version.error && data === undefined) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <ErrorState error={version.error} onRetry={() => void version.refetch()} />
      </Screen>
    );
  }
  if (!data || data.status !== 'ready') {
    return (
      <Screen edges={['bottom']}>
        {header}
        <EmptyState
          icon="file-text"
          title={data ? t('plan.history.status.failed') : t('plan.version.notFoundTitle')}
          body={data ? t('plan.version.notReady') : t('plan.version.notFoundBody')}
          action={{ label: t('plan.version.backToHistory'), onPress: () => router.navigate('/plan/history') }}
        />
      </Screen>
    );
  }

  const isCurrent = plan.currentVersion?.id === data.id;
  const changed = plan.currentVersion && !isCurrent ? changedSectionKeys(contents(plan.sections), contents(data.sections)) : [];
  const changedSet = new Set(changed);
  const keys = PLAN_SECTION_KEYS.filter((key) => data.sections[key]);

  const doRestore = async () => {
    const ok = await confirm({
      title: t('plan.version.restoreTitle', { number: data.version_number }),
      message: t('plan.version.restoreBody', { number: data.version_number }),
      confirmLabel: t('plan.version.restoreConfirm'),
    });
    if (!ok) return;
    restore.mutate(data.id, {
      onSuccess: () => {
        notice.show({ message: t('plan.version.restored') });
        router.dismissTo('/plan');
      },
    });
  };

  return (
    <Screen
      edges={['bottom']}
      gap={spacing[8]}
      testID="plan-version-screen"
      footer={
        isCurrent ? undefined : (
          <View style={styles.footer}>
            {restore.error ? <InlineNotice tone="error" message={actionErrorText(t, restore.error, 'restore')} /> : null}
            <Button
              label={t('plan.version.restore')}
              onPress={() => void doRestore()}
              loading={restore.isPending}
              disabled={!online || plan.isGenerating}
              fullWidth
              testID="plan-version-restore"
            />
            {!online ? (
              <Text variant="caption" tone="secondary">
                {t('plan.errors.offlineAction')}
              </Text>
            ) : null}
          </View>
        )
      }
    >
      {header}
      <View style={styles.head}>
        <Text variant="overline" tone="secondary" numeric>
          {[t(`plan.history.origin.${data.origin}`), formatDate(data.created_at, locale, { style: 'medium', withTime: true })].join(' · ')}
        </Text>
        <Text variant="display">{title}</Text>
        {data.change_note ? (
          <Text variant="callout" tone="secondary">
            {data.change_note}
          </Text>
        ) : null}
      </View>

      <InlineNotice
        tone="info"
        message={
          isCurrent
            ? t('plan.version.isCurrent')
            : `${t('plan.version.readOnly')}${plan.currentVersion ? ` ${changed.length > 0 ? t('plan.version.changedCount', { count: changed.length }) : t('plan.version.unchanged')}` : ''}`
        }
      />

      {keys.map((key, index) => {
        const row = data.sections[key];
        if (!row) return null;
        return (
          <View key={key} style={styles.section}>
            {index > 0 ? <Divider /> : null}
            <View style={styles.sectionHead}>
              <Text variant="title">{t(`plan.sections.${key}`)}</Text>
              {changedSet.has(key) ? (
                <Text variant="caption" tone="secondary" weight={500}>
                  {t('plan.version.changed')}
                </Text>
              ) : null}
            </View>
            <SectionContentView content={row.content} />
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing[2] },
  section: { gap: spacing[5] },
  sectionHead: { gap: spacing[1] },
  footer: { gap: spacing[2] },
});
