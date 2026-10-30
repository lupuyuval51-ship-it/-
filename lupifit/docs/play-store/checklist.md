# Google Play launch checklist (LUPU-FIT device-mode Android app)

> **Status: draft, 2026-10-30.** Everything in this folder is a starting point for the owner, not legal
> advice. Play Console requirements change; confirm each item in the Console itself.

The app on Google Play is the **device-mode** app (`android/`, Capacitor): the app and its database run on the
phone. **No server, database or domain has to be hosted or paid for.** The only public web page needed is the
privacy policy (static files, any free static host). Owner's guide in Hebrew: `docs/device-mode-he.md`.

Files here: `listing-he.md`, `listing-en.md`, `data-safety.md`, `content-rating.md`,
`health-declaration.md`, `target-audience.md`, `screenshots/` (6 phone screenshots, 1080×1920, Hebrew,
dark), `icon-512.png` (512×512, 32-bit PNG, full square), `feature-graphic-he.png` /
`feature-graphic-en.png` (1024×500, 24-bit PNG). Regenerate the images with
`scripts/play-store-assets.mjs` (instructions at the top of the script).

## A. Decide or fix before launch

- [ ] **Dish photos:** their source and licence are unknown (`docs/dishes-source.md`). Confirm or replace
      them before a public release (they are inside the app). Until then do not upload
      `screenshots/05-daily-menu.png`.
- [ ] **Legal texts:** fill every `[placeholder]` in `client/src/i18n/locales/he/legal.ts` and `en/legal.ts`
      (operator name, address, contact email, how changes are announced; the device-mode texts are under
      `device`), have a lawyer review them (Israeli Privacy Protection Law incl. Amendment 13; GDPR if EU users),
      then remove the draft notice in `client/src/features/legal/LegalDocument.tsx` and
      `client/src/features/legal/staticSite.ts`, and update `LEGAL_UPDATED` in `client/src/features/legal/documents.ts`.
      The texts ship inside the app: rebuild after any change.
- [ ] **Public privacy-policy page:** `npm run legal:static` → upload `dist/legal/` to a free static host
      (GitHub Pages, Netlify, Cloudflare Pages …). Check `…/privacy.html`, `…/terms.html` and
      `…/account-deletion.html` open in a private browser window, in Hebrew and English (`…/en/…`).
- [ ] **Parental consent (13–17):** the app does not collect it. Decide with a lawyer whether a consent step
      is needed (see `target-audience.md`).
- [ ] **Android 7–8 backups:** on those versions Android's cloud backup of the app's data (if the person turned
      backup on) is not end-to-end encrypted (`docs/android.md`). The privacy policy says so. Decide whether to keep
      it or to turn backup off below Android 9.
- [ ] **Camera barcode scanning:** the app has no camera permission; if the phone's WebView offers barcode
      detection, the scan button appears and fails (`docs/android.md`, "Known gaps"). Hide it or add the
      permission (and update the privacy texts and `data-safety.md`) before launch.
- [ ] **Open Food Facts:** keep the attribution (Open Database License) in the terms; consider showing "Data:
      Open Food Facts" next to barcode results.

## B. Build and test the release

- [ ] Raise `versionCode` in `android/version.properties` (it must be higher than every build already uploaded
      for `com.lupufit.app`, including the old TWA build, versionCode 1).
- [ ] `./android/build-release.sh --out <folder>` with the upload key in `LUPUFIT_KEYSTORE` and its password in
      `LUPUFIT_KEYSTORE_PASSWORD_FILE` (`docs/android.md`). Keep the keystore and the password backed up in two
      safe places; never commit them.
- [ ] **Test the APK on a real phone** (`LUPU-FIT-device.apk`, installed directly): the list in `docs/android.md`,
      "Testing on a real phone before a release" (first launch, airplane mode, restart, reminders, backup file and
      restore, update over an older version). Nothing has been run on a phone yet.
- [ ] A phone that has the directly installed APK cannot take the Play version over it (different signing keys
      with Play App Signing): save a backup file, uninstall, install from Play, restore.

## C. Play Console

- [ ] **Developer account:** pay the registration fee and complete identity verification (organisation
      accounts need a D-U-N-S number). New **personal** accounts must run a **closed test with at least 12
      testers opted in for at least 14 days in a row** before they can apply for production access.
- [ ] **Create the app:** default language Hebrew (he-IL), app (not game), free or paid, accept the
      declarations.
- [ ] **Signing:** use Play App Signing. The first upload registers the upload key; keep it safe (losing it means
      a key-reset request).
- [ ] **Upload** `LUPU-FIT-device.aab` to the internal testing track first, then the closed test (testers install
      from Play), then production after access is granted.
- [ ] **Store listing:** texts from `listing-he.md` (default) and `listing-en.md`; icon; feature graphic;
      2–8 phone screenshots; category **Health & Fitness**; a public contact email; website optional; privacy
      policy URL from section A.
- [ ] **App content:**
  - Privacy policy URL: `https://<static host>/privacy.html`.
  - Ads: no ads.
  - App access: **all functionality is available without special access** (no sign-in).
  - Content rating: `content-rating.md`.
  - Target audience: `target-audience.md`.
  - Data safety: `data-safety.md`, Part 1 (device mode).
  - Account deletion: the app has no accounts; answer so in Data safety. Only if the Console still asks for a
    URL: `https://<static host>/account-deletion.html`.
  - Health apps declaration: `health-declaration.md`.
  - Advertising ID: the app does not use it (the merged manifest has no `AD_ID` permission; `build-release.sh`
    prints the permissions).
  - News app: no. Government app: no. Financial features: none.
- [ ] **Production release:** staged rollout; watch Android vitals and reviews.

## D. After launch

- [ ] Every update: raise `versionCode`, build, test the upgrade over the previous version on a phone (data must
      stay; migrations run once), upload.
- [ ] Never edit an applied database migration (it would stop the app on every phone that ran it).
- [ ] Keep the legal texts, the static legal pages and `data-safety.md` in step with the code: anything new that
      the app stores or sends off the phone changes them.
- [ ] Re-run `scripts/play-store-assets.mjs` after visible UI changes.

## Hosted mode only (`android-twa/`, needs the server)

Not needed for the device-mode app. Only if the website app becomes the listing (see `docs/android-twa.md`):

- [ ] Production server: HTTPS domain; `NODE_ENV=production`, `APP_URL=https://<domain>`, `SESSION_SECRET`
      (32+ random characters), `DATABASE_URL`, `TRUST_PROXY=true` behind a proxy; database backups with a known
      retention (write it into the privacy policy); encryption at rest is up to the hosting provider.
- [ ] Password-reset email is not delivered in production: plug a provider into `server/src/lib/mailer.ts`
      (`setMailTransport`) and name it in the privacy policy, or remove the "Forgot your password?" line on
      `/account-deletion`.
- [ ] AI on or off (`AI_API_KEY`): if on, Play's AI-Generated Content policy requires an in-app report button for
      AI output (there is none yet), and the AI parts of the privacy policy and the listing apply.
- [ ] Web push reminders need `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`; test on a real phone.
- [ ] Under-13 accounts: registration does not ask the age; onboarding rejects ages under 13 but the account
      (name, email, password hash) remains.
- [ ] Digital Asset Links: `ANDROID_APP_PACKAGE` / `ANDROID_CERT_SHA256` on the server (`docs/android-twa.md`).
- [ ] Deletion requests from people who cannot sign in: verify the requester, then run
      `node dist/server/db-cli.js delete-account <email> --yes`.
- [ ] Data safety: `data-safety.md`, Part 2; App access: a reviewer account that completed the questionnaire.
