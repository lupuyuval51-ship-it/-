/**
 * Route /marketing/[id]: read view of an asset (title, summary, items) with edit mode, AI
 * regeneration (creates a NEW asset of the same kind; this one is kept), share as text and delete.
 * Search param `edit=1` opens edit mode (used after "Start from blank").
 */
import { Stack, useLocalSearchParams, usePreventRemove, useRouter, type Href } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Button, EmptyState, ErrorState, InlineNotice, ListRow, LoadingState, Screen, Section, Text, useConfirm, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useDeleteAsset, useGenerateAsset, useMarketingAsset, useMarketingQuota, useUpdateAsset } from '../api';
import { AssetEditorFields, useAssetEditForm } from '../components/AssetEditor';
import { GeneratingState } from '../components/GeneratingState';
import { marketingAssetToText, type MarketingAsset } from '../logic';
import { assetToEditValues, editValuesToContent } from '../schemas';
import { assetMeta, generationErrorText } from '../text';

export default function AssetScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; edit?: string }>();
  const assetId = typeof params.id === 'string' ? params.id : null;
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const query = useMarketingAsset(businessId, assetId);
  const asset = query.data;

  const header = <Stack.Screen options={{ title: asset ? t(`marketing.kinds.${asset.kind}.title`) : t('marketing.title') }} />;

  if ((!businessId && businessLoading) || (query.isLoading && !asset)) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <LoadingState variant="screen" />
      </Screen>
    );
  }

  if (!asset) {
    const notFound = !businessId || !assetId || !query.error || toAppError(query.error).code === 'not_found';
    return (
      <Screen edges={['bottom']}>
        {header}
        {notFound ? (
          <EmptyState
            icon="file-text"
            title={t('marketing.detail.notFoundTitle')}
            body={t('marketing.detail.notFoundBody')}
            action={{ label: t('marketing.detail.backToStudio'), onPress: () => router.navigate('/marketing' as Href) }}
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
        )}
      </Screen>
    );
  }

  return <AssetView key={asset.id} header={header} businessId={businessId as string} asset={asset} startInEdit={params.edit === '1'} />;
}

interface AssetViewProps {
  header: ReactElement;
  businessId: string;
  asset: MarketingAsset;
  startInEdit: boolean;
}

