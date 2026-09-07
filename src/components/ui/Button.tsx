"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and disables the button. */
  loading?: boolean;
  /** Icon rendered before the label (logical start). */
  icon?: ReactNode;
  /** Icon rendered after the label (logical end). */
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  /** When set the button renders as a Next.js <Link>. */
  href?: string;
  type?: "button" | "submit" | "reset";
  /** Rounded pill shape (chips-like CTA). */
  pill?: boolean;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-strong active:bg-primary-strong shadow-card",
  secondary: "bg-surface text-text border border-border-strong hover:bg-surface-2 active:bg-surface-3",
  ghost: "bg-transparent text-primary hover:bg-primary-soft active:bg-primary-soft",
  danger: "bg-danger text-white hover:brightness-95 active:brightness-90",
  accent: "bg-accent text-accent-fg hover:bg-accent-strong active:bg-accent-strong shadow-card",
};

export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "h-10 min-w-11 px-3.5 text-sm gap-1.5 rounded-sm",
  md: "h-11 min-w-11 px-4 text-base gap-2 rounded-md",
  lg: "h-12 min-w-12 px-5 text-base gap-2 rounded-md",
  xl: "h-14 min-w-14 px-6 text-lg gap-2.5 rounded-lg",
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: "[&_svg]:size-4",
  md: "[&_svg]:size-5",
  lg: "[&_svg]:size-5",
  xl: "[&_svg]:size-6",
};

export const buttonBaseClasses =
  "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold leading-none transition-[background-color,color,box-shadow,transform,filter] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100";

/**
 * Primary action component. Renders a <button> or, when `href` is given, a Next <Link> with identical styling.
 * Tap targets are ≥ 44px for md and up (sm is 40px – use it only inside dense rows).
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, iconEnd, fullWidth, href, type = "button", pill, className, children, disabled, ...rest },
  ref,
) {
  const classes = cn(
    buttonBaseClasses,
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    iconSizeClasses[size],
    pill && "rounded-full",
    fullWidth && "w-full",
    className,
  );
  const content = (
    <>
      {loading ? <Spinner size={size === "xl" ? "md" : "sm"} /> : icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children != null && <span className="truncate">{children}</span>}
      {iconEnd && !loading ? <span className="inline-flex shrink-0">{iconEnd}</span> : null}
    </>
  );

  if (href && !disabled && !loading) {
    // Only the props that make sense on an anchor are forwarded.
    const { onClick, id, title, tabIndex, role, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy } = rest;
    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        id={id}
        title={title}
        tabIndex={tabIndex}
        role={role}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {content}
      </Link>
    );
  }

  return (
    <button ref={ref as Ref<HTMLButtonElement>} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});
