/**
 * `/finance/scenarios` — edit the conservative / optimistic adjustments (expected is fixed at
 * 100%) and compare the three scenarios side by side. The comparison previews unsaved values.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { useDeferredValue, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { compareScenarios, DEFAULT_SCENARIOS } from '@domain/finance';
import { Button, InlineNotice, Screen, Section, Text, useNotice } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useUpdateFinancialModel } from '../api';
import { FinanceGate, readyFinance, type ReadyFinance } from '../components/FinanceGate';
import { NumberFormField } from '../components/FormFields';
import { ScenarioCompareTable } from '../components/ScenarioCompareTable';
import { useActiveFinance, useFinanceFormat } from '../hooks';
import { EDITABLE_SCENARIOS, SCENARIO_FIELDS, parseScenarioForm, scenarioFormDefaults, scenarioFormSchema, type ScenarioFormValues } from '../mapping';

const FIELD_LABEL = { volumePct: 'volume', pricePct: 'price', costPct: 'cost' } as const;

export default function ScenariosScreen() {
  const t = useT();
  const finance = useActiveFinance();
  const ready = readyFinance(finance);
  if (!ready) {
    return (
      <Screen edges={['bottom']}>
        <Stack.Screen options={{ title: t('finance.scenarios.title') }} />
        <FinanceGate finance={finance}>{() => null}</FinanceGate>
      </Screen>
    );
  }
  return <ScenariosForm ready={ready} />;
}

function ScenariosForm({ ready }: { ready: ReadyFinance }) {
  const t = useT();
  const notice = useNotice();
  const online = useIsOnline();
  const format = useFinanceFormat(ready.currency);
  const update = useUpdateFinancialModel(ready.businessId);
  const schema = useMemo(() => scenarioFormSchema(), []);
  const defaults = useMemo(() => scenarioFormDefaults(ready.model), [ready.model]);
  const form = useForm<ScenarioFormValues>({ resolver: zodResolver(schema), defaultValues: defaults, mode: 'onTouched' });

  // Live preview of the comparison with the values being edited (deferred: no recompute storm).
  const watched = useWatch({ control: form.control });
  const parsed = useMemo(() => parseScenarioForm({ ...defaults, ...watched } as ScenarioFormValues), [watched, defaults]);
  const deferred = useDeferredValue(parsed);
  const forecasts = useMemo(() => {
    const s = deferred ?? { conservative: ready.inputs.scenarios.conservative, optimistic: ready.inputs.scenarios.optimistic };
    return compareScenarios({ ...ready.inputs, scenarios: { ...ready.inputs.scenarios, ...s } });
  }, [deferred, ready.inputs]);
  const dirty = form.formState.isDirty;

  const submit = form.handleSubmit(async (values) => {
    const next = parseScenarioForm(values);
    if (!next) return;
    try {
      await update.mutateAsync({ conservative: next.conservative, optimistic: next.optimistic });
      form.reset(values);
      notice.show({ message: t('finance.scenarios.saved') });
    } catch {
      // Shown inline.
    }
  });

  const resetToDefaults = () => {
    for (const key of EDITABLE_SCENARIOS) {
      for (const field of SCENARIO_FIELDS) {
        form.setValue(`${key}.${field}`, String(DEFAULT_SCENARIOS[key][field]), { shouldDirty: true, shouldValidate: true });
      }
    }
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        <Button
          label={t('finance.scenarios.save')}
          onPress={() => void submit()}
          loading={update.isPending}
          disabled={!online || !dirty}
          fullWidth
          testID="finance-scenarios-save"
        />
      }
      testID="finance-scenarios"
    >
      <Stack.Screen options={{ title: t('finance.scenarios.title') }} />
      <View style={styles.intro}>
        <Text variant="body" tone="secondary">
          {t('finance.scenarios.intro')}
        </Text>
        <Text variant="callout" tone="secondary">
          {t('finance.scenarios.expectedFixed')}
        </Text>
      </View>

      <Section title={t('finance.scenarios.compare.title')} description={t('finance.disclaimer')}>
        <ScenarioCompareTable forecasts={forecasts} format={format} />
        {dirty ? (
          <Text variant="caption" tone="secondary">
            {t('finance.scenarios.unsaved')}
          </Text>
        ) : null}
      </Section>

      {EDITABLE_SCENARIOS.map((key) => (
        <Section key={key} title={t(`finance.scenario.${key}`)}>
          {SCENARIO_FIELDS.map((field) => (
            <NumberFormField
              key={field}
              control={form.control}
              name={`${key}.${field}`}
              label={t('finance.scenarios.pctField', { name: t(`finance.scenarios.${FIELD_LABEL[field]}`) })}
              hint={t(`finance.scenarios.${FIELD_LABEL[field]}Help`)}
              testID={`finance-scenario-${key}-${field}`}
            />
          ))}
        </Section>
      ))}

      <Button variant="quiet" inline label={t('finance.scenarios.reset')} onPress={resetToDefaults} testID="finance-scenarios-reset" />
      {!online ? <InlineNotice tone="info" message={t('errors.offline')} /> : null}
      {update.error ? <InlineNotice tone="error" message={t(update.error.messageKey)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing[2] },
});
