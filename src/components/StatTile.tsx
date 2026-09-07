"use client";
import { Card, type CardTone } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { Stat, type StatProps } from "./ui/Stat";
import { cn } from "@/lib/cn";

export interface StatTileProps extends StatProps {
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  tone?: CardTone;
}

/** Card-shaped stat for dashboards and summaries. Shows a skeleton while `loading`. */
export function StatTile({ href, onClick, loading, tone = "surface", className, ...stat }: StatTileProps) {
  return (
    <Card padding="sm" tone={tone} href={href} onClick={onClick} className={cn("min-h-24", className)}>
      {loading ? (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton variant="text" width="60%" />
          <Skeleton height={28} width="40%" />
        </div>
      ) : (
        <Stat {...stat} />
      )}
    </Card>
  );
}
