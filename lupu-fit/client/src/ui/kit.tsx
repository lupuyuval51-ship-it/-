import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ChangeEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { useT } from '../i18n/index.tsx';
import { IconInfo, IconMinus, IconPlus, IconWarn, IconX } from './icons.tsx';

export const cx = (...c: (string | false | null | undefined)[]): string => c.filter(Boolean).join(' ');

/** At most ONE `variant="primary"` button per screen: it marks the single main action. */
export function Button({ variant = 'default', size, block, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'ghost' | 'danger'; size?: 'sm'; block?: boolean }): ReactNode {
  return <button type="button" {...p} className={cx('btn', variant === 'primary' && 'btn-primary', variant === 'ghost' && 'btn-ghost', variant === 'danger' && 'btn-danger', size === 'sm' && 'btn-sm', block && 'btn-block', className)} />;
}
export function LinkButton({ variant = 'default', size, block, className, ...p }: LinkProps & { variant?: 'default' | 'primary' | 'ghost'; size?: 'sm'; block?: boolean }): ReactNode {
  return <Link {...p} className={cx('btn', variant === 'primary' && 'btn-primary', variant === 'ghost' && 'btn-ghost', size === 'sm' && 'btn-sm', block && 'btn-block', className)} />;
}
export function IconButton({ label, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }): ReactNode {
  return <button type="button" aria-label={label} title={label} {...p} className={cx('icon-btn', className)}>{children}</button>;
}

export function Card({ children, className, as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' | 'li' }): ReactNode {
  return <Tag className={cx('card', className)}>{children}</Tag>;
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string | null | undefined; children: (id: string, describedBy: string | undefined) => ReactNode; htmlFor?: string }): ReactNode {
  const auto = useId(); const id = htmlFor ?? auto; const msgId = `${id}-msg`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id, error || hint ? msgId : undefined)}
      {error ? <span id={msgId} className="field-error" role="alert">{error}</span> : hint ? <span id={msgId} className="hint">{hint}</span> : null}
    </div>
  );
}
export function TextInput({ label, hint, error, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | null | undefined }): ReactNode {
  return <Field label={label} {...(hint ? { hint } : {})} error={error} {...(p.id ? { htmlFor: p.id } : {})}>{(id, d) => <input {...p} id={id} aria-describedby={d} aria-invalid={error ? true : undefined} className={cx('input', p.className)} />}</Field>;
}
export function TextArea({ label, hint, error, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string | null | undefined }): ReactNode {
  return <Field label={label} {...(hint ? { hint } : {})} error={error}>{(id, d) => <textarea {...p} id={id} aria-describedby={d} className={cx('textarea', p.className)} />}</Field>;
}
export function Select({ label, hint, error, options, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; error?: string | null | undefined; options: { value: string; label: string }[] }): ReactNode {
  return <Field label={label} {...(hint ? { hint } : {})} error={error}>{(id, d) => <select {...p} id={id} aria-describedby={d} className={cx('select', p.className)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>}</Field>;
}

/**
 * Shared number-field logic for NumberStepper and the live-session stepper. While the field is focused a raw text draft is
 * kept, so "62." and "62.5" can be typed without the dot being eaten; the value is clamped and rounded on blur and on ±.
 */
export function useNumberDraft({ value, onChange, step = 1, min = 0, max = 9999, decimals = 0 }: { value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; max?: number; decimals?: number }): {
  bump: (dir: -1 | 1) => void;
  input: { value: string; onFocus: () => void; onBlur: () => void; onChange: (e: ChangeEvent<HTMLInputElement>) => void };
} {
  const [draft, setDraft] = useState<string | null>(null);
  const round = (n: number): number => Math.round(n * 10 ** decimals) / 10 ** decimals;
  const clamp = (n: number): number => Math.min(max, Math.max(min, round(n)));
  return {
    bump: (dir) => { setDraft(null); onChange(clamp((value ?? min) + dir * step)); },
    input: {
      value: draft ?? (value === null ? '' : String(value)),
      onFocus: () => setDraft(value === null ? '' : String(value)),
      onBlur: () => { setDraft(null); if (value !== null) onChange(clamp(value)); },
      onChange: (e) => {
        const raw = e.target.value.replace(',', '.');
        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
        setDraft(raw);
        if (raw === '') onChange(null);
        else if (raw !== '.') onChange(Math.min(max, Math.max(min, Number(raw))));
      },
    },
  };
}

/** Numeric stepper with hold-free ± buttons. `value` null = empty. Always shows Latin digits (.num). */
export function NumberStepper({ label, value, onChange, step = 1, min = 0, max = 9999, decimals = 0, suffix, large, msgId, invalid }: { msgId?: string; invalid?: boolean; label: string; value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; max?: number; decimals?: number; suffix?: string; large?: boolean }): ReactNode {
  const t = useT();
  const { bump, input } = useNumberDraft({ value, onChange, step, min, max, decimals });
  return (
    <div className="field">
      <span className="field-label">{label}{suffix ? <span className="muted"> ({suffix})</span> : null}</span>
      <div className={cx('stepper', large && 'stepper-lg')} role="group" aria-label={label}>
        <button type="button" aria-label={`${label} −`} onClick={() => bump(-1)}><IconMinus aria-label={t('action.remove')} /></button>
        <input className="num" inputMode="decimal" aria-label={label} aria-describedby={msgId} aria-invalid={invalid ? true : undefined} {...input} />
        <button type="button" aria-label={`${label} +`} onClick={() => bump(1)}><IconPlus aria-label={t('action.add')} /></button>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }): ReactNode {
  return <div className="segmented" role="radiogroup" aria-label={label}>{options.map((o) => <button type="button" key={o.value} role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div>;
}
export function Chip({ pressed, onClick, children, count }: { pressed?: boolean; onClick?: () => void; children: ReactNode; count?: number }): ReactNode {
  return <button type="button" className="chip" aria-pressed={pressed ?? false} onClick={onClick}>{children}{count !== undefined ? <span className="count">{count}</span> : null}</button>;
}
export function ChipGroup<T extends string>({ label, options, selected, onToggle }: { label: string; options: { value: T; label: string; count?: number; disabled?: boolean }[]; selected: readonly T[]; onToggle: (v: T) => void }): ReactNode {
  return (
    <div className="row-wrap" role="group" aria-label={label}>
      {options.map((o) => <button type="button" key={o.value} disabled={o.disabled} className="chip" aria-pressed={selected.includes(o.value)} onClick={() => onToggle(o.value)}>{o.label}{o.count !== undefined ? <span className="count">{o.count}</span> : null}</button>)}
    </div>
  );
}
export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }): ReactNode {
  return <label className="toggle"><input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>;
}
export function Tag({ children, tone }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' }): ReactNode { return <span className={cx('tag', tone)}>{children}</span>; }

export function Tabs<T extends string>({ label, value, tabs, onChange }: { label: string; value: T; tabs: { value: T; label: string }[]; onChange: (v: T) => void }): ReactNode {
  return <div className="tabs" role="tablist" aria-label={label}>{tabs.map((x) => <button type="button" key={x.value} className="tab" role="tab" aria-selected={x.value === value} onClick={() => onChange(x.value)}>{x.label}</button>)}</div>;
}

export function ProgressBar({ value, max, tone, label }: { value: number; max: number; tone?: 'ok' | 'warn' | 'over'; label: string }): ReactNode {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return <div className={cx('bar', tone)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}><i style={{ inlineSize: `${pct}%` }} /></div>;
}

export function Spinner({ label }: { label?: string }): ReactNode { const t = useT(); return <div className="spinner" role="status" aria-label={label ?? t('app.loading')} />; }
export function Loading(): ReactNode { return <div className="center-screen"><Spinner /></div>; }

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }): ReactNode {
  return <div className="empty">{icon}<strong>{title}</strong>{hint ? <span className="small">{hint}</span> : null}{action}</div>;
}
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }): ReactNode {
  const t = useT();
  return <div className="banner danger" role="alert"><IconWarn /><div className="stack-sm grow"><span>{errorMessage(error, t)}</span>{onRetry ? <Button size="sm" onClick={onRetry}>{t('app.retry')}</Button> : null}</div></div>;
}
export function Banner({ tone, children }: { tone?: 'warn' | 'danger' | 'ok'; children: ReactNode }): ReactNode {
  return <div className={cx('banner', tone)} role={tone === 'danger' ? 'alert' : 'note'}>{tone === 'warn' || tone === 'danger' ? <IconWarn /> : <IconInfo />}<div className="grow">{children}</div></div>;
}

