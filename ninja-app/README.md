# NINJA CIRCUIT: fitness app

A fitness app in one dependency-free HTML file. English by default, Hebrew (right to left) from the language switch. It starts as **general fitness** and turns into a **ninja warrior** app with one switch in Profile.

## What it does

- **Ready workouts, no questions asked.** The first screen has "Just show me workouts": 62 ready-made sessions open straight away.
  - 25 for **home** (no equipment, a few with dumbbells), 25 for the **gym** (barbell, dumbbells, machines, cardio machines), 12 **ninja** workouts (grip, pulls, swing, balance, course circuits).
  - Categories: full body, abs, legs and glutes, glutes, upper body, cardio and HIIT, women, stretch. Search, "under 20 minutes", saved workouts, a "jumps" badge, and a level label on every card.
  - Every workout is built for you when you open it: injuries swap or remove exercises, age and the daily "how is your body" check scale the load, push-ups follow your push-up level, and the estimated length is real.
- **Personal program (9 to 11 questions).** Age, then injuries, then a track: **general fitness, build muscle (push/pull/legs), get lean, athlete, ninja**. Experience, places, equipment, push-up level, focus area (abs, glutes, legs, arms, back, chest, cardio), days and length (15 to 60 minutes). Ninja adds pull-up and hang baselines, strengths and ninja focus areas.
- **Injuries that change the training.** Seven areas (shoulders, elbows, wrists, lower back, hips, knees, ankles), each marked **sore** or **injured**. Injured removes every exercise that loads the area. Sore removes the heavy, deep and explosive ones and lightens the rest. A gentle prehab move is added to the warm-up.
- **Age rules.** Under 13 and 13 to 17: capped level, no max tests, no calorie numbers, no "get lean" track, no advanced workouts. 30 to 44 and 45+: full warm-ups, longer rests, and no hard jumping or landings for 45+.
- **Readiness.** A one-tap "tired / normal / peak" on Today lowers or raises the day's load and explains what was adapted.
- **Workout player.** Set-by-set, timers, rest, beeps, vibration, wake lock, swap and skip. Weighted exercises get a weight stepper (2.5 kg steps) that remembers your last weight; Progress shows a Lifts card with last and best.
- **Programs.** 4-week blocks with a lighter fourth week. Main lifts stay the same through a block (progressive overload) and change in the next one. Sessions are trimmed to fit the chosen length.
- **Ninja mode** (Profile switch, with a confirmation). Adds the Course stopwatch tab, the grip, pull, swing and balance program, hang and other tests (18+), and the ninja workouts. Switching back keeps all history.
- **Daily target and weight log (adults).** Body details (sex, height, weight) give a daily calorie and protein target from the track (Mifflin-St Jeor, activity from training days, about 20% deficit for get lean, 10% surplus for muscle, never below a safe floor) with the expected pace, and the sample day is chosen to match it. A weight log with a trend sits in Progress. Minors get no targets and no weight tracking.
- **Nutrition:** 300 dishes with photos, search, filters, favorites and a sample training day (no calories shown under 18).
- **Progress:** weekly rings, streak, XP, charts, tests, achievements, history, reminders (calendar file).

## Media

- `workouts/<category>-<home|gym>.webp` and `workouts/ninja.webp`: category covers (fallbacks). `workouts/w/<workout id>.webp`: one cover per ready workout.
- `ex/<exercise id>.webp`: a photo for each of the 107 new exercises (the original ninja exercises have 8-second clips in `videos/`).
- `videos/<id>.mp4` (72 clips), `food/<id>.webp` (300 dish photos).

## Data and tools

- `tools/fit_ex.py`: the general-fitness exercises. `tools/fit_ready.py`: the 62 ready workouts. `python3 tools/gen-fitness.py` splices both into `index.html` (between the `@fit-ex` and `@ready` markers) and refreshes the list of exercise photos.
- `tools/build-artifact.mjs <out.html>`: builds the hosted-viewer page. Optional `videos-map.json`, `food-map.json`, `work-map.json`, `ex-map.json` map ids to uploaded asset URLs; without the last two the page uses the relative image files published beside it.
- Exercise rows: `[id, category, equipment, kind, dose, avoid tags, per side, he, en, cue he, cue en]`. Equipment tokens: `bar rings rope monkey beam wall box weights towel ninja barbell machine band cardiom`.

## Storage

Data is saved to `localStorage` on every change (key `ninja-circuit-v1`). Inside a hosted viewer the app also syncs to the viewer's private `db` subtree. Backups export and import as JSON.

## Installing as an app

Serve this folder over https and open it on the phone. `manifest.webmanifest`, `sw.js` and `icons/` make it installable and let it work offline. Opened directly as a file, `index.html` still works.

## This is not medical advice

The program and the injury handling are general guidance, not treatment. Stop if something hurts and see a professional.

## Ninja-only edition

`index.html` has a build flag, `const NINJA_ONLY = /*@ninja-only*/false;`. Setting it to `true` (replace `false` with `true` in a copy) locks ninja mode on: no track question, no ninja switch or track chips in Profile, Workouts lists only the 12 ninja sessions, and the welcome copy is ninja-specific. The Android build for it uses the package `com.ninjacircuit.ninja` (set `applicationId`, `appId` and the strings), so it is a separate store listing from the general-fitness app.
