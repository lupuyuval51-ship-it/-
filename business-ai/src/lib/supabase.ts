/**
 * The app's single Supabase client (Auth + PostgREST + Functions), typed with the generated
 * schema. Follows the Supabase React Native guide: AsyncStorage session storage on native,
 * default (localStorage) on web, auto refresh paused while the app is in the background.
 *
 * When EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are missing, `supabase` is a guard object that throws
 * a ConfigurationError on use and `isSupabaseConfigured` is false — the root layout shows a
 * configuration screen instead of crashing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import type { Database } from './database';
import { publicConfig } from './env';

export class ConfigurationError extends Error {
  constructor(missing: string[]) {
    super(`Supabase is not configured. Missing: ${missing.join(', ')}`);
    this.name = 'ConfigurationError';
  }
}

export type AppSupabaseClient = SupabaseClient<Database>;

export const isSupabaseConfigured = publicConfig.ok;
export const missingConfiguration: readonly string[] = publicConfig.ok ? [] : publicConfig.missing;

function createGuard(missing: string[]): AppSupabaseClient {
  return new Proxy({} as AppSupabaseClient, {
    get() {
      throw new ConfigurationError(missing);
    },
  });
}

function createAppClient(): AppSupabaseClient {
  if (!publicConfig.ok) return createGuard(publicConfig.missing);
  const isWeb = Platform.OS === 'web';
  return createClient<Database>(publicConfig.config.supabaseUrl, publicConfig.config.supabaseAnonKey, {
    auth: {
      ...(isWeb ? {} : { storage: AsyncStorage }),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: isWeb,
      // PKCE: recovery links carry `?code=` (exchanged on native, auto-detected on web).
      flowType: 'pkce',
      ...(isWeb ? {} : { lock: processLock }),
    },
  });
}

export const supabase: AppSupabaseClient = createAppClient();

let appStateWired = false;

/**
 * Native only: refresh tokens only while the app is in the foreground (Supabase RN guide).
 * On web the client manages refresh via visibility changes itself.
 */
export function wireAuthAutoRefresh(): () => void {
  if (!isSupabaseConfigured || Platform.OS === 'web' || appStateWired) return () => undefined;
  appStateWired = true;
  if (AppState.currentState === 'active') void supabase.auth.startAutoRefresh();
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });
  return () => {
    appStateWired = false;
    sub.remove();
  };
}

/** Base URL of the project (for Edge Function SSE clients). */
export function getSupabaseUrl(): string {
  if (!publicConfig.ok) throw new ConfigurationError(publicConfig.missing);
  return publicConfig.config.supabaseUrl;
}

export function getSupabaseAnonKey(): string {
  if (!publicConfig.ok) throw new ConfigurationError(publicConfig.missing);
  return publicConfig.config.supabaseAnonKey;
}
