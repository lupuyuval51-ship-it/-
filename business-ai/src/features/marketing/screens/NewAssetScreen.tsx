/**
 * Route /marketing/new: choose one of the nine kinds, optionally add an instruction, then either
 * generate a draft with AI (saved as a new asset) or start from a blank asset.
 * Search param `kind` preselects a kind.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { MARKETING_KINDS, type MarketingKind } from '@domain/marketing';
import { Button, ChoiceList, EmptyState, InlineNotice, LoadingState, Screen, Text, TextField, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { useT } from '@/i18n/I18nProvider';
import { fieldMessage, useFieldError } from '@/lib/forms';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useCreateAsset, useGenerateAsset, useMarketingQuota } from '../api';
import { GeneratingState } from '../components/GeneratingState';
import { isMarketingKind } from '../logic';
import { generationErrorText } from '../text';

const NewAssetSchema = z.object({
  kind: z
    .enum(MARKETING_KINDS)
    .nullable()
    .refine((v) => v !== null, fieldMessage('marketing.new.kindRequired')),
  instruction: z.string().trim().max(1000, fieldMessage('errors.field.tooLong', { max: 1000 })),
});
type NewAssetValues = z.input<typeof NewAssetSchema>;

export default function NewAssetScreen() {
  const t = useT();
  const router = useRouter();
  const notice = useNotice();
  const online = useIsOnline();
  const fieldError = useFieldError();
  const params = useLocalSearchParams<{ kind?: string }>();
  const { businessId, isLoading: businessLoading } = useActiveBusiness();
  const quota = useMarketingQuota();
  const generate = useGenerateAsset(businessId);
  const create = useCreateAsset(businessId);

  const form = useForm<NewAssetValues>({
    resolver: zodResolver(NewAssetSchema),
    defaultValues: { kind: isMarketingKind(params.kind) ? params.kind : null, instruction: '' },
  });

  const header = <Stack.Screen options={{ title: t('marketing.new.title') }} />;

  if (!businessId && businessLoading) {
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
        <EmptyState title={t('marketing.new.title')} body={t('marketing.list.noBusiness')} />
      </Screen>
    );
  }

  if (generate.isPending && generate.variables) {
    return (
      <Screen edges={['bottom']} testID="marketing-generating">
        {header}
        <GeneratingState kindTitle={t(`marketing.kinds.${generate.variables.kind}.title`)} />
      </Screen>
    );
  }

  const exhausted = quota.remaining === 0;
  const busy = generate.isPending || create.isPending;

  const onGenerate = form.handleSubmit((values) => {
    if (!online || busy || !values.kind) return;
    create.reset();
    generate.mutate(
      { kind: values.kind, instruction: values.instruction },
      {
        onSuccess: (asset) => {
          notice.show({ message: t('marketing.new.generated') });
          router.replace(`/marketing/${encodeURIComponent(asset.id)}` as Href);
        },
      },
    );
  });

  const onBlank = form.handleSubmit((values) => {
    if (!online || busy || !values.kind) return;
    generate.reset();
    const chosen: MarketingKind = values.kind;
    create.mutate(
      { kind: chosen, title: t(`marketing.kinds.${chosen}.title`) },
      {
        onSuccess: (asset) => {
          notice.show({ message: t('marketing.new.created') });
          router.replace(`/marketing/${encodeURIComponent(asset.id)}?edit=1` as Href);
        },
      },
    );
  });

  const error = generate.error ? generationErrorText(t, generate.error) : create.error ? generationErrorText(t, create.error) : null;

  return (
    <Screen
      edges={['bottom']}
      footer={
        <View style={styles.footer}>
          <Button
            label={t('marketing.new.generate')}
            onPress={() => void onGenerate()}
            disabled={!online || exhausted || busy}
            loading={generate.isPending}
            fullWidth
            testID="marketing-generate"
          />
          <Button
            label={t('marketing.new.blank')}
            variant="secondary"
            onPress={() => void onBlank()}
            disabled={!online || busy}
            loading={create.isPending}
            fullWidth
            testID="marketing-blank"
          />
        </View>
      }
      testID="marketing-new"
    >
      {header}
      {!online ? <InlineNotice tone="warning" message={t('marketing.new.offline')} /> : null}

      <View style={styles.block}>
        <Text variant="heading" accessibilityRole="header">
          {t('marketing.new.chooseKind')}
        </Text>
        <Controller
          control={form.control}
          name="kind"
          render={({ field, fieldState }) => (
            <ChoiceList
              options={MARKETING_KINDS.map((k) => ({
                value: k,
                label: t(`marketing.kinds.${k}.title`),
                description: t(`marketing.kinds.${k}.description`),
              }))}
              value={field.value}
              onChange={field.onChange}
              accessibilityLabel={t('marketing.new.chooseKindA11y')}
              error={fieldError(fieldState.error)}
              testID="marketing-kind"
            />
          )}
        />
      </View>

      <Controller
        control={form.control}
        name="instruction"
        render={({ field, fieldState }) => (
          <TextField
            label={t('marketing.new.instructionLabel')}
            hint={t('marketing.new.instructionHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(fieldState.error)}
            multiline
            maxLength={1000}
            disabled={busy}
            testID="marketing-instruction"
          />
        )}
      />

      {quota.remaining !== null ? (
        <Text variant="caption" tone={exhausted ? 'warning' : 'secondary'} numeric testID="marketing-remaining">
          {t('marketing.new.remaining', { count: quota.remaining })}
        </Text>
      ) : null}

      {exhausted && !error ? <InlineNotice tone="info" message={t('marketing.errors.quota')} /> : null}
      {error ? <InlineNotice tone="error" message={error} testID="marketing-new-error" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing[3] },
  footer: { gap: spacing[2] },
});
