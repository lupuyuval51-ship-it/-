# Supabase: optional account + cloud backup for the Android app

Status: **live.** Project `levelup-app` (`yhxwgfgodxbzdvaqtqjz`, eu-central-1, free plan), created 2026-10-16 and used from app 1.16.0 on.
The three migrations in `migrations/` are applied, the edge function `functions/delete-account` is deployed (JWT required), the security
advisor was clean (no findings) and the RLS checks in `tests/rls_checks.sql` passed on it the same day. Google Play purchase verification
lives here too, next to the accounts: the edge function `functions/verify-purchase` and the table `play_purchases` (migration 4 below) are in the
repository and **deployed 2026-10-22** (migration applied, function version 1, JWT on, security advisor clean; it answers `503 NOT_CONFIGURED` until the owner adds the secret). Owner steps and secrets `PLAY_SERVICE_ACCOUNT_JSON` / `PLAY_PACKAGE_NAME`: `docs/play-release.md`, "Server-side purchase check").
The earlier project `level-up` (`dytftgtyugvzfumdcoep`) served app versions up to 1.15.0; its accounts and backups were not copied over (it had none) and it is paused.
LEVEL UP AI lives in a separate project, `levelup-ai` (`zfkjkbyzurhidhpkzpxr`, https://zfkjkbyzurhidhpkzpxr.supabase.co, eu-central-1): the Edge Function
`generate-game` (deployed 2026-10-17, `verify_jwt = false` because it checks the caller's **levelup-app** sign-in itself) and the table `ai_requests`
(`ai/migrations/`; one game at a time and a daily limit, only the service role can touch it). Details, secrets and how to redeploy: `functions/generate-game/README.md`.
The AI key goes only into that project's Edge Function secrets; without one the function answers `503 AI_UNAVAILABLE` and uses nothing. **The app does not call it yet.**

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
4. `20261021000000_play_purchases.sql`: `play_purchases` (verdicts of the Play purchase check: product, plan, valid, end date, SHA-256 of the token; owner-read-only, no insert/update/delete policy) and `claim_play_purchase` (atomic "first account to prove a token keeps it", executable only by the service role). Checked on a local Postgres with stand-ins for Supabase's roles: owner sees own rows, another account sees none, no write or function call from `authenticated`, bad hash/product refused, rows cascade on user delete. Run the Supabase security advisor after applying it.

After **every** schema or policy change: re-run the Supabase security advisor and fix any warning, run the checks in `tests/rls_checks.sql`, and keep this file, `docs/play-release.md`
(Data safety table) and `mobile/store/privacy-policy.md` in step.

`tests/rls_checks.sql` is a **manual** script (not part of `npm test` or CI): each block creates throw-away users, acts as the `authenticated` or `anon` role with forged claims and ends
with `RAISE EXCEPTION`, so everything rolls back. Run the blocks one by one in the SQL editor. The results recorded at the top of the file are from 2026-10-10 (project above); the
"cascade on user delete" check was never run.

**Policy impact** (already reflected in the privacy policy, the Play *Data safety* answers and `AGENTS.md`): for signed-in users the app is no longer "no data leaves the device".
Anything that changes what is sent (new columns, new tables) needs the same four updates: `mobile/store/privacy-policy.md`, the Play *Data safety* form, `connect-src` if the host changes,
and `AGENTS.md`.

Dashboard settings that cannot be done from the repository (confirm-email, Site URL, own SMTP before many sign-ups; password reset is not built in) are listed in `mobile/store/release-checklist.md`.
