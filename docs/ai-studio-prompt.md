# Prompt for Google AI Studio — LEVEL UP

Paste everything below the line into Google AI Studio together with the project zip.

---

You are joining an existing, working project called **LEVEL UP** (brand: LUPU). The full source is attached as a zip. Do **not** start over and do **not** rewrite working parts: read the project, then extend it carefully. First read `AGENTS.md` (enforced engineering rules), `README.md` (commands, configuration, architecture), `docs/handover.md` and `docs/project-dna.md` (decisions and current state).

## What the product is

LEVEL UP turns anything a learner wants to learn into a playable **3D educational game**. The learner picks a topic (or pastes their own notes), chooses a level, and gets a short 3D world with stations, challenges, missions and a final boss. Score, hints, attempts and rewards are calculated from validated events.

There are three products in one codebase:

1. **Website** (Next.js 16 App Router, React 19, TypeScript, Tailwind 4, React Three Fiber, PostgreSQL + Prisma 7, Zod 4, Stripe). Accounts ("LUPU ID", optional Google sign-in), a game library, creating games, playing in the browser, plans and billing. The **server** is authoritative: it grades answers, keeps answer keys private and enforces plans.
2. **Offline Android app** (`mobile/` Vite + React, `android/` Capacitor, package `app.levelup.learn3d`). Everything runs on the phone with no network; optional account and cloud backup through Supabase (owner-only tables). This is a documented exception: the reducer, answer keys and scoring run on the device.
3. **Three ways to make a game**, each honestly labelled in the UI:
   - **Topic library** (`src/lib/game/topics`): 201 curated, fact-checked topics in 10 categories (maths, science, history, geography, languages, programming & computers, economy, health, arts, thinking), each with beginner / intermediate / advanced content in Hebrew and English. No AI. Label: "Topic library".
   - **Study engine** (`src/lib/game/material`): builds a game from the learner's own notes (terms, Q&A, tables) without AI. Label: "From your material".
   - **LEVEL UP AI** (`src/server/ai`): a model on the server writes the game. Label: "AI-generated (LEVEL UP AI)". The UI never shows the vendor or model name. The system prompt already exists in `src/server/ai/prompts.ts` — reuse it, do not invent a new one.

## Games and levels

- A game is **data, not code**: a `GameSpec` JSON (`src/lib/game/spec/`). Every game, from any source, must pass `validateGameSpec()` (schema, cross-checks, solvability, sanitising) before it is saved or played. Nothing in a spec is executable.
- Challenge types: multiple choice, numeric, sequence, matching, block programming, simulation. Game types: exploration, puzzle, platformer, simulation, adventure. Boss battles are made of ordinary challenge stations.
- **Feature levels**: C = 40 %, B = 70 %, A = 100 % of the game features (`src/config/plans.ts`). Enforced with `clampToFeatureTier`.
- Games made on a phone are fitted to a touch screen by `fitForDevice` (less walking, easier jumps, more time); challenges and answers never change.

## Plans (currently switched off)

- `src/config/plans.ts` is the **only** place for plans and prices. Free: 2 points (2 topics at level C or 1 at level B). Plus ₪10 / $10: 3 points (3 topics at B or 1 at A, plus unlimited level C). Pro ₪40 / $40: 10 points (5 at A or 10 at B, plus unlimited C).
- `PLANS_ENABLED=false` (default): nobody pays, everybody gets the full product. `PLANS_SHOWN=true`: plans are shown as information only, with no buy button.
- In the Android app, paid features may only use **Google Play Billing** (never Stripe, never PayPal, never a link to an outside payment page).

## The app's first launch

A 4-step questionnaire (`mobile/src/pages/FirstSetup.tsx`): language (English preselected; Hebrew, Spanish), what the learner wants to learn, minutes per day, then the country for prices and the plan they would like (a preference only). Answers stay on the phone and only shape suggestions.

## Languages

Interface in **English, Hebrew (RTL) and Spanish**. Every new string goes into all three dictionaries (`src/lib/i18n/dict/*.ts` and `src/lib/i18n/dict/es/*.ts`); the build fails on a missing key. Use logical Tailwind properties (`ms-`/`me-`/`start-`/`end-`), never left/right. Learning content is Hebrew and English (Spanish speakers get English content via `contentLangOf`).

## Non-negotiable rules

- No secrets in the app or the browser: no API keys in `mobile/`, no `NEXT_PUBLIC_*`/`VITE_*` secrets, `.env` and the signing key are never committed.
- Any AI call goes through a **server endpoint** that holds the key; the app only calls that endpoint, only after an explicit user action, and its origin is the only new entry in the CSP `connect-src` (never `*`).
- AI output is untrusted → `validateGameSpec()` before saving; on failure show an error and save nothing. A failed generation never costs the learner anything.
- Honest labels: never present non-AI content as AI or AI content as curated.
- Minors: profiles private by default, no open chat, no precise location.
- Keep the package name `app.levelup.learn3d`; raise `versionCode` for every release (the last one is 21, version 1.17.0) and sign with the **same upload key** as before.

## What I want from you

[Write your task here — for example: "Add LEVEL UP AI to the Android app through a server endpoint using Gemini, following the rules above."]

## Definition of done

- `npm run check` passes (typecheck, lint, unit + integration tests).
- `npm run test:e2e:mobile` passes (and `npm run test:e2e` for website changes).
- `npm run mobile:build && npx cap sync android && (cd android && ./gradlew bundleRelease)` builds a signed AAB.
- Update `AGENTS.md`, `README.md`, `docs/play-release.md` (Data safety answers) and `mobile/store/privacy-policy.md` when behaviour changes.
- Give me a list of every changed file and exactly how to deploy anything new (for example the AI endpoint and where its key is stored).
