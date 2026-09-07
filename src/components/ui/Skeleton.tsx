import { cn } from "@/lib/cn";

export type SkeletonVariant = "block" | "text" | "circle";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** CSS width (e.g. "100%", 120). Text lines default to full width with a shorter last line. */
  width?: number | string;
  /** CSS height. Text defaults to 1em, circle to width. */
  height?: number | string;
  /** Number of lines for the text variant. */
  lines?: number;
  className?: string;
}

/** Loading placeholder with the shared shimmer. Never render fake data – use this until `hydrated`. */
export function Skeleton({ variant = "block", width, height, lines = 1, className }: SkeletonProps) {
  if (variant === "text") {
    return (
      <div className={cn("flex flex-col gap-2", className)} aria-hidden>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-4 rounded-sm" style={{ width: i === lines - 1 && lines > 1 ? "65%" : (width ?? "100%") }} />
        ))}
      </div>
    );
  }
  if (variant === "circle") {
    const size = width ?? height ?? 40;
    return <div className={cn("skeleton rounded-full", className)} style={{ width: size, height: size }} aria-hidden />;
  }
  return <div className={cn("skeleton", className)} style={{ width: width ?? "100%", height: height ?? 96 }} aria-hidden />;
}

/** Card-shaped skeleton used by list screens. */
export function SkeletonCard({ className, lines = 2 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4", className)} aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width={44} />
        <div className="flex-1">
          <Skeleton variant="text" lines={lines} />
        </div>
      </div>
    </div>
  );
}
