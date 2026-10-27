"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthState =
  | { status: "disabled" } // Supabase לא מוגדר – מצב מקומי
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: User };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(isSupabaseConfigured() ? { status: "loading" } : { status: "disabled" });
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) setState(data.session ? { status: "signed-in", user: data.session.user } : { status: "signed-out" });
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setState(session ? { status: "signed-in", user: session.user } : { status: "signed-out" });
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}
