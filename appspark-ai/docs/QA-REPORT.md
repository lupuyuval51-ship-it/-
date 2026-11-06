# AppSpark AI – QA report

_Build verified on 2026-11-06 in a headless Linux container (Node 22.23, Expo SDK 58). Native simulators were not available, so native behaviour was verified through type checking, Expo's own validation and unit tests; the full user journey was exercised on the exported web build with Playwright._

## Automated gates

| Gate | Command | Result |
| --- | --- | --- |
| TypeScript (strict) | `npm run typecheck` | RESULT_TSC |
| ESLint (expo config, React Compiler rules) | `npm run lint` | RESULT_LINT |
| Unit tests (Jest, jest-expo) | `npm test` | RESULT_JEST |
| Seed catalogue validation | `npm run validate:seed` | RESULT_SEED |
| Expo project health | `npx expo-doctor` | RESULT_DOCTOR |
| Web export | `npm run export:web` | RESULT_EXPORT |

## Browser walkthrough (exported web build, 390×844, Playwright)

Script: `scripts/qa/web-walkthrough.js`. Every step below was executed and screenshotted; the browser console reported **no page errors**.

1. Onboarding: welcome (language switch) → interests → experience → platform → assistant → finish; skip is available on every step.
2. Discover: greeting, search entry, idea of the day, category chips, personalised / trending / beginner / revenue / experimental sections.
3. Idea details: all specification sections, save toggle (toast), share, "צור פרומפט לבניית האפליקציה".
4. Prompt Studio: generated brief (sections A–H), MVP ↔ complete toggle, copy (toast), save sheet → saved prompts list, export button present.
5. Search: category deep link `/search?category=…`, filters sheet (difficulty, budget, business model, platform, traits), empty state with clear action.
6. Generate: demo-mode banner, full form, generation produces 3–5 clearly labelled demo concepts that open as full ideas.
7. Saved: ideas / projects / prompts segments, project journey counters, new-project sheet.
8. Profile: account (local mode), display name, theme, language, personalization summary, AI status, data controls.
9. English + light theme: layout flips to LTR, palette switches, content fully translated.
10. Persistence: after a full page reload the saved idea and saved prompt are still present (`23-saved-after-reload`).

## Checklist from the brief

- Every navigation destination exists: ✅ (routes verified by the walkthrough and typed routes).
- Primary buttons perform their intended actions: ✅ (copy, save, regenerate, export, generate, create project, sign-in flow).
- Favorites persist after reopening: ✅ (web reload; local repository unit tests; Supabase tables + RLS for accounts).
- Prompt generation and copy: ✅ (unit tests + walkthrough).
- RTL layouts: ✅ Hebrew default verified in screenshots; English verified too.
- Authentication and protected data: ✅ schema with RLS; client flows implemented; live sign-in requires a Supabase project (not available in CI).
- Loading, error and empty states: ✅ skeletons, empty states and inline errors on every async screen.
- No secrets in the client: ✅ only `EXPO_PUBLIC_*` values; AI keys live in Edge Function secrets.
- Environment variables and startup documented: ✅ README + `.env.example`.
- Completed vs unfinished: ✅ README "What is implemented" and "Known limitations".

## Not verified here

- iOS / Android device runs (no simulator in the container). The native code paths are standard Expo modules; run `npx expo start` and test on a device.
- Live Supabase auth and the Edge Function against a real project and AI provider.
- Language switch restart on native (`expo-updates` reload) – implemented with a graceful fallback message.
