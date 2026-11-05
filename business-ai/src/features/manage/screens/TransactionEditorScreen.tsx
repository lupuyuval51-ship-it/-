/**
 * /manage/transaction/[id] — create ('new', optional `?kind=expense`) or edit a transaction.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, EmptyState, ErrorState, InlineNotice, LoadingState, Screen, SegmentedControl, Text, TextField, useConfirm, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { DateField } from '@/features/roadmap/components/DateField';
import { useT } from '@/i18n/I18nProvider';
import { toISODate } from '@/i18n/format';
import type { TranslationKey } from '@/i18n/translate';
import { toAppError } from '@/lib/errors';
import { useFieldError } from '@/lib/forms';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useDeleteTransaction, useSaveTransaction, useTransaction, type TransactionRow } from '../api';
import { LIMITS, parseTransactionForm, transactionFormDefaults, transactionFormSchema, type TransactionFormValues } from '../forms';
import type { TransactionKind } from '../logic';

const SUGGESTIONS: Record<TransactionKind, readonly TranslationKey[]> = {
  income: [
    'manage.transaction.suggestions.income.sales',
    'manage.transaction.suggestions.income.services',
    'manage.transaction.suggestions.income.subscriptions',
    'manage.transaction.suggestions.income.misc',
  ],
  expense: [
    'manage.transaction.suggestions.expense.inventory',
    'manage.transaction.suggestions.expense.marketing',
    'manage.transaction.suggestions.expense.rent',
    'manage.transaction.suggestions.expense.salaries',
    'manage.transaction.suggestions.expense.software',
    'manage.transaction.suggestions.expense.fees',
    'manage.transaction.suggestions.expense.misc',
  ],
};

export default function TransactionEditorScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; kind?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const isNew = id === 'new';
  const active = useActiveBusiness();
  const businessId = active.businessId;
  const tx = useTransaction(businessId, isNew ? null : id);

  const title = isNew ? t('manage.transaction.newTitle') : t('manage.transaction.editTitle');
  const header = <Stack.Screen options={{ title }} />;
  const currency = active.business?.currency ?? 'ILS';

  if (!isNew && (tx.isLoading || (!businessId && active.isLoading))) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <LoadingState variant="text" count={4} />
        </Screen>
      </>
    );
  }
  if (!isNew && tx.error && !tx.data) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <ErrorState error={tx.error} onRetry={() => void tx.refetch()} />
        </Screen>
      </>
    );
  }
  if (!isNew && !tx.transaction) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <EmptyState
            title={t('manage.transaction.notFound')}
            action={{ label: t('manage.transaction.backToList'), onPress: () => router.replace('/manage/transactions' as Href) }}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      {header}
      <TransactionForm
        key={tx.transaction?.id ?? 'new'}
        businessId={businessId}
        currency={currency}
        existing={tx.transaction}
        initialKind={params.kind === 'expense' ? 'expense' : 'income'}
      />
    </>
  );
}

interface TransactionFormProps {
  businessId: string | null;
  currency: string;
  existing: TransactionRow | undefined;
  initialKind: TransactionKind;
}

function TransactionForm({ businessId, currency, existing, initialKind }: TransactionFormProps) {
  const t = useT();
  const router = useRouter();
  const notice = useNotice();
  const confirm = useConfirm();
  const online = useIsOnline();
  const fieldError = useFieldError();
  const save = useSaveTransaction(businessId);
  const remove = useDeleteTransaction(businessId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => transactionFormSchema(currency), [currency]);
  const defaultValues = useMemo(() => transactionFormDefaults(existing, toISODate(new Date()), initialKind), [existing, initialKind]);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TransactionFormValues>({ resolver: zodResolver(schema), defaultValues });
  const kind = useWatch({ control, name: 'kind' });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/manage/transactions' as Href));

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    const draft = parseTransactionForm(values, currency);
    if (!draft) {
      setSubmitError(t('errors.invalidRequest'));
      return;
    }
    try {
      await save.mutateAsync({ id: existing?.id, values: draft });
      notice.show({ message: t('manage.transaction.saved') });
      close();
    } catch (e) {
      setSubmitError(t(toAppError(e).messageKey));
    }
  });

  const onDelete = async () => {
    if (!existing) return;
    const ok = await confirm({
      title: t('manage.transaction.confirmDeleteTitle'),
      message: t('manage.transaction.confirmDeleteBody'),
      confirmLabel: t('manage.transaction.confirmDelete'),
      cancelLabel: t('common.actions.cancel'),
      destructive: true,
    });
    if (!ok) return;
    setSubmitError(null);
    try {
      await remove.mutateAsync(existing.id);
      notice.show({ message: t('manage.transaction.deleted') });
      close();
    } catch (e) {
      setSubmitError(t(toAppError(e).messageKey));
    }
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        <Button
          variant="primary"
          label={t('manage.transaction.save')}
          fullWidth
          loading={save.isPending}
          disabled={!online || remove.isPending || (!!existing && !isDirty)}
          onPress={() => void submit()}
          testID="transaction-save"
        />
      }
    >
      {submitError ? <InlineNotice tone="error" message={submitError} onDismiss={() => setSubmitError(null)} /> : null}
      {!online ? <InlineNotice tone="warning" message={t('errors.offline')} /> : null}

      <Controller
        control={control}
        name="kind"
        render={({ field }) => (
          <View style={styles.group}>
            <Text variant="callout" weight={500}>
              {t('manage.transaction.kind.label')}
            </Text>
            <SegmentedControl
              accessibilityLabel={t('manage.transaction.kind.label')}
              options={[
                { value: 'income', label: t('manage.transaction.kind.income') },
                { value: 'expense', label: t('manage.transaction.kind.expense') },
              ]}
              value={field.value}
              onChange={field.onChange}
              testID="transaction-kind"
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <TextField
            label={t('manage.transaction.amount')}
            hint={t('manage.transaction.amountHint')}
            mode="money"
            currency={currency}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(errors.amount)}
            autoFocus={!existing}
            testID="transaction-amount"
          />
        )}
      />

      <Controller
        control={control}
        name="occurredOn"
        render={({ field }) => (
          <DateField
            label={t('manage.transaction.date')}
            value={field.value}
            onChange={field.onChange}
            error={fieldError(errors.occurredOn)}
            clearable={false}
            testID="transaction-date"
          />
        )}
      />

      <View style={styles.group}>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <TextField
              label={t('manage.transaction.category')}
              hint={t('manage.transaction.categoryHint')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldError(errors.category)}
              maxLength={LIMITS.categoryMax}
              testID="transaction-category"
            />
          )}
        />
        <View style={styles.chips} accessible={false} accessibilityLabel={t('manage.transaction.suggestionsLabel')}>
          {SUGGESTIONS[kind].map((key) => (
            <Button
              key={key}
              variant="secondary"
              size="compact"
              label={t(key)}
              onPress={() => setValue('category', t(key), { shouldDirty: true, shouldValidate: true })}
            />
          ))}
        </View>
      </View>

      <Controller
        control={control}
        name="note"
        render={({ field }) => (
          <TextField
            label={t('manage.transaction.note')}
            hint={t('manage.transaction.noteHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(errors.note)}
            multiline
            maxLength={LIMITS.noteMax}
            testID="transaction-note"
          />
        )}
      />

      {existing ? (
        <Button
          variant="destructive"
          label={t('manage.transaction.delete')}
          icon="trash-2"
          loading={remove.isPending}
          disabled={!online || save.isPending}
          onPress={() => void onDelete()}
          style={styles.delete}
          testID="transaction-delete"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  delete: { alignSelf: 'flex-start', marginTop: spacing[4] },
});
