# Google Play listing: English (en-US) translation

> **Draft** for the **device-mode** Android app (no account, data only on the phone, see `docs/device-mode.md`).
> Every claim below was checked against the code on 2026-10-30. Re-check it after feature changes. Counts are
> Unicode characters of the text between the fences (Python `len()`), as Play Console counts them.

## App name (max 30)

```text
LUPU-FIT: Workouts & Nutrition
```
**30 characters of 30 max**

Shorter alternative: `LUPU-FIT` (8 characters).

## Short description (max 80)

```text
Workout plans, live workout tracking, food log and progress. No account needed.
```
**79 characters of 80 max**

## Full description (max 4000)

```text
LUPU-FIT is a fitness and nutrition app built Hebrew-first, with full English support. It builds a workout plan around your goal, equipment and time, guides you through every workout, and helps you keep track of what you eat and how you progress.

No account, everything on your phone
• No sign-up: enter a name, answer a short questionnaire and start
• Your data is stored only on your phone, not on a server
• Works without internet; only the barcode lookup needs a connection

Personal workout plan
• A short questionnaire: goal, experience, equipment, days per week, session length, injuries and the muscles you want to focus on
• A training engine that builds your plan for the gym, home or outdoors
• Built-in safety rules: more conservative plans for teenagers and for ages 50 and over
• Edit everything: swap exercises and change sets, reps and rest

Live workout
• Log every set: weight, reps, time and effort
• Rest timer, your numbers from last time and a suggestion when to add weight
• A quick readiness check-in before training that makes the session easier when you need it

Exercise library
• 119 exercises with instructions in English and Hebrew, common mistakes, safety tips and an animation of the movement

Nutrition
• Calorie, protein, carb and fat targets from your profile that never go below a safe minimum
• A food database in English and Hebrew, custom foods, saved meals and quick add
• Barcode lookup in the Open Food Facts product database (needs internet; only the barcode number is sent)
• A daily menu of ready dishes that fits your targets, with a shopping list. Nutrition values are estimates and the dishes have no allergen information, so always check the ingredients

Coach
• A coach that answers questions from your own data: your plan, workouts, nutrition and weight

Progress
• Workouts per week, training volume and sets per muscle group
• Personal records and strength trends for every exercise
• Body-weight trend, weekly consistency, achievements and points

Reminders
• Workout and meal reminders as notifications on your phone, even when the app is closed

Your data
• No ads and no tracking code
• Save a backup file whenever you like, to keep your data safe or move it to a new phone
• Erase everything at any time. Uninstalling the app deletes your data unless you saved a backup file

Light and dark themes. Hebrew (right-to-left) and English.

Please note: LUPU-FIT gives general fitness and nutrition guidance and is not medical advice. Talk to a doctor before starting a training or nutrition program, especially if you have a medical condition, an injury, are pregnant or have an eating disorder. For ages 13 and up; under 18 with a parent's consent.
```
**2704 characters of 4000 max**

Before publishing: the **Reminders** section is true for the app's code (local notifications, checked by unit
tests) but was not yet seen on a real phone. Check it on a phone first (`docs/android.md`, "Testing on a real
phone before a release"); until then, remove those two lines.

## Do not claim

See the same list in `listing-he.md`.

## Graphics

Screenshots: the Hebrew set in `screenshots/` can be reused for the English listing. Feature graphic:
`feature-graphic-en.png`.
