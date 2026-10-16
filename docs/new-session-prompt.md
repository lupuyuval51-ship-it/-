# Prompt for a new Claude Code session — continue and build LEVEL UP

Paste everything below the line as the first message of a new Claude Code session that has the GitHub repository `lupuyuval51-ship-it/-` attached.

---

You are continuing an existing, working project: **LEVEL UP** (brand LUPU), a platform that turns any learning goal into a playable 3D educational game, with a website (Next.js) and an offline Android app (Vite + Capacitor, package `app.levelup.learn3d`). Do not start over and do not rewrite working parts.

## 1. Get the code and read it

1. Work on branch `claude/gifted-wozniak-y84up7` (fetch it; push only there; no pull requests unless I ask).
2. Read, in this order: `AGENTS.md` (enforced rules), `README.md` (commands and configuration), `docs/handover.md`, `docs/project-dna.md` (decisions and current state), `docs/play-release.md` (Android release checklist).
3. Current state: Android version 1.14.0 (versionCode 18), 201 topic-library topics (about a third of each category is Plus/Pro only), first-run questionnaire, bottom tab bar, English/Hebrew/Spanish interface, plans switched off (`PLANS_ENABLED=false`, shown as information only), no payments and no AI keys in the app.

## 2. Set up the environment

- Node 22 and `npm ci` (never delete `node_modules` while tests run; never `git clean`).
- PostgreSQL for the tests: `bash scripts/pg-local.sh start` (databases `levelup` and `levelup_test` on 127.0.0.1:54329).
- JDK 21 and the Android SDK in a scratch folder outside the repo: command-line tools, then `sdkmanager "platforms;android-36" "build-tools;36.0.0" "platform-tools"`, accept the licences, and export `ANDROID_HOME` to that folder. compileSdk/targetSdk are 36, minSdk 23.
- Chromium for Playwright is pre-installed; do not run `playwright install`.

## 3. Signing key (required for Google Play updates)

The release AAB must be signed with the **same upload key** as the versions already built. It is NOT in the repository. I will provide it through the environment settings (never in chat):
- `ANDROID_UPLOAD_KEYSTORE_B64` — the `.jks` file, base64-encoded
- `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_PASSWORD`, alias `upload`

Decode the key into a scratch folder outside the repo and write `android/keystore.properties` pointing to it (that file is git-ignored; never commit it, never print the passwords). If these variables are missing, stop before building the release and tell me — do not create a new key.

## 4. Check, build, deliver

1. `npm run check` (typecheck + lint + unit/integration) must pass.
2. `npm run test:e2e:mobile` must pass; for website changes also `npm run build` and `npx playwright test`.
3. Raise `versionCode` (19 or higher) and `versionName` in `android/app/build.gradle` for every new release.
4. Build: `npm run mobile:build && npx cap sync android && (cd android && ./gradlew bundleRelease --no-daemon)`.
5. Verify the AAB: `jarsigner -verify`, no secrets inside (scan the unzipped bundle), `npx vitest run tests/unit/android-shell.test.ts`.
6. Commit, push, then send me the AAB and a source zip made with `git archive` (it never contains the keystore or `.env`).

## 5. How to work with me

- Reply in Hebrew, singular address, short and clear.
- Never ask for secrets in chat; secrets go into the environment settings, and you only name the variable.
- Report honestly what was actually run; never present an unrun test as passed. Say "I did not check" when you did not.
- Keep the honest labels (nothing non-AI presented as AI); the AI is called "LEVEL UP AI" with no vendor or model name.
- Paid features in the Android app may only use Google Play Billing.

## 6. My task for this session

[Write the task here — for example: "Build the latest AAB and send it to me", or "Add Google Play Billing subscriptions for Plus and Pro".]
