import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { TIER_LIMITS } from '@domain/entitlements';
import { Button, InlineNotice, Sheet, Text, useNotice } from '@/components/ui';
import { useEntitlement } from '@/features/settings/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useUpdateFinancialModel } from '../api';
import {
  capitalFormSchema,
  formatMoneyInputText,
  horizonFormSchema,
  parseForecastMonths,
  parseOptionalMoney,
  type CapitalFormValues,
  type HorizonFormValues,
} from '../mapping';
import { MoneyFormField, NumberFormField } from './FormFields';

interface SheetBaseProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
}

export function CapitalSheet({ visible, onClose, businessId, currentMinor, currency }: SheetBaseProps & { currentMinor: number; currency: string }) {
  const t = useT();
  const { locale } = useLocale();
  const notice = useNotice();
  const online = useIsOnline();
  const update = useUpdateFinancialModel(businessId);
  const schema = useMemo(() => capitalFormSchema(currency), [currency]);
  const form = useForm<CapitalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { startingCapital: formatMoneyInputText(currentMinor, locale) },
  });
  const { reset } = form;
  const resetMutation = update.reset;

  useEffect(() => {
    if (!visible) return;
    reset({ startingCapital: formatMoneyInputText(currentMinor, locale) });
    resetMutation();
  }, [visible, currentMinor, locale, reset, resetMutation]);

  const submit = form.handleSubmit(async (values) => {
    const minor = parseOptionalMoney(values.startingCapital, currency);
    if (minor === null) return;
    try {
      await update.mutateAsync({ startingCapitalMinor: minor });
      notice.show({ message: t('finance.capital.saved') });
      onClose();
    } catch {
      // Shown inline below.
    }
  });

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('finance.capital.title')}
      testID="finance-capital-sheet"
      footer={
        <Button label={t('common.actions.save')} onPress={() => void submit()} loading={update.isPending} disabled={!online} fullWidth testID="finance-capital-save" />
      }
    >
      <MoneyFormField control={form.control} name="startingCapital" label={t('finance.capital.field')} hint={t('finance.capital.hint')} currency={currency} />
      {!online ? <InlineNotice tone="info" message={t('errors.offline')} /> : null}
      {update.error ? <InlineNotice tone="error" message={t(update.error.messageKey)} /> : null}
    </Sheet>
  );
}

export function HorizonSheet({ visible, onClose, businessId, currentMonths }: SheetBaseProps & { currentMonths: number }) {
  const t = useT();
  const notice = useNotice();
  const online = useIsOnline();
  const entitlement = useEntitlement();
  const update = useUpdateFinancialModel(businessId);
  // Until the entitlement loads, let the server enforce the cap (do not block Pro users).
  const maxMonths = entitlement.isLoading ? TIER_LIMITS.pro.maxForecastMonths : entitlement.limits.maxForecastMonths;
  const capped = !entitlement.isLoading && maxMonths < TIER_LIMITS.pro.maxForecastMonths;
  const schema = useMemo(() => horizonFormSchema(maxMonths), [maxMonths]);
  const form = useForm<HorizonFormValues>({ resolver: zodResolver(schema), defaultValues: { forecastMonths: String(currentMonths) } });
  const { reset } = form;
  const resetMutation = update.reset;

  useEffect(() => {
    if (!visible) return;
    reset({ forecastMonths: String(currentMonths) });
    resetMutation();
  }, [visible, currentMonths, reset, resetMutation]);

  const submit = form.handleSubmit(async (values) => {
    const months = parseForecastMonths(values.forecastMonths);
    if (months === null) return;
    try {
      await update.mutateAsync({ forecastMonths: months });
      notice.show({ message: t('finance.horizon.saved') });
      onClose();
    } catch {
      // Shown inline below.
    }
  });

  const error = update.error;
  const errorMessage = error
    ? error.code === 'forecast_limit_exceeded'
      ? t('finance.horizon.overLimit', { max: error.maxForecastMonths ?? maxMonths })
      : t(error.messageKey)
    : null;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('finance.horizon.title')}
      testID="finance-horizon-sheet"
      footer={
        <Button label={t('common.actions.save')} onPress={() => void submit()} loading={update.isPending} disabled={!online} fullWidth testID="finance-horizon-save" />
      }
    >
      <NumberFormField control={form.control} name="forecastMonths" label={t('finance.horizon.field')} hint={t('finance.horizon.hint', { max: maxMonths })} />
      {capped ? (
        <View style={styles.upsell}>
          <Text variant="callout" tone="secondary">
            {t('finance.horizon.proHint', { max: TIER_LIMITS.pro.maxForecastMonths })}
          </Text>
          <Button
            variant="quiet"
            inline
            label={t('finance.horizon.seePlans')}
            onPress={() => {
              onClose();
              router.push('/settings/subscription');
            }}
          />
        </View>
      ) : null}
      {!online ? <InlineNotice tone="info" message={t('errors.offline')} /> : null}
      {errorMessage ? <InlineNotice tone="error" message={errorMessage} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  upsell: { gap: spacing[1], alignItems: 'flex-start' },
});
