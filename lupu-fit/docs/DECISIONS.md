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
