/**
 * /businesses/[id] — rename, stage, country / currency and archive one business.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  ChoiceList,
  EmptyState,
  ErrorState,
  InlineNotice,
  ListRow,
  LoadingState,
  Screen,
  Section,
  Sheet,
  TextField,
  useConfirm,
  useNotice,
} from '@/components/ui';
import { useActiveBusiness, useArchiveBusiness, useBusinesses, useUpdateBusiness, type Business } from '@/features/business/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { hasTranslation } from '@/i18n/translate';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { CountryPicker } from '../components/CountryPicker';
import { CurrencyField } from '../components/CurrencyField';
import { BUSINESS_STAGE_VALUES, businessEditSchema, FIELD_LIMITS, type BusinessEditFields, type BusinessEditValues } from '../forms';
import { budgetCurrencyOptions, countryName, suggestCurrency } from '../logic';

export default function BusinessDetailsScreen() {
  const t = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { businesses, isLoading, error, refetch } = useActiveBusiness();
  const { isRefetching } = useBusinesses();
  const business = businesses.find((b) => b.id === id) ?? null;

  const header = <Stack.Screen options={{ title: t('onboarding.businesses.edit.title') }} />;

  if (!business) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          {isLoading ? (
            <LoadingState variant="screen" />
          ) : error && !businesses.length ? (
            <ErrorState error={error} onRetry={refetch} retrying={isRefetching} />
          ) : (
            <EmptyState
              icon="briefcase"
              title={t('onboarding.businesses.edit.notFound')}
              action={{ label: t('onboarding.businesses.title'), onPress: () => router.replace('/businesses') }}
            />
          )}
        </Screen>
      </>
    );
  }

  return (
    <>
      {header}
      <BusinessForm key={business.id} business={business} />
    </>
  );
}

function BusinessForm({ business }: { business: Business }) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const online = useIsOnline();
  const confirm = useConfirm();
  const notice = useNotice();
  const update = useUpdateBusiness();
  const archive = useArchiveBusiness();
  const [countryOpen, setCountryOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<BusinessEditFields, unknown, BusinessEditValues>({
    resolver: zodResolver(businessEditSchema),
    defaultValues: {
      name: business.name,
      stage: business.stage,
      countryCode: business.country_code ?? '',
      currency: business.currency,
    },
  });
  const countryCode = useWatch({ control: form.control, name: 'countryCode' });
  const currency = useWatch({ control: form.control, name: 'currency' });
  const suggested = suggestCurrency(countryCode);
  const { isDirty, isSubmitting } = form.formState;

  const fieldError = (message: string | undefined, max?: number) =>
    message ? (hasTranslation(message) ? t(message, max ? { max } : undefined) : t('errors.invalidRequest')) : undefined;

  const onSubmit = form.handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await update.mutateAsync({
        id: business.id,
        patch: { name: values.name, stage: values.stage, country_code: values.countryCode || null, currency: values.currency },
      });
      form.reset({ name: values.name, stage: values.stage, countryCode: values.countryCode, currency: values.currency });
      notice.show({ message: t('business.update.saved') });
    } catch (e) {
      setSaveError(t(toAppError(e).messageKey));
    }
  });

  const onArchive = async () => {
    const ok = await confirm({
      title: t('business.archive.confirmTitle', { name: business.name }),
      message: t('business.archive.confirmBody'),
      confirmLabel: t('business.archive.confirm'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await archive.mutateAsync(business.id);
      notice.show({ message: t('business.archive.done') });
      if (router.canGoBack()) router.back();
      else router.replace('/businesses');
    } catch (e) {
      notice.show({ message: t(toAppError(e).messageKey), tone: 'error' });
    }
  };

  const footer = (
    <>
      {saveError ? <InlineNotice tone="error" message={saveError} /> : null}
      <Button
        label={t('onboarding.businesses.edit.save')}
        onPress={() => void onSubmit()}
        loading={isSubmitting}
        disabled={!isDirty || !online || archive.isPending}
        fullWidth
        testID="business-save"
      />
    </>
  );

  return (
    <Screen edges={['bottom']} footer={footer} gap={spacing[8]} testID="business-details">
      {!online ? <InlineNotice tone="warning" message={t('onboarding.businesses.edit.offline')} /> : null}

      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('business.fields.name')}
            hint={t('business.fields.nameHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={FIELD_LIMITS.name}
            error={fieldError(fieldState.error?.message, FIELD_LIMITS.name)}
            testID="business-name"
          />
        )}
      />

      <Section title={t('business.fields.stage')} description={t('onboarding.businesses.edit.stageHint')}>
        <Controller
          control={form.control}
          name="stage"
          render={({ field, fieldState }) => (
            <ChoiceList
              accessibilityLabel={t('business.fields.stage')}
              value={field.value || null}
              onChange={field.onChange}
              error={fieldError(fieldState.error?.message)}
              options={BUSINESS_STAGE_VALUES.map((stage) => ({
                value: stage,
                label: t(`business.stage.${stage}`),
                description: t(`onboarding.businesses.edit.stages.${stage}`),
              }))}
              testID="business-stage"
            />
          )}
        />
      </Section>

      <View style={styles.group}>
        <ListRow
          title={t('business.fields.country')}
          value={countryCode ? (countryName(countryCode, locale) ?? countryCode) : t('onboarding.businesses.edit.countryNone')}
          onPress={() => setCountryOpen(true)}
          testID="business-country"
        />
        <Controller
          control={form.control}
          name="currency"
          render={({ field }) => (
            <CurrencyField
              label={t('business.fields.currency')}
              sheetTitle={t('onboarding.businesses.edit.currencySheetTitle')}
              hint={t('onboarding.businesses.edit.currencyHint')}
              value={field.value}
              options={budgetCurrencyOptions(business.currency, field.value, suggested)}
              onChange={field.onChange}
              testID="business-currency"
            />
          )}
        />
        {suggested && suggested !== currency ? (
          <Button
            variant="quiet"
            inline
            label={t('onboarding.businesses.edit.useSuggestedCurrency', {
              currency: suggested,
              country: countryName(countryCode, locale) ?? countryCode,
            })}
            onPress={() => form.setValue('currency', suggested, { shouldDirty: true })}
            style={styles.suggestion}
            testID="business-currency-suggestion"
          />
        ) : null}
      </View>

      <Section title={t('onboarding.businesses.edit.archiveTitle')} description={t('onboarding.businesses.edit.archiveBody')}>
        <Button
          variant="destructive"
          icon="archive"
          label={t('business.archive.action')}
          onPress={() => void onArchive()}
          loading={archive.isPending}
          disabled={!online || isSubmitting}
          style={styles.archive}
          testID="business-archive"
        />
      </Section>

      <Sheet visible={countryOpen} onClose={() => setCountryOpen(false)} title={t('onboarding.businesses.edit.countrySheetTitle')}>
        <CountryPicker
          value={countryCode || null}
          onChange={(code) => {
            form.setValue('countryCode', code, { shouldDirty: true });
            setCountryOpen(false);
          }}
          testID="business-country-picker"
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[1] },
  suggestion: { alignSelf: 'flex-start' },
  archive: { alignSelf: 'flex-start' },
});
