"use client";
import { forwardRef, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardTone = "surface" | "muted" | "primary" | "accent" | "outline";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  /** Adds hover/active affordance. Automatically true when onClick or href is given. */
  interactive?: boolean;
  /** Renders as a Next <Link> wrapper. */
  href?: string;
  tone?: CardTone;
  /** Optional header slot (title row) rendered above children with a divider. */
  header?: ReactNode;
  /** Optional footer slot. */
  footer?: ReactNode;
}

const paddings: Record<CardPadding, string> = { none: "", sm: "p-3", md: "p-4", lg: "p-5 md:p-6" };
const tones: Record<CardTone, string> = {
  surface: "bg-surface border border-border shadow-card",
  muted: "bg-surface-2 border border-transparent",
  primary: "bg-primary-soft border border-transparent",
  accent: "bg-accent-soft border border-transparent",
  outline: "bg-transparent border border-border-strong",
};

/**
 * Surface container. Flat (no gradients), 16px radius, subtle shadow.
 * Becomes keyboard-accessible (role="button") when onClick is provided, or a link when href is provided.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = "md", interactive, href, tone = "surface", header, footer, className, children, onClick, ...rest },
  ref,
) {
  const isInteractive = interactive || !!onClick || !!href;
  const classes = cn(
    "block rounded-lg text-start transition-[background-color,box-shadow,transform,border-color] duration-150 ease-out motion-reduce:transition-none",
    tones[tone],
    isInteractive && "cursor-pointer hover:border-border-strong hover:shadow-raised active:scale-[0.995]",
    padding !== "none" && !header && !footer && paddings[padding],
    className,
  );
  const body =
    header || footer ? (
      <>
        {header && <div className={cn("border-b border-border", paddings[padding === "none" ? "md" : padding])}>{header}</div>}
        <div className={paddings[padding]}>{children}</div>
        {footer && <div className={cn("border-t border-border", paddings[padding === "none" ? "md" : padding])}>{footer}</div>}
      </>
    ) : (
      children
    );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}>
        {body}
      </Link>
    );
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(e);
    if (!onClick || e.defaultPrevented) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      ref={ref}
      className={classes}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
      onKeyDown={onClick ? onKeyDown : rest.onKeyDown}
    >
      {body}
    </div>
  );
});
