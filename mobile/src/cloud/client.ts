import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/** Created once; makes no network request until the user signs in. The session is kept in this app's local storage only. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false,
    // PKCE: required by "Continue with Google" (the code that comes back through the deep link is useless without the verifier kept here).
    flowType: "pkce", storageKey: "levelup.auth" },
});
