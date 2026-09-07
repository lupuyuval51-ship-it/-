"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { IconButton } from "./ui/IconButton";

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Back button as a link. */
  backHref?: string;
  /** Back button with a custom handler (defaults to router.back() when `back` is true). */
  onBack?: () => void;
  back?: boolean;
  /** Buttons at the logical end of the title row. */
  actions?: ReactNode;
  /** Element before the title (avatar, icon). */
  leading?: ReactNode;
  size?: "md" | "lg";
  /** Content under the title row (tabs, filters). */
  children?: ReactNode;
  className?: string;
}

/** Screen title row with optional back button, actions and a slot for tabs/filters. */
export function PageHeader({ title, subtitle, backHref, onBack, back, actions, leading, size = "md", children, className }: PageHeaderProps) {
  const { t } = useT();
  const router = useRouter();
  const showBack = back || !!backHref || !!onBack;
  return (
    <header className={cn("mb-4 flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        {showBack && (
          <IconButton
            label={t("nav.back")}
            icon={<ArrowLeft className="rtl:rotate-180" />}
            href={backHref}
            onClick={backHref ? undefined : (onBack ?? (() => router.back()))}
            className="-ms-2"
          />
        )}
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <h1 className={cn("truncate font-bold leading-tight text-text", size === "lg" ? "text-3xl" : "text-2xl")}>{title}</h1>
          {subtitle && <p className="mt-0.5 text-base text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
