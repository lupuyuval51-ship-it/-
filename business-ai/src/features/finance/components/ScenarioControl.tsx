import { SCENARIO_KEYS, type ScenarioKey } from '@domain/finance';
import { SegmentedControl } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';

export function ScenarioControl({ value, onChange }: { value: ScenarioKey; onChange: (s: ScenarioKey) => void }) {
  const t = useT();
  return (
    <SegmentedControl
      accessibilityLabel={t('finance.scenario.label')}
      options={SCENARIO_KEYS.map((key) => ({ value: key, label: t(`finance.scenario.${key}`) }))}
      value={value}
      onChange={onChange}
      testID="finance-scenario"
    />
  );
}
