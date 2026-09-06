"use client";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

export interface StatProps {
  label: ReactNode;
  /** Already formatted value ("72%", "4.3"). Pass "—" when not measured. */
  value: ReactNode;
  unit?: string;
  /** Change vs. the previous period, in the value's own unit (or percent points). */
  delta?: number;
  /** Text that replaces the numeric delta ("+3 מהשבוע שעבר"). */
  deltaLabel?: string;
  /** Whether a positive delta is good (false for times, e.g. sprint seconds). */
  positiveIsGood?: boolean;
  hint?: ReactNode;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  align?: "start" | "center";
  className?: string;
}

/** Label + big value + optional delta arrow. Purely presentational; wrap in Card/StatTile for tiles. */
export function Stat({ label, value, unit, delta, deltaLabel, positiveIsGood = true, hint, icon, size = "md", align = "start", className }: StatProps) {
  const { t } = useT();
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const direction = !hasDelta || delta === 0 ? "same" : delta > 0 ? "up" : "down";
  const good = direction === "same" ? null : (direction === "up") === positiveIsGood;
  const deltaText = deltaLabel ?? (hasDelta ? `${delta > 0 ? "+" : ""}${Math.round(delta * 10) / 10}${unit === "%" ? "%" : ""}` : undefined);
  const srText = direction === "same" ? t("ui.stat.same") : t(direction === "up" ? "ui.stat.up" : "ui.stat.down", { value: deltaText ?? "" });
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", align === "center" && "items-center text-center", className)}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted [&_svg]:size-4">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("flex items-baseline gap-1 font-bold tabular-nums text-text", size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl")} dir="ltr">
        <span>{value}</span>
        {unit && unit !== "%" && <span className="text-sm font-medium text-muted">{unit}</span>}
      </div>
      {(deltaText || hint) && (
        <div className="flex flex-wrap items-center gap-x-2 text-xs">
          {deltaText && (
            <span
              className={cn("inline-flex items-center gap-0.5 font-semibold tabular-nums [&_svg]:size-3.5", good === null ? "text-muted" : good ? "text-success" : "text-danger")}
              title={srText}
            >
              {direction === "up" ? <ArrowUpRight aria-hidden className="rtl:-scale-x-100" /> : direction === "down" ? <ArrowDownRight aria-hidden className="rtl:-scale-x-100" /> : <Minus aria-hidden />}
              <span dir="ltr">{deltaText}</span>
              <span className="sr-only">{srText}</span>
            </span>
          )}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}
    </div>
  );
}
