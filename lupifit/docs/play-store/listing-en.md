# Google Play listing: English (en-US) translation

> **Draft.** Every claim below was checked against the code on 2026-10-29. Re-check it after feature
> changes. Counts are Unicode characters of the text between the fences (Python `len()`), as Play Console counts them.

## App name (max 30)

```text
LUPU-FIT: Workouts & Nutrition
```
**30 characters of 30 max**

Shorter alternative: `LUPU-FIT` (8 characters).

## Short description (max 80)

```text
Personal workout plans, live workout tracking, nutrition log and progress.
```
**74 characters of 80 max**

## Full description (max 4000)

```text
LUPU-FIT is a fitness and nutrition app built Hebrew-first, with full English support. It builds a workout plan around your goal, equipment and time, guides you through every workout, and helps you keep track of what you eat and how you progress.

Personal workout plan
• A short questionnaire: goal, experience, equipment, days per week, session length, injuries and the muscles you want to focus on
• A training engine that builds your plan for the gym, home or outdoors
• Built-in safety rules: more conservative plans for teenagers and for ages 50 and over
• Edit everything: swap exercises and change sets, reps and rest

Live workout
• Log every set: weight, reps, time and effort
• Rest timer, your numbers from last time and a suggestion when to add weight
• A quick readiness check-in before training that makes the session easier when you need it
• Keep logging sets without a signal; they are sent when you are back online

Exercise library
• 119 exercises with instructions in English and Hebrew, common mistakes, safety tips and an animation of the movement

Nutrition
• Calorie, protein, carb and fat targets from your profile that never go below a safe minimum
• A food database in English and Hebrew, custom foods, saved meals and quick add
• Barcode lookup (Open Food Facts product database)
• A daily menu of ready dishes that fits your targets, with a shopping list. Nutrition values are estimates and the dishes have no allergen information, so always check the ingredients

Coach
• A coach that answers questions from your own data: your plan, workouts, nutrition and weight

Progress
• Workouts per week, training volume and sets per muscle group
• Personal records and strength trends for every exercise
• Body-weight trend, weekly consistency, achievements and points

Privacy
• No ads and no third-party tracking code
• Download all your data or delete your account at any time, right in the app

Light and dark themes. Hebrew (right-to-left) and English.

Please note: LUPU-FIT gives general fitness and nutrition guidance and is not medical advice. Talk to a doctor before starting a training or nutrition program, especially if you have a medical condition, an injury, are pregnant or have an eating disorder. For ages 13 and up; under 18 with a parent's consent.
```
**2291 characters of 4000 max**

### Add only if AI features are enabled on the production server

The coach answers with an external AI service and meal-photo analysis exists **only** when `AI_API_KEY`
is set. Without it, do not mention either. If AI is enabled, replace the "Coach" section with:

```text
Coach
• An AI coach that answers questions from your own data: your plan, workouts, nutrition and weight
• Meal-photo analysis: take a photo, then review and correct every item before it is logged
```
**196 characters**

Full description with the AI section instead of the plain one: **2387 characters of 4000 max**.

## Do not claim

See the same list in `listing-he.md` (no "AI-generated plans", no push reminders until verified on a real phone, no videos, no
allergen-safe menus, no medical claims; price is a Play Console setting).

## Graphics

Screenshots: the Hebrew set in `screenshots/` can be reused for the English listing, or regenerate an
English set by switching the demo account to English. Feature graphic: `feature-graphic-en.png`.
