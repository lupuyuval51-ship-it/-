# LUPU-FIT — Engineering decisions

Ambiguities are resolved toward the safer, more private and more honest option.

## D1. Location in the repository
The repository root already holds an unrelated flat-file project (LEVELUP AI, with its own `package.json`
and `AGENTS.md`). To avoid overwriting it, LUPU-FIT lives in `lupu-fit/`, which is its own npm workspace root.
`AGENTS.md` at the repo root documents the LEVELUP project and was not applied to LUPU-FIT.

## D2. Colour tokens changed after `contrast-check` failed the specified palette
The specified palette does not meet the specified targets, so the tokens were adjusted rather than the check relaxed:
- `--on-primary` `#0B0B0D` → `#000000`: `#0B0B0D` on `#FF6A00` is 6.85:1 (< 7:1 required); `#000000` is 7.31:1.
- Light `--success` `#1F7A4C` → `#1D7447`: 4.48:1 on `--surface-2` (< 4.5:1); now 4.85:1.
- New `--tally-active` token (dark `#FF6A00`, light `#B33F00`): `#FF6A00` is only 2.55:1 / 2.87:1 against the light
  background / surface (< 3:1 for non-text UI). The TallyMarks active mark uses this token. The orange CTA fill
  itself is exempt from a fill-vs-background ratio because its label meets 7:1.

## D3. Achievement id `week_streak` → `two_week_streak`
"Week streak" was ambiguous. Defined as: weekly goal met in 2 consecutive weeks; `month_streak` = 4 consecutive weeks.

## D4. Readiness reducer
`score = sleep + energy + (6 − soreness)` (3..15). `≤5` → `rest`, `≤9` → `easier`, else `normal`.
Reported pain can never yield `normal` (floor `easier`) but does not force `rest` alone.

## D5. Carbohydrate floor (130 g)
Order of adjustment when carbs < 130 g: fat → its 25% floor, then protein → no lower than 1.2 g/kg of reference
weight, then **raise kcal** to fit 130 g. kcal is never lowered, so adult floors and the minor no-deficit rule
stay valid. A `carb_floor_raised_kcal` note is emitted so the UI can explain it.

## D6. Allergen filter is deliberately over-inclusive
Err toward hiding. Examples: hummus → sesame; wrap/tortilla → gluten; `חמאת בוטנים` hides for peanut but not dairy
(plant "butter"/"milk" exceptions) because the nut allergen still matches. `חלבון` ("protein") is not milk.
Structured `allergens[]` tags are always UNIONed with keyword detection; the UI must always show the verification
disclaimer.

## D7. Safety classifier scope
Deterministic first-line shield, not a clinical guarantee (stated in the source). Negation within ~3 tokens
(`no chest pain`, `אין כאב בחזה`) suppresses a hit. PED rules require BOTH a substance term and dosing/cycle intent,
and are suppressed for cortisone/inhaler/topical contexts. Literal first-person phrases such as "I want to die"
always trigger even if jokingly meant — a false positive costs a gentle message, a false negative costs far more.

## D8. Where Node-dependent tests live
`shared/src` must contain no Node/DOM globals, so its tsconfig has `types: []`. Tests that spawn the linters need
Node and live in `scripts/` with their own tsconfig (`npm run test:tools`).

## D9. Dependency advisory
`npm audit` reports a moderate advisory on `vitest@3` (`@vitest/mocker`, dev-only; affects the vitest dev server
mock-redirect feature, not shipped code). Upgrading to vitest 5 is a breaking change; deferred, not hidden.

## D10. Technique videos are generated in code (schematic, not filmed)
`npm run gen:videos` renders every exercise as a silent, seamless 8 s loop (720x720, H.264 High, +faststart, ~30 fps,
poster JPG ≤ 60 KB) from a parametric skeleton: forward kinematics + two-bone IK, motion programs per movement family
(`scripts/video/motions*.ts`), ids mapped by `scripts/video/classify.ts`. The primary muscle is highlighted and the
start/end poses are shown as a faint ghost. This is a stylised illustration, NOT footage of a person.
- Each clip carries `fidelity` in `media-manifest.json`: `specific` (a motion written for that movement, 182),
  `approximate` (nearest family; a variant looks like its sibling, 62) or `generic` (pattern fallback, 0).
