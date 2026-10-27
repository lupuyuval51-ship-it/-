"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Logo } from "./Logo";
import { NavIcon } from "./NavIcon";
import { ThemeToggle } from "./ThemeToggle";
import { SyncStatusChip } from "./SyncStatusChip";

export function Header() {
  const [open, setOpen] = useState(false);
  const more = NAV_ITEMS.filter((n) => !n.primary);
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur lg:h-16 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <Button variant="ghost" size="icon-sm" aria-label="תפריט – כל המסכים" aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <Menu />
        </Button>
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>
      <span className="hidden lg:block" />
      <div className="flex items-center gap-2">
        <SyncStatusChip />
        <ThemeToggle />
      </div>
      <Dialog open={open} onOpenChange={setOpen} title="כל המסכים" side="sheet">
        <ul className="grid grid-cols-2 gap-2">
          {more.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3 py-3.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                <NavIcon name={it.icon} className="size-5 text-primary" />
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </Dialog>
    </header>
  );
}
