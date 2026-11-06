> **Repository contents**
>
> - `appspark-ai/` — **AppSpark AI**, an Expo (React Native + TypeScript) app for discovering app ideas and generating AI-ready build prompts. See [`appspark-ai/README.md`](appspark-ai/README.md).
> - Everything else in this folder is the LEVELUP AI demo described below.

# AppSpark AI

**Discover what to build next.** AppSpark AI is a Hebrew-first (RTL), English-ready mobile app that helps developers and founders browse curated app ideas, generate new concepts, explore full product specifications, and turn any idea into a complete, AI-ready development brief they can paste into Claude, Codex, Gemini / Antigravity or any coding assistant.

The core journey is deliberately simple: **Discover → Explore → Generate Prompt → Copy → Build.**

> Built with Expo SDK 58, Expo Router, TypeScript (strict), TanStack Query, Zustand, Reanimated 4 and Supabase. Dark-first design with a single accent colour, editorial typography (Heebo + Frank Ruhl Libre) and full right-to-left support.

---

## Contents

1. [What is implemented](#what-is-implemented)
2. [Project structure](#project-structure)
3. [Getting started](#getting-started)
4. [Environment variables](#environment-variables)
5. [Connecting Supabase (accounts + cloud sync)](#connecting-supabase)
6. [Connecting an AI provider (server-side)](#connecting-an-ai-provider)
7. [Scripts and quality gates](#scripts-and-quality-gates)
8. [Architecture notes](#architecture-notes)
9. [Known limitations / not yet implemented](#known-limitations)

---

## What is implemented

| Area | Status | Notes |
| --- | --- | --- |
| App shell, floating tab bar, Expo Router navigation | ✅ | Discover · Generate · Saved · Profile tabs, stack screens for ideas, Prompt Studio, projects, search, onboarding, auth |
| Discover feed | ✅ | Greeting, search entry, idea of the day (stable per date), category chips, personalised picks, trending, beginner-friendly, revenue-potential and experimental sections |
| Search & filters | ✅ | Bilingual full-text scoring across name/tagline/tags/category/overview, multi-select filters (category, difficulty, budget, business model, platform, traits), sorting |
| Idea details | ✅ | Every spec section (overview, problem, solution, differentiator, users, features, screens, journey, UX, architecture, stack, database, auth, monetization, milestones, risks, expansion) + similar ideas + share + save + add to project + "צור פרומפט לבניית האפליקציה" |
| Prompt Studio | ✅ | Deterministic template engine producing sections A–H in Hebrew or English; options for target AI, platform, framework, design direction, complexity, MVP/complete, language, backend; editable text; copy, save, regenerate, export Markdown, MVP/advanced variants; saved prompts per idea; optional "Enhance with AI" when a provider is configured |
| AI idea generator | ✅ | Full form (category, audience, complexity, platform, monetization, budget, interests, originality, free-text brief). **Live mode** calls a Supabase Edge Function that proxies Anthropic / OpenAI / Gemini. **Demo mode** (clearly labelled, never presented as AI) remixes the curated catalogue locally when no provider is configured |
| Saved ideas, projects, prompts | ✅ | Statuses Saved · Exploring · Ready to build · In development · Launched; editable name, description, notes; persistence in local storage (guest) or Supabase (signed in) with optional one-time upload of local data |
| Onboarding | ✅ | Interests, experience, platform, preferred AI assistant; skippable; drives personalised feed and Prompt Studio defaults |
| Auth | ✅ | Email + password, magic link, guest mode; local-mode explanation when Supabase is not configured |
| Localization | ✅ | Hebrew (default, RTL) and English (LTR); typed dictionaries; runtime switch (native requires a restart to re-layout, the app explains this) |
| Theming | ✅ | Dark (default), light and system |
| Loading / empty / error states | ✅ | Skeletons, empty states with next actions, inline errors, toasts |
| Seed catalogue | ✅ | 60+ bilingual ideas across 13 categories with realistic single-developer estimates (`src/data/seed`) |
| Database schema + RLS | ✅ | `supabase/migrations/20261106000000_init.sql` |
| Tests | ✅ | Jest unit tests for the prompt engine, search/filters/sections, i18n parity, local repositories, demo generator, seed catalogue |

See [Known limitations](#known-limitations) for what is intentionally not finished.

## Project structure

```
appspark-ai/
├─ src/
│  ├─ app/                 # Expo Router routes
│  │  ├─ _layout.tsx       # providers, fonts, splash, direction sync, root stack
│  │  ├─ (tabs)/           # index (Discover), generate, saved, profile + custom tab bar
│  │  ├─ idea/[id].tsx     # idea specification
│  │  ├─ prompt/[ideaId].tsx  # Prompt Studio
│  │  ├─ project/[id].tsx  # project editor
│  │  ├─ search.tsx, onboarding.tsx, auth.tsx, +not-found.tsx
│  ├─ components/          # ui primitives (AppText, Button, Chip, Sheet, …), idea cards, layout
│  ├─ data/                # domain types, categories, seed catalogue (he + en)
│  ├─ features/            # discover (search/sections), prompt (engine), generator (demo + AI client), library (query hooks)
│  ├─ i18n/                # he.ts (source of truth), en.ts, provider + helpers
│  ├─ repositories/        # local (AsyncStorage) and Supabase implementations behind one interface
│  ├─ store/               # zustand: preferences, session, toast
│  ├─ lib/                 # env, supabase client, clipboard, haptics, share, export, direction
│  └─ theme/               # tokens, fonts, ThemeProvider
├─ supabase/
│  ├─ migrations/          # schema + row-level security
│  ├─ functions/ai-generate/  # Edge Function: AI gateway (Anthropic / OpenAI / Gemini)
│  └─ seed.sql             # generated from the TypeScript catalogue (npm run seed:sql)
├─ scripts/                # validate-seed, build-seed-index, generate-seed-sql
├─ __tests__/              # Jest
└─ app.json, package.json, tsconfig.json, eslint.config.js
```

## Getting started

Requirements: Node.js 22.13 or newer, npm, and either Expo Go / a development build on a phone, an iOS simulator, an Android emulator, or a browser.

```bash
cd appspark-ai
npm install
cp .env.example .env        # optional – the app runs fully in local mode without it
npx expo start
```

Then press `i` (iOS simulator), `a` (Android emulator) or `w` (web), or scan the QR code with Expo Go.

Development builds (recommended for the final product, required for `expo-updates` driven restarts):

```bash
npx expo run:ios
npx expo run:android
```

Web production build:

```bash
npm run export:web          # outputs a single-page app to dist/
npx serve dist              # or any static host
```

The first launch shows the onboarding flow (skippable). Everything works offline: the catalogue ships with the app and saved ideas / projects / prompts are stored on the device until you sign in.

## Environment variables

Only `EXPO_PUBLIC_*` variables are read by the client, and they are inlined at build time. See `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | no | Supabase project URL. Enables accounts and cloud sync. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | no | Supabase publishable key (`sb_publishable_…`; the legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY` is also accepted). Safe to ship. |
| `EXPO_PUBLIC_AI_FUNCTION_NAME` | no | Edge Function name (default `ai-generate`). |
| `EXPO_PUBLIC_AI_ENABLED` | no | `1` to show "connected to AI" optimistically before the first health check. |

Server-side secrets (never in the app bundle) are set on the Edge Function: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_DAILY_LIMIT`.

**No secret is ever exposed in client code.** The Supabase service-role key and the AI API key live only in Edge Function secrets.

## Connecting Supabase

1. Create a project at <https://supabase.com> (or reuse one).
2. Apply the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push          # applies supabase/migrations/20261106000000_init.sql
   ```
   Or paste the migration into the SQL editor. It creates `profiles`, `categories`, `ideas`, `saved_ideas`, `projects`, `generated_prompts`, `generated_ideas`, `user_preferences` and `ai_usage`, all with row-level security so users only ever read and write their own rows. Catalogue tables are public-read.
3. (Optional) Mirror the curated catalogue into Postgres:
   ```bash
   npm run seed:sql              # writes supabase/seed.sql
   npx supabase db query < supabase/seed.sql
   ```
4. Enable Email auth in **Authentication → Providers** (password and magic link). For magic links on native, add `appspark://` to the allowed redirect URLs.
5. Put the project URL and publishable key in `.env` and restart `expo start --clear`.

When signed in, the app switches from the local repositories to the Supabase ones automatically and offers a one-time upload of the data that was stored on the device.

## Connecting an AI provider

The client never calls an AI provider directly. Deploy the gateway function and give it a key:

```bash
npx supabase functions deploy ai-generate
npx supabase secrets set AI_PROVIDER=anthropic AI_API_KEY=sk-ant-... AI_MODEL=claude-sonnet-5-5 AI_DAILY_LIMIT=40
```

Supported providers: `anthropic`, `openai`, `gemini` (`AI_MODEL` defaults to a sensible model per provider). The function:

- requires a signed-in user (JWT verified by the platform and by `@supabase/server`),
- enforces a per-user daily quota through the `increment_ai_usage` database function,
- asks the model for 3–5 bilingual concepts in the app's exact `Idea` shape and validates/sanitises the JSON before returning it,
- powers "Enhance with AI" in the Prompt Studio.

Until a provider is configured, the Generate tab runs in **demo mode** and says so in the UI: concepts are remixed from the curated catalogue by a deterministic local generator and are labelled "Demo sample (not AI)".

## Scripts and quality gates

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint (ESLint, React Compiler rules)
npm test               # Jest (jest-expo preset)
npm run validate:seed  # schema + content checks for the catalogue (60+ ideas, both languages, realistic estimates)
npm run check          # all of the above
npm run export:web     # static web bundle
npm run doctor         # expo-doctor
```

## Architecture notes

- **Repositories, not direct storage calls.** Screens use TanStack Query hooks (`src/features/library/hooks.ts`) over a `Repositories` interface. `local/` persists JSON collections in AsyncStorage; `supabase/` maps the same operations to tables. Query keys include the repository scope so switching between guest and account refetches cleanly.
- **The catalogue is code.** Ideas live in typed TypeScript files (one per category) validated by `scripts/validate-seed.mts`, so the app is useful offline and the content is reviewable in pull requests. `supabase/seed.sql` is generated from the same source.
- **Prompt engine is deterministic.** `src/features/prompt/engine.ts` composes the brief from the idea spec and the studio options. Same input → same output, fully offline, unit tested. AI enhancement is an optional layer on top.
- **RTL by construction.** All layouts use logical properties (`start`/`end`, `flexDirection: 'row'` which React Native flips) and the `AppText` primitive aligns to "start". On web the `dir` attribute drives react-native-web; on native `I18nManager` is synced from the chosen locale (a restart is needed after switching language, and the Profile screen offers one).
- **One accent colour.** `src/theme/tokens.ts` holds the entire palette (dark + light), spacing, radii and type scale; components never hard-code colours.

## Known limitations

Honest list of what is not finished or needs a human decision:

- **Real AI output quality depends on the provider you connect.** Without a provider the generator is a labelled demo, by design.
- **Language switch on native needs an app restart** to re-layout RTL/LTR. The restart button uses `expo-updates`, which works in development and production builds; in Expo Go you may need to close and reopen the app.
- **No store builds or EAS configuration are included.** `app.json` has bundle identifiers and the project is development-build ready, but signing, EAS profiles and store assets are not set up.
- **Web is a secondary target.** It works (the QA pass was done on the exported web build with Playwright), but keyboard-only navigation and SEO were not tuned.
- **Cloud sync is one-directional at sign-in.** Local data can be uploaded to the account once; there is no continuous two-way merge.
- **`user_preferences` table exists but preferences are only stored on the device** in this version.
- **No analytics, crash reporting or push notifications.**
