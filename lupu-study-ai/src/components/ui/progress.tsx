import { cn } from "@/lib/utils";

export function Progress({ value, className, barClassName, label }: { value: number; className?: string; barClassName?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className={cn("h-full rounded-full bg-gradient-to-l from-primary to-accent transition-[width] duration-700", barClassName)} style={{ width: `${v}%` }} />
    </div>
  );
}
