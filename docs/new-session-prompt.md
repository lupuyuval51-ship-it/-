# Prompt for a new Claude Code session — continue and build LEVEL UP

Paste everything below the line as the first message of a new Claude Code session that has the GitHub repository `lupuyuval51-ship-it/-` attached.

---

You are continuing an existing, working project: **LEVEL UP** (brand LUPU), a platform that turns any learning goal into a playable 3D educational game, with a website (Next.js) and an offline Android app (Vite + Capacitor, package `app.levelup.learn3d`). Do not start over and do not rewrite working parts.

## 1. Get the code and read it

1. Work on branch `claude/gifted-wozniak-y84up7` (fetch it; push only there; no pull requests unless I ask).
2. Read, in this order: `AGENTS.md` (enforced rules), `README.md` (commands and configuration), `docs/handover.md`, `docs/project-dna.md` (decisions and current state), `docs/play-release.md` (Android release checklist).
3. Current state: Android version 1.26.10 (versionCode 54), 470 topic-library topics (every one held to the collection bar: 8+ items per level, the right answer the longest option in at most 40 %; the next game of a topic at a level starts with the questions the last one did not show; the original 210: about a third of each category is not free, two per category Pro only, the rest Plus and Pro, course chapters free; the Plus and Pro collection of 260: 20 to 30 per category, half Plus and Pro, half Pro only), one learning path ("Fractions, decimals and percentages", grades 5–6, 9 chapters with lessons) on the app's home screen, a 3-step first-run questionnaire, bottom tab bar, the chalkboard / notebook look (chalk-yellow main action, Rubik, the hopping-ball mark), English/Hebrew/Spanish interface, plans switched off on the website (`PLANS_ENABLED=false`; each level has its own quota per period: Free B 1 and C 5, Plus A 5, B 10 and C unlimited, Pro A 20, B 40 and C unlimited), and sold in the app through Google Play Billing in shekels, game editing hidden (`GAME_EDITING` off), no demo games at all (a game comes only from the topic library, the learner's own material or AI; the old template generator is test-only in `tests/support/samples`), no Stripe and no AI keys in the app.
4. Supabase: the app uses the project `levelup-app` (ref `yhxwgfgodxbzdvaqtqjz`, https://yhxwgfgodxbzdvaqtqjz.supabase.co) for the optional account and cloud backup. Purchases are not verified by a server (a check was built and removed on 2026-10-22). LEVEL UP AI is a separate Supabase project, `levelup-ai` (ref `zfkjkbyzurhidhpkzpxr`), with the Edge Function `generate-game` already deployed (see `supabase/functions/generate-game/README.md`; it checks the caller's `levelup-app` sign-in, and needs an AI key in that project's secrets, which I add myself). The app does not call it yet: wiring it in (a create-screen option, the CSP `connect-src` entry for that one URL, `validateGameSpec` on the answer, the label "AI-generated (LEVEL UP AI)") is open work. The older projects `level-up`, `open` and `levelup-billing` are paused and not used.

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
3. Raise `versionCode` (26 or higher) and `versionName` in `android/app/build.gradle` for every new release.
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
