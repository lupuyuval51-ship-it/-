/** בדיקת אסימון Supabase בצד השרת (ללא SDK, דרך נקודת הקצה של Auth). */
export function supabaseServerConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url: url.replace(/\/$/, ""), anonKey } : null;
}

export async function verifySupabaseToken(token: string): Promise<{ id: string } | null> {
  const cfg = supabaseServerConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.anonKey, authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { id?: string };
    return json.id ? { id: json.id } : null;
  } catch {
    return null;
  }
}
