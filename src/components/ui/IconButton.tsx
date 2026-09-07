"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type IconButtonVariant = "ghost" | "secondary" | "primary" | "accent" | "danger" | "soft";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> {
  /** Required accessible name (rendered as aria-label + title). */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  href?: string;
  type?: "button" | "submit" | "reset";
  /** Marks a toggled state (aria-pressed) – e.g. favourite. */
  pressed?: boolean;
}

const variants: Record<IconButtonVariant, string> = {
  ghost: "bg-transparent text-text hover:bg-surface-2 active:bg-surface-3",
  soft: "bg-surface-2 text-text hover:bg-surface-3",
  secondary: "bg-surface text-text border border-border-strong hover:bg-surface-2",
  primary: "bg-primary text-primary-fg hover:bg-primary-strong",
  accent: "bg-accent text-accent-fg hover:bg-accent-strong",
  danger: "bg-danger-soft text-danger hover:brightness-95",
};

const sizes: Record<IconButtonSize, string> = {
  sm: "size-10 [&_svg]:size-5",
  md: "size-11 [&_svg]:size-5",
  lg: "size-14 [&_svg]:size-7",
};

/** Square icon-only button (≥ 44px for md/lg). Always pass a meaningful `label`. */
export const IconButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, IconButtonProps>(function IconButton(
  { label, icon, variant = "ghost", size = "md", loading, href, type = "button", pressed, className, disabled, ...rest },
  ref,
) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 ease-out active:scale-95 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
    variants[variant],
    sizes[size],
    pressed && variant === "ghost" && "bg-primary-soft text-primary",
    className,
  );
  const content = loading ? <Spinner size="sm" /> : icon;
  if (href && !disabled) {
    return (
      <Link ref={ref as Ref<HTMLAnchorElement>} href={href} className={classes} aria-label={label} title={label} onClick={rest.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref as Ref<HTMLButtonElement>} type={type} className={classes} aria-label={label} title={label} aria-pressed={pressed} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});
