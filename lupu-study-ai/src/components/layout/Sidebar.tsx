"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SIDEBAR_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { NavIcon } from "./NavIcon";
import { XpBadge } from "./XpBadge";

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e bg-card/80 backdrop-blur lg:flex">
      <div className="p-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>
      <nav aria-label="תפריט ראשי" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {SIDEBAR_GROUPS.map((g) => (
          <div key={g.title}>
            <p className="px-3 pb-1.5 text-xs font-bold text-muted-foreground">{g.title}</p>
            <ul className="space-y-0.5">
              {g.hrefs.map((href) => {
                const item = NAV_ITEMS.find((n) => n.href === href)!;
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                        active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <NavIcon name={item.icon} className="size-[18px]" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t p-4">
        <XpBadge />
      </div>
    </aside>
  );
}
