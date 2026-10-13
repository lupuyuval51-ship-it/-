# Sign in with Google: owner steps

LEVEL UP has "Continue with Google" in two places. Both are **off until you configure them**, so nothing changes (and nothing
breaks) until you have created Google credentials.

| Where | How it works | What switches it on |
|---|---|---|
| **Website** | Our own server flow: OAuth 2.0 Authorization Code + PKCE + nonce. `GET /api/auth/google/start`, `GET /api/auth/google/callback`. | `GOOGLE_CLIENT_ID` **and** `GOOGLE_CLIENT_SECRET` set in the server environment |
| **Android app** (optional cloud account) | Supabase Auth's Google provider, opened in the system browser, back through `app.levelup.learn3d://auth` | `VITE_GOOGLE_AUTH=1` at `npm run mobile:build` **and** the Google provider enabled in the Supabase dashboard |

You need **two OAuth clients** in Google Cloud (one per place), because the redirect URI of the website and the one of Supabase
differ and the two secrets must live in different places (the website's in your server environment, the app's only in the
Supabase dashboard). Never put a client secret in the app or in `NEXT_PUBLIC_*`.

## 1. Google Cloud Console (once)

1. <https://console.cloud.google.com/> → create or choose a project (e.g. "LEVEL UP").
2. **Google Auth Platform → Branding** (older UI: *APIs & Services → OAuth consent screen*):
   - User type **External**.
   - App name `LEVEL UP`, user support email, developer contact email.
   - Authorised domain: your site's domain (e.g. `levelup.example`), and the **privacy policy** link (the site's policy page or
     the hosted `mobile/store/privacy-policy.md`).
3. **Data Access** (scopes): add only `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. These are the non-sensitive
   scopes, so no Google verification review is needed.
4. **Audience**: while the publishing status is **Testing**, only the **test users** you list there (up to 100) can sign in. Add
   your own Google account and the accounts of whoever tests. When you are ready for everyone, press **Publish app** (**In
   production**). With only the three scopes above no verification is required.

## 2. Website

1. **Google Auth Platform → Clients → Create client** → Application type **Web application**, name `LEVEL UP web`.
2. **Authorised redirect URIs** (exact match, no trailing slash, `https` in production):
   - `<APP_URL>/api/auth/google/callback`, e.g. `https://levelup.example/api/auth/google/callback`
   - for local testing also `http://localhost:3000/api/auth/google/callback` (Google allows `http://localhost`).
   Leave *Authorised JavaScript origins* empty (the flow never runs in the browser).
3. Copy the **Client ID** and **Client secret** into the server environment (see `.env.example`):

   ```
   GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```

   `APP_URL` must be the public URL: the redirect URI is always built from it, never from request headers, and in production it
   must be `https://`. Restart the server. Set both or neither; with only one set the feature stays off.
4. Run the database migration `20261013150000_auth_identity` (`npx prisma migrate deploy`) before turning it on.

The login and register pages ("Sign in with LUPU ID" / "Create your LUPU ID") now show "Continue with Google" under the form; the account page shows **Connected sign-in
methods**.

## 3. Android app (Supabase)

1. In Google Cloud create a second client: **Web application**, name `LEVEL UP via Supabase`. Authorised redirect URI:
   `https://dytftgtyugvzfumdcoep.supabase.co/auth/v1/callback` (the project URL from `mobile/src/cloud/config.ts` + `/auth/v1/callback`).
2. Supabase dashboard → **Authentication → Sign In / Providers → Google**: enable, paste that client's ID and secret. Leave
   "Skip nonce checks" off.
3. Supabase dashboard → **Authentication → URL Configuration → Redirect URLs**: add `app.levelup.learn3d://auth`.
4. Build the app with the flag: `VITE_GOOGLE_AUTH=1 npm run mobile:build`, then `npx cap sync android` and the usual Gradle
   build (see `docs/play-release.md`). The manifest already has the intent filter for `app.levelup.learn3d://auth`.
5. Re-run the Supabase security advisor (nothing in `supabase/` changed, but providers did).

A Google user in Supabase is a normal `auth.users` row, so row-level security, the `delete-account` function and the owner-only
tables work unchanged. Supabase matches a Google sign-in to an existing e-mail/password user with the **same verified e-mail**
(its default "link accounts with the same email" behaviour); that is Supabase's account model, separate from the website's rule below.

## 4. How it behaves (website)

- **New e-mail**: an account is created from the verified Google e-mail. It has no password (`passwordHash = "!"`, which can never
  match), the Free plan, a private profile, the language of the current page, no region (the user can pick one on the account page).
  Google gives us no age, so there is nothing to weaken: registration here never asked for it either.
