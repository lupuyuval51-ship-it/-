"use client";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ListRowProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /** Show a chevron at the end (automatically true when href/onClick is set). */
  chevron?: boolean;
  href?: string;
  disabled?: boolean;
  /** Visually separates rows when stacked (default true). */
  divider?: boolean;
  /** Tone of the leading icon bubble. */
  leadingTone?: "neutral" | "primary" | "accent" | "danger";
}

const leadingTones = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  danger: "bg-danger-soft text-danger",
};

/** 56px list row: leading icon, title/subtitle, trailing value, chevron. Renders a Link, button or div. */
export const ListRow = forwardRef<HTMLElement, ListRowProps>(function ListRow(
  { leading, title, subtitle, trailing, chevron, href, onClick, disabled, divider = true, leadingTone = "neutral", className, ...rest },
  ref,
) {
  const interactive = !!href || !!onClick;
  const showChevron = chevron ?? interactive;
  const classes = cn(
    "flex min-h-14 w-full items-center gap-3 px-1 py-2 text-start transition-colors duration-150 ease-out motion-reduce:transition-none",
    divider && "border-b border-border last:border-b-0",
    interactive && !disabled && "cursor-pointer hover:bg-surface-2/60 active:bg-surface-2",
    disabled && "opacity-50",
    className,
  );
  const content = (
    <>
      {leading && <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5", leadingTones[leadingTone])}>{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-text">{title}</span>
        {subtitle && <span className="block truncate text-sm text-muted">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0 text-sm text-muted">{trailing}</span>}
      {showChevron && <ChevronRight aria-hidden className="size-5 shrink-0 text-subtle rtl:rotate-180" />}
    </>
  );
  if (href && !disabled) {
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={classes} onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>} {...(rest as HTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} type="button" className={classes} onClick={onClick as unknown as React.MouseEventHandler<HTMLButtonElement>} disabled={disabled} {...(rest as HTMLAttributes<HTMLButtonElement>)}>
        {content}
      </button>
    );
  }
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={classes} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {content}
    </div>
  );
});
