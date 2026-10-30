# Ready dishes and their photos: where they come from

The daily menu (`/nutrition/menu`) offers 300 ready dishes. This file records honestly what is known about them.

## What was imported

| What | Where in this repo | Origin |
|---|---|---|
| 300 dishes: Hebrew + English names, kcal / protein / carbs / fat per serving, ingredient lists, tags (`hp`, `v`, `vg`, `q`, `k`) | `shared/dishes/data.ts` | `nutrition/dishes.json` in the NINJA CIRCUIT app (pull request 10, branch `claude/modest-mccarthy-4qopfr`, commit `c0c899d`) |
| 300 square photos, 480×480 WebP, one per dish (`<id>.webp`) | `client/public/dishes/` | `food/<id>.webp` in the same app |

The data was copied unchanged. Meal categories are breakfast 55, lunch 60, dinner 60, snack 53, pre-workout 24, post-workout 26, drink 22.

## What is NOT known

- **The photos' original source and licence were not recorded.** They were added to the repository by an earlier Claude session (commit `c0c899d`) without a note on whether they were generated, photographed or taken from elsewhere. The repository owner chose to use them in LUPU-FIT. Nothing here claims they are licensed for public or commercial release. **Before a public launch, confirm where the photos came from, or replace them.**
- **The nutrition values are estimates** for a typical home serving, not laboratory values or a verified food database. The app labels them as approximate. A check of the 300 rows found macros that agree with kcal (4·protein + 4·carbs + 9·fat) except for three drink rows (`w06`, `w13`, `w21`).
- **There is no allergen, fibre or gluten data.** The menu hides dishes using keyword rules on the ingredient names (`shared/dishes/safety.ts`). That is a best-effort filter, not an allergen guarantee: hidden ingredients (a sauce, a coating, a "protein powder") are invisible to it. The app says so wherever the menu is shown. Do not remove that notice.

## Not imported (on purpose)

The same app also holds 107 exercise photos, 77 workout covers and 73 videos. They are not used here: the exercise library already has its own checked animations, and the exercise page layout is tested to have no photo in the main column. They can be wired in later if wanted.

## Maintaining the data

`npm run validate:content` checks ids, bilingual text, macro consistency and that every dish has a photo. Photos are cached by the service worker the first time they are viewed (not precached on install, ~8 MB).