/** True while a sheet's own history entry is being popped (async), so a sheet opened in the same tick does not adopt that pop. */
let sheetUnwinding = false;

/**
 * Modal bottom sheet. Traps focus loosely (focus moves in and returns to the opener on close, Escape closes, scrim click closes).
 * The browser/Android Back button closes the sheet instead of leaving the screen: opening adds one same-URL history entry
 * (React Router's own state is copied, so its location and index stay valid) and Back pops it.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }): ReactNode {
  const ref = useRef<HTMLDivElement>(null); const t = useT(); const titleId = useId();
  // Keep the latest onClose in a ref so an inline callback does not re-run the effect (which would steal focus from inputs on every render).
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    const token = `lf-sheet-${Math.random().toString(36).slice(2)}`;
    let pushed = false;
    const onPop = (): void => { if (pushed) { pushed = false; closeRef.current(); } };
    if (!sheetUnwinding) {
      try {
        window.history.pushState({ ...((window.history.state as Record<string, unknown> | null) ?? {}), lfSheet: token }, '');
        pushed = true;
        window.addEventListener('popstate', onPop);
      } catch { /* history unavailable: Escape and the close button still work */ }
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      // Closed from the UI (not by Back): drop our entry, unless the app has already navigated on.
      if (pushed && (window.history.state as { lfSheet?: string } | null)?.lfSheet === token) {
        sheetUnwinding = true;
        const done = (): void => { sheetUnwinding = false; window.removeEventListener('popstate', done); };
        window.addEventListener('popstate', done);
        setTimeout(done, 600);
        window.history.back();
      }
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={ref}>
        <div className="row-between"><h3 id={titleId}>{title}</h3><IconButton label={t('action.close')} onClick={onClose}><IconX /></IconButton></div>
        <div className="stack" style={{ marginBlockStart: '1rem' }}>{children}</div>
      </div>
    </>
  );
}

export function errorMessage(e: unknown, t: (k: string) => string): string {
  const code = (e as { code?: string; name?: string } | null)?.code;
  if ((e as { name?: string } | null)?.name === 'NetworkError' || (e instanceof Error && e.message === 'network_error')) return t('error.network');
  if (code) { const k = `error.${code}`; const m = t(k); if (m !== k) return m; }
  return t('error.generic');
}
