import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Text shown after the label in muted style (e.g. "optional"). */
  labelSuffix?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error wrapper shared by Input, Textarea, Select and NumberStepper. */
export function Field({ id, label, hint, error, required, labelSuffix, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="flex items-baseline gap-1.5 text-sm font-semibold text-text">
          <span>{label}</span>
          {required && <span aria-hidden className="text-danger">*</span>}
          {labelSuffix && <span className="text-xs font-normal text-muted">{labelSuffix}</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const controlBaseClasses =
  "w-full rounded-md border bg-surface text-text placeholder:text-subtle transition-[border-color,box-shadow,background-color] duration-150 ease-out disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-70 motion-reduce:transition-none";

export function controlStateClasses(error?: boolean) {
  return error ? "border-danger focus-visible:outline-danger" : "border-border-strong hover:border-subtle";
}

export function describedBy(id: string, error?: unknown, hint?: unknown) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}
