"use client";
import { CircleAlert, CloudOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { useAppStore } from "@/store/appStore";
import { Spinner } from "./ui/Spinner";

export interface SyncIndicatorProps {
  /** dot = 10px status dot with a tooltip; label = icon + text. */
  variant?: "dot" | "label";
  className?: string;
}

/** Account-only sync status. Renders nothing for guests and when everything is synced. */
export function SyncIndicator({ variant = "label", className }: SyncIndicatorProps) {
  const { t } = useT();
  const mode = useAppStore((s) => s.auth.mode);
  const status = useAppStore((s) => s.syncStatus);
  if (mode !== "account") return null;

  let tone: "muted" | "warning" | "danger" | null = null;
  let text = "";
  let icon: React.ReactNode = null;
  if (status.state === "syncing") {
    tone = "muted";
    text = t("ui.sync.syncing");
    icon = <Spinner size="xs" label={text} />;
  } else if (status.state === "offline") {
    tone = "warning";
    text = t("ui.sync.offline");
    icon = <CloudOff aria-hidden />;
  } else if (status.state === "error") {
    tone = "danger";
    text = t("ui.sync.error");
    icon = <CircleAlert aria-hidden />;
  } else if (status.pending > 0) {
    tone = "muted";
    text = t("ui.sync.pending", { count: status.pending });
    icon = <CloudOff aria-hidden />;
  }
  if (!tone) return null;

  const colour = tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-muted";
  const title = status.state === "error" && status.error ? `${text}: ${status.error}` : text;

  if (variant === "dot") {
    return (
      <span role="status" title={title} className={cn("inline-flex size-4 items-center justify-center", className)}>
        <span className={cn("block size-2.5 rounded-full", tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-subtle", status.state === "syncing" && "animate-pulse")} aria-hidden />
        <span className="sr-only">{text}</span>
      </span>
    );
  }
  return (
    <span role="status" title={title} className={cn("inline-flex items-center gap-1.5 text-xs font-medium [&_svg]:size-4", colour, className)}>
      {icon}
      <span>{text}</span>
    </span>
  );
}
