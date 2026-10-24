# NINJA CIRCUIT — training app

A personal Ninja Warrior training app in one dependency-free HTML file. Hebrew/RTL by default, English/LTR from the language switch.

## What it does

- **Questionnaire (11 steps):** age group, experience, goal, places, equipment, baseline (pull-ups, hang), a 1–10 strength level on a push-up ladder (knee push-ups at 1 up to a one-arm clap push-up at 10), strengths (chips plus free text), focus areas, training days and length, limitations and a safety acknowledgement.
- **Program engine:** picks a level from the answers and builds 2–6 weekly sessions (Grip & Pull, Jump & Balance, Course & Endurance, Swing & Technique, Explosive Power, Mobility). Exercises are filtered by equipment, injuries and age (under 13: no weighted carries, explosive pulls, lache, clap or one-arm push-ups). The strength level picks the push-up variation in Grip & Pull and Explosive Power sessions, stepping down past anything age or limits rule out. Each marked strength (grip, pull, legs, balance, swing, core) starts that exercise category one load step higher, capped at level 1 for under 13. Strengths and the strength level can be edited from Profile at any time. A 4-week cycle raises load for 3 weeks, then lightens. Post-session effort ratings tune each session type ±4–8%.
- **A different workout every training day:** every exercise slot lists interchangeable options and the pick rotates each week, so a session type never repeats the same exercises two weeks in a row. Pull-ups rotate between regular, chin-up, wide and towel grips, and push-ups rotate inside a pool for the strength level. Today shows how many exercises are new since the last session of that type.
- **Reminders:** a calendar file (.ics) with one repeating weekly event per training day and an alert 10 minutes before works with any phone calendar, even when the app is closed. Browser notifications fire at the chosen time on training days when the app is open, or installed and running in the background; they are not guaranteed when the app is fully closed. Real background push would need a server and is not included.
- **Workout player:** set-by-set guidance, timers with countdown, rest timers, beeps, vibration and screen wake lock. Exercises can be swapped or skipped.
- **Course stopwatch:** editable courses with a draggable route map, per-obstacle splits, falls, and personal bests with split deltas.
- **Fitness tests and progress:** hang, pull-ups, push-ups, balance and broad jump; weekly chart, 12-week activity map, ability radar, achievements, XP levels, history.
- **Smart coach:** asks Claude with the athlete's profile and recent history (only inside a Claude artifact viewer).

## Storage

Data is saved to `localStorage` on every change. Inside a Claude artifact, the app also syncs to the viewer's private `db` subtree (`data/users/<id>/profile`, `courses`, `m-YYYY-MM`). Records merge by id and update time across devices. Backups export and import as JSON.

## Files

`index.html` is the standalone app: open it directly in a browser. The part between `@artifact-start` and `@artifact-end` is what gets published as the Claude artifact.

## Installing as an app

Serve this folder over https (any static host, for example GitHub Pages, Netlify or Vercel) and open it on the phone. `manifest.webmanifest`, `sw.js` and `icons/` make it installable ("Add to Home screen") and let it work offline. Opened directly as a file, `index.html` still works, but notifications and offline caching need the https version.

## Files

- `index.html`: the whole app. The part between `@artifact-start` and `@artifact-end` is what gets published as the Claude artifact.
- `manifest.webmanifest`, `sw.js`, `icons/`: install, offline and notification support.
