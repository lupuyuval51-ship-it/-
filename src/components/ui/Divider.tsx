import { cn } from "@/lib/cn";

export interface DividerProps {
  /** Optional centred label. */
  label?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
  /** Vertical spacing preset for horizontal dividers. */
  spacing?: "none" | "sm" | "md" | "lg";
}

const spacings = { none: "", sm: "my-2", md: "my-4", lg: "my-6" };

/** Thin separator; with `label` renders text between two lines. */
export function Divider({ label, orientation = "horizontal", className, spacing = "md" }: DividerProps) {
  if (orientation === "vertical") {
    return <span role="separator" aria-orientation="vertical" className={cn("inline-block h-6 w-px self-center bg-border", className)} />;
  }
  if (!label) return <hr className={cn("border-0 border-t border-border", spacings[spacing], className)} />;
  return (
    <div role="separator" className={cn("flex items-center gap-3 text-sm text-muted", spacings[spacing], className)}>
      <span className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
