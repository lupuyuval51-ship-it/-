# LEVEL UP — offline Android app (Google Play)

The phone app runs **without any server**. It reuses the website's game code (`src/`): the 3D runtime, challenges, the
study engine and demo templates, and the very same game reducer the server uses (`processEvent`), here running on the
device through `src/lib/offline/store.ts`. Games and progress are kept in the app's local storage.

Phone-only features:
- **Review my mistakes** (`src/lib/offline/deck.ts`): every question missed in any game goes into one deck with spaced
  repetition (Leitner boxes: right on the first try → back in 1, 3, 7, 16 days, then mastered; a miss → back to box 1).
- **Android back button** (`@capacitor/app`): in a game it closes the open panel, then pauses, then leaves; elsewhere it goes
  back a screen, and from the library the app moves to the background (what Android 12+ does for any root launcher activity).
- **Vibration** (`@capacitor/haptics`) on right/wrong answers, pickups, gates and missions; switch off in Settings.

- **Optional account + cloud backup** (Supabase): e-mail sign-in in Settings; games, progress and the review deck are pushed and
  pulled automatically (on start, when the app comes back, 15 s after a change, when back online). Last write wins; a deleted game
  stays deleted on every phone. Signed out, nothing is sent. Details and dashboard settings: `supabase/README.md`,
  `mobile/store/release-checklist.md`.

What is different from the website (by design):
- No Stripe and no AI providers (a secret key cannot live in an app); the account is optional and only for backup/sync. Games come from the **study engine** (your
  notes) or **demo templates**, and are labelled that way.
- Answer keys are on the device, so scores are for self-practice, not for anything that must be cheat-proof.
- Graphics tier A/B/C is a Settings choice for the phone's power. Default: B, or A on phones that report ≥ 6 GB RAM and ≥ 8 cores.
- The *feature* tier (what a game may contain: C = 40 %, B = 70 %, A = 100 % of the game features, see `src/config/plans.ts`) is enforced on the
  device too (`generateOffline(…, tier)` refuses what the tier lacks and clamps the rest). The tier comes from `src/lib/offline/entitlement.ts`,
  which stays at the full tier A for every install until Google Play Billing supplies a purchased plan. Games made on a phone are fitted to a touch
  screen (`fitForDevice`: less walking, easier jumps, never a change to challenges, answers, missions or bosses).
- Version 1 is free. Google Play does not allow Stripe for in-app digital goods; paid features later need **Google Play
  Billing** (products created in your Play Console).

## Build

Needs Node 20+, **JDK 21** (Capacitor 7 generates Java 21 settings; JDK 17 will not build it), Android SDK (platform 36, build-tools 36) with `ANDROID_HOME` set.

```bash
npm install
npm run mobile:build          # web bundle → mobile/dist
npx cap sync android          # copy it into the Android project
cd android
./gradlew bundleRelease       # → app/build/outputs/bundle/release/app-release.aab (upload this to Play)
./gradlew assembleRelease     # → app/build/outputs/apk/release/app-release.apk (install on your phone to try)
```

Release signing reads `android/keystore.properties` (not committed):

```
storeFile=/absolute/path/levelup-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Keep the `.jks` file and the password safe and private. With **Play App Signing** (default for new apps) this is only
the *upload* key; Google holds the app-signing key, and a lost upload key can be reset through Play Console support.

The release build is shrunk with R8 (code and resources) and has no Android backup, no cleartext traffic and only the `INTERNET` and `VIBRATE` permissions. Everything about the Play release — target API level, privacy settings and why, Data safety answers, what needs you, and the checks to run on the built AAB — is in [`docs/play-release.md`](../docs/play-release.md).

Before the first upload, decide the package name: `appId` in `capacitor.config.ts` and `namespace`/`applicationId` in
`android/app/build.gradle` (currently `app.levelup.learn3d`). It can never change after the first upload. Increase
`versionCode` in `android/app/build.gradle` for every new upload.

## Test

```bash
npm run test:e2e:mobile       # Playwright on a Pixel 7 viewport against the built bundle, network blocked
npx vitest run --project unit tests/unit/offline.test.ts tests/unit/android-shell.test.ts   # store/reducer, and the guards on manifest, CSP, permissions, target API
```
`npm run mobile:dev` serves the web part with Vite for quick UI work. The unit tests that read `android/` and `mobile/index.html` (`android-shell.test.ts`) must be kept in
step with `docs/play-release.md` whenever you change either.

Icons and store graphics: `python3 mobile/make-icons.py` (writes launcher icons and `mobile/store/*.png`).
Store text and Play Console answers: `mobile/store/listing.md`. Privacy policy: `mobile/store/privacy-policy.md`.

**Google sign-in (optional).** Build with `VITE_GOOGLE_AUTH=1 npm run mobile:build` to show "Continue with Google" in the account panel; without the flag nothing about it is in the UI. Setup (Google client, Supabase provider, redirect URL `app.levelup.learn3d://auth`): `docs/google-signin.md`.
