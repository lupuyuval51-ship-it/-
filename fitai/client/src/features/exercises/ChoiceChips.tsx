import { useId, useRef, type KeyboardEvent } from 'react';
import { Icon } from '../../components/ui';
import { useI18n } from '../../i18n';

export interface ChoiceOption<T extends string> {
  /** `null` is the "all / any" choice. */
  value: T | null;
  label: string;
  /** Result count shown on the chip (omitted while unknown). */
  count?: number;
}

/**
 * Single-choice chips with result counts (radio-group semantics, roving tab stop,
 * arrow keys follow the visual direction in RTL). Choices with no results are disabled
 * unless selected.
 */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange(value: T | null): void;
}) {
  const { dir, formatNumber } = useI18n();
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const isDisabled = (o: ChoiceOption<T>) => o.count === 0 && o.value !== value;

  const move = (from: number, step: 1 | -1) => {
    for (let i = 1; i <= options.length; i++) {
      const next = (from + step * i + options.length) % options.length;
      const option = options[next]!;
      if (!isDisabled(option)) {
        refs.current[next]?.focus();
        onChange(option.value);
        return;
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward || e.key === 'ArrowDown') move(index, 1);
    else if (e.key === backward || e.key === 'ArrowUp') move(index, -1);
    else if (e.key === 'Home') move(-1, 1);
    else if (e.key === 'End') move(options.length, -1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="field">
      <span className="field-label" id={labelId}>
        {label}
      </span>
      <div className="chips ex-choice-chips" role="radiogroup" aria-labelledby={labelId}>
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value ?? '__all'}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={i === selectedIndex ? 0 : -1}
              disabled={isDisabled(o)}
              className={`chip${selected ? ' chip-active' : ''}`}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {selected && <Icon name="check" size={14} />}
              <span>{o.label}</span>
              {o.count != null && (
                <>
                  {' '}
                  <span className="ex-chip-count">{formatNumber(o.count)}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
