# Supabase: optional account + cloud backup for the Android app

Status: **live.** Project `levelup-app` (`yhxwgfgodxbzdvaqtqjz`, eu-central-1, free plan), created 2026-10-16 and used from app 1.16.0 on.
The three migrations in `migrations/` are applied, the edge function `functions/delete-account` is deployed (JWT required), the security
advisor was clean (no findings) and the RLS checks in `tests/rls_checks.sql` passed on it the same day. Google Play purchase verification will
live here too, next to the accounts (`PLAY_SERVICE_ACCOUNT_JSON` in this project's Edge Function secrets).
The earlier project `level-up` (`dytftgtyugvzfumdcoep`) served app versions up to 1.15.0; its accounts and backups were not copied over (it had none) and it is paused.
A separate, still empty project `levelup-ai` (`zfkjkbyzurhidhpkzpxr`, https://zfkjkbyzurhidhpkzpxr.supabase.co, eu-central-1) is reserved for
LEVEL UP AI in the app: an Edge Function there would hold the AI provider key in its secrets (never in the app). Nothing in the app talks to it yet.
It does not know the users of `levelup-app`, so a function there must verify the caller's `levelup-app` sign-in before doing any work.

What it does (the app keeps working offline; sign-in is optional):
- E-mail sign-in (Supabase Auth). Games, play progress and the review deck are backed up per user and synced between phones
  (last write wins by `updated_at`; deletions sync through `deleted_at`). The client is `mobile/src/cloud`, the sync logic is `src/lib/offline/sync.ts`.
- Only the project URL and the public *publishable* key are shipped in the app (`mobile/src/cloud/config.ts`). All tables (`games`, `sessions`, `deck_cards`) are owner-only
  through row level security. A secret or service-role key must never be added to the app or to this repository (`tests/unit/source-hygiene.test.ts` fails on secret-shaped literals).
- Signed out, the app makes no network request (tested). The CSP `connect-src` in `mobile/index.html` lists exactly `'self'` and the project URL, never `*`
  (`tests/unit/android-shell.test.ts`).
- **Account deletion** is the edge function `delete-account` (it checks the caller's JWT, then deletes the user with the Auth admin API using the service-role key that
  Supabase injects into the function's environment). Deleting from `auth.users` through the SQL endpoint hung on this project, which is why it is not done that way.

Migrations (apply in order; schema changes always go through `migrations/`, never by hand in the dashboard):
1. `20261010000000_levelup_sync.sql`: the three tables, constraints (spec size, session status), owner-only policies, server-stamped `updated_at`.
2. `20261010000001_deck_cards_mastered.sql`: a mastered review card stays, flagged, so another phone does not bring it back.
3. `20261010000002_sessions_finished_at.sql`: the real finish time, so results look the same on every phone.

After **every** schema or policy change: re-run the Supabase security advisor and fix any warning, run the checks in `tests/rls_checks.sql`, and keep this file, `docs/play-release.md`
(Data safety table) and `mobile/store/privacy-policy.md` in step.

`tests/rls_checks.sql` is a **manual** script (not part of `npm test` or CI): each block creates throw-away users, acts as the `authenticated` or `anon` role with forged claims and ends
with `RAISE EXCEPTION`, so everything rolls back. Run the blocks one by one in the SQL editor. The results recorded at the top of the file are from 2026-10-10 (project above); the
"cascade on user delete" check was never run.

**Policy impact** (already reflected in the privacy policy, the Play *Data safety* answers and `AGENTS.md`): for signed-in users the app is no longer "no data leaves the device".
Anything that changes what is sent (new columns, new tables) needs the same four updates: `mobile/store/privacy-policy.md`, the Play *Data safety* form, `connect-src` if the host changes,
and `AGENTS.md`.

Dashboard settings that cannot be done from the repository (confirm-email, Site URL, own SMTP before many sign-ups; password reset is not built in) are listed in `mobile/store/release-checklist.md`.
