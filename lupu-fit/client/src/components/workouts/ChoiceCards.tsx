import type { ReactNode } from 'react';

export interface ChoiceOption<T extends string> { value: T; label: string; hint?: string; icon: ReactNode }

/** Big tappable choice cards (icon + label + one line). Used by the ready-workout wizard and the generator. */
export function ChoiceCards<T extends string>({ label, options, value, onPick, cols }: {
  label: string; options: readonly ChoiceOption<T>[]; value: T | null; onPick: (v: T) => void; cols: 2 | 3;
}): ReactNode {
  return (
    <div className={`wk-choices wk-cols-${cols}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="wk-choice" aria-pressed={value === o.value} aria-label={o.label} onClick={() => onPick(o.value)}>
          {o.icon}
          <strong>{o.label}</strong>
          {o.hint ? <span className="small muted">{o.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}
