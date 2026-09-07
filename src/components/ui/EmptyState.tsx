import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Primary action (usually a <Button>). */
  action?: ReactNode;
  secondaryAction?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Wrap in a dashed outline card. */
  bordered?: boolean;
}

/** Centred empty/zero-data state with a real call to action. */
export function EmptyState({ icon, title, description, action, secondaryAction, size = "md", className, bordered }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "gap-2 px-4 py-6" : size === "lg" ? "gap-4 px-6 py-14" : "gap-3 px-6 py-10",
        bordered && "rounded-lg border border-dashed border-border-strong",
        className,
      )}
    >
      {icon && (
        <div className={cn("flex items-center justify-center rounded-full bg-surface-2 text-muted", size === "sm" ? "size-12 [&_svg]:size-6" : "size-16 [&_svg]:size-8")} aria-hidden>
          {icon}
        </div>
      )}
      <h3 className={cn("font-bold text-text", size === "sm" ? "text-base" : "text-lg")}>{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-col items-center gap-2 sm:flex-row">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
