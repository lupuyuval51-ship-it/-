import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="טוען" className="space-y-4">
      <Skeleton className="h-10 w-56" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64" />
      <span className="sr-only">טוען…</span>
    </div>
  );
}
