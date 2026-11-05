/**
 * Route /marketing: the studio's assets grouped by kind, with one primary action (Create).
 */
import { Stack, useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MARKETING_KINDS } from '@domain/marketing';
import { Button, EmptyState, ErrorState, ListRow, LoadingState, Screen, Section, Text } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { useMarketingAssets } from '../api';
import { usePullRefresh } from '../hooks';
import { groupAssetsByKind } from '../logic';
import { assetMeta } from '../text';

export default function MarketingListScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const assets = useMarketingAssets(businessId);
  const pull = usePullRefresh(assets.refetch);

  const header = <Stack.Screen options={{ title: t('marketing.title') }} />;
  const create = () => router.push('/marketing/new' as Href);

  if ((!businessId && businessLoading) || (assets.isLoading && !assets.data)) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <LoadingState variant="list" count={5} />
      </Screen>
    );
  }

  if (!businessId) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <EmptyState title={t('marketing.title')} body={t('marketing.list.noBusiness')} />
      </Screen>
    );
  }

  if (assets.error && !assets.data) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <ErrorState error={assets.error} onRetry={() => void assets.refetch()} retrying={assets.isRefetching} />
      </Screen>
    );
  }

  const list = assets.data ?? [];

  if (list.length === 0) {
    return (
      <Screen edges={['bottom']} refreshing={pull.refreshing} onRefresh={pull.onRefresh} testID="marketing-empty">
        {header}
        <View style={styles.intro}>
          <Text variant="title">{t('marketing.list.emptyTitle')}</Text>
          <Text variant="body" tone="secondary">
            {t('marketing.list.emptyBody')}
          </Text>
        </View>
        <Section separated>
          {MARKETING_KINDS.map((kind) => (
            <View key={kind} style={styles.toolRow} accessible accessibilityLabel={`${t(`marketing.kinds.${kind}.title`)}. ${t(`marketing.kinds.${kind}.description`)}`}>
              <Text variant="bodyStrong">{t(`marketing.kinds.${kind}.title`)}</Text>
              <Text variant="callout" tone="secondary">
                {t(`marketing.kinds.${kind}.description`)}
              </Text>
            </View>
          ))}
        </Section>
        <Button label={t('marketing.list.emptyAction')} onPress={create} icon="plus" testID="marketing-create" />
      </Screen>
    );
  }

  const groups = groupAssetsByKind(list);

  return (
    <Screen
      edges={['bottom']}
      refreshing={pull.refreshing}
      onRefresh={pull.onRefresh}
      footer={<Button label={t('marketing.list.create')} onPress={create} icon="plus" fullWidth testID="marketing-create" />}
      testID="marketing-list"
    >
      {header}
      {groups.map((group) => (
        <Section key={group.kind} title={t(`marketing.kinds.${group.kind}.title`)} separated>
          {group.assets.map((asset) => (
            <ListRow
              key={asset.id}
              title={asset.title}
              subtitle={assetMeta(t, locale, asset)}
              onPress={() => router.push(`/marketing/${encodeURIComponent(asset.id)}` as Href)}
              accessibilityRole="link"
              testID={`marketing-asset-${asset.id}`}
            />
          ))}
        </Section>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing[2] },
  toolRow: { gap: 2, paddingVertical: spacing[3] },
});
