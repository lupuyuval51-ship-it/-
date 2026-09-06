"use client";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

export interface TabItem<V extends string = string> {
  value: V;
  label: ReactNode;
  icon?: ReactNode;
  /** Small count badge. */
  count?: number;
  disabled?: boolean;
}

export interface TabsProps<V extends string = string> {
  items: TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Accessible name of the tab list. */
  label?: string;
  /** Underline (default) or pill style. */
  variant?: "underline" | "pills";
  /** Stretch tabs to fill the width instead of scrolling. */
  fill?: boolean;
  className?: string;
  /** id prefix so screens can link panels with `tabPanelProps(value)`. */
  id?: string;
}

/** Tab list only – render the active panel yourself with `role="tabpanel"` and the ids from `tabPanelProps`. */
export function Tabs<V extends string = string>({ items, value, onChange, label, variant = "underline", fill, className, id: idProp }: TabsProps<V>) {
  const { t } = useT();
  const autoId = useId();
  const id = idProp ?? `tabs-${autoId}`;
  const listRef = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const enabled = items.filter((i) => !i.disabled);
    const i = enabled.findIndex((it) => it.value === value);
    const rtl = document.documentElement.dir === "rtl";
    const forward = (e.key === "ArrowRight") !== rtl;
    const next = e.key === "Home" ? 0 : e.key === "End" ? enabled.length - 1 : (i + (forward ? 1 : -1) + enabled.length) % enabled.length;
    const item = enabled[next];
    if (item) {
      onChange(item.value);
      listRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(`${id}-tab-${item.value}`)}`)?.focus();
    }
  };
  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label ?? t("ui.tabs.label")}
      onKeyDown={onKeyDown}
      className={cn(
        "flex",
        variant === "underline" ? "gap-1 border-b border-border" : "gap-1 rounded-lg bg-surface-2 p-1",
        !fill && "no-scrollbar -mx-4 overflow-x-auto px-4",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={`${id}-tab-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${id}-panel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap px-3 text-sm font-semibold transition-[color,background-color,border-color] duration-150 ease-out disabled:opacity-40 motion-reduce:transition-none [&_svg]:size-4",
              fill && "flex-1",
              variant === "underline"
                ? cn("-mb-px border-b-2", selected ? "border-primary text-primary" : "border-transparent text-muted hover:text-text")
                : cn("rounded-md", selected ? "bg-surface text-text shadow-card" : "text-muted hover:text-text"),
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", selected ? "bg-primary-soft text-primary-strong" : "bg-surface-3 text-muted")}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Props for the panel that belongs to a tab: `<div {...tabPanelProps(id, "stats")}>`. */
export function tabPanelProps(id: string, value: string) {
  return { role: "tabpanel" as const, id: `${id}-panel-${value}`, "aria-labelledby": `${id}-tab-${value}`, tabIndex: 0 };
}
