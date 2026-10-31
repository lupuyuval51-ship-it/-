/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" shows "Continue with Google" in the account panel (the Google provider must be enabled in the Supabase dashboard; see src/cloud/google.ts). */
  readonly VITE_GOOGLE_AUTH?: string;
  /** "1" (together with VITE_GOOGLE_AUTH=1) asks for a Google sign-in before anything else (src/pages/GoogleGate.tsx). Off in a normal build. */
  readonly VITE_REQUIRE_GOOGLE?: string;
  /** The plans and prices (Settings → Plans, `#/plans`) are shown in a normal build; "0" hides them (see src/features.ts). */
  readonly VITE_SHOW_PLANS?: string;
  /** "1" brings back the questionnaire's plan step (country for prices, plan wanted) and the country in Settings, while the plans are shown. */
  readonly VITE_SETUP_PLAN?: string;
}
