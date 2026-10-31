# LUPU-FIT: Master Build Prompt

> Paste everything below the line into your AI app builder (Claude, Gemini, Lovable, Bolt, Cursor...). It describes the
> complete LUPU-FIT app. Build it in the phases of section 11 and do not skip the acceptance checks.

---

## 0. Your role

You are a senior full-stack engineer, product designer and sports-science-aware content engineer. Build **LUPU-FIT**, a
Hebrew-first (RTL) fitness and nutrition app with an English (LTR) mode, for Android (Google Play) and the web. Ship
production quality: typed end to end, validated input, real tests, accessible, fast on a cheap phone, honest in every
number and claim. When something is ambiguous, choose the safer and more honest option and write the decision down.

## 1. Product in one paragraph

LUPU-FIT tells a person what to train today and walks them through it set by set: a rules-based plan generator,
**213 ready-made workouts** filtered by place (gym / home / park), equipment, bodyweight-or-weights and muscle, a
**10-minute sport finisher** for 13 sports, a live workout screen with rest timers and progression suggestions, an
exercise library of **244 exercises, each with a technique video**, progress charts and personal records, honest
gamification, nutrition targets with a food log, barcode lookup, meal-photo analysis and a daily menu built from
**300 dishes**, and an AI coach that knows the user's data. It adapts everything to age, injuries and minors, works
offline, and can run with **no server at all** (database inside the phone). Limits: age 13-100, height 120-230 cm, weight
30-300 kg, 1-7 days a week, sessions 15-180 min, 1-10 sets, 1-100 reps, rest 0-600 s, RPE 1-10, up to 20 exercises per
workout and 7 days per plan.

## 2. Non-negotiable rules

1. **Never fabricate.** Stats, records, insights, nutrition numbers and coach answers come only from stored data or
   the built-in datasets. Empty states when there is no data. Never claim a video exists unless one is attached.
2. **Safety only ever makes things easier.** Minors (13-17): no calorie deficit, no max-effort sets, RPE <= 7, loaded
   reps >= 6, no 1RM-based loads, no advanced exercises. Adults 50-64: RPE cap 8, +15 s rest. 65+: RPE cap 7.5,
   +30 s rest, <= 4 sets, >= 8 reps on externally loaded work, no advanced and no high-impact exercises (plyometrics,
   jumps, hops, bounds, skips, sprints, burpees, jump rope, high knees). Reported injuries remove or swap
   contraindicated exercises. Adults never get nutrition targets below the computed safe minimum. Guidance, never
   diagnosis; say so where it matters.
3. **Authorization everywhere:** every query on user data filters by the authenticated user's id; another user's
   resource returns 404. Every body, query and param is validated (zod). Parameterized SQL only. CSRF protection on
   cookie sessions. Idempotency keys on every create/finish action; buttons disabled while pending.
4. **AI only server-side** (or through a proxy in device mode): the key never reaches the client. Model output is
   validated before use and never sets rewards, ids or permissions. Every AI feature has a non-AI fallback.
5. **i18n:** no hard-coded user-visible strings. Hebrew is the default and must sound natural and gender-neutral
   (infinitives / noun phrases). Every key exists in he and en (type-checked).
6. **RTL:** logical CSS properties only (margin-inline-start, inset-inline-end, text-align: start). Direction-dependent
   icons mirror.
7. **Accessibility:** labelled controls, keyboard operable, visible focus, aria-live for async results, tap targets
   >= 44 px, no colour-only meaning, WCAG AA contrast for every token pair in both themes, prefers-reduced-motion.

## 3. Stack and architecture

- **Client:** React 19 + TypeScript + Vite, React Router 7, TanStack Query, PWA with a service worker.
- **Server:** Node.js 22 + Express 5 + TypeScript, PostgreSQL 16, zod schemas shared with the client.
- **Shared package** (`shared/`): enums, DTO types, zod schemas and pure math (nutrition, training, timers, dates,
  gamification, age rules, menu generator, schedule). Pure functions only, no I/O.
