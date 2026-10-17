/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" shows "Continue with Google" in the account panel (the Google provider must be enabled in the Supabase dashboard). */
  readonly VITE_GOOGLE_AUTH?: string;
  /** "1" shows the plans and prices again (see src/features.ts). */
  readonly VITE_SHOW_PLANS?: string;
  /** "1" lets a subject without notes make a demo-template game again (see src/features.ts). */
  readonly VITE_DEMO_GAMES?: string;
}
