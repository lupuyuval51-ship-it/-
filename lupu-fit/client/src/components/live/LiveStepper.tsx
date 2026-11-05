import { useId, type ReactNode } from 'react';
import { IconMinus, IconPlus } from '../../ui/icons.tsx';
import { useNumberDraft } from '../../ui/kit.tsx';

/** Gym-sized stepper: 56 px minus / plus on both sides, the number is the hero (tap it to type). Typing logic: `useNumberDraft`. */
export function LiveStepper({ label, unit, value, onChange, step = 1, min = 0, max = 9999, decimals = 0 }: {
  label: string; unit?: string; value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; max?: number; decimals?: number;
}): ReactNode {
  const id = useId();
  const { bump, input } = useNumberDraft({ value, onChange, step, min, max, decimals });
  return (
    <div className="lv-step" role="group" aria-label={label}>
      <button type="button" className="lv-step-btn" aria-label={`${label} −`} onClick={() => bump(-1)}><IconMinus /></button>
      <div className="lv-step-mid">
        <label className="lv-step-label" htmlFor={id}>{label}{unit ? <span className="lv-step-unit"> · {unit}</span> : null}</label>
        <input
          id={id} className="lv-step-input num" inputMode="decimal" aria-label={label} autoComplete="off" enterKeyHint="done"
          {...input}
          onFocus={(e) => { input.onFocus(); e.currentTarget.select(); }}
        />
      </div>
      <button type="button" className="lv-step-btn" aria-label={`${label} +`} onClick={() => bump(1)}><IconPlus /></button>
    </div>
  );
}