- **Two run modes from one codebase:**
  - **Hosted:** client + API on one origin (Docker image; free hosting on Render + Neon or an Oracle Cloud VM with
    Docker Compose + Caddy HTTPS).
  - **Device mode (no server, no database service):** the same Express backend runs in a Web Worker against
    **PGlite** (real PostgreSQL in WebAssembly, persisted to IndexedDB, `pg_trgm` for search), requests are
    serialized, a single-instance lock prevents two tabs from writing, and the Android app is a **Capacitor** shell
    (local notifications, file share/save). A hidden device account is created through the server's own register
    route (its credentials live inside the database, never in localStorage), so there is no login screen. Data stays on
    the phone; backup = an export file. The worker may only
    reach the app itself and Open Food Facts.
- **Android:** Capacitor build (APK for direct install, AAB for Play). A Trusted Web Activity variant for the hosted
  mode (Digital Asset Links served by the server).
- **Forward-only SQL migrations** with checksums pinned in a JSON file (a changed checksum would brick installed
  phones). Line endings normalised to LF before hashing.

## 4. Brand and design system: Orange x Black

- Name **LUPU-FIT**. Black creates the atmosphere, orange creates the focus.
- Tokens (dark default / warm light): `--bg #0B0B0D / #F4F1EC`, `--surface #1A1A1D / #FFFFFF`, `--surface-2
  #222226 / #EFEBE4`, `--text #F5F5F5 / #141416`, `--text-muted #A3A3A8 / #5E5E66`, `--border #6B6B72 / #8A857C`,
  `--primary #FF6A00` (fill only), `--primary-text #FF8533 / #B33F00`, `--on-primary #0B0B0D` (black on orange;
  white on orange fails WCAG and is forbidden), `--success #3DBE7A / #1F7A4C`, `--warning #F5C518 / #8A6100`,
  `--danger #FF5C5C / #C42B2B`, focus ring 2 px + 2 px offset.
- **One filled orange action per screen.** Orange as text/icon uses `--primary-text`; thin indicators (active tab
  bar, current tally mark, progress) use an accent line.
- **Forbidden:** gradients, glows, glass/blur, decorative shadows, pills, radii above 8 px (only switches, status
  dots, radio indicators and spinners are round). One overlay shadow for modals/sheets/toasts.
- Fonts (self-hosted, OFL): **Heebo Variable** for all UI text, **Barlow Condensed 600/700** for numbers and the
  wordmark, tabular lining numerals in every `.num`. Type scale 12/14/16/18/22/28, numbers 40, timer 64. No negative
  letter-spacing in Hebrew. Units with gershayim: ק״ג, קק״ל.
- **Signature element: the Tally** (training-log tick marks in groups of five, the current mark in orange) used for
  progress instead of rings.
- Guards in CI: a design lint (counts of gradients/glows/pills/raw colours/px fonts may only go down) and a token
  contrast test.

## 5. Navigation and screens

App shell: bottom navigation on phones (64 px), a 240 px sidebar on desktop, a 56 px top bar: **Home, Workouts,
Exercises, Nutrition, Coach, Progress** (+ More: Profile, Notifications, Log out), a "workout in progress" banner that
resumes the live session from anywhere, and a language switch (עב / EN).

| Route | Screen |
|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth (reset not in device mode) |
| `/welcome` (device mode), `/onboarding` | First run and the questionnaire |
| `/` | Home: resume banner, next workout (schedule-aware), readiness check, weekly goal tally, nutrition today, next meal, menu teaser, quick actions, getting-started card |
| `/workouts` | Tabs: My plans · AI generator · **Ready workouts** |
| `/workouts/plans/:planId` | Plan: days, editing, reorder, alternatives, apply progression, activate/archive/duplicate |
| `/workouts/ready/:readyId` | Ready workout detail + the sport question + Start |
| `/workouts/session` | Live workout |
| `/workouts/sessions/:id` | Workout summary (PRs, XP, finisher sport) |
| `/workouts/history` | History grouped by week |
| `/exercises`, `/exercises/:id` | Library with search and filters; exercise page **with its video** |
| `/nutrition`, `/nutrition/log`, `/nutrition/menu` | Nutrition day, food log, daily menu + shopping list |
| `/coach` | AI coach chat with threads |
| `/progress` | Charts, records, body weight |
| `/notifications` | In-app notifications |
| `/profile` | Profile, targets, settings, reminders, backup/restore, account export and deletion |
| `/privacy`, `/terms`, `/account-deletion` | Legal (public) |

