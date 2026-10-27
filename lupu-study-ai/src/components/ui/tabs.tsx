"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({ items, value, onChange, className, label }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string; label?: string }) {
  const onKey = (e: React.KeyboardEvent) => {
    const i = items.findIndex((x) => x.value === value);
    // בכיוון RTL חץ שמאלה = הבא
    const dir = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    onChange(items[(i + dir + items.length) % items.length].value);
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKey} className={cn("no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-muted p-1", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          type="button"
          aria-selected={it.value === value}
          tabIndex={it.value === value ? 0 : -1}
          onClick={() => onChange(it.value)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-all",
            it.value === value ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {it.label}
          {it.count !== undefined && <span className="rounded-full bg-primary/12 px-1.5 text-xs text-primary">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}
