"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useData } from "@/hooks/useApp";
import { levelFromXp, totalXp } from "@/services/learning/gamification";
import { Progress } from "@/components/ui/progress";

export function XpBadge() {
  const data = useData();
  const xp = totalXp(data.xpEvents);
  const lv = levelFromXp(xp);
  return (
    <Link href="/achievements" className="block rounded-xl bg-muted/70 p-3 transition-colors hover:bg-muted">
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span className="flex items-center gap-1.5">
          <Zap className="size-4 text-warning" aria-hidden /> רמה {lv.level}
        </span>
        <span className="text-xs text-muted-foreground">{xp} XP</span>
      </div>
      <Progress value={lv.progress * 100} label="התקדמות לרמה הבאה" />
    </Link>
  );
}