## 6. Content and data model

- **Exercise (244):** stable snake_case id, name {en, he}, description, primary/secondary muscles (18 muscles in 6
  groups: chest, back, shoulders, arms, core, legs), equipment (23 kinds: barbell, dumbbells, kettlebell, EZ bar,
  squat rack, bench, cable machine, lat pulldown / leg press / leg curl / leg extension / chest press / Smith
  machines, pull-up bar, dip bars, resistance bands, suspension trainer, gymnastic rings, medicine ball, plyo box,
  jump rope, cardio machine, ab wheel; `[]` = no equipment), category (free weight, machine, cable, bodyweight,
  calisthenics, band, plyometric, cardio, mobility), movement pattern (21), difficulty (beginner / intermediate /
  advanced), tracking type (`weight_reps`, `reps`, `time`), unilateral, compound, 4-7 instruction steps, 3-5 common
  mistakes, 2-4 safety notes, contraindications (neck, shoulder, elbow, wrist, lower back, hip, knee, ankle), easier
  and harder alternatives (difficulty-ordered), load increment, and **`media` (the video, see section 7)**.
- **Ready workouts (213):** id, name, description, focus (15: chest, back, shoulders, biceps, triceps, arms, abs,
  core, glutes, quads, hamstrings, legs, upper body, full body, cardio), mode (bodyweight / weights), level, places
  (gym / home / park), 4-9 items (sets, rep range or seconds, rest, optional bilingual cue). Equipment, muscles and
  minutes are **derived** from the exercises, never typed in.
- **Sport finisher blocks (39):** 13 sports (soccer, basketball, volleyball, tennis/padel, running, cycling,
  swimming, boxing/kickboxing/krav maga, judo/BJJ/wrestling, climbing, surfing, calisthenics, other/general) x 3
  variants (**bodyweight** = no gear, **gear** = light gear, **gentle** = no equipment, no impact, beginner only,
  nothing contraindicated for knee/ankle/hip/lower back), 4-6 stations, 9-11 minutes.
- **Foods (198)** per 100 g with serving, allergens (9), animal source, contains-flags; **36 meal templates**;
  **300 ready dishes** (per-dish kcal/protein/carbs/fat, bilingual name and ingredients, photo).
- Tables: app_meta, users, auth_sessions, password_reset_tokens, idempotency_keys, profiles, body_weight_entries,
  exercises, workout_plans, plan_workouts, plan_exercises, workout_sessions, session_exercises (with `sport`),
  session_sets, personal_records, foods, food_log_entries, saved_meals, saved_meal_items, meal_templates, coach_threads,
  coach_messages, coach_usage, ai_usage_events, xp_events, user_achievements, notifications, readiness_checkins,
  push_subscriptions, push_deliveries, server_settings, plus an `exercise_media` record per video.
- User data: users, profiles, workout plans/days/exercises, sessions/exercises/sets (with `sport` tag on finisher
  rows), personal records, readiness check-ins, XP events, achievements, notifications, food logs, custom foods,
  body weight, coach threads/messages/usage, push subscriptions/deliveries, idempotency keys, server settings.

## 7. Exercise videos

Every exercise is demonstrated by a **real technique video**, wherever the exercise appears in the app.

**Assets**
- One clip per exercise: `<exerciseId>.mp4` (H.264 video, **no audio track**, `+faststart` so it starts playing before it fully downloads), 6-10 s, a seamless loop of
  3 clean reps (one-sided exercises: one side, then the other; holds: a steady hold). 720 x 720 (square) or 720 x 1280
  portrait, 24-30 fps, target <= 2.5 MB (hard cap 4 MB). A `<exerciseId>.jpg` poster frame (the start position,
  <= 60 KB) and an optional `<exerciseId>.webm` (AV1/VP9) for smaller downloads.
