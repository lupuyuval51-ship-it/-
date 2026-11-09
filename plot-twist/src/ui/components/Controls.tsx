import { useId, type ReactNode } from 'react';
import type { Weirdness } from '../../../shared/types.ts';
import { WEIRDNESS_LABEL } from '../../../shared/constants.ts';

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
  icon?: ReactNode;
}

/**
 * A radio group rendered as chips. Native radios (visually hidden) give us
 * arrow-key navigation and correct screen-reader semantics for free.
 */
export function ChipGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  grid = false,
  columns,
}: {
  legend: string;
  name: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Two-column grid instead of a wrapping row. */
  grid?: boolean;
  /** A segmented row: every option in one evenly split row (no orphan chips on small phones). */
  columns?: 3 | 4;
}) {
  const id = useId();
  const layout = columns === 4 ? 'grid grid-cols-4 gap-1.5' : columns === 3 ? 'grid grid-cols-3 gap-1.5' : grid ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2';
  const cell = grid || columns;
  return (
    <fieldset className="min-w-0">
      <legend className="t-kicker mb-2.5">{legend}</legend>
      <div className={layout}>
        {options.map((opt) => {
          const inputId = `${id}-${String(opt.value)}`;
          return (
            // Positioned per option (in grids too), so each hidden radio covers its own chip and
            // arrowing to an option scrolls that chip into view.
            <span key={String(opt.value)} className="chip-option relative flex">
              <input
                id={inputId}
                className="chip-input"
                type="radio"
                name={name}
                value={String(opt.value)}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
              />
              <label htmlFor={inputId} className={`chip ${cell ? 'w-full' : ''} ${columns ? 'px-1.5 text-[0.88rem]' : ''}`}>
                {opt.icon}
                {opt.label}
              </label>
            </span>
          );
        })}
      </div>
    </fieldset>
  );
}

const WEIRD_BLURB: Record<Weirdness, string> = {
  1: 'Calm, grounded, gentle. A quiet little plot.',
  2: 'An unexpected premise and playful rules.',
  3: 'Theatrical. Bold. A little ridiculous. You are the lead.',
};

export function WeirdnessDial({ value, onChange }: { value: Weirdness; onChange: (w: Weirdness) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="t-kicker mb-1 block">
        How weird are we getting today?
      </label>
      <input
        id={id}
        className="dial"
        type="range"
        min={1}
        max={3}
        step={1}
        value={value}
        aria-valuetext={WEIRDNESS_LABEL[value]}
        aria-describedby={`${id}-desc`}
        onChange={(e) => onChange(Number(e.target.value) as Weirdness)}
      />
      <div className="mt-0.5 grid grid-cols-3 text-[0.8125rem] font-semibold leading-tight" aria-hidden="true">
        {([1, 2, 3] as Weirdness[]).map((w) => (
          <button
            key={w}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(w)}
            className={`${w === 1 ? 'text-left' : w === 2 ? 'text-center' : 'text-right'} py-1 transition-colors ${value === w ? 'text-ivory' : 'text-ivory-mute hover:text-ivory-dim'}`}
          >
            {WEIRDNESS_LABEL[w]}
          </button>
        ))}
      </div>
      <p id={`${id}-desc`} className="t-serif-italic mt-2 text-[0.9375rem] text-ivory-dim" aria-live="polite">
        {WEIRD_BLURB[value]}
      </p>
    </div>
  );
}
