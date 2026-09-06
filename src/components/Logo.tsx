import type { SVGAttributes } from "react";
import { cn } from "@/lib/cn";

/*
 * DiscCoach mark: a tilted disc (ellipse with a rim ring) flying up-right, three motion arcs trailing behind
 * it and a subtle dotted flight curve. Geometry is shared with public/logo.svg – keep both in sync.
 */
export const LOGO_VIEWBOX = "0 0 512 512";
const DISC_FILLED =
  "M458.3 187.2A158 56 -18 1 0 157.7 284.8A158 56 -18 1 0 458.3 187.2ZM406.9 203.9A104 32 -18 1 0 209.1 268.1A104 32 -18 1 0 406.9 203.9ZM391.7 208.8A88 24 -18 1 0 224.3 263.2A88 24 -18 1 0 391.7 208.8Z";
const DISC_OUTER = "M458.3 187.2A158 56 -18 1 0 157.7 284.8A158 56 -18 1 0 458.3 187.2Z";
const DISC_RING = "M399.3 206.3A96 28 -18 1 0 216.7 265.7A96 28 -18 1 0 399.3 206.3Z";
const ARCS = [
  ["M149.4 120.8A196 196 0 0 0 149.4 351.2", 34],
  ["M103.6 118A236 236 0 0 0 103.6 354", 28],
  ["M55.9 123.7A276 276 0 0 0 55.9 348.3", 22],
] as const;
const ARC_TRANSFORM = "rotate(-18 308 236)";
const FLIGHT = "M40 470C190 470 330 432 470 330";

export type LogoVariant = "mark" | "wordmark";
/** current: inherits text colour (single colour). brand: pitch-green disc with an orange flight curve. */
export type LogoTone = "current" | "brand";

export interface LogoProps extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
  variant?: LogoVariant;
  /** Pixel size of the mark (the wordmark scales its text with it). */
  size?: number;
  /** Filled disc (default) or a line-only disc for very light contexts. */
  filled?: boolean;
  tone?: LogoTone;
  /** Accessible name; pass "" to hide the mark from screen readers when a visible label sits next to it. */
  title?: string;
}

/** Inline-SVG mark; `variant="wordmark"` adds the Heebo "DiscCoach" wordmark after it. */
export function Logo({ variant = "mark", size = 32, filled = true, tone = "current", title = "DiscCoach", className, ...rest }: LogoProps) {
  const brand = tone === "brand";
  const svg = (
    <svg
      viewBox={LOGO_VIEWBOX}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={cn("shrink-0", brand && "text-primary", variant === "mark" && className)}
      {...rest}
    >
      {filled ? (
        <path d={DISC_FILLED} fill="currentColor" fillRule="evenodd" stroke="none" />
      ) : (
        <>
          <path d={DISC_OUTER} strokeWidth={30} />
          <path d={DISC_RING} strokeWidth={18} />
        </>
      )}
      <g transform={ARC_TRANSFORM}>
        {ARCS.map(([d, w]) => (
          <path key={d} d={d} strokeWidth={w} />
        ))}
      </g>
      <path d={FLIGHT} strokeWidth={14} strokeDasharray="1 30" className={brand ? "text-accent" : undefined} />
    </svg>
  );
  if (variant === "mark") return svg;
  return (
    <span className={cn("inline-flex items-center gap-2 font-sans font-bold tracking-tight text-text", className)} dir="ltr">
      {svg}
      <span style={{ fontSize: Math.round(size * 0.72), lineHeight: 1 }}>
        Disc<span className={brand ? "text-primary" : undefined}>Coach</span>
      </span>
    </span>
  );
}
