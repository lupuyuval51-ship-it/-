import { cn } from "@/lib/cn";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

const sizes: Record<SpinnerSize, string> = {
  xs: "size-3.5 border-2",
  sm: "size-4 border-2",
  md: "size-6 border-[3px]",
  lg: "size-10 border-4",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Accessible label; defaults to a generic "loading" (pass a translated string when it matters). */
  label?: string;
  className?: string;
  /** Use "current" to inherit the text colour (inside buttons); "primary" for standalone. */
  tone?: "current" | "primary" | "muted";
}

/** Circular indeterminate spinner. Inherits text colour by default so it works inside any button variant. */
export function Spinner({ size = "md", label = "Loading", className, tone = "current" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-solid border-current border-e-transparent motion-reduce:animate-none",
        tone === "primary" && "text-primary",
        tone === "muted" && "text-muted",
        sizes[size],
        className,
      )}
    />
  );
}
