"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { NavIcon } from "./NavIcon";
import { isActive } from "./Sidebar";

export function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((n) => n.primary);
  return (
    <nav aria-label="ניווט תחתון" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors", active ? "text-primary" : "text-muted-foreground")}
              >
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/14")}>
                  <NavIcon name={it.icon} className="size-5" />
                </span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
