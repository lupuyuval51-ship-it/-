/**
 * /manage/goal/[id] — create ('new') or edit a business goal.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, ChoiceList, EmptyState, ErrorState, InlineNotice, LoadingState, Screen, SegmentedControl, Text, TextField, useConfirm, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { DateField } from '@/features/roadmap/components/DateField';
import { useT } from '@/i18n/I18nProvider';
import { toAppError } from '@/lib/errors';
import { useFieldError } from '@/lib/forms';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useDeleteGoal, useGoal, useSaveGoal, type GoalRow } from '../api';
import { goalFormDefaults, goalFormSchema, LIMITS, parseGoalForm, type GoalFormValues } from '../forms';
import { GOAL_METRICS, GOAL_STATUSES, isMoneyMetric } from '../logic';

export default function GoalEditorScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const isNew = id === 'new';
  const active = useActiveBusiness();
  const businessId = active.businessId;
  const goal = useGoal(businessId, isNew ? null : id);
  const header = <Stack.Screen options={{ title: isNew ? t('manage.goal.newTitle') : t('manage.goal.editTitle') }} />;

  if (!isNew && (goal.isLoading || (!businessId && active.isLoading))) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <LoadingState variant="text" count={4} />
        </Screen>
      </>
    );
  }
  if (!isNew && goal.error && !goal.data) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <ErrorState error={goal.error} onRetry={() => void goal.refetch()} />
        </Screen>
      </>
    );
  }
  if (!isNew && !goal.goal) {
    return (
      <>
        {header}
        <Screen edges={['bottom']}>
          <EmptyState title={t('manage.goal.notFound')} action={{ label: t('manage.goal.backToList'), onPress: () => router.replace('/manage/goals' as Href) }} />
        </Screen>
      </>
    );
  }

  return (
    <>
      {header}
      <GoalForm key={goal.goal?.id ?? 'new'} businessId={businessId} currency={active.business?.currency ?? 'ILS'} existing={goal.goal} />
    </>
  );
}

function GoalForm({ businessId, currency, existing }: { businessId: string | null; currency: string; existing: GoalRow | undefined }) {
  const t = useT();
  const router = useRouter();
  const notice = useNotice();
  const confirm = useConfirm();
  const online = useIsOnline();
  const fieldError = useFieldError();
  const save = useSaveGoal(businessId);
  const remove = useDeleteGoal(businessId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => goalFormSchema(currency), [currency]);
  const defaultValues = useMemo(() => goalFormDefaults(existing), [existing]);
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = useForm<GoalFormValues>({ resolver: zodResolver(schema), defaultValues });
  const metric = useWatch({ control, name: 'metric' });
  const money = isMoneyMetric(metric);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/manage/goals' as Href));

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    const draft = parseGoalForm(values, currency);
    if (!draft) {
      setSubmitError(t('errors.invalidRequest'));
      return;
    }
    try {
      await save.mutateAsync({ id: existing?.id, values: draft });
      notice.show({ message: t('manage.goal.saved') });
      close();
    } catch (e) {
      setSubmitError(t(toAppError(e).messageKey));
    }
  });

  const onDelete = async () => {
    if (!existing) return;
    const ok = await confirm({
      title: t('manage.goal.confirmDeleteTitle'),
      message: t('manage.goal.confirmDeleteBody'),
      confirmLabel: t('manage.goal.confirmDelete'),
      cancelLabel: t('common.actions.cancel'),
      destructive: true,
    });
    if (!ok) return;
    setSubmitError(null);
    try {
      await remove.mutateAsync(existing.id);
      notice.show({ message: t('manage.goal.deleted') });
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
          label={t('manage.goal.save')}
          fullWidth
          loading={save.isPending}
          disabled={!online || remove.isPending || (!!existing && !isDirty)}
          onPress={() => void submit()}
          testID="goal-save"
        />
      }
    >
      {submitError ? <InlineNotice tone="error" message={submitError} onDismiss={() => setSubmitError(null)} /> : null}
      {!online ? <InlineNotice tone="warning" message={t('errors.offline')} /> : null}

      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            label={t('manage.goal.title')}
            hint={t('manage.goal.titleHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(errors.title)}
            maxLength={LIMITS.titleMax}
            autoFocus={!existing}
            testID="goal-title"
          />
        )}
      />

      <Controller
        control={control}
        name="metric"
        render={({ field }) => (
          <View style={styles.group}>
            <Text variant="callout" weight={500}>
              {t('manage.goal.metric.label')}
            </Text>
            <ChoiceList
              accessibilityLabel={t('manage.goal.metric.label')}
              options={GOAL_METRICS.map((m) => ({ value: m, label: t(`manage.goal.metric.${m}`), description: t(`manage.goal.metricHint.${m}`) }))}
              value={field.value}
              onChange={(next) => {
                // Money and plain numbers are not interchangeable: clear the target when switching kinds.
                if (isMoneyMetric(next) !== isMoneyMetric(getValues('metric'))) setValue('target', '', { shouldDirty: true });
                field.onChange(next);
              }}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="target"
        render={({ field }) => (
          <TextField
            label={money ? t('manage.goal.targetMoney') : t('manage.goal.target')}
            mode={money ? 'money' : 'number'}
            currency={money ? currency : undefined}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(errors.target)}
            testID="goal-target"
          />
        )}
      />

      {!money ? (
        <>
          <Controller
            control={control}
            name="current"
            render={({ field }) => (
              <TextField
                label={t('manage.goal.current')}
                mode="number"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(errors.current)}
                testID="goal-current"
              />
            )}
          />
          <Controller
            control={control}
            name="unit"
            render={({ field }) => (
              <TextField
                label={t('manage.goal.unit')}
                hint={t('manage.goal.unitHint')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(errors.unit)}
                maxLength={LIMITS.unitMax}
                testID="goal-unit"
              />
            )}
          />
        </>
      ) : null}

      <Controller
        control={control}
        name="dueDate"
        render={({ field }) => (
          <DateField
            label={t('manage.goal.dueDate')}
            hint={t('manage.goal.dueDateHint')}
            value={field.value}
            onChange={field.onChange}
            error={fieldError(errors.dueDate)}
            testID="goal-due"
          />
        )}
      />

      {existing ? (
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <View style={styles.group}>
              <Text variant="callout" weight={500}>
                {t('manage.goal.status.label')}
              </Text>
              <SegmentedControl
                accessibilityLabel={t('manage.goal.status.label')}
                options={GOAL_STATUSES.map((s) => ({ value: s, label: t(`manage.goal.status.${s}`) }))}
                value={field.value}
                onChange={field.onChange}
                testID="goal-status"
              />
            </View>
          )}
        />
      ) : null}

      {existing ? (
        <Button
          variant="destructive"
          icon="trash-2"
          label={t('manage.goal.delete')}
          loading={remove.isPending}
          disabled={!online || save.isPending}
          onPress={() => void onDelete()}
          style={styles.delete}
          testID="goal-delete"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[3] },
  delete: { alignSelf: 'flex-start', marginTop: spacing[4] },
});
