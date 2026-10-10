import { IconButton, NumberField } from '../../components/ui';
import { useI18n } from '../../i18n';

/**
 * Number input with quick − / + buttons (one tap per set / rep / 5 seconds) for editing a
 * plan on a phone. The typed value stays authoritative; the buttons start from `fallback`
 * when the field is empty.
 */
export function StepperField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  fallback,
  error,
}: {
  label: string;
  value: number | null;
  onChange(value: number | null): void;
  min: number;
  max: number;
  step?: number;
  /** Value the first tap starts from when the field is empty. */
  fallback: number;
  error?: string | undefined;
}) {
  const { t } = useI18n();
  const bump = (dir: -1 | 1) => {
    const base = value ?? fallback;
    onChange(Math.min(max, Math.max(min, base + dir * step)));
  };
  return (
    <div className="ux-stepper">
      <NumberField label={label} value={value} min={min} max={max} onChange={onChange} error={error} />
      <div className="ux-stepper-btns">
        <IconButton icon="minus" size="sm" variant="secondary" label={t('workouts.editor.decrease', { label })} onClick={() => bump(-1)} disabled={value != null && value <= min} />
        <IconButton icon="plus" size="sm" variant="secondary" label={t('workouts.editor.increase', { label })} onClick={() => bump(1)} disabled={value != null && value >= max} />
      </div>
    </div>
  );
}
