"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type ChipSize = "sm" | "md" | "lg";
export type ChipTone = "neutral" | "primary" | "accent";

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onSelect"> {
  selected?: boolean;
  /** Called with the next selected state. */
  onSelect?: (selected: boolean) => void;
  icon?: ReactNode;
  size?: ChipSize;
  tone?: ChipTone;
  /** Hide the check icon when selected (e.g. single-choice rows). */
  hideCheck?: boolean;
  /** Renders a static (non-interactive) tag. */
  static?: boolean;
}

const sizes: Record<ChipSize, string> = {
  sm: "h-8 px-3 text-sm gap-1 [&_svg]:size-4",
  md: "h-10 px-3.5 text-sm gap-1.5 [&_svg]:size-4",
  lg: "h-12 px-4 text-base gap-2 [&_svg]:size-5",
};
const selectedTone: Record<ChipTone, string> = {
  neutral: "border-text bg-text text-bg",
  primary: "border-primary bg-primary-soft text-primary-strong",
  accent: "border-accent bg-accent-soft text-accent-strong",
};

/** Selectable tag with a check mark. For groups use <ChipGroup>. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, onSelect, icon, size = "md", tone = "primary", hideCheck, static: isStatic, className, children, onClick, disabled, ...rest },
  ref,
) {
  const classes = cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full border font-medium leading-none transition-[background-color,border-color,color,transform] duration-150 ease-out motion-reduce:transition-none",
    sizes[size],
    selected ? selectedTone[tone] : "border-border-strong bg-surface text-text",
    !isStatic && "hover:border-subtle active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    !isStatic && selected && "hover:border-primary",
    className,
  );
  if (isStatic) {
    return (
      <span className={classes}>
        {icon}
        {children}
      </span>
    );
  }
  return (
    <button
      ref={ref}
      type="button"
      role={onSelect ? "checkbox" : undefined}
      aria-checked={onSelect ? selected : undefined}
      aria-pressed={!onSelect ? selected : undefined}
      disabled={disabled}
      className={classes}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onSelect?.(!selected);
      }}
      {...rest}
    >
      {selected && !hideCheck ? <Check aria-hidden /> : icon}
      {children}
    </button>
  );
});

export interface ChipOption<V extends string = string> {
  value: V;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export type ChipGroupProps<V extends string = string> =
  | {
      mode: "single";
      options: ChipOption<V>[];
      value: V | null | undefined;
      onChange: (value: V) => void;
      /** Allow tapping the selected chip again to clear the selection. */
      allowEmpty?: boolean;
      size?: ChipSize;
      tone?: ChipTone;
      /** Accessible name for the group. */
      label?: string;
      className?: string;
      /** Single-line horizontally scrollable strip instead of wrapping. */
      scroll?: boolean;
    }
  | {
      mode: "multi";
      options: ChipOption<V>[];
      value: V[];
      onChange: (value: V[]) => void;
      /** Maximum selected chips (further chips are disabled). */
      max?: number;
      size?: ChipSize;
      tone?: ChipTone;
      label?: string;
      className?: string;
      scroll?: boolean;
    };

/** Single-choice (radiogroup) or multi-choice (checkbox group) chips. Wraps by default. */
export function ChipGroup<V extends string = string>(props: ChipGroupProps<V>) {
  const { options, size = "md", tone = "primary", label, className, scroll } = props;
  const isMulti = props.mode === "multi";
  const selectedValues: V[] = isMulti ? props.value : props.value ? [props.value] : [];
  const maxReached = isMulti && props.max !== undefined && props.value.length >= props.max;
  return (
    <div
      role={isMulti ? "group" : "radiogroup"}
      aria-label={label}
      className={cn("flex gap-2", scroll ? "no-scrollbar -mx-4 overflow-x-auto px-4 py-1" : "flex-wrap", className)}
    >
      {options.map((o) => {
        const selected = selectedValues.includes(o.value);
        return (
          <Chip
            key={o.value}
            size={size}
            tone={tone}
            icon={o.icon}
            selected={selected}
            disabled={o.disabled || (isMulti && !selected && maxReached)}
            role={isMulti ? "checkbox" : "radio"}
            aria-checked={selected}
            onClick={() => {
              if (isMulti) props.onChange(selected ? props.value.filter((v) => v !== o.value) : [...props.value, o.value]);
              else if (selected && props.allowEmpty) props.onChange(null as unknown as V);
              else props.onChange(o.value);
            }}
          >
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}
