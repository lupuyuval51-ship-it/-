"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";

/** A navigation link that announces the current page (`aria-current`) and highlights it; nested routes count (a game's details are under "My games"). */
export function NavLink({ href, className, activeClassName, children }: { href: string; className: string; activeClassName: string; children: ReactNode }) {
  const pathname = usePathname();
  const current = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={current ? "page" : undefined} className={cx(className, current && activeClassName)}>
      {children}
    </Link>
  );
}
