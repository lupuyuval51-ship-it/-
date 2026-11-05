/**
 * Route /launch/item/[id] ('new' creates a custom item; search param `category` preselects one):
 * title, description, category, status, notes, optional source, delete.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useLocalSearchParams, usePreventRemove, useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ReactElement } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  ChoiceList,
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  Screen,
  Section,
  SegmentedControl,
  Text,
  TextField,
  useConfirm,
  useNotice,
} from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate } from '@/i18n/format';
import { toAppError } from '@/lib/errors';
import { useFieldError } from '@/lib/forms';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useCreateLaunchItem, useDeleteLaunchItem, useLaunchItem, useUpdateLaunchItem } from '../api';
import { displayLaunchItem, type LaunchItem } from '../logic';
import {
  LaunchItemFormSchema,
  emptyLaunchItemForm,
  formToLaunchPatch,
  launchItemToForm,
  type LaunchItemFormOutput,
  type LaunchItemFormValues,
} from '../schemas';
import { LAUNCH_CATEGORIES, LAUNCH_STATUSES, isLaunchCategory } from '../templates';

export default function LaunchItemScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; category?: string }>();
  const isNew = params.id === 'new';
  const itemId = !isNew && typeof params.id === 'string' ? params.id : null;
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const query = useLaunchItem(businessId, itemId);

  const header = <Stack.Screen options={{ title: isNew ? t('launch.item.newTitle') : t('launch.item.editTitle') }} />;
  const back = () => router.navigate('/launch' as Href);

  if ((!businessId && businessLoading) || (!isNew && query.isLoading && query.data === undefined)) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <LoadingState variant="screen" />
      </Screen>
    );
  }
  if (!businessId) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <EmptyState title={t('launch.title')} body={t('launch.noBusiness')} />
      </Screen>
    );
  }
  if (!isNew && query.error && query.data === undefined) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <ErrorState error={query.error} onRetry={() => void query.refetch()} retrying={query.isRefetching} />
      </Screen>
    );
  }
  if (!isNew && !query.data) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <EmptyState title={t('launch.item.notFoundTitle')} body={t('launch.item.notFoundBody')} action={{ label: t('launch.item.back'), onPress: back }} />
      </Screen>
    );
  }

  const category = isLaunchCategory(params.category) ? params.category : 'other';
  return <ItemForm key={query.data?.id ?? 'new'} header={header} businessId={businessId} item={query.data ?? null} initialCategory={category} />;
}

interface ItemFormProps {
  header: ReactElement;
  businessId: string;
  item: LaunchItem | null;
  initialCategory: LaunchItemFormValues['category'];
}

function ItemForm({ header, businessId, item, initialCategory }: ItemFormProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const confirm = useConfirm();
  const notice = useNotice();
  const online = useIsOnline();
  const fieldError = useFieldError();
  const create = useCreateLaunchItem(businessId);
  const update = useUpdateLaunchItem(businessId);
  const remove = useDeleteLaunchItem(businessId);

  const form = useForm<LaunchItemFormValues, unknown, LaunchItemFormOutput>({
    resolver: zodResolver(LaunchItemFormSchema),
    defaultValues: item ? launchItemToForm(item, locale) : emptyLaunchItemForm(initialCategory),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const saving = create.isPending || update.isPending;
  // Navigate away only after the render that turned the unsaved-changes guard off.
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (!finished) return;
    if (router.canGoBack()) router.back();
    else router.replace('/launch' as Href);
  }, [finished, router]);

  usePreventRemove(form.formState.isDirty && !saving && !remove.isPending && !finished, ({ repeat }) => {
    void (async () => {
      const ok = await confirm({
        title: t('launch.item.discardTitle'),
        message: t('launch.item.discardBody'),
        confirmLabel: t('launch.item.discard'),
        destructive: true,
      });
      if (ok) {
        form.reset(form.getValues());
        repeat();
      }
    })();
  });

  const submit = form.handleSubmit((values) => {
    if (!online || saving) return;
    const patch = formToLaunchPatch(values);
    if (item) {
      update.mutate(
        { id: item.id, patch },
        {
          onSuccess: (saved) => {
            form.reset(launchItemToForm(saved, locale));
            notice.show({ message: t('launch.item.saved') });
            setFinished(true);
          },
        },
      );
    } else {
      create.mutate(patch, {
        onSuccess: (created) => {
          form.reset(launchItemToForm(created, locale));
          notice.show({ message: t('launch.item.created') });
          setFinished(true);
        },
      });
    }
  });

  const destroy = async () => {
    if (!item) return;
    const ok = await confirm({
      title: t('launch.item.deleteConfirmTitle'),
      message: t('launch.item.deleteConfirmBody'),
      confirmLabel: t('common.actions.delete'),
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(item.id, {
      onSuccess: () => {
        form.reset(form.getValues());
        notice.show({ message: t('launch.item.deleted') });
        setFinished(true);
      },
    });
  };

  const display = item ? displayLaunchItem(item, locale) : null;
  const template = display?.template ?? null;
  const sourceUrl = display?.sourceUrl ?? null;
  const mutationError = create.error ?? update.error ?? remove.error;

  return (
    <Screen
      edges={['bottom']}
      footer={
        <Button
          label={item ? t('common.actions.save') : t('launch.item.create')}
          onPress={() => void submit()}
          loading={saving}
          disabled={!online || remove.isPending}
          fullWidth
          testID="launch-item-save"
        />
      }
      testID="launch-item-form"
    >
      {header}
      {!online ? <InlineNotice tone="warning" message={t('launch.offline')} /> : null}
      {mutationError ? <InlineNotice tone="error" message={t(toAppError(mutationError).messageKey)} /> : null}
      {template ? (
        <InlineNotice tone="info" message={t('launch.item.templateNote', { date: formatDate(template.lastReviewed, locale) })} testID="launch-item-template-note" />
      ) : null}

      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <TextField
            label={t('launch.item.titleLabel')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(fieldState.error)}
            maxLength={200}
            disabled={saving}
            testID="launch-item-title"
          />
        )}
      />
      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <TextField
            label={t('launch.item.descriptionLabel')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(fieldState.error)}
            multiline
            maxLength={4000}
            disabled={saving}
            testID="launch-item-description"
          />
        )}
      />

      <View style={styles.block}>
        <Text variant="callout" weight={500}>
          {t('launch.item.statusLabel')}
        </Text>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <SegmentedControl
              options={LAUNCH_STATUSES.map((s) => ({ value: s, label: t(`launch.status.${s}`) }))}
              value={field.value}
              onChange={field.onChange}
              accessibilityLabel={t('launch.item.statusLabel')}
              disabled={saving}
              testID="launch-item-status"
            />
          )}
        />
      </View>

      <View style={styles.block}>
        <Text variant="callout" weight={500}>
          {t('launch.item.categoryLabel')}
        </Text>
        <Controller
          control={form.control}
          name="category"
          render={({ field, fieldState }) => (
            <ChoiceList
              options={LAUNCH_CATEGORIES.map((c) => ({ value: c, label: t(`launch.categories.${c}`) }))}
              value={field.value}
              onChange={field.onChange}
              accessibilityLabel={t('launch.item.categoryLabel')}
              error={fieldError(fieldState.error)}
              testID="launch-item-category"
            />
          )}
        />
      </View>

      <Controller
        control={form.control}
        name="notes"
        render={({ field, fieldState }) => (
          <TextField
            label={t('launch.item.notesLabel')}
            hint={t('launch.item.notesHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(fieldState.error)}
            multiline
            maxLength={2000}
            disabled={saving}
            testID="launch-item-notes"
          />
        )}
      />

      <Section title={t('launch.item.sourceTitle')}>
        <Controller
          control={form.control}
          name="sourceName"
          render={({ field, fieldState }) => (
            <TextField
              label={t('launch.item.sourceNameLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(fieldState.error)}
              maxLength={200}
              disabled={saving}
              testID="launch-item-source-name"
            />
          )}
        />
        <Controller
          control={form.control}
          name="sourceUrl"
          render={({ field, fieldState }) => (
            <TextField
              label={t('launch.item.sourceUrlLabel')}
              hint={t('launch.item.sourceUrlHint')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(fieldState.error)}
              maxLength={500}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              inputMode="url"
              disabled={saving}
              testID="launch-item-source-url"
            />
          )}
        />
        {sourceUrl ? (
          <Button
            label={t('launch.item.openSource')}
            variant="quiet"
            icon="external-link"
            inline
            onPress={() => {
              WebBrowser.openBrowserAsync(sourceUrl).catch(() => notice.show({ tone: 'error', message: t('launch.openSourceFailed') }));
            }}
            testID="launch-item-open-source"
          />
        ) : null}
      </Section>

      {item ? (
        <Button
          label={t('launch.item.delete')}
          variant="destructive"
          onPress={() => void destroy()}
          loading={remove.isPending}
          disabled={!online || saving}
          testID="launch-item-delete"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing[2] },
});
