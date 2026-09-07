import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "accent" | "success" | "warning" | "danger" | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: ReactNode;
  /** Small coloured dot before the label. */
  dot?: boolean;
  /** Solid fill instead of soft background. */
  solid?: boolean;
}

const soft: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary-strong",
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};
const solidTone: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-text",
  primary: "bg-primary text-primary-fg",
  accent: "bg-accent text-accent-fg",
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  danger: "bg-danger text-white",
  info: "bg-info text-white",
};
const dotTone: Record<BadgeTone, string> = {
  neutral: "bg-subtle",
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

/** Small status label. Not interactive – use Chip for selectable tags. */
export function Badge({ tone = "neutral", size = "md", icon, dot, solid, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-semibold leading-none",
        size === "sm" ? "h-6 px-2 text-xs [&_svg]:size-3.5" : "h-7 px-2.5 text-sm [&_svg]:size-4",
        solid ? solidTone[tone] : soft[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn("size-2 rounded-full", dotTone[tone])} aria-hidden />}
      {icon}
      {children}
    </span>
  );
}
