"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, MessageCircle, TrendingUp, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

export interface NavItem {
  key: string;
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

/** Primary destinations shared by the bottom bar and the sidebar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "home", href: "/home", labelKey: "nav.home", icon: Home },
  { key: "workouts", href: "/workouts", labelKey: "nav.workouts", icon: Dumbbell },
  { key: "coach", href: "/coach", labelKey: "nav.coach", icon: MessageCircle },
  { key: "progress", href: "/progress", labelKey: "nav.progress", icon: TrendingUp },
  { key: "profile", href: "/profile", labelKey: "nav.profile", icon: User },
];

export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile bottom navigation (hidden from md up). Fixed, safe-area aware, 56px targets. */
export function BottomNav({ className }: { className?: string }) {
  const { t } = useT();
  const pathname = usePathname();
  return (
    <nav aria-label={t("nav.main.label")} className={cn("safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden", className)}>
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {NAV_ITEMS.map(({ key, href, labelKey, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <li key={key} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold leading-tight transition-colors duration-150 ease-out motion-reduce:transition-none",
                  active ? "text-primary" : "text-muted hover:text-text",
                )}
              >
                <span aria-hidden className={cn("absolute top-0 h-0.5 w-8 rounded-full bg-primary transition-opacity duration-150", active ? "opacity-100" : "opacity-0")} />
                <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 2} />
                <span className="max-w-full truncate">{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
