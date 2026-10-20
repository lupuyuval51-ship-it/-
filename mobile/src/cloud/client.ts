import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/** Where the sign-in is kept: this app's local storage only. */
export const AUTH_STORAGE_KEY = "levelup.auth";

let client: Promise<SupabaseClient> | null = null;

/**
 * The Supabase client, created on first use. The library (about 200 kB) is a separate chunk loaded only when it is needed: a
 * sign-in saved on this phone, or the learner signing in. A learner without an account never loads it. Creating the client
 * makes no network request.
 */
export function getSupabase(): Promise<SupabaseClient> {
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false,
        // PKCE: required by "Continue with Google" (the code that comes back through the deep link is useless without the verifier kept here).
        flowType: "pkce", storageKey: AUTH_STORAGE_KEY },
    }));
  return client;
}

/** Whether this phone holds a finished sign-in (not just a Google sign-in that was started). */
export function hasSavedSession(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Whether this phone keeps a sign-in (or a Google sign-in waiting for its deep link), read without loading the library. */
export function hasSavedSignIn(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null || localStorage.getItem(`${AUTH_STORAGE_KEY}-code-verifier`) !== null;
  } catch {
    return false; // storage blocked: nothing can have been saved
  }
}
