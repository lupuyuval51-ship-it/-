"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cloud, CloudOff, HardDrive, Loader2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { syncEngine, type SyncStatus } from "@/services/data/sync";
import { useAuth } from "@/hooks/useAuth";

export function SyncStatusChip() {
  const auth = useAuth();
  const [s, setS] = useState<SyncStatus>({ state: "off" });
  useEffect(() => syncEngine.subscribe(setS), []);

  if (!isSupabaseConfigured()) {
    return (
      <span title="הנתונים נשמרים רק במכשיר הזה" className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:flex">
        <HardDrive className="size-3.5" aria-hidden /> שמור במכשיר
      </span>
    );
  }
  if (auth.status === "signed-out") {
    return (
      <Link href="/login" className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
        <Cloud className="size-3.5" aria-hidden /> התחבר לסנכרון
      </Link>
    );
  }
  if (auth.status !== "signed-in") return null;
  const map = {
    syncing: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "מסנכרן…", cls: "bg-muted text-muted-foreground" },
    synced: { icon: <Cloud className="size-3.5" />, text: "מסונכרן", cls: "bg-success/12 text-success" },
    error: { icon: <CloudOff className="size-3.5" />, text: "שגיאת סנכרון", cls: "bg-destructive/12 text-destructive" },
    offline: { icon: <CloudOff className="size-3.5" />, text: "לא מקוון", cls: "bg-warning/15 text-warning" },
    off: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "מתחבר…", cls: "bg-muted text-muted-foreground" },
  }[s.state];
  return (
    <span role="status" title={s.message} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${map.cls}`}>
      {map.icon}
      {map.text}
    </span>
  );
}
