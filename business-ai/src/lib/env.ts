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

export interface RawPublicEnv {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
}

/** Values inlined by the Expo bundler (static access is required for inlining). */
function bundledEnv(): RawPublicEnv {
  return {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function readPublicConfig(raw: RawPublicEnv = bundledEnv()): ConfigResult {
  const supabaseUrl = clean(raw.supabaseUrl);
  const supabaseAnonKey = clean(raw.supabaseAnonKey);
  const missing: string[] = [];
  if (!/^https?:\/\/\S+$/.test(supabaseUrl)) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, config: { supabaseUrl: supabaseUrl.replace(/\/+$/, ''), supabaseAnonKey } };
}

export const publicConfig: ConfigResult = readPublicConfig();
