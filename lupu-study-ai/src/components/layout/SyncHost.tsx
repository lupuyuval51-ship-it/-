"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabase } from "@/lib/supabase/client";
import { syncEngine } from "@/services/data/sync";
import { useReady } from "@/hooks/useApp";

/** מפעיל סנכרון לענן כשהמשתמש מחובר, ומכבה אותו בהתנתקות. בלי Supabase – לא עושה כלום. */
export function SyncHost() {
  const auth = useAuth();
  const ready = useReady();
  const userId = auth.status === "signed-in" ? auth.user.id : null;

  useEffect(() => {
    if (!ready) return;
    const sb = getSupabase();
    if (sb && userId) void syncEngine.start(sb, userId);
    else syncEngine.stop();
  }, [ready, userId]);

  return null;
}
