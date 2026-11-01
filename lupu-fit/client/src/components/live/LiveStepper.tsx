import { useId, useState, type ReactNode } from 'react';
import { IconMinus, IconPlus } from '../../ui/icons.tsx';

/**
 * Gym-sized stepper: 56 px minus / plus on both sides, the number is the hero (tap it to type).
 * While the field is focused a text draft is kept so "62." and "62.5" can be typed without the dot being eaten.
 */
export function LiveStepper({ label, unit, value, onChange, step = 1, min = 0, max = 9999, decimals = 0 }: {
  label: string; unit?: string; value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; max?: number; decimals?: number;
}): ReactNode {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const round = (n: number): number => Math.round(n * 10 ** decimals) / 10 ** decimals;
  const clamp = (n: number): number => Math.min(max, Math.max(min, round(n)));
  const bump = (dir: -1 | 1): void => { setDraft(null); onChange(clamp((value ?? min) + dir * step)); };
  return (
    <div className="lv-step" role="group" aria-label={label}>
      <button type="button" className="lv-step-btn" aria-label={`${label} −`} onClick={() => bump(-1)}><IconMinus /></button>
      <div className="lv-step-mid">
        <label className="lv-step-label" htmlFor={id}>{label}{unit ? <span className="lv-step-unit"> · {unit}</span> : null}</label>
        <input
          id={id} className="lv-step-input num" inputMode="decimal" aria-label={label} autoComplete="off" enterKeyHint="done"
          value={draft ?? (value === null ? '' : String(value))}
          onFocus={(e) => { setDraft(value === null ? '' : String(value)); e.currentTarget.select(); }}
          onBlur={() => { setDraft(null); if (value !== null) onChange(clamp(value)); }}
          onChange={(e) => {
            const raw = e.target.value.replace(',', '.');
            if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
            setDraft(raw);
            if (raw === '') onChange(null);
            else if (raw !== '.' && !Number.isNaN(Number(raw))) onChange(Math.min(max, Math.max(min, Number(raw))));
          }}
        />
      </div>
      <button type="button" className="lv-step-btn" aria-label={`${label} +`} onClick={() => bump(1)}><IconPlus /></button>
    </div>
  );
}