- Consistent look: same demonstrator style, plain light studio or the same home/park setting, camera fixed at a 3/4
  side angle at hip height, full body in frame, no text, logos, music or cuts.
- Source of truth: `docs/exercise-video-list.md` (244 files, priority A/B/C/D by how many workouts use each exercise)
  and `docs/exercise-video-prompts.md|csv` (a generation prompt per exercise). Film them yourself on a phone if AI
  video generation is not free: it is cheaper and the form is correct.
- **Every clip is reviewed by a qualified person before release.** A clip with wrong or unsafe form is rejected. High
  impact and advanced exercises are marked "check twice".

**Components:** `ExerciseVideo` (sizes sm / md / lg / hero; props: exerciseId, label, controls, autoPlay,
showUnavailable) and `ExerciseVideoThumb` (poster thumbnail that plays on tap). Used on the library cards, the
live-workout exercise card and its info modal, plan exercise rows, the exercise detail page, ready-workout previews and
the alternatives / exercise-picker lists.

**Data and delivery**
- `exercise.media = { type: 'video', url, posterUrl, durationSec, width, height, sizeBytes, sha256, credit,
  reviewedAt, reviewedBy } | null`. `hasMedia` in every summary DTO is true only when a reviewed video is attached.
  An admin-only upload/attach tool validates container, codec, duration, size and dimensions, computes the hash and
  stores the file privately before publishing (no user uploads).
- Hosted mode: serve from object storage behind a CDN with long-lived immutable caching (hash in the file name),
  HTTP range requests, CSP `media-src` limited to that origin.
