"use client";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Field, controlBaseClasses, controlStateClasses, describedBy } from "./Field";

export type InputSize = "md" | "lg";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  size?: InputSize;
  /** Icon at the logical start (inside the control). */
  startIcon?: ReactNode;
  /** Element at the logical end (icon or a small button). */
  endSlot?: ReactNode;
  /** Wrapper class (the control itself gets `className`). */
  wrapperClassName?: string;
  /** Right-aligned digits regardless of locale, e.g. numbers, times. */
  numeric?: boolean;
}

/** Text input with label, hint and error. Height 44px (md) / 52px (lg). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id: idProp, label, hint, error, size = "md", startIcon, endSlot, wrapperClassName, numeric, className, required, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? `in-${autoId}`;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      <div className="relative flex items-center">
        {startIcon && <span className="pointer-events-none absolute start-3 inline-flex text-muted [&_svg]:size-5">{startIcon}</span>}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          inputMode={numeric ? "decimal" : rest.inputMode}
          className={cn(
            controlBaseClasses,
            controlStateClasses(!!error),
            size === "lg" ? "h-13 px-4 text-lg" : "h-11 px-3.5 text-base",
            !!startIcon && "ps-11",
            !!endSlot && "pe-11",
            numeric && "text-end tabular-nums",
            className,
          )}
          {...rest}
        />
        {endSlot && <span className="absolute end-1.5 inline-flex items-center [&_svg]:size-5">{endSlot}</span>}
      </div>
    </Field>
  );
});
