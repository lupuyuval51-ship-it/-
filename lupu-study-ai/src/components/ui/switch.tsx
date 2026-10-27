"use client";

import { cn } from "@/lib/utils";

export function Switch({ checked, onCheckedChange, label, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-primary" : "bg-input")}
    >
      <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", checked ? "end-0.5" : "start-0.5")} />
    </button>
  );
}
