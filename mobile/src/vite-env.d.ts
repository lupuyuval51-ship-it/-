/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" shows "Continue with Google" in the account panel (the Google provider must be enabled in the Supabase dashboard). */
  readonly VITE_GOOGLE_AUTH?: string;
}
