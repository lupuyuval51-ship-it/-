/**
 * `/finance/line/[kind]/[id]` — create (`id = 'new'`) or edit a startup cost, recurring expense or
 * revenue stream. RHF + zod; money formatted on blur; revenue shows live unit economics.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { grossMarginPct, markupPct, unitContributionMinor, validateInputs } from '@domain/finance';
import { Button, Divider, EmptyState, InlineNotice, Screen, Section, useConfirm, useNotice } from '@/components/ui';
import { parseMoneyInput } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useCreateFinanceLine, useDeleteFinanceLine, useUpdateFinanceLine } from '../api';
import { FigureRow } from '../components/FigureRow';
import { FinanceGate, readyFinance, type ReadyFinance } from '../components/FinanceGate';
import { BasisPicker, MoneyFormField, NumberFormField, TextFormField } from '../components/FormFields';
import { useActiveFinance, useFinanceFormat } from '../hooks';
import {
  LABEL_MAX,
  CATEGORY_MAX,
  findLine,
  inputsWithDraft,
  isLineKind,
  lineFormDefaults,
  lineFormSchema,
  lineIssueErrors,
  linesOfKind,
  parseLineForm,
  parseOptionalMoney,
  type FinanceLine,
  type LineFormValues,
  type LineKind,
} from '../mapping';

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/finance');
}

export default function LineEditorScreen() {
  const t = useT();
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const kind = isLineKind(params.kind) ? params.kind : null;
  const id = typeof params.id === 'string' && params.id !== '' ? params.id : null;
  const finance = useActiveFinance();
  const ready = readyFinance(finance);

  if (!kind || !id) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState title={t('finance.line.invalidRoute')} action={{ label: t('finance.line.backToFinance'), onPress: () => router.replace('/finance') }} />
      </Screen>
    );
  }

  const isNew = id === 'new';
  const title = isNew ? t(`finance.line.newTitle.${kind}`) : t(`finance.line.editTitle.${kind}`);
  const line = ready && !isNew ? findLine(ready.lines, kind, id) : undefined;

  if (!ready || (!isNew && !line)) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={{ title }} />
        <FinanceGate finance={finance}>
          {() => (
            <EmptyState
              title={t('finance.line.notFoundTitle')}
              body={t('finance.line.notFoundBody')}
              action={{ label: t('finance.line.backToFinance'), onPress: leave }}
              testID="finance-line-not-found"
            />
          )}
        </FinanceGate>
      </Screen>
    );
  }

  return <LineForm key={`${kind}:${line?.id ?? 'new'}`} kind={kind} line={line} ready={ready} title={title} />;
}

function LineForm({ kind, line, ready, title }: { kind: LineKind; line: FinanceLine | undefined; ready: ReadyFinance; title: string }) {
  const t = useT();
  const { locale } = useLocale();
  const notice = useNotice();
  const confirm = useConfirm();
  const online = useIsOnline();
  const { businessId, currency } = ready;
  const create = useCreateFinanceLine(businessId);
  const update = useUpdateFinanceLine(businessId);
  const remove = useDeleteFinanceLine(businessId);
  const [forecastError, setForecastError] = useState(false);

  const schema = useMemo(() => lineFormSchema(kind, currency), [kind, currency]);
  const form = useForm<LineFormValues>({
    resolver: zodResolver(schema),
    defaultValues: lineFormDefaults(line, kind, locale),
    mode: 'onTouched',
  });

  const saving = create.isPending || update.isPending;
  const mutationError = create.error ?? update.error ?? remove.error;

  const submit = form.handleSubmit(async (values) => {
    const draft = parseLineForm(kind, values, currency);
    if (!draft) return;
    // Whole-model check: catches values that are fine alone but overflow the forecast together.
    const index = line ? linesOfKind(ready.lines, kind).findIndex((l) => l.id === line.id) : null;
    const candidate = inputsWithDraft(ready.inputs, draft, index);
    const errors = lineIssueErrors(validateInputs(candidate.inputs), kind, candidate.index);
    const alreadyOverflowing = lineIssueErrors(validateInputs(ready.inputs), kind, -1).forecast;
    for (const [field, key] of Object.entries(errors.fields)) form.setError(field as keyof LineFormValues, { message: key });
    const blockForecast = errors.forecast && !alreadyOverflowing;
    setForecastError(blockForecast);
    if (blockForecast || Object.keys(errors.fields).length > 0) return;
    try {
      if (line) await update.mutateAsync({ id: line.id, draft });
      else await create.mutateAsync(draft);
      notice.show({ message: t('finance.line.saved') });
      leave();
    } catch {
      // Shown inline.
    }
  });

  const onDelete = async () => {
    if (!line) return;
    const ok = await confirm({
      title: t('finance.line.deleteTitle', { label: line.label }),
      message: t('finance.line.deleteBody'),
      confirmLabel: t('finance.line.delete'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync({ kind, id: line.id });
      notice.show({ message: t('finance.line.deleted') });
      leave();
    } catch {
      // Shown inline.
    }
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        <Button
          label={line ? t('finance.line.save') : t('finance.line.add')}
          onPress={() => void submit()}
          loading={saving}
          disabled={!online || remove.isPending}
          fullWidth
          testID="finance-line-save"
        />
      }
      testID={`finance-line-editor-${kind}`}
    >
      <Stack.Screen options={{ title }} />
      <View style={styles.fields}>
        <TextFormField
          control={form.control}
          name="label"
          label={t('finance.line.label')}
          hint={t(`finance.line.labelHint.${kind}`)}
          maxLength={LABEL_MAX}
          testID="finance-line-label"
        />
        {kind === 'revenue' ? (
          <>
            <MoneyFormField control={form.control} name="unitPrice" label={t('finance.line.unitPrice')} currency={currency} testID="finance-line-price" />
            <MoneyFormField
              control={form.control}
              name="unitCost"
              label={t('finance.line.unitCost')}
              hint={t('finance.line.unitCostHint')}
              currency={currency}
              testID="finance-line-cost"
            />
            <NumberFormField
              control={form.control}
              name="monthlyUnits"
              label={t('finance.line.monthlyUnits')}
              hint={t('finance.line.monthlyUnitsHint')}
              testID="finance-line-units"
            />
            <NumberFormField
              control={form.control}
              name="growthPct"
              label={t('finance.line.growthPct')}
              hint={t('finance.line.growthHint')}
              testID="finance-line-growth"
            />
          </>
        ) : (
          <>
            <MoneyFormField
              control={form.control}
              name="amount"
              label={kind === 'startup' ? t('finance.line.amount') : t('finance.line.monthlyAmount')}
              currency={currency}
              testID="finance-line-amount"
            />
            <TextFormField
              control={form.control}
              name="category"
              label={t('finance.line.category')}
              hint={t('finance.line.categoryHint')}
              maxLength={CATEGORY_MAX}
              testID="finance-line-category"
            />
          </>
        )}
        <Controller control={form.control} name="basis" render={({ field }) => <BasisPicker value={field.value} onChange={field.onChange} />} />
      </View>

      {kind === 'revenue' ? <UnitEconomics control={form.control} currency={currency} /> : null}

      {forecastError ? <InlineNotice tone="warning" message={t('finance.validation.forecast')} /> : null}
      {!online ? <InlineNotice tone="info" message={t('errors.offline')} /> : null}
      {mutationError ? <InlineNotice tone="error" message={t(mutationError.messageKey)} /> : null}

      {line ? (
        <View style={styles.danger}>
          <Divider />
          <Button
            variant="destructive"
            label={t('finance.line.delete')}
            icon="trash-2"
            onPress={() => void onDelete()}
            loading={remove.isPending}
            disabled={!online || saving}
            testID="finance-line-delete"
          />
        </View>
      ) : null}
    </Screen>
  );
}

/** Live gross margin, contribution and markup from the engine while the user types. */
function UnitEconomics({ control, currency }: { control: Control<LineFormValues>; currency: string }) {
  const t = useT();
  const format = useFinanceFormat(currency);
  const [priceText, costText] = useWatch({ control, name: ['unitPrice', 'unitCost'] });
  const price = parseMoneyInput(priceText ?? '', currency);
  const cost = parseOptionalMoney(costText ?? '', currency);
  const metrics = useMemo(() => {
    if (price === null || cost === null) return null;
    return {
      margin: grossMarginPct(price, cost),
      contribution: unitContributionMinor(price, cost),
      markup: markupPct(price, cost),
    };
  }, [price, cost]);
  const na = t('finance.line.metrics.notApplicable');
  return (
    <Section title={t('finance.line.metrics.title')} description={t('finance.line.metrics.hint')} separated testID="finance-line-metrics">
      <FigureRow
        label={t('finance.line.metrics.grossMargin')}
        value={metrics ? (format.pct(metrics.margin) ?? na) : '—'}
        valueTone={metrics && metrics.margin !== null && metrics.margin < 0 ? 'danger' : metrics?.margin === null ? 'secondary' : 'default'}
      />
      <FigureRow
        label={t('finance.line.metrics.contribution')}
        value={metrics ? format.money(metrics.contribution) : '—'}
        valueTone={metrics && metrics.contribution < 0 ? 'danger' : 'default'}
      />
      <FigureRow
        label={t('finance.line.metrics.markup')}
        value={metrics ? (format.pct(metrics.markup) ?? na) : '—'}
        valueTone={metrics?.markup === null ? 'secondary' : 'default'}
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing[5] },
  danger: { gap: spacing[4], alignItems: 'flex-start' },
});
