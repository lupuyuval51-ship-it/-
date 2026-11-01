import type { ReactNode } from 'react';
import { IconCheck } from '../../ui/icons.tsx';

export interface ChoiceOption<T extends string> { value: T; label: string; desc?: string; icon?: ReactNode }

/**
 * Big, thumb-sized choice cards. `radio` (default) is a single-choice radiogroup; `pressed` renders toggle buttons
 * (aria-pressed) for single-select lists where each card is its own button, such as the goal.
 */
export function ChoiceCards<T extends string>({ label, value, options, onChange, mode = 'radio', cols, dense }: { dense?: boolean;
  label: string; value: T; options: ChoiceOption<T>[]; onChange: (v: T) => void; mode?: 'radio' | 'pressed'; cols?: 2 | 3;
}): ReactNode {
  return (
    <div className={`choice-grid${cols ? ` cols-${cols}` : ''}${dense ? ' dense' : ''}`} role={mode === 'radio' ? 'radiogroup' : 'group'} aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        const common = { type: 'button' as const, className: 'choice', 'aria-label': o.label, onClick: () => onChange(o.value) };
        const body = (
          <>
            {o.icon ? <span className="choice-icon">{o.icon}</span> : null}
            <span className="choice-text"><span className="choice-title">{o.label}</span>{o.desc ? <span className="choice-desc">{o.desc}</span> : null}</span>
            <span className="choice-check" aria-hidden="true">{on ? <IconCheck /> : null}</span>
          </>
        );
        return mode === 'radio'
          ? <button key={o.value} {...common} role="radio" aria-checked={on}>{body}</button>
          : <button key={o.value} {...common} aria-pressed={on}>{body}</button>;
      })}
    </div>
  );
}
