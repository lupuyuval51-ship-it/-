"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Shield, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { useAppStore } from "@/store/appStore";
import { Logo } from "./Logo";
import { NAV_ITEMS, isNavActive } from "./BottomNav";
import { SyncIndicator } from "./SyncIndicator";

const SECONDARY: { key: string; href: string; labelKey: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { key: "settings", href: "/settings", labelKey: "nav.settings", icon: Settings },
  { key: "privacy", href: "/privacy", labelKey: "nav.privacy", icon: Shield },
  { key: "admin", href: "/admin", labelKey: "nav.admin", icon: ShieldCheck, adminOnly: true },
];

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-md px-3 text-base font-semibold transition-colors duration-150 ease-out motion-reduce:transition-none",
        active ? "bg-primary-soft text-primary-strong" : "text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      <Icon aria-hidden className="size-5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/** Desktop sidebar (md and up): wordmark, primary + secondary links, sync status. */
export function Sidebar({ className }: { className?: string }) {
  const { t } = useT();
  const pathname = usePathname();
  const isAdmin = useAppStore((s) => s.auth.role === "admin");
  return (
    <aside className={cn("sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-border bg-surface md:flex", className)}>
      <div className="px-5 pb-4 pt-6">
        <Link href="/home" aria-label={t("nav.brand")} className="inline-flex rounded-md">
          <Logo variant="wordmark" size={36} tone="brand" title="" />
        </Link>
      </div>
      <nav aria-label={t("nav.main.label")} className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.key} href={item.href} label={t(item.labelKey)} icon={item.icon} active={isNavActive(pathname, item.href)} />
        ))}
      </nav>
      <nav aria-label={t("nav.secondary.label")} className="mt-6 flex flex-col gap-1 border-t border-border px-3 pt-4">
        {SECONDARY.filter((s) => !s.adminOnly || isAdmin).map((item) => (
          <NavLink key={item.key} href={item.href} label={t(item.labelKey)} icon={item.icon} active={isNavActive(pathname, item.href)} />
        ))}
      </nav>
      <div className="mt-auto px-5 pb-5 pt-4">
        <SyncIndicator variant="label" />
      </div>
    </aside>
  );
}
