/**
 * Public runtime configuration. Only EXPO_PUBLIC_* values are ever shipped to the app; they are
 * inlined at build time, so they must be read with static `process.env.EXPO_PUBLIC_…` access.
 */
export interface PublicConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export type ConfigResult = { ok: true; config: PublicConfig } | { ok: false; missing: string[] };

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

export function readPublicConfig(): ConfigResult {
  const supabaseUrl = clean(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const missing: string[] = [];
  if (!/^https?:\/\/\S+$/.test(supabaseUrl)) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, config: { supabaseUrl: supabaseUrl.replace(/\/+$/, ''), supabaseAnonKey } };
}

export const publicConfig: ConfigResult = readPublicConfig();
