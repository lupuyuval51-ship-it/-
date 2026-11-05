/** Route /plan/history: every version of the plan, newest first; the current one is marked. */
import { Stack, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState, ErrorState, Icon, LoadingState, Screen, Section, Text } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { formatDate } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing } from '@/theme/tokens';
import { usePlanVersions, type PlanVersionMeta } from '../api';
import { effectiveVersionStatus } from '../logic';

export default function HistoryScreen() {
  const t = useT();
  const router = useRouter();
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const history = usePlanVersions(businessId);
  const header = <Stack.Screen options={{ title: t('plan.history.title') }} />;

  let body;
  if ((!businessId && businessLoading) || history.isLoading) {
    body = <LoadingState variant="list" count={5} />;
  } else if (history.error && !history.data) {
    body = <ErrorState error={history.error} onRetry={() => void history.refetch()} />;
  } else if (!history.data || history.data.versions.length === 0) {
    body = (
      <EmptyState
        icon="clock"
        title={t('plan.history.emptyTitle')}
        body={t('plan.history.emptyBody')}
        action={{ label: t('plan.section.backToPlan'), onPress: () => router.navigate('/plan') }}
      />
    );
  } else {
    const { versions, currentVersionId } = history.data;
    const numberById = new Map(versions.map((v) => [v.id, v.version_number]));
    body = (
      <>
        <Text variant="callout" tone="secondary">
          {t('plan.history.intro')}
        </Text>
        <Section separated>
          {versions.map((version) => (
            <VersionRow
              key={version.id}
              version={version}
              isCurrent={version.id === currentVersionId}
              basedOnNumber={version.based_on_version_id ? numberById.get(version.based_on_version_id) : undefined}
              onPress={() => router.push({ pathname: '/plan/version/[id]', params: { id: version.id } })}
            />
          ))}
        </Section>
      </>
    );
  }

  return (
    <Screen edges={['bottom']} refreshing={history.isRefetching} onRefresh={businessId ? () => void history.refetch() : undefined} testID="plan-history-screen">
      {header}
      {body}
    </Screen>
  );
}

function VersionRow({
  version,
  isCurrent,
  basedOnNumber,
  onPress,
}: {
  version: PlanVersionMeta;
  isCurrent: boolean;
  basedOnNumber: number | undefined;
  onPress: () => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const { status } = effectiveVersionStatus(version);
  const ready = status === 'ready';
  const origin =
    version.origin === 'restored' && basedOnNumber !== undefined
      ? t('plan.history.restoredFrom', { number: basedOnNumber })
      : t(`plan.history.origin.${version.origin}`);
  const statusLabel = status === 'generating' ? t('plan.history.status.generating') : status === 'failed' ? t('plan.history.status.failed') : null;
  const date = formatDate(version.created_at, locale, { style: 'medium', withTime: true });
  const lines = [origin, statusLabel, date].filter(Boolean).join(' · ');
  const title = t('plan.history.version', { number: version.version_number });

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={[title, isCurrent ? t('plan.history.current') : null, lines, version.change_note].filter(Boolean).join(', ')}
      accessibilityState={{ disabled: !ready }}
      disabled={!ready}
      onPress={onPress}
      testID={`plan-version-${version.version_number}`}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
    >
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numeric tone={ready ? 'default' : 'secondary'}>
            {title}
          </Text>
          {isCurrent ? (
            <View style={[styles.current, { backgroundColor: colors.accentSoft }]}>
              <Text variant="caption" tone="accent" weight={500}>
                {t('plan.history.current')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="caption" tone={status === 'failed' ? 'danger' : 'secondary'} numeric>
          {lines}
        </Text>
        {version.change_note ? (
          <Text variant="callout" tone="secondary" numberOfLines={3}>
            {version.change_note}
          </Text>
        ) : null}
      </View>
      {ready ? <Icon name="chevron-right" size={18} tone="secondary" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    marginHorizontal: -spacing[2],
    borderRadius: radii.control,
    minHeight: 56,
  },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  current: { paddingHorizontal: spacing[2], paddingVertical: 1, borderRadius: radii.control },
});
