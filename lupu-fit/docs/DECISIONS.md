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
