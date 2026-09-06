"use client";
import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field, controlBaseClasses, controlStateClasses, describedBy } from "./Field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
  /** Shows "n / max" below the field when maxLength is set. */
  showCount?: boolean;
}

/** Multi-line text field. Grows with `rows`; no manual resize handle on mobile. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id: idProp, label, hint, error, wrapperClassName, showCount, className, required, rows = 3, maxLength, value, defaultValue, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? `ta-${autoId}`;
  const length = typeof value === "string" ? value.length : typeof defaultValue === "string" ? defaultValue.length : 0;
  const countHint = showCount && maxLength ? <span className="tabular-nums" dir="ltr">{length} / {maxLength}</span> : null;
  return (
    <Field id={id} label={label} error={error} required={required} className={wrapperClassName} hint={hint ?? countHint}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        maxLength={maxLength}
        required={required}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint ?? countHint)}
        className={cn(controlBaseClasses, controlStateClasses(!!error), "min-h-11 resize-y px-3.5 py-2.5 text-base leading-relaxed md:resize-y", className)}
        {...rest}
      />
    </Field>
  );
});
