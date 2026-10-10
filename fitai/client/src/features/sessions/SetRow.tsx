import { useEffect, useId, useState } from 'react';
import type { TrackingType } from '@shared/constants';
import { updateSetSchema } from '@shared/schemas/sessions';
import { formatClock } from '@shared/training';
import type { PreviousPerformanceDTO, SessionSetDTO } from '@shared/types';
import { Icon, IconButton } from '../../components/ui';
import { useNow } from '../../hooks/useNow';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { fieldErrorMessage } from '../../lib/errors';
import { formatSetTarget, formatSetValues } from './format';
import type { SetPatch } from './queue';

const RPE_OPTIONS = [1, 2, 3, 4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

/** Next value for a +/- tap: never negative, no floating point noise. */
export function stepValue(base: number | null, delta: number): number {
  return Math.max(0, Math.round(((base ?? 0) + delta) * 100) / 100);
}

/** Free-typing numeric input that reports `number | null` (comma decimals accepted). */
function SetInput({
  label,
  value,
  onChange,
  decimal = false,
  placeholder,
  error,
  className,
  step,
  fallback,
  decLabel,
  incLabel,
}: {
  label: string;
  value: number | null;
  onChange(v: number | null): void;
  decimal?: boolean;
  placeholder?: string;
  /** Increment of the +/- buttons (display units). */
  step: number;
  /** Starting point for the first tap when the field is empty (the prefilled suggestion). */
  fallback: number | null;
  decLabel: string;
  incLabel: string;
  error?: string;
  className?: string;
}) {
  const [text, setText] = useState(value == null ? '' : String(value));
  const errorId = useId();
  useEffect(() => {
    const parsed = text.trim() === '' ? null : Number(text.replace(',', '.'));
    if (parsed !== value) setText(value == null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span className={`set-input${className ? ` ${className}` : ''}`}>
      <input
        className="input input-number"
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        value={text}
        placeholder={placeholder}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const raw = e.target.value;
          if (!(decimal ? /^\d{0,4}([.,]\d{0,2})?$/ : /^\d{0,4}$/).test(raw)) return;
          setText(raw);
          const n = raw.trim() === '' ? null : Number(raw.replace(',', '.'));
          onChange(n == null || Number.isNaN(n) ? null : n);
        }}
      />
      <span className="set-stepper">
        <button type="button" className="set-step-btn" aria-label={decLabel} onClick={() => onChange(stepValue(value ?? fallback, -step))}>
          <Icon name="minus" size={18} />
        </button>
        <button type="button" className="set-step-btn" aria-label={incLabel} onClick={() => onChange(stepValue(value ?? fallback, step))}>
          <Icon name="plus" size={18} />
        </button>
      </span>
      {error && (
        <span className="set-input-error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

function Stopwatch({ n, onStop }: { n: number; onStop(seconds: number): void }) {
  const { t } = useI18n();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const now = useNow(250, startedAt != null);
  const elapsed = startedAt != null ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  return startedAt == null ? (
    <IconButton icon="play" size="sm" label={t('session.sets.stopwatchStart', { n })} onClick={() => setStartedAt(Date.now())} />
  ) : (
    <button
      type="button"
      className="btn btn-sm btn-secondary stopwatch-running"
      aria-label={t('session.sets.stopwatchStop', { n })}
      onClick={() => {
        onStop(Math.min(7200, Math.max(0, Math.floor((Date.now() - startedAt) / 1000))));
        setStartedAt(null);
      }}
    >
      <Icon name="stop" size={14} />
      <span className="num">{formatClock(elapsed)}</span>
    </button>
  );
}

export interface SetRowProps {
  set: SessionSetDTO;
  tracking: TrackingType;
  /** Show the weight column (always for weight × reps; optional "added weight" for bodyweight). */
  showWeight: boolean;
  previous: PreviousPerformanceDTO['sets'][number] | null;
  /** Values used (and shown as placeholders) when the set is completed untouched. */
  defaults: Pick<SessionSetDTO, 'reps' | 'weightKg' | 'durationSeconds'>;
  onPatch(patch: SetPatch, opts: { immediate: boolean }): void;
  onToggleComplete(): void;
  onDelete(): void;
  /** The set to log next (first one not done). */
  current?: boolean;
}

export function SetRow({ set, tracking, showWeight, previous, defaults, onPatch, onToggleComplete, onDelete, current = false }: SetRowProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const { toDisplay, fromDisplay, weightUnit, formatWeight, imperial } = useUnits();
  const [errors, setErrors] = useState<Partial<Record<'weightKg' | 'reps' | 'durationSeconds', string>>>({});
  const n = set.setNumber;

  const edit = (field: 'weightKg' | 'reps' | 'durationSeconds', value: number | null) => {
    const parsed = updateSetSchema.safeParse({ [field]: value });
    if (!parsed.success) {
      const code = parsed.error.issues[0]?.code === 'too_big' ? 'too_big' : 'invalid';
      setErrors((e) => ({ ...e, [field]: fieldErrorMessage(code, i18n) }));
      return;
    }
    setErrors((e) => ({ ...e, [field]: undefined }));
    onPatch({ [field]: value }, { immediate: false });
  };

  const target = formatSetTarget(set, tracking, i18n, formatWeight);
  const weightPlaceholder = defaults.weightKg != null ? String(toDisplay(defaults.weightKg)) : undefined;
  const repsPlaceholder = defaults.reps != null ? String(defaults.reps) : undefined;

  return (
    <li className={`set-row${set.completed ? ' set-row-done' : ''}${current ? ' set-row-current' : ''}`}
      data-testid={`set-row-${n}`}
      aria-current={current ? 'step' : undefined}
    >
      <span className="set-num num" aria-hidden="true">
        {n}
      </span>
      <div className="set-fields">
        {showWeight && (
          <SetInput
            className="set-input-weight"
            decimal
            label={t(tracking === 'reps' ? 'session.sets.addedWeightLabel' : 'session.sets.weightLabel', { n, unit: weightUnit })}
            value={toDisplay(set.weightKg)}
            onChange={(v) => edit('weightKg', fromDisplay(v))}
            placeholder={weightPlaceholder}
            step={imperial ? 5 : 2.5}
            fallback={toDisplay(defaults.weightKg)}
            decLabel={t('session.sets.weightDec', { n })}
            incLabel={t('session.sets.weightInc', { n })}
            error={errors.weightKg}
          />
        )}
        {showWeight && <span className="set-unit small muted">{weightUnit}</span>}
        {tracking === 'time' ? (
          <>
            <SetInput
              className="set-input-reps"
              label={t('session.sets.durationLabel', { n })}
              value={set.durationSeconds}
              onChange={(v) => edit('durationSeconds', v)}
              placeholder={defaults.durationSeconds != null ? String(defaults.durationSeconds) : undefined}
              step={5}
              fallback={defaults.durationSeconds}
              decLabel={t('session.sets.durationDec', { n })}
              incLabel={t('session.sets.durationInc', { n })}
              error={errors.durationSeconds}
            />
            <span className="set-unit small muted">{t('common.units.sec')}</span>
            <Stopwatch n={n} onStop={(seconds) => onPatch({ durationSeconds: seconds }, { immediate: true })} />
          </>
        ) : (
          <>
            {showWeight && (
              <span className="set-times muted" aria-hidden="true">
                ×
              </span>
            )}
            <SetInput
              className="set-input-reps"
              label={t('session.sets.repsLabel', { n })}
              value={set.reps}
              onChange={(v) => edit('reps', v)}
              placeholder={repsPlaceholder}
              step={1}
              fallback={defaults.reps}
              decLabel={t('session.sets.repsDec', { n })}
              incLabel={t('session.sets.repsInc', { n })}
              error={errors.reps}
            />
            {!showWeight && <span className="set-unit small muted">{t('common.units.reps')}</span>}
          </>
        )}
      </div>
      <button
        type="button"
        className={`set-check${set.completed ? ' set-check-done' : ''}`}
        aria-pressed={set.completed}
        aria-label={set.completed ? t('session.sets.uncomplete', { n }) : t('session.sets.complete', { n })}
        title={set.completed ? t('session.sets.uncomplete', { n }) : t('session.sets.complete', { n })}
        onClick={onToggleComplete}
      >
        <Icon name="check" size={22} />
      </button>
      <div className="set-meta small">
        <span className="muted set-hints">
          {previous && <span>{t('session.sets.previous', { value: formatSetValues(previous, tracking, i18n, formatWeight) })}</span>}
          {target && <span>{t('session.sets.target', { value: target })}</span>}
        </span>
        <span className="set-extra">
          {tracking !== 'time' && (
            <select
              className="input select set-rpe"
              aria-label={t('session.sets.rpeLabel', { n })}
              value={set.rpe ?? ''}
              onChange={(e) => onPatch({ rpe: e.target.value === '' ? null : Number(e.target.value) }, { immediate: false })}
            >
              <option value="">{t('session.sets.rpeNone')}</option>
              {RPE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {i18n.formatNumber(r)}
                </option>
              ))}
            </select>
          )}
          <IconButton icon="trash" size="sm" label={t('session.sets.delete', { n })} onClick={onDelete} />
        </span>
      </div>
    </li>
  );
}
