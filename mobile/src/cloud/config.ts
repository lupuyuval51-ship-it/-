/**
 * The app's Supabase project. Both values are PUBLIC by design: the URL, and the *publishable* key, which can only do what
 * row level security allows a signed-in user to do with their own rows. Never put a secret / service-role key in this app.
 */
export const SUPABASE_URL = "https://yhxwgfgodxbzdvaqtqjz.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mhowyylc3sDlIerXlS9ujw_emr9KYvd";

/**
 * LEVEL UP AI: the separate Supabase project `levelup-ai` holding the Edge Function `generate-game`. Public URL, no key: the
 * function checks the learner's sign-in in the app project above, and the AI key lives only in that project's secrets.
 */
export const AI_URL = "https://zfkjkbyzurhidhpkzpxr.supabase.co";
