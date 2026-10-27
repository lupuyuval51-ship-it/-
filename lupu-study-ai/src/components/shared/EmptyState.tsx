import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon, title, description, action, className }: { icon: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-10 text-center", className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-7">{icon}</div>
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
