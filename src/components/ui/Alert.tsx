"use client";
import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  /** Action rendered under the text (e.g. a ghost Button "נסו שוב"). */
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const tones: Record<AlertTone, { box: string; icon: ReactNode }> = {
  info: { box: "bg-info-soft text-text [&>svg]:text-info", icon: <Info aria-hidden /> },
  success: { box: "bg-success-soft text-text [&>svg]:text-success", icon: <CircleCheck aria-hidden /> },
  warning: { box: "bg-warning-soft text-text [&>svg]:text-warning", icon: <TriangleAlert aria-hidden /> },
  danger: { box: "bg-danger-soft text-text [&>svg]:text-danger", icon: <CircleAlert aria-hidden /> },
};

/** Inline message block. warning/danger announce as role="alert". */
export function Alert({ tone = "info", title, children, icon, action, onDismiss, className }: AlertProps) {
  const { t } = useT();
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-lg p-3.5 text-sm [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0", tones[tone].box, className)}
    >
      {icon ?? tones[tone].icon}
      <div className="min-w-0 flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={cn(!!title && "mt-0.5", "text-muted")}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("ui.dismiss")}
          className="-me-1.5 -mt-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-surface/60 hover:text-text"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
