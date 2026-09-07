"use client";
import { useId, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { Field } from "./Field";

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Unit shown after the value (e.g. "דק׳", "m"). */
  unit?: string;
  /** Custom value formatter (overrides `unit`). */
  format?: (value: number) => string;
  size?: "md" | "lg";
  disabled?: boolean;
  /** Allow typing a value directly. */
  editable?: boolean;
  fullWidth?: boolean;
  className?: string;
  id?: string;
  /** Accessible name when no visible label is given. */
  "aria-label"?: string;
}

function roundToStep(n: number, step: number) {
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number(n.toFixed(decimals));
}

/** ± stepper with 48px tap targets. Clamps to min/max and disables the button at the boundary. */
export function NumberStepper({
  value, onChange, min = -Infinity, max = Infinity, step = 1, label, hint, error, unit, format, size = "md", disabled, editable, fullWidth, className, id: idProp, "aria-label": ariaLabel,
}: NumberStepperProps) {
  const { t } = useT();
  const autoId = useId();
  const id = idProp ?? `ns-${autoId}`;
  const clamp = (n: number) => Math.min(max, Math.max(min, roundToStep(n, step)));
  const set = (n: number) => { if (!disabled) onChange(clamp(n)); };
  const display = format ? format(value) : unit ? `${value} ${unit}` : String(value);
  const btn = cn(
    "inline-flex shrink-0 items-center justify-center rounded-md bg-surface-2 text-text transition-[background-color,transform] duration-150 ease-out hover:bg-surface-3 active:scale-95 disabled:opacity-40 disabled:hover:bg-surface-2 disabled:active:scale-100 motion-reduce:transition-none",
    size === "lg" ? "size-14 [&_svg]:size-6" : "size-12 [&_svg]:size-5",
  );
  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn("inline-flex items-center gap-2 rounded-lg border border-border bg-surface p-1", fullWidth && "flex w-full justify-between")}
      >
        <button type="button" className={btn} onClick={() => set(value - step)} disabled={disabled || value <= min} aria-label={t("ui.stepper.decrease")}>
          <Minus aria-hidden />
        </button>
        {editable ? (
          <input
            id={id}
            type="number"
            inputMode="decimal"
            value={value}
            min={Number.isFinite(min) ? min : undefined}
            max={Number.isFinite(max) ? max : undefined}
            step={step}
            disabled={disabled}
            onChange={(e) => { const n = Number(e.target.value); if (!Number.isNaN(n)) set(n); }}
            className={cn("min-w-16 flex-1 bg-transparent text-center font-semibold tabular-nums outline-none", size === "lg" ? "text-2xl" : "text-lg")}
            dir="ltr"
          />
        ) : (
          <output id={id} aria-live="polite" className={cn("min-w-16 flex-1 text-center font-semibold tabular-nums", size === "lg" ? "text-2xl" : "text-lg")} dir="ltr">
            {display}
          </output>
        )}
        <button type="button" className={btn} onClick={() => set(value + step)} disabled={disabled || value >= max} aria-label={t("ui.stepper.increase")}>
          <Plus aria-hidden />
        </button>
      </div>
    </Field>
  );
}
