# Supabase (planned): optional account + cloud backup for the Android app

Status: **schema written, project not created yet.** Creating a Supabase project is a billing-relevant action that has to be
approved by the account owner (the free plan costs nothing; Supabase shows the price before creation).

Planned scope (the app keeps working offline, sign-in is optional):
- E-mail sign-in (Supabase Auth). Games, play progress and the review deck are backed up per user and synced between phones
  (last write wins by `updated_at`; deletions sync through `deleted_at`).
- Only the public *publishable* key is shipped in the app. All tables are owner-only through row level security.
- **Policy impact:** the app stops being "no data leaves the device" for signed-in users. Before publishing a version with sync:
  update `mobile/store/privacy-policy.md`, the Play *Data safety* form (e-mail address, user content: games and progress;
  encrypted in transit; users can request deletion), `connect-src` in `mobile/index.html` (add exactly the project URL, never `*`)
  and `AGENTS.md`.

Apply `migrations/20261010000000_levelup_sync.sql` to the project, then run Supabase's security advisor and fix any warning.