- Device mode / Android: the A-priority clips (about 56) ship inside the app; the rest download on first view and are
  cached (Cache Storage or the Capacitor filesystem) with an LRU limit (default 300 MB, user-adjustable, "clear video
  cache" button). A "videos on Wi-Fi only" setting (default on for mobile data).

**Player behaviour**
- Inline `<video muted loop playsinline preload="metadata" poster>`; autoplay only when visible
  (IntersectionObserver), paused when off-screen or the app is in the background, one playing video at a time.
- `prefers-reduced-motion` or the data-saver setting: no autoplay, show the poster with a play button.
- Controls: play/pause, 0.5x slow motion, mirror (useful in RTL / for left-side reps), full-screen; keyboard
  operable, labelled ("Play technique video: Goblet squat"). Captions are not needed (no audio), but the written
  steps sit right under the video and the video has an accessible description.
- Loading skeleton with the exact aspect ratio (no layout shift); on error, show the poster and the steps with a
  retry; offline without a cached clip: "Video available online" plus the steps. Never show a broken player.
- Where videos appear: exercise detail page (large), live workout exercise card (compact, above the set rows, tap to
  enlarge, pauses during the rest timer unless the user plays it), ready-workout and plan previews (poster thumbnails
  that play on tap), exercise picker (poster thumbnails), alternatives modal.
- The service worker never precaches videos except the bundled A-set; it caches on first view.

**Tests for videos**: DTO `hasMedia` true only with a reviewed video; the attach tool rejects wrong codec/size/
duration; the player respects reduced motion and data saver; offline fallback renders steps; e2e asserts that a
video element with a poster is visible on the exercise page, the live workout and the ready-workout preview.

## 8. Features in detail

### 8.1 Onboarding and profile
Seven steps (about, experience, goal, training, preferences, nutrition, review) with skip, start over, a restored draft
and "redo questionnaire"; the review step shows BMR, TDEE and how each target was set, plus caring notes for minors
("healthy habits first", never a deficit) and for injuries ("get professional advice"). Questionnaire: age (13-100), sex, height (120-230 cm), weight (30-300 kg), experience (beginner / intermediate /
advanced), goal (muscle gain, strength, general fitness, fat loss, athletic performance), training location (gym /
home / outdoor park) with pre-selected equipment, days per week (1-7), session length (15-180 min), focus muscle
groups, injuries / pain areas, ability benchmarks (max push-ups, pull-ups, plank seconds, optional 1RMs),
likes/dislikes, activity level, occupation activity, stress, sleep, diet type (omnivore / vegetarian / vegan /
pescatarian), allergies, restrictions (no pork, no beef, no shellfish, no alcohol, lactose free, gluten free), food
dislikes, meals per day. Settings: language, theme (system / dark / light), units (metric / imperial), time zone,
reminders, workout preferences (keep screen awake, vibrate at rest end, auto-advance, rest sound) synced to the
account, custom nutrition targets (with safety bounds), data export, backup/restore, account deletion. Settings sections: Profile,
Targets, Workout preferences, Reminders, Security (change password, log out everywhere), Privacy, Account, Backup,
Device data (device mode). Preferred days and a weekly workout goal drive the schedule-aware "today's workout".

### 8.2 Plan generator (rules engine, deterministic)
Candidate pool by equipment, injuries, avoid list, difficulty vs experience, minors and age rules, no mobility in
training slots. Split by days per week (full body A/B/C, upper/lower, push/pull/legs, capped at 6 training days with a
rest-day note). Slot templates per focus plus goal modifiers (jump slot and conditioning for athletes, conditioning
finisher for fat loss / general fitness, extra accessory for focus groups). Time budget per exercise =
sets x (work + rest) + 60 s transition (40 s per rep set, x1.5 one-sided; timed sets x2 one-sided) plus a 6-8 min
warm-up. Seeded tie-breaks ("regenerate" gives variety). Prescriptions by goal and role, benchmark-based bodyweight
reps and %1RM loads for adults. Free-text preferences ("more arms, no jumping") interpreted by AI into constrained
options with a keyword fallback. Every non-obvious decision becomes a translated generation note.

### 8.3 Ready workouts (213) and the sport finisher
Filter flow, in this order: **Where do you train?** (gym / home / park) -> **What equipment do you have?** (home and
park only; nothing ticked = no equipment; prefilled from the profile) -> **Bodyweight or weights?** -> **Which muscle?**
(chips with live counts) -> optional level and length. Cards show focus, level, minutes, exercise count, mode and gear.
Detail page: warm-up tip, exercises with sets x reps/time, rest, RPE, cue and **video thumbnail**, notes explaining any
change made for the user, and the question **"Do you train a specific sport? Add a 10-minute finisher at the end."**
(None + 13 sports, remembered per user). The finisher appears as its own section and in the live workout as a
separate part ("Sport finisher - Soccer, about 10 min"); the summary and history keep the sport. Honest line: general
physical preparation for the sport, not coaching in it.
Safety layer: an exercise is unsuitable when its gear is missing, it is contraindicated for a reported injury, it is
on the avoid list, it is advanced for a minor or 65+, or high-impact for 65+; it is swapped for an easier alternative
that trains a shared muscle and never leaves the workout's mode, or dropped; a workout that would lose too much is
hidden (and counted: "N workouts hidden because of your age or injuries"). Finisher variant order: senior or
lower-body joint complaint -> gentle first; weights mode -> gear first; bodyweight mode never gets gear. Catalog rules
enforced by a validator in CI: 4-9 exercises, 20-75 min, mode and places consistent with gear, level not below the
hardest exercise, the focus muscle gets its share of sets, no duplicates or > 70% overlap inside a focus, every sport
has all three variants.

### 8.4 Live workout
Exercise stepper and list, set rows with weight/reps/time steppers, RPE, complete-set check (the one orange action),
undo, add/remove/reorder/replace exercise, alternatives, notes, rest timer that survives reloads and backgrounding
(end time stored, vibration/sound, local notification in the Android app), auto-advance, plate calculator, previous
performance, progression suggestions from history (one increment at a time for 65+), optional readiness check-in
(energy, soreness, sleep) that can only make the day easier and can be reverted while untouched, pause/resume, finish
dialog (RPE + notes), abandon. Progression from the last two completed performances: hit the top of the range -> exactly
one load increment; missed reps twice -> deload x0.9 (at least one increment); nothing increases on an "easier"
readiness day; minors and 65+ move one step at a time. Keyboard shortcuts on desktop. Offline-safe: set edits queue and sync in order. Wake lock while training.

### 8.5 History, summary, records, progress
Summary: duration, sets, reps, volume, per-exercise best sets, new personal records (max weight, estimated 1RM by
Epley for 1-12 reps, max reps, max volume, max duration), XP earned, comparison with the previous run of the same
plan day, finisher sport. Progress (7/30/90 days, filters kept in the URL): summary, activity, consistency, muscle-group volume, strength,
body weight (log and trend), nutrition history, achievements and level, records list, data-based insights with a
metric glossary, and an honest "not enough data yet" notice instead of invented trends.

### 8.6 Gamification (rewards consistency, not excess)
XP: workout 50 (only if >= 10 min and >= 3 completed sets; at most 1 per day; no XP beyond the weekly goal + 1),
+2 per set capped at 30, personal record 15 (max 3 per session), food day 10 (>= 2 meals, today and 2 previous days
only), protein target day 10 (>= 90%, never rewards eating less), body weight 5 (once per week), weekly goal 100.
Levels on a triangular curve x100. 14 achievements (first workout, 5/25/100 workouts, weekly goal, 4- and 12-week
streaks, first PR, 10 PRs, first food log, 7 days logged, 7 protein days, 4 weeks of weigh-ins, first coach question).
All awards idempotent per source.

### 8.7 Nutrition
Targets: Mifflin-St Jeor BMR (10 kg + 6.25 cm - 5 age, +5 male / -161 female / -78 unspecified) x activity (1.2 /
1.375 / 1.55 / 1.725 / 1.9). Fat loss (adults only) -20% of TDEE capped at 500 kcal and never below BMR; muscle gain
+10% kept within 200-350 kcal; strength +5% up to 250 kcal. Protein g/kg: muscle gain 1.8, strength 1.8, fat loss 2.0,
general fitness 1.4, athletic 1.6 (reference weight when BMI > 30). Fat 25-30% of energy, carbs the rest (>= 130 g).
Calorie floors for adults: 1500 male, 1200 female, 1350 unspecified; custom targets are clamped to them. Minors never
get a deficit; suggest-only adaptive calorie adjustment (+-150 kcal) from the
weight trend. Food log by meal (breakfast, lunch, dinner, snack) with search, custom foods, quick add, recent foods,
saved meals (save a day's meal, log it again), copy a meal, "repeat yesterday", frequent foods, edit with undo,
next-meal and target suggestion cards, weekly summary, barcode (Open Food Facts lookup; camera scan on the web, typed number in the Android app), meal-photo analysis (AI,
photo shrunk to 1280 px JPEG on the device, nothing logged until the user confirms). **Daily menu**: deterministic per
date from the 300 dishes, 3-5 slots, portion scaling 0.5-1.75, snack cap 350 kcal, swap a dish, log one or all dishes,
shopping list, diet and restriction aware, a broad bilingual allergen keyword filter that errs toward hiding, and a
mandatory "check the ingredients yourself" notice (stronger when allergies are set). Estimates are labelled as
estimates.

### 8.8 AI coach
Chat with threads (rename, delete, markdown answers, copy, suggested prompts), limits of 6 messages per minute and 50
per day (configurable; 429 `quota_exceeded`), photo analysis 20 per day, last 12 messages as context plus a structured summary of the
user's data (age group not exact age, goals, plan, last workouts, PRs, nutrition averages, weight trend, check-in;
never email or password). Providers: **Google Gemini** (free tier; prompts may be used by Google to improve its
products, so the name is not sent and the coach page shows that notice) or **Claude** (paid, private). A safety check
before any model call returns fixed, caring replies for self-harm, medical red flags, eating disorders and
performance-enhancing drug dosing. Without a key, a built-in rules coach answers from the data. Device mode needs a
small server-side proxy to use AI.

### 8.9 Notifications
Web Push (VAPID keys auto-generated and stored) and Android local notifications: workout reminder on training days,
meal reminders at chosen times, rest-over alert. Each reminder is sent at most once (claimed per user, kind, local
date and slot, within 10 minutes of its time). Permission asked only from a tap. In-app notifications for
achievements, level-ups, PRs and weekly goals.

### 8.10 Offline, backup and accounts
Outbox for creates (food log, quick add, weigh-in) with the original idempotency key, sent oldest first, rejected
entries kept visible. Drafts for unfinished forms (3-day TTL, wiped at logout). Backup file = account export + device
state; restore re-creates only what is missing through validated endpoints. Account export (JSON) and permanent
deletion. Device mode: storage-full handling (refuse writes, keep reads, ask to free space), WAL checkpoints, erase
all data, backup up to 200 MB.

### 8.11 Legal and store readiness
Privacy policy, terms, account-deletion page (Play requirement), health disclaimer, data-safety answers, content
rating, target audience 13+ with teen-safe defaults, store listing texts in he/en, screenshots.

## 9. API surface (hosted mode; the device worker serves the same routes)

Auth (register, login, logout, me, forgot/reset password), profile and onboarding, settings, targets and adjustment,
account export/deletion, exercises (list with filters/search/pagination, facets, detail, history), workout plans
(list, generate, create, get, update, delete, activate, archive, duplicate, apply progression, alternatives, days:
add/reorder/update/delete/duplicate/regenerate), **ready workouts** (`GET /ready-workouts`,
`GET /ready-workouts/:id`), sessions (start from a plan day / a ready workout with `{ readyWorkoutId, sport?,
location?, equipment? }` / empty, active, history, detail, summary, state, sets, exercises add/replace/update/remove,
readiness revert, finish, abandon, delete), nutrition (foods search, barcode, custom foods, logs, quick add, day
summary, recent, frequent, logs: create / quick / copy / restore / batch / edit / delete, saved meals: create /
from-day / log / delete, food alternatives, suggestions, photo analysis), progress (overview, exercises, records, body
weight), gamification and notifications, dashboard, coach (status, threads,
messages), push (public key, subscribe, unsubscribe, test), health, Android asset links; device mode adds `GET /api/device/snapshot`
and `POST /api/device/restore` answered by the worker. Middleware: 600 requests/min per client, 100 KB JSON bodies
(8 MB only for signed-in photo uploads), CSRF, idempotency, security headers with a strict CSP, no-store on the API. Add for videos:
`POST /admin/exercises/:id/media` (admin only) and `GET /exercises/:id` returning `media`.

## 10. Quality gates (run on every change)

Typecheck (server + client), lint (security scan, design ratchet, e2e copy lock), content validation (exercises,
foods, meals, dishes, ready workouts, sport blocks), client unit tests (Vitest + jsdom), server integration tests
against real PostgreSQL, the same server tests on PGlite, production builds (hosted and device), Playwright e2e on
desktop and a Pixel 7 profile in Hebrew and English (onboarding, generator, ready workout with a finisher started end
to end, live workout, food log, menu, push, coach, backup, offline). Never weaken a test to make it pass.

## 11. Delivery phases and acceptance

1. Foundation: monorepo, shared enums/schemas, auth, migrations, design system, i18n he/en, CI gates.
2. Content: exercise library with the video `media` model and the admin attach tool; foods, dishes, ready workouts,
   sport blocks with their validators.
3. Training: generator, plans, ready workouts + finisher, live workout, history, records, progression, age/injury
   safety layer.
4. Videos: player component, caching, data saver, bundled A-set, a video on every exercise screen; e2e proves it.
5. Nutrition: targets, log, barcode, photo, daily menu, shopping list, allergen notice.
6. Coach, notifications, gamification.
7. Offline, backup/restore, device mode (PGlite worker), Capacitor Android APK/AAB, hosted deployment.
8. Store readiness: legal pages, data safety, screenshots, signed release.
Acceptance: all gates green; a person at home with no equipment can pick "Chest", add a soccer finisher, start, see
a video for every exercise, finish, and find the workout with its sport in history, in Hebrew, offline.
