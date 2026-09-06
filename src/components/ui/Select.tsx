"use client";
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, controlBaseClasses, controlStateClasses, describedBy } from "./Field";

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<V extends string = string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size" | "onChange"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: SelectOption<V>[];
  /** Placeholder rendered as a disabled first option. */
  placeholder?: string;
  size?: "md" | "lg";
  wrapperClassName?: string;
  /** Called with the selected value (plus the native event). */
  onChange?: (value: V, event: React.ChangeEvent<HTMLSelectElement>) => void;
}

function SelectInner<V extends string = string>(
  { id: idProp, label, hint, error, options, placeholder, size = "md", wrapperClassName, className, required, onChange, value, defaultValue, ...rest }: SelectProps<V>,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  const autoId = useId();
  const id = idProp ?? `sel-${autoId}`;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
          value={value}
          defaultValue={defaultValue ?? (value === undefined && placeholder ? "" : undefined)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          onChange={(e) => onChange?.(e.target.value as V, e)}
          className={cn(
            controlBaseClasses,
            controlStateClasses(!!error),
            "appearance-none pe-11 ps-3.5",
            size === "lg" ? "h-13 text-lg" : "h-11 text-base",
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
      </div>
    </Field>
  );
}

/** Native <select> styled like Input – keeps the OS picker, which is the best UX on phones. */
export const Select = forwardRef(SelectInner) as <V extends string = string>(
  props: SelectProps<V> & { ref?: React.ForwardedRef<HTMLSelectElement> },
) => ReactNode;
