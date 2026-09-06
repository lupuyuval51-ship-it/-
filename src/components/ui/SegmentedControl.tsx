"use client";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SegmentOption<V extends string = string> {
  value: V;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<V extends string = string> {
  options: SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Accessible name. */
  label?: string;
  size?: "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

/** Radio-group styled as connected segments. Arrow keys move the selection. */
export function SegmentedControl<V extends string = string>({ options, value, onChange, label, size = "md", fullWidth = true, className }: SegmentedControlProps<V>) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const enabled = options.filter((o) => !o.disabled);
    const i = enabled.findIndex((o) => o.value === value);
    const rtl = (ref.current?.closest("[dir]")?.getAttribute("dir") ?? document.documentElement.dir) === "rtl";
    const forward = (e.key === "ArrowRight") !== rtl;
    let next = i;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = enabled.length - 1;
    else next = (i + (forward ? 1 : -1) + enabled.length) % enabled.length;
    const opt = enabled[next];
    if (opt) {
      onChange(opt.value);
      ref.current?.querySelector<HTMLButtonElement>(`[data-value="${opt.value}"]`)?.focus();
    }
  };
  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("inline-flex gap-1 rounded-lg bg-surface-2 p-1", fullWidth && "flex w-full", className)}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            id={`${id}-${o.value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={o.disabled}
            data-value={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 font-semibold transition-[background-color,color,box-shadow] duration-150 ease-out disabled:opacity-40 motion-reduce:transition-none [&_svg]:size-4",
              size === "lg" ? "h-12 text-base" : "h-10 text-sm",
              selected ? "bg-surface text-text shadow-card" : "text-muted hover:text-text",
            )}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
