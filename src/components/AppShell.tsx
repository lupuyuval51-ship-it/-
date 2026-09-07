"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { SyncIndicator } from "./SyncIndicator";

/** Routes that take the whole screen (no sidebar / bottom bar), e.g. the live session player. */
export const IMMERSIVE_PREFIXES = ["/session"] as const;

export interface AppShellProps {
  children: ReactNode;
  /** Force immersive mode regardless of the route. */
  immersive?: boolean;
  /** Max width of the page column (default 3xl). */
  width?: "md" | "lg" | "xl";
  className?: string;
}

const widths = { md: "max-w-3xl", lg: "max-w-5xl", xl: "max-w-7xl" };

/** App frame: skip link, offline strip, desktop sidebar, page column, mobile bottom navigation. */
export function AppShell({ children, immersive: immersiveProp, width = "md", className }: AppShellProps) {
  const { t } = useT();
  const pathname = usePathname();
  const immersive = immersiveProp ?? IMMERSIVE_PREFIXES.some((p) => pathname?.startsWith(p));
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-semibold text-primary-fg focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t("nav.skipToContent")}
      </a>
      {!immersive && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        {!immersive && (
          <div className="mx-auto flex w-full max-w-3xl justify-end px-4 pt-2 empty:hidden md:hidden">
            <SyncIndicator variant="label" />
          </div>
        )}
        <main
          id="main"
          tabIndex={-1}
          className={cn(
            "mx-auto flex w-full flex-1 flex-col outline-none",
            immersive ? "max-w-3xl" : cn(widths[width], "px-4 pt-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-6 md:pb-10"),
            className,
          )}
        >
          {children}
        </main>
      </div>
      {!immersive && <BottomNav />}
    </div>
  );
}
