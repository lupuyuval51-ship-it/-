"use client";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { dayLabel } from "@/i18n/domain";

export type DayPickerProps =
  | { mode?: "multi"; value: number[]; onChange: (days: number[]) => void; label?: string; max?: number; size?: "md" | "lg"; className?: string; disabled?: boolean }
  | { mode: "single"; value: number | null; onChange: (day: number) => void; label?: string; max?: never; size?: "md" | "lg"; className?: string; disabled?: boolean };

const DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Seven day chips (Sunday first – Israeli week). Multi-select by default; `mode="single"` for one day. */
export function DayPicker(props: DayPickerProps) {
  const { t } = useT();
  const { label, size = "md", className, disabled } = props;
  const isSingle = props.mode === "single";
  const selected = (d: number) => (isSingle ? props.value === d : props.value.includes(d));
  const maxReached = !isSingle && props.max !== undefined && props.value.length >= props.max;
  return (
    <div role="group" aria-label={label ?? t("ui.dayPicker.label")} className={cn("grid grid-cols-7 gap-1.5", className)}>
      {DAYS.map((d) => {
        const on = selected(d);
        return (
          <button
            key={d}
            type="button"
            role={isSingle ? "radio" : "checkbox"}
            aria-checked={on}
            aria-label={dayLabel(t, d)}
            disabled={disabled || (!on && maxReached)}
            onClick={() => {
              if (isSingle) props.onChange(d);
              else props.onChange(on ? props.value.filter((x) => x !== d) : [...props.value, d].sort((a, b) => a - b));
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-md border font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-95 disabled:opacity-40 motion-reduce:transition-none",
              size === "lg" ? "h-14 text-base" : "h-12 text-sm",
              on ? "border-primary bg-primary text-primary-fg" : "border-border-strong bg-surface text-text hover:border-subtle",
            )}
          >
            {dayLabel(t, d, true)}
          </button>
        );
      })}
    </div>
  );
}
