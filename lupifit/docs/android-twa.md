# LUPU-FIT for Android, hosted mode (Trusted Web Activity, `android-twa/`)

> This is **not** the app that ships today. The Android app on Google Play is the **device-mode** app
> (`android/`, Capacitor, no server needed): see [android.md](android.md) and [device-mode.md](device-mode.md).
> This project stays for the day the hosted website (server + PostgreSQL) is used instead.

A small native shell that opens the LUPU-FIT **website** full screen in the phone's browser engine (Chrome
Custom Tabs / Trusted Web Activity). All features, updates and data live on the website, so the site must be
deployed on a public HTTPS domain first. Accounts, AI (when the server has a key) and Web Push reminders work
as on the website.

Both Android projects use the package id `com.lupufit.app`, so only one of them can be the Google Play listing
at a time. Publishing this one as an update of the device-mode listing would replace the device app on people's
phones, and their data (stored inside the device app) would not move to the website. To publish both, give
this one its own package id in `android-twa/twa.properties` (and its own Play listing).

## What is in `android-twa/`
- `twa.properties`: domain (`host`), start path, package id (`com.lupufit.app`), name, version.
  The committed host `lupu-fit.example` is a **placeholder** (the `.example` domain can never exist).
- `app/src/main/AndroidManifest.xml`: launcher, links to the site open in the app (verified),
  splash screen (black with the logo), notification delegation (web push from the site appears as
  LUPU-FIT notifications; Android 13+ asks for permission), portrait, Custom Tab fallback.
- Icons are generated from `client/public/icon-*.png` (adaptive icon, round icon, white notification icon).
- `build-aab.sh`: builds a signed `.aab`. Gradle wrapper included (Gradle 8.14.3, AGP 8.13.2,
  compile/target SDK 36, min SDK 24).

## Steps to publish
1. Deploy the web app (server + PostgreSQL) on your domain over HTTPS, e.g. `app.your-domain.com`.
   Step-by-step guides (Hebrew): [deploy-oracle.md](deploy-oracle.md) (one free VM with Docker Compose, Caddy
   and automatic HTTPS; `deploy/oracle/setup.sh`) or [deploy-render.md](deploy-render.md) (Render + Neon). The
   host is baked into the app, so prefer a domain you own over a free `…sslip.io` / `…onrender.com` name
   before publishing to Google Play.
2. The upload key: the same one signs both Android projects. To create one (once; keep it forever, losing it
   means asking Google to reset it):
   `LUPUFIT_KEYSTORE_PASSWORD=... ./android-twa/build-aab.sh --create-keystore ~/lupufit-upload.jks`
3. Build: `LUPUFIT_KEYSTORE=~/lupufit-upload.jks LUPUFIT_KEYSTORE_PASSWORD=... ./android-twa/build-aab.sh --host app.your-domain.com --fetch-sdk`
   Raise `--version-code` for every upload; it must be higher than every versionCode already uploaded for the
   package, **including device-mode builds** (`android/version.properties`, which starts at 2).
4. Upload `android-twa/app/build/outputs/bundle/release/app-release.aab` to Play Console (internal testing
   first), with Play App Signing enabled.
5. On the server set `ANDROID_APP_PACKAGE=com.lupufit.app` and
   `ANDROID_CERT_SHA256=<upload key SHA-256>,<app signing key SHA-256>` (the second one is in Play Console >
   Test and release > App integrity). Check `https://app.your-domain.com/.well-known/assetlinks.json` returns
   both. Without it the app shows an address bar. With the Oracle kit, put Play's fingerprint in
   `deploy/oracle/.env` as `ANDROID_PLAY_CERT_SHA256` and run `docker compose up -d` (the upload key's
   fingerprint is already in `ANDROID_CERT_SHA256`); on Render add `ANDROID_PLAY_CERT_SHA256` in the Dashboard.

## Play Console for hosted mode
The store texts and forms in `docs/play-store/` are written for the device-mode app. For this app use the
hosted-mode parts: the "Hosted mode" section of `data-safety.md` (accounts, server storage, optional AI and
Web Push), the website's own legal pages (`https://<domain>/privacy`, `/terms`, `/account-deletion`: the server
build shows the hosted-service texts), reviewer sign-in details under "App access", and the server items of
`checklist.md` ("Hosted mode only").

## Not verified here
The bundle was built and its signature and merged manifest were checked in a Linux container. It was not
installed on a phone or emulator, and it cannot open a real site until step 1 is done.
