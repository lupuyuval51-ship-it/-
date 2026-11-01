# Client implementation guide (for screen authors)

Repo root: `/home/user/-/lupu-fit` (npm workspaces: `shared`, `server`, `client`). Client source: `client/src`.
You implement real, complete, fully wired screens. **No placeholders, no TODO, no fake data, no stubbed buttons.**

## Read first
- `client/src/ui/kit.tsx` (Button, LinkButton, Card, TextInput, TextArea, Select, NumberStepper, Segmented, ChipGroup, Chip, Toggle, Tabs, ProgressBar, Sheet, Banner, EmptyState, ErrorState, Loading, Tag, errorMessage), `ui/icons.tsx`, `ui/TallyMarks.tsx`, `ui/toast.tsx` (`useToast()`).
- `components/ExerciseVideo.tsx` (`ExerciseVideo`, `ExerciseVideoThumb`), `lib/videoState.ts`.
- `i18n/index.tsx` (`useT()`, `useLang()`, `fmt`), `i18n/core.ts` (`defineFeature`), `i18n/features/common.ts`, `labels.ts`, `video.ts`, `device.ts`.
- `api/client.ts` (`api.get/post/put/patch/delete`, `ApiRequestError`, `NetworkError`), `app/session.ts` (`useMe`, `useProfile`, `qk`).
- `data/content.ts` (EXERCISES, FOODS, DISHES, READY_WORKOUTS, FINISHERS, MEAL_TEMPLATES + id maps and name helpers).
- `app/App.tsx` (routes; every page is `export default function X()`), `app/Shell.tsx`.
- Server contract: `server/src/routes/*.ts` (paths, bodies via `shared/src/schemas.ts`, responses). Server tests in `server/test/api.test.ts` show real payloads.
- Pure engines (reuse, do not reimplement): `shared/src/readyWorkouts.ts` (`personalizeReadyWorkout`, `rankReadyWorkouts`, `filterReadyWorkouts`, `focusCounts`), `training.ts` (`generatePlan`, `epley1RM`, `plateCalculator`, `nextProgression`, `readinessState`, `estimateMinutes`), `nutrition.ts` (`computeNutrition`, `smoothWeights`, `suggestTrendAdjustment`), `menu.ts` (`buildDailyMenu`, `swapDish`, `buildShoppingList`, `isDishAllowed`, `detectAllergensInText`), `gamification.ts`, `coachRules.ts`, `age.ts`.
- Product rules: `AGENTS`-style invariants in `docs/DECISIONS.md`. Safety may only ever make training easier. Minors (13–17): no calorie deficit, RPE ≤ 7, no 1RM estimates. Never show a number that is not derived from real data; show honest empty states ("אין מספיק נתונים עדיין").

## Hard rules (CI-enforced by `scripts/design-lint.mjs`, `scripts/copy-lock.ts`, `scripts/security-scan.mjs`)
1. **No hard-coded UI strings in `.tsx`** (text nodes, `aria-label`, `placeholder`, `title`, `alt`). Use `t('feature.key')`. Add strings to **your own** file `client/src/i18n/features/<yourfeature>.ts` using `defineFeature(en, he)` (Hebrew must have the identical shape; TypeScript enforces it). Namespace every key under your feature's top-level name; keys must not collide with other files.
2. Every `t('literal.key')` must exist in both languages. Dynamic keys like ``t(`label.muscle.${m}`)`` are fine for the enums in `labels.ts`.
3. Hebrew copy: natural, athletic, concise, **gender-neutral** (infinitives / noun phrases: "להתחיל אימון", "סיום סט", "שמירת ארוחה"; never "התחל/י", never imperatives like "בחר"). Units with real gershayim/geresh: `ק״ג` `ס״מ` `קק״ל` `דק׳` `שנ׳` (use `t('unit.kg')` etc.). Never ASCII `"` or `'` inside Hebrew words.
4. CSS: only `var(--token)` colours (no hex/rgb/hsl), font sizes in `rem` (use `var(--fs-*)`), **logical properties only** (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`, `border-inline-start`…; never left/right), radius ≤ `var(--radius)` (8px; only spinners/dots/thumb may be `50%`), no gradients, no shadows (except `var(--overlay-shadow)` for sheets/toasts), no blur/backdrop-filter, no pill buttons. Put your styles in `client/src/styles/<feature>.css` and `import '../styles/<feature>.css'` from your page. Reuse classes from `styles/base.css` first.
5. **At most ONE `variant="primary"` (orange fill) button per screen.** It marks the single main action. Orange text uses `.accent` (`--primary-text`).
6. Numbers: wrap numeric readouts in `<span className="num">…</span>` (Barlow Condensed, tabular, LTR). Directional icons mirror in RTL via `.flip-rtl`.
7. Touch targets ≥ 44px (kit components already comply). Every control needs an accessible name. Focus ring comes from tokens.
8. Data: use TanStack Query (`useQuery`/`useMutation`); invalidate the right keys after mutations. Surface errors with `ErrorState`/toast using `errorMessage(e, t)`. Mutations automatically carry an `Idempotency-Key`.
9. Do not edit files you do not own (listed in your assignment) except to *add* your own feature dictionary/CSS. If you need a shared change (kit component, server field), make the smallest additive change and mention it in your report.
10. Security: no `dangerouslySetInnerHTML`, no `eval`, no secrets, no tokens in web storage (language/theme/draft preferences are fine).

## Verification you must run and pass before reporting (from `/home/user/-/lupu-fit`)
```
npx tsc --noEmit -p client/tsconfig.json
node scripts/design-lint.mjs && node scripts/security-scan.mjs && npx tsx scripts/copy-lock.ts
npx vitest run --root client            # your component/unit tests, plus everything already there
npm run build:device                    # must build
```
Write Vitest + Testing Library tests for your pages' real logic (mock `../api/client.ts` with `vi.mock`; wrap in `LangProvider`, `QueryClientProvider`, `MemoryRouter`). Test behaviour (what the user can do and what is shown), in both `he` and `en` where copy matters. Other authors work in parallel in other files; if a check fails in a file you do not own, ignore it and mention it.

## Final answer
Reply with a short report: files created, routes/behaviour implemented, tests added and results, anything you could not finish (be honest), and any shared change you made.

## Custom (machine-translated) languages
`useLang()` also returns `custom` (`{code,name,dir}` or null) and `activateCustom`; `lang` stays `'he' | 'en'` (it is `'en'` while a custom language is active). Never branch UI on `lang === 'he'` for direction: use CSS logical properties and `dir`. Add strings only through `features/*.ts` as usual; translations are generated from the English tree, so keep `{placeholders}` simple and avoid markup in strings. Code in `client/src/i18n/custom/`.
