import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({ icon, label, value, hint, tone = "primary", children }: { icon: ReactNode; label: string; value: ReactNode; hint?: string; tone?: "primary" | "accent" | "warning" | "success"; children?: ReactNode }) {
  const tones = {
    primary: "bg-primary/12 text-primary",
    accent: "bg-accent/15 text-accent",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5", tones[tone])}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight text-muted-foreground">{label}</p>
          <p className="text-lg font-extrabold leading-tight sm:text-xl">{value}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </Card>
  );
}
