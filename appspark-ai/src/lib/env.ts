/**
 * Public runtime configuration. Only `EXPO_PUBLIC_*` variables are ever read on
 * the client – they are safe to ship because Supabase publishable keys are
 * designed to be public and all privileged work happens in Edge Functions.
 *
 * Variables must be accessed statically (`process.env.EXPO_PUBLIC_X`) so Expo
 * can inline them at build time.
 */
function clean(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const env = {
  supabaseUrl: clean(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseKey: clean(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ?? clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  aiFunctionName: clean(process.env.EXPO_PUBLIC_AI_FUNCTION_NAME) ?? 'ai-generate',
  /**
   * Set to "1" to tell the client that the server has an AI provider configured.
   * The client still verifies this against the function's health endpoint; the
   * flag only controls optimistic UI before the first request.
   */
  aiEnabledHint: clean(process.env.EXPO_PUBLIC_AI_ENABLED) === '1',
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseKey);
