import { forwardRef, useEffect, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useI18n } from '../../i18n';
import { Icon } from './Icon';

export function Field({
  label,
  hint,
  error,
  required,
  children,
  id,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** id of the control (auto-generated when using the bundled inputs via `useFieldId`). */
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field${error ? ' field-invalid' : ''}${className ? ` ${className}` : ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}
        {/* The control's `required` attribute is announced by assistive tech; the asterisk is visual only. */}
        {required ? <span className="field-required" aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !error && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, hint?: ReactNode, error?: string | null) =>
  [error ? `${id}-error` : '', hint && !error ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;

interface BaseFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  fieldClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, BaseFieldProps & InputHTMLAttributes<HTMLInputElement>>(function TextField(
  { label, hint, error, required, id, fieldClassName, className, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={fid} className={fieldClassName}>
      <input
        ref={ref}
        id={fid}
        className={`input${className ? ` ${className}` : ''}`}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fid, hint, error)}
        {...rest}
      />
    </Field>
  );
});

export function PasswordField(props: BaseFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const auto = useId();
  const fid = props.id ?? auto;
  const { label, hint, error, required, fieldClassName, ...rest } = props;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={fid} className={fieldClassName}>
      <div className="input-group">
        <input
          {...rest}
          id={fid}
          type={visible ? 'text' : 'password'}
          className="input"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fid, hint, error)}
        />
        <button
          type="button"
          className="input-addon-btn"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('auth.fields.hidePassword') : t('auth.fields.showPassword')}
          aria-pressed={visible}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
        </button>
      </div>
    </Field>
  );
}

/**
 * Numeric input that keeps a free-typing string internally and reports `number | null`.
 * Empty input → null. Accepts comma decimals.
 */
export function NumberField({
  label,
  hint,
  error,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  required,
  id,
  placeholder,
  disabled,
  fieldClassName,
  inputMode,
  name,
  autoFocus,
  onBlur,
}: BaseFieldProps & {
  value: number | null | undefined;
  onChange(value: number | null): void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  required?: boolean;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: 'numeric' | 'decimal';
  name?: string;
  autoFocus?: boolean;
  onBlur?(): void;
}) {
  const auto = useId();
  const fid = id ?? auto;
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => {
    const parsed = text.trim() === '' ? null : Number(text.replace(',', '.'));
    if (parsed !== value) setText(value == null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <Field label={label} hint={hint} error={error} required={required} id={fid} className={fieldClassName}>
      <div className="input-group">
        <input
          id={fid}
          name={name}
          className="input input-number"
          type="text"
          inputMode={inputMode ?? (step < 1 ? 'decimal' : 'numeric')}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fid, hint, error)}
          aria-valuemin={min}
          aria-valuemax={max}
          onChange={(e) => {
            const raw = e.target.value;
            if (!/^-?\d*([.,]\d*)?$/.test(raw)) return;
            setText(raw);
            const n = raw.trim() === '' || raw === '-' ? null : Number(raw.replace(',', '.'));
            onChange(n == null || Number.isNaN(n) ? null : n);
          }}
          onBlur={onBlur}
        />
        {unit && <span className="input-addon">{unit}</span>}
      </div>
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  id,
  fieldClassName,
  options,
  ...rest
}: BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={fid} className={fieldClassName}>
      <select id={fid} className="input select" required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fid, hint, error)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextAreaField({ label, hint, error, required, id, fieldClassName, ...rest }: BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} required={required} id={fid} className={fieldClassName}>
      <textarea id={fid} className="input textarea" required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(fid, hint, error)} {...rest} />
    </Field>
  );
}

export function Checkbox({ label, checked, onChange, disabled, hint }: { label: ReactNode; checked: boolean; onChange(v: boolean): void; disabled?: boolean; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="checkbox">
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </label>
    </div>
  );
}

export function Switch({ label, checked, onChange, disabled, hint }: { label: ReactNode; checked: boolean; onChange(v: boolean): void; disabled?: boolean; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="switch-row">
      <div>
        <label htmlFor={id} className="switch-label">
          {label}
        </label>
        {hint && <p className="field-hint">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch${checked ? ' switch-on' : ''}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

/** Multi-select chips (toggle buttons). */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  error,
  max,
}: {
  label: ReactNode;
  options: { value: T; label: string }[];
  value: T[];
  onChange(v: T[]): void;
  hint?: ReactNode;
  error?: string | null;
  max?: number;
}) {
  const id = useId();
  return (
    <fieldset className={`field chip-field${error ? ' field-invalid' : ''}`} aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="field-label">{label}</legend>
      <div className="chips" role="group">
        {options.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={`chip${active ? ' chip-active' : ''}`}
              aria-pressed={active}
              disabled={!active && max != null && value.length >= max}
              onClick={() => onChange(active ? value.filter((v) => v !== o.value) : [...value, o.value])}
            >
              {active && <Icon name="check" size={14} />}
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && !error && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Single-select segmented control (radio group semantics). */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  hideLabel,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange(v: T): void;
  size?: 'sm' | 'md';
  hideLabel?: boolean;
}) {
  return (
    <div className="segmented-wrap">
      {!hideLabel && <span className="field-label">{label}</span>}
      <div className={`segmented segmented-${size}`} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={`segment${value === o.value ? ' segment-active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Large selectable cards (single choice) with optional descriptions. */
export function RadioCards<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  columns = 2,
}: {
  label: ReactNode;
  options: { value: T; label: string; description?: string; icon?: ReactNode }[];
  value: T | null;
  onChange(v: T): void;
  error?: string | null;
  columns?: 1 | 2 | 3;
}) {
  const name = useId();
  return (
    <fieldset className={`field${error ? ' field-invalid' : ''}`}>
      <legend className="field-label">{label}</legend>
      <div className={`radio-cards cols-${columns}`}>
        {options.map((o) => (
          <label key={o.value} className={`radio-card${value === o.value ? ' radio-card-active' : ''}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="visually-hidden" />
            {o.icon}
            <span className="radio-card-title">{o.label}</span>
            {o.description && <span className="radio-card-desc">{o.description}</span>}
          </label>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