- All manifest entries have `reviewed: false`. Nothing here is human-reviewed; a coach should review before the UI
  presents a clip as an authoritative demonstration. The spec rule "never claim a video exists unless a validated,
  reviewed record exists" therefore still applies: set `reviewed` only after human review.
- Known limits: side view only (movements in the frontal plane, e.g. flies, wipers, clamshells, are approximated or shown
  from the front); no hands or fingers; equipment is drawn as simple symbols; unilateral exercises alternate sides.
- Generated media is not committed (`client/public/media/` is git-ignored, ~41 MB). Build pipelines run `gen:videos`.
- Quality gates: `scripts/video.test.ts` checks for every exercise that bone lengths never change, nothing sinks through
  the floor, no joint teleports between frames and the loop is seamless; `npm run verify:videos` re-validates every file
  with the repo's own MP4 validator AND ffprobe and checks sha256 against the manifest.
- IK bend side is chosen once per limb (at its most flexed sample) and locked for the clip. Choosing per frame from a
  world-space preference made elbows/knees flip mid-motion; the invariant test caught it.

### D10 addendum: v1.1 improvements
Larger figure (far cable/band anchors no longer shrink the camera), hands, a floor surface with a contact shadow, a rep counter
(4 dots) for rep/cycle clips and a progress bar for holds/stretches, a short pause at both ends of every rep, and distinct
motions for movements that previously looked identical (assisted/regular/shrimp pistol, single-leg/elevated/banded bridge,
sumo vs conventional deadlift). Specific-fidelity clips rose from 182 to 185; the rest remain labelled `approximate` and
nothing is human-reviewed (`reviewed: false`).

## D11 — Portable API core instead of Express in the worker
`createApiApp(deps, router).handle(ApiRequest)` is framework-agnostic; Express is an adapter. Device Mode runs the same core in a Web Worker over PGlite. JSON bodies are canonicalised by a JSON round trip. Deviation from literally running Express in the worker.

## D12 — No pg_trgm; content lives in code
Search is client-side over static content in `shared/src/content`. Dishes/templates derive macros/allergens from foods.

## D13 — Offline identity cache
The service worker keeps a last-known copy of `GET /api/auth/me` and `/api/profile` only, served only when the network fails; wiped on logout or 401. All other API calls are never cached.

## D14 — Second UX pass
Per-screen redesign by five parallel owners following `docs/UX_GUIDE.md` (one primary action per screen, sticky action bars on phones, skeletons, collapsed secondary content). Orange is reserved for the primary action and active states.

## D15 — Username + user-chosen password, no e-mail
Accounts use a username (3-24 chars: a-z 0-9 _ . -, case-insensitive) and a password the user picks. No e-mail is collected, so password reset was removed (migration 0003 renames users.email -> users.username; password_reset_tokens kept, unused). Trade-off: a forgotten password cannot be recovered. A one-time recovery key shown at registration is the suggested follow-up if recovery is wanted.

