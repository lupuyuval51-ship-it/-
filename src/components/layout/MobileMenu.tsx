"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * The phone/tablet navigation (a native `<details>`). It closes after a link is followed (the header lives in a layout
 * that stays mounted between pages), on Escape (focus returns to the button) and when the user taps outside it.
 */
export function MobileMenu({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = ref.current;
      if (e.key !== "Escape" || !el?.open) return;
      el.open = false;
      el.querySelector("summary")?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const el = ref.current;
      if (el?.open && e.target instanceof Node && !el.contains(e.target)) el.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return (
    <details ref={ref} className="relative lg:hidden">
      <summary aria-label={label} className="grid size-10 cursor-pointer list-none place-items-center rounded-lg border border-line hover:bg-text/10">
        <Menu aria-hidden className="size-5" />
      </summary>
      <div className="lu-pop absolute end-0 top-12 w-64 space-y-1 rounded-xl border border-line bg-ink-800 p-2 shadow-e3">{children}</div>
    </details>
  );
}