function AssetView({ header, businessId, asset, startInEdit }: AssetViewProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const confirm = useConfirm();
  const notice = useNotice();
  const online = useIsOnline();
  const quota = useMarketingQuota();
  const update = useUpdateAsset(businessId);
  const remove = useDeleteAsset(businessId);
  const generate = useGenerateAsset(businessId);
  const form = useAssetEditForm(asset);
  const [mode, setMode] = useState<'read' | 'edit'>(startInEdit ? 'edit' : 'read');

  const dirty = mode === 'edit' && form.formState.isDirty;
  usePreventRemove(dirty && !update.isPending, ({ repeat }) => {
    void (async () => {
      const ok = await confirm({
        title: t('marketing.editor.discardTitle'),
        message: t('marketing.editor.discardBody'),
        confirmLabel: t('marketing.editor.discard'),
        destructive: true,
      });
      if (ok) {
        form.reset(assetToEditValues(asset));
        setMode('read');
        repeat();
      }
    })();
  });

  /* ---------------- edit ---------------- */
  if (mode === 'edit') {
    const save = form.handleSubmit((values) => {
      if (!online || update.isPending) return;
      update.mutate(
        { id: asset.id, title: values.title, content: editValuesToContent(values) },
        {
          onSuccess: (saved) => {
            form.reset(assetToEditValues(saved));
            setMode('read');
            notice.show({ message: t('marketing.detail.saved') });
          },
        },
      );
    });
    const cancel = async () => {
      if (form.formState.isDirty) {
        const ok = await confirm({
          title: t('marketing.editor.discardTitle'),
          message: t('marketing.editor.discardBody'),
          confirmLabel: t('marketing.editor.discard'),
          destructive: true,
        });
        if (!ok) return;
      }
      form.reset(assetToEditValues(asset));
      update.reset();
      setMode('read');
    };
    return (
      <Screen
        edges={['bottom']}
        footer={
          <View style={styles.footer}>
            <Button label={t('common.actions.cancel')} variant="quiet" onPress={() => void cancel()} disabled={update.isPending} testID="asset-edit-cancel" />
            <Button
              label={t('common.actions.save')}
              onPress={() => void save()}
              loading={update.isPending}
              disabled={!online}
              style={styles.footerPrimary}
              testID="asset-edit-save"
            />
          </View>
        }
        testID="asset-edit"
      >
        {header}
        {!online ? <InlineNotice tone="warning" message={t('marketing.detail.offline')} /> : null}
        {update.error ? <InlineNotice tone="error" message={t(toAppError(update.error).messageKey)} /> : null}
        <AssetEditorFields form={form} disabled={update.isPending} />
      </Screen>
    );
  }

  /* ---------------- read ---------------- */
  const startEdit = () => {
    form.reset(assetToEditValues(asset));
    update.reset();
    setMode('edit');
  };

  const regenerate = async () => {
    if (!online || generate.isPending) return;
    const ok = await confirm({
      title: t('marketing.detail.regenerateConfirmTitle'),
      message: t('marketing.detail.regenerateConfirmBody'),
      confirmLabel: t('marketing.detail.regenerateConfirm'),
    });
    if (!ok) return;
    generate.mutate(
      { kind: asset.kind },
      {
        onSuccess: (created) => {
          notice.show({ message: t('marketing.detail.regenerated') });
          router.push(`/marketing/${encodeURIComponent(created.id)}` as Href);
        },
      },
    );
  };

  const share = async () => {
    try {
      await Share.share({ message: marketingAssetToText(asset), title: asset.title });
    } catch {
      notice.show({ tone: 'error', message: t('marketing.detail.shareFailed') });
    }
  };

  const destroy = async () => {
    const ok = await confirm({
      title: t('marketing.detail.deleteConfirmTitle'),
      message: t('marketing.detail.deleteConfirmBody'),
      confirmLabel: t('marketing.detail.delete'),
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(asset.id, {
      onSuccess: () => {
        notice.show({ message: t('marketing.detail.deleted') });
        if (router.canGoBack()) router.back();
        else router.replace('/marketing' as Href);
      },
    });
  };

  const { summary, items } = asset.content;
  const isEmpty = summary.trim() === '' && items.length === 0;
  const remaining = quota.remaining;

  return (
    <Screen edges={['bottom']} testID="asset-read">
      {header}
      <View style={styles.head}>
        <Text variant="title" accessibilityRole="header">
          {asset.title}
        </Text>
        <Text variant="caption" tone="secondary" accessibilityLabel={t('marketing.origin.a11y', { origin: assetMeta(t, locale, asset) })}>
          {assetMeta(t, locale, asset)}
        </Text>
      </View>

      {!online ? <InlineNotice tone="warning" message={t('marketing.detail.offline')} /> : null}
      {asset.origin === 'ai' ? <InlineNotice tone="info" message={t('marketing.detail.aiNote')} /> : null}

      {isEmpty ? (
        <Text variant="body" tone="secondary">
          {t('marketing.detail.emptyContent')}
        </Text>
      ) : null}

      {summary.trim() !== '' ? (
        <Text variant="body" testID="asset-summary">
          {summary}
        </Text>
      ) : null}

      {items.length > 0 ? (
        <Section title={t('marketing.detail.items')} separated>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              {item.label ? (
                <Text variant="overline" tone="secondary">
                  {item.label}
                </Text>
              ) : null}
              {item.heading ? <Text variant="heading">{item.heading}</Text> : null}
              {item.body ? (
                <Text variant="body" tone={item.heading ? 'secondary' : 'default'}>
                  {item.body}
                </Text>
              ) : null}
            </View>
          ))}
        </Section>
      ) : null}

      {generate.isPending ? <GeneratingState kindTitle={t(`marketing.kinds.${asset.kind}.title`)} testID="asset-regenerating" /> : null}
      {generate.error ? <InlineNotice tone="error" message={generationErrorText(t, generate.error)} /> : null}
      {remove.error ? <InlineNotice tone="error" message={t(toAppError(remove.error).messageKey)} /> : null}

      <Section separated>
        <ListRow title={t('marketing.detail.edit')} icon="edit-2" onPress={startEdit} disabled={!online || generate.isPending} chevron={false} testID="asset-edit" />
        <ListRow
          title={t('marketing.detail.regenerate')}
          subtitle={remaining !== null ? t('marketing.new.remaining', { count: remaining }) : undefined}
          icon="refresh-cw"
          onPress={() => void regenerate()}
          disabled={!online || generate.isPending || remaining === 0}
          chevron={false}
          testID="asset-regenerate"
        />
        <ListRow title={t('marketing.detail.share')} icon="share" onPress={() => void share()} chevron={false} testID="asset-share" />
        <ListRow
          title={t('marketing.detail.delete')}
          icon="trash-2"
          destructive
          onPress={() => void destroy()}
          disabled={!online || remove.isPending || generate.isPending}
          chevron={false}
          testID="asset-delete"
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing[1] },
  item: { gap: spacing[1], paddingVertical: spacing[4] },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing[2] },
  footerPrimary: { flexGrow: 1 },
});