## D16 — "More languages": on-demand machine translation of the UI
Settings > Language keeps Hebrew (RTL, default) and English as the only built-in, fully reviewed languages and adds "Translate the app to another language" (about 70 languages by endonym and English name, plus a free-text language name; ar/fa/ur/yi/ps/ckb and other RTL codes set `dir=rtl`).
- **Source**: the merged English dictionary (all `features/*.ts` keys except `legal.*`, which is never machine translated) is sent in batches of at most 150 keys to the new authenticated `POST /api/i18n/translate` (`{ target:{code,name}, keys }`). It uses the existing `AiProvider` (Claude preferred, Gemini fallback; `complete` gained optional `maxTokens`/`json`). The prompt demands strict JSON with identical keys, untouched `{placeholders}`, no markup, brand/unit names kept. The server validates every value (non-empty, exact placeholder bag, no markup), retries only the bad keys once, then falls back per key to English and lists them in `fallback`. The client re-validates placeholders before storing and never stores fallbacks as translations.
- **Limits**: shares the `coach_usage` ledger (kind `translate`, 30/min and 150/day per user, `429 quota_exceeded` with `Retry-After`); provider overload maps to `429 ai_busy`; no provider returns `503 ai_unavailable` and the UI says "Translation needs an internet connection and an AI service". Nothing is ever fabricated. In Device Mode this works only when an AI proxy (`VITE_AI_PROXY_URL`) is configured; the existing egress guard is unchanged.
- **Cache**: IndexedDB (`idb-keyval`, key `lf-i18n:<code>`) with a whole-dictionary hash plus a per-key source hash. An unchanged app costs zero network calls and works offline; after an app update only new/changed/previously failed keys are re-translated. Every finished batch is saved, so cancel or failure keeps progress and retry resumes. Downloaded languages are listed for one-tap switching and deletion.
- **Activation**: `lf_lang=<code>` plus `lf_lang_custom={code,name,dir}`; `<html lang dir>` follows. English is the per-key fallback. `useLang().lang` stays `'he'|'en'` (`'en'` while a custom language is active) so every existing screen keeps working; new `custom` meta on the context identifies the custom language.
- **Server copy**: `profile.language` stays `he|en` (set to `en` while custom is active). The coach request accepts an optional `uiLanguage {code,name}` (name restricted to letters/digits/space) and the coach prompt then replies in that language; omitting it is unchanged. The deterministic rules-coach fallback and safety messages stay English/Hebrew.
- **Numbers/dates**: `fmt.date` uses the custom BCP-47 locale when the browser supports it; numbers stay Latin digits by design.
- **Limitations**: quality is machine quality and unreviewed (shown in the UI); content names (exercises, foods, dishes) and server-generated plan/menu text are not translated; no per-language fonts are bundled (system fonts render scripts).

## D17 — Configurable Gemini model chain
`GEMINI_MODELS="model-a,model-b"` (server env, first = preferred, falls back on 429/503) overrides the default `gemma-4-31b-it, gemma-4-26b-a4b-it, gemini-2.5-flash, gemini-2.5-flash-lite` (Gemma 4 IDs per ai.google.dev/gemma/docs/core/gemma_on_gemini_api; JSON mode is not documented for Gemma, so responseMimeType is dropped for gemma-* and output is validated server-side). The API key stays in `GEMINI_API_KEY` (server env only, never in the repo or client). Verify any new model supports `systemInstruction` and JSON mode on the Gemini API before using it for translation/coach; the code does not check that.


## D18 - Optional on-device Gemma 4 (LiteRT-LM), cloud stays default
- **Why LiteRT-LM**: it is the documented runtime for Gemma 4 `.litertlm` files with a stable Kotlin Android API on Google Maven (`litertlm-android:0.19.0`, minSdk 24, arm64-v8a + x86_64). The model card calls the MediaPipe route maintenance-mode; AICore/Gemini Nano is device-dependent and not version-pinnable (a possible future provider).
- **Not bundled**: the model (2,588,147,712 bytes) is downloaded after install on explicit user action, resumable, SHA-256 verified before it is marked installed. The default source is the public, non-gated `litert-community/gemma-4-E2B-it-litert-lm` file pinned to a commit; `VITE_LOCAL_MODEL_URL/SHA256/SIZE` override it. No credential exists in the repo or app.
- **Placement**: a decorator at the `AiProvider` seam inside the Device Mode worker (`LocalFirstAiProvider`), bridged to the native plugin through the main thread. All routes keep their own safety shield, quotas, anonymised snapshot, minors caps and rules fallback; the local path cannot bypass them. Deviation: `main.tsx` gets one call (`attachLocalAiBridge`) and `deviceWorker.ts` builds `deps.ai` through a getter so AI stays "unconfigured" (rules coach / 503 translate) unless a proxy exists or local is selected.
- **Policy**: Auto (local only if installed and the user downloaded it, cloud fallback), Cloud only, On-device only (never contacts the cloud; failure ends in the rules coach). 30 s first-token budget, 150-word clamp, hard token caps (coach 320, translate 1024).
- **CPU only, arm64 only, ~6 GB RAM**: GPU is skipped because a native driver crash cannot be caught; supported=false carries a human reason.
- **Packaging**: Kotlin Gradle plugin added for the plugin; ABIs not filtered (Play splits per ABI); `ACCESS_NETWORK_STATE` added for Wi-Fi-only; no foreground service.
- **Unverified on a device** (see docs/ANDROID.md).
