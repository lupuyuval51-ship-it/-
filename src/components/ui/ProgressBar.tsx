import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ProgressTone = "primary" | "accent" | "success" | "warning" | "danger" | "info";

export interface ProgressBarProps {
  /** 0–100 (values are clamped). */
  value: number;
  label?: ReactNode;
  /** Shows the rounded percentage at the end of the label row. */
  showPercent?: boolean;
  /** Custom text instead of the percentage (e.g. "3/8"). */
  valueText?: string;
  tone?: ProgressTone;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Accessible name when no visible label is given. */
  "aria-label"?: string;
}

const fills: Record<ProgressTone, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};
const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

/** Determinate progress bar with an optional label/percent row. */
export function ProgressBar({ value, label, showPercent, valueText, tone = "primary", size = "md", className, "aria-label": ariaLabel }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const text = valueText ?? (showPercent ? `${Math.round(v)}%` : undefined);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || text) && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          {label && <span className="font-medium text-text">{label}</span>}
          {text && <span className="ms-auto tabular-nums text-muted" dir="ltr">{text}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        aria-valuetext={text}
        aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
        className={cn("w-full overflow-hidden rounded-full bg-surface-3", heights[size])}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none", fills[tone])} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
