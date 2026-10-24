# NINJA CIRCUIT — training app

A personal Ninja Warrior training app in one dependency-free HTML file. Hebrew/RTL by default, English/LTR from the language switch.

## What it does

- **Questionnaire (9 steps):** age group, experience, goal, places, equipment, baseline (pull-ups, hang, push-ups), focus areas, training days and length, limitations and a safety acknowledgement.
- **Program engine:** picks a level from the answers and builds 2–6 weekly sessions (Grip & Pull, Jump & Balance, Course & Endurance, Swing & Technique, Explosive Power, Mobility). Exercises are filtered by equipment, injuries and age (under 13: no weighted carries, explosive pulls or lache). A 4-week cycle raises load for 3 weeks, then lightens. Post-session effort ratings tune each session type ±4–8%.
- **Workout player:** set-by-set guidance, timers with countdown, rest timers, beeps, vibration and screen wake lock. Exercises can be swapped or skipped.
- **Course stopwatch:** editable courses with a draggable route map, per-obstacle splits, falls, and personal bests with split deltas.
- **Fitness tests and progress:** hang, pull-ups, push-ups, balance and broad jump; weekly chart, 12-week activity map, ability radar, achievements, XP levels, history.
- **Smart coach:** asks Claude with the athlete's profile and recent history (only inside a Claude artifact viewer).

## Storage

Data is saved to `localStorage` on every change. Inside a Claude artifact, the app also syncs to the viewer's private `db` subtree (`data/users/<id>/profile`, `courses`, `m-YYYY-MM`). Records merge by id and update time across devices. Backups export and import as JSON.

## Files

`index.html` is the standalone app: open it directly in a browser. The part between `@artifact-start` and `@artifact-end` is what gets published as the Claude artifact.
