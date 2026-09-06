"use client";
import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type" | "role"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  /** Where the label sits relative to the switch (logical direction). */
  labelPosition?: "start" | "end";
  size?: "md" | "lg";
}

/** Accessible switch (role="switch"). The whole row is a 44px+ tap target. */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, onChange, label, description, labelPosition = "start", size = "md", className, disabled, id: idProp, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? `tg-${autoId}`;
  const knob = size === "lg" ? "size-7" : "size-6";
  const track = size === "lg" ? "h-9 w-16" : "h-8 w-14";
  const shift = size === "lg" ? "translate-x-7 rtl:-translate-x-7" : "translate-x-6 rtl:-translate-x-6";
  const control = (
    <button
      ref={ref}
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-describedby={description ? `${id}-desc` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full p-1 transition-colors duration-200 ease-out disabled:opacity-50 motion-reduce:transition-none",
        track,
        checked ? "bg-primary" : "bg-surface-3",
        !label && className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={cn("block rounded-full bg-white shadow-card transition-transform duration-200 ease-out motion-reduce:transition-none", knob, checked && shift)}
      />
    </button>
  );
  if (!label) return control;
  return (
    <div className={cn("flex min-h-11 items-center gap-3", labelPosition === "end" && "flex-row-reverse justify-end", className)}>
      <label htmlFor={id} className={cn("flex-1 cursor-pointer select-none", disabled && "opacity-60")}>
        <span id={`${id}-label`} className="block text-base font-medium text-text">{label}</span>
        {description && <span id={`${id}-desc`} className="block text-sm text-muted">{description}</span>}
      </label>
      {control}
    </div>
  );
});
