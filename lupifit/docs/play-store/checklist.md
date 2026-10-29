# Google Play launch checklist (LUPU-FIT as a Trusted Web Activity)

> **Status: draft, 2026-10-29.** Everything in this folder is a starting point for the owner, not legal
> advice. Play Console requirements change; confirm each item in the Console itself.

Files here: `listing-he.md`, `listing-en.md`, `data-safety.md`, `content-rating.md`,
`health-declaration.md`, `target-audience.md`, `screenshots/` (6 phone screenshots, 1080×1920, Hebrew,
dark), `icon-512.png` (512×512, 32-bit PNG, full square), `feature-graphic-he.png` /
`feature-graphic-en.png` (1024×500, 24-bit PNG). Regenerate the images with
`scripts/play-store-assets.mjs` (instructions at the top of the script).

## A. Fix or decide before launch (found in the code)

- [ ] **Dish photos:** their source and licence are unknown (`docs/dishes-source.md`). Confirm or replace
      them before a public release. Until then do not upload `screenshots/05-daily-menu.png`.
- [ ] **Password-reset email is not delivered in production:** no email provider is bundled
      (`server/src/lib/mailer.ts` only logs a warning). Plug one in with `setMailTransport`, name it in the
      privacy policy, or remove the "Forgot your password?" line on `/account-deletion`.
- [ ] **Legal texts:** fill every `[placeholder]` in `client/src/i18n/locales/he/legal.ts` and `en/legal.ts`
      (operator name, address, contact email, hosting provider and region, log and backup retention, AI
      provider terms, days to handle deletion requests), have a lawyer review them (Israeli Privacy
      Protection Law incl. Amendment 13; GDPR if EU users), then remove the draft notice in
      `client/src/features/legal/LegalDocument.tsx` and update `LEGAL_UPDATED`.
- [ ] **AI on or off in production?** Only with `AI_API_KEY` set does the coach call Anthropic and does
      meal-photo analysis exist.
  - If **on**: Play's AI-Generated Content policy requires users to be able to report offensive AI output
    in the app; **there is no report button yet**. Also confirm the provider's data-retention and data-use
    terms for your account, fill the AI placeholders in the privacy policy, and use the AI variants in the
    listings and `data-safety.md`.
  - If **off**: the coach page heading still says "AI coach" / "מאמן AI" (an e2e spec checks that text) and
    the built-in-mode banner tells end users to "configure an AI provider"; consider changing both.
- [ ] **Under-13 accounts:** registration does not ask the age; onboarding rejects ages under 13 but the
      account (name, email, password hash) remains. Consider asking the age at registration or deleting the
      account when onboarding refuses it.
- [ ] **Parental consent (13–17):** the app does not collect it. Decide with a lawyer whether a consent step
      is needed (see `target-audience.md`).
- [ ] **Reminders only work while the app is open** (no push server). Do not advertise reminders, or add push
      notifications later.
- [ ] **Encryption at rest** is up to the hosting provider (the app does not encrypt stored data itself).
      Choose a host with encrypted disks and backups and describe it in the privacy policy.
- [ ] **Open Food Facts:** set `OPENFOODFACTS_USER_AGENT` to include a contact, and keep the attribution
      (Open Database License) in the terms; consider showing "Data: Open Food Facts" next to barcode results.

## B. Production server

- [ ] HTTPS domain (required for a TWA); `NODE_ENV=production`, `APP_URL=https://<domain>`,
      `SESSION_SECRET` (32+ random characters), `DATABASE_URL`, `TRUST_PROXY=true` behind a proxy.
- [ ] Database backups with a known retention (write it into the privacy policy).
- [ ] Check the public pages load signed out: `https://<domain>/privacy`, `/terms`, `/account-deletion`
      (the server's SPA fallback serves them on direct load).
- [ ] Deletion requests from people who cannot sign in: verify the requester, then run
      `node dist/server/db-cli.js delete-account <email> --yes` within the period the deletion page promises.

## C. Play Console

- [ ] **Developer account:** pay the registration fee and complete identity verification (organisation
      accounts need a D-U-N-S number). Note the account type: new **personal** accounts must run a
      **closed test with at least 12 testers opted in for at least 14 days in a row** before they can apply
      for production access.
- [ ] **Create the app:** default language Hebrew (he-IL), app (not game), free or paid, accept the
      declarations.
- [ ] **Signing:** use Play App Signing. Keep the upload keystore of the TWA project safe (losing it means
      a key-reset request). Copy the **SHA-256 of the app signing key** from Play Console › App integrity
      (and of the upload key, for local test builds).
- [ ] **Digital Asset Links:** publish `https://<domain>/.well-known/assetlinks.json` with the TWA package
      name and both SHA-256 fingerprints. In this repo the file belongs in
      `client/public/.well-known/assetlinks.json` (Vite copies it to `dist/client`; the server serves
      dot-directories). Without it the app shows a browser address bar. If the file is missing, the SPA
      fallback answers with the HTML shell instead of a 404, so check that the URL returns JSON.
- [ ] **TWA build:** current Play target API level (it rises every year), package name, start URL `/`,
      splash and theme colour `#0b0b0d`, notification delegation if reminders should show notifications.
- [ ] **Store listing:** texts from `listing-he.md` (default) and `listing-en.md`; icon; feature graphic;
      2–8 phone screenshots; category **Health & Fitness**; a public contact email; website; privacy policy
      URL `https://<domain>/privacy`.
- [ ] **App content:**
  - Privacy policy URL.
  - Ads: no ads.
  - App access: sign-in required; give reviewers a test account that has completed the questionnaire.
  - Content rating: `content-rating.md`.
  - Target audience: `target-audience.md`.
  - Data safety: `data-safety.md`; account deletion URL `https://<domain>/account-deletion`.
  - Health apps declaration: `health-declaration.md`.
  - Advertising ID: the app does not use it (make sure the TWA build does not add the `AD_ID` permission).
  - News app: no. Government app: no. Financial features: none.
- [ ] **Testing tracks:** internal testing first, then the closed test (12+ testers, 14 days for new
      personal accounts), fix what testers report, then apply for production access.
- [ ] **Production release:** staged rollout; watch Android vitals and reviews.

## D. After launch

- [ ] Keep `/privacy`, `/terms`, `/account-deletion` and `data-safety.md` in step with the code; any new
      table with user data must be added to the export and covered by the deletion test.
- [ ] Re-run `scripts/play-store-assets.mjs` after visible UI changes.