- **Same Google account again**: signs in (looked up by Google's stable `sub`, never by e-mail).
- **E-mail already has an account** (password): **not** merged. The user is sent back to the login page with a message to sign in
  with the password and then press **Connect Google** on the account page. This prevents anyone who controls a Google address
  from taking over an existing account.
- **Unverified Google e-mail** (`email_verified` not `true`): refused.
- **Connected sign-in methods** (account page): connect/disconnect Google. The last way to sign in can never be removed (the server
  answers 409 `LAST_SIGN_IN_METHOD`).
- **Deleting a Google-only account**: there is no password to confirm with, so the user presses **Confirm with Google**, picks the
  Google account again, and for 5 minutes *that session* may delete the account. The Google account must be the linked one.
  Accounts that have a password always need the password.
- Failures never explain themselves: the user lands on the login page with one of a few fixed messages; details go to the server log
  as a code only.

Trust model (documented in `src/server/auth/google/protocol.ts`): the server exchanges the code at Google's token endpoint over
TLS with the client secret and the PKCE verifier and reads the claims from that response (OpenID Connect Core 3.1.3.7 permits
skipping the JWT signature check for this case). It still checks `iss`, `aud`, `exp`, `nonce`, `sub` and `email_verified`. The
`state`, verifier and nonce live in a 10-minute, HttpOnly, SameSite=Lax cookie (`Secure` in production) that is HMAC-sealed with a
key derived from the client secret, so a planted cookie is rejected.

## 5. How to test

Automated (no Google needed; a fake Google is injected):

```
npx vitest run --project unit tests/unit/google-protocol.test.ts tests/unit/google-mobile.test.ts tests/unit/android-shell.test.ts
npx vitest run --project integration tests/integration/google-signin.test.ts
```

By hand, website: set the two variables, start the server, open `/login`, press **Continue with Google**, sign in with a **test
user**. Then: sign in again (same account); register an e-mail/password account and try Google with the same address (must be
refused with the "sign in with your password, then connect Google" message); connect Google on `/account`; disconnect; with a
Google-only account try to delete the account.

By hand, app: build with `VITE_GOOGLE_AUTH=1`, install on a phone, Settings → Account → **Continue with Google**. The system
browser opens, you choose the account, the browser returns to the app and the account panel shows "Signed in as ...". Also check:
cancel in the browser (the app shows "cancelled"), and that with no sign-in the app still makes no network request.

Not verifiable without real Google credentials and a device: the redirect URI registration, the consent screen, the browser
hand-off on a real Android version, and the deep link on OEM browsers.

## 6. Privacy policy and Play Data safety (done in the repo; you publish them)

Google sign-in collects the user's **e-mail address** and **name** (and Google's account id, which we store as a pseudonymous user
id). Updated:

- `mobile/store/privacy-policy.md` (English and Hebrew): the optional account may be created with Google; what we receive.
- `docs/play-release.md` section 5: Data safety table (Name added; e-mail/User IDs now also via Google).
- The website has no separate policy page in the repo (the footer states no chat and no location tracking and does not describe
  data collection). When you publish a website privacy policy, include the same paragraph: Google sign-in is optional, we receive the
  e-mail, name and Google account id, nothing else, no contacts, no calendar, no Google API access after sign-in (we do not keep
  Google tokens), and the data is deleted with the account.
- In **Google Cloud → Branding** use the same privacy policy URL; in **Play Console → Data safety** re-submit the form as in
  `docs/play-release.md`.

We request no Google API scopes beyond sign-in and store no Google access or refresh token (the website discards the token
response after reading the ID token; Supabase manages its own session for the app).

## 7. Rotating or removing

- Rotate the secret: create a new one in Google Cloud, change `GOOGLE_CLIENT_SECRET`, restart. The sealed state cookies in flight
  (10 minutes) stop working, which only means those sign-ins have to be started again.
- Turn the website feature off: unset either variable. Google-only users then cannot sign in (they have no password, and setting
  one is not built yet, see "Known gaps") until it is back, so tell them first.
- Turn the app feature off: build without `VITE_GOOGLE_AUTH`; existing Supabase Google users keep their session until it expires.

## Known gaps

- A Google-only website account cannot set a password and therefore cannot disconnect Google.
- Re-authentication for deletion relies on Google's account chooser (`prompt=select_account`); Google does not document forcing a
  password prompt, so a stolen *unlocked* browser profile with a live Google session could pass it. Password accounts are not affected.
- The app opens Supabase's page with a plain navigation to the system browser instead of a Chrome Custom Tab (that needs the
  `@capacitor/browser` plugin; `openExternal` in `mobile/src/cloud/google-native.ts` is the one line to change).
- There is no audit log in the codebase yet, so sign-ins are not recorded beyond the session row.
