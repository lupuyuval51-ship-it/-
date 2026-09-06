"use client";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: ReactNode;
  /** One label per step (e.g. 5 labels for 1–5). Shown under the track; the current one is highlighted. */
  labels?: string[];
  /** Text announced/shown for the current value; defaults to the matching label or the number. */
  valueText?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Rating slider (default 1–5) with step labels. Uses the native range input for full accessibility,
 * with a large thumb and a tall tap area for outdoor use.
 */
export function Slider({ value, onChange, min = 1, max = 5, step = 1, label, labels, valueText, disabled, className, id: idProp }: SliderProps) {
  const { t } = useT();
  const autoId = useId();
  const id = idProp ?? `sl-${autoId}`;
  const steps = Math.round((max - min) / step) + 1;
  const index = Math.round((value - min) / step);
  const current = valueText ? valueText(value) : (labels?.[index] ?? String(value));
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {(label || current) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && <label htmlFor={id} className="text-sm font-semibold text-text">{label}</label>}
          <output htmlFor={id} aria-live="polite" className="text-sm font-semibold text-primary">{current}</output>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={current}
        aria-label={label ? undefined : t("ui.slider.value", { value: current })}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--dc-fill" as string]: `${pct}%` }}
        className={cn(
          "h-11 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50",
          "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-surface-3",
          "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-surface-3",
          "[&::-moz-range-progress]:h-2 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-primary",
          "[&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-raised",
          "[&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-primary",
        )}
      />
      {labels && labels.length === steps && (
        <div className="flex justify-between gap-1" aria-hidden>
          {labels.map((l, i) => (
            <span
              key={l}
              className={cn(
                "flex-1 text-center text-xs leading-tight transition-colors duration-150",
                i === 0 && "text-start",
                i === labels.length - 1 && "text-end",
                i === index ? "font-semibold text-text" : "text-muted",
              )}
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
