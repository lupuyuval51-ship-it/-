"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

/** לקוח Supabase לדפדפן (מפתח anon ציבורי; ההגנה על הנתונים נעשית על ידי RLS). null כשלא הוגדר. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return client;
}

export async function getAccessToken(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
