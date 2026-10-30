# Play Console: Target audience and content notes

> **Draft.** Facts checked against the code on 2026-10-30, for the **device-mode** Android app (no account,
> data only on the phone). The age choices have legal consequences (Israeli Privacy Protection Law incl.
> Amendment 13, GDPR Art. 8 for EU users, Play Families policy); decide them with a lawyer.

## What the code actually does with age (device mode)

| Step | Behaviour | Code |
|---|---|---|
| First launch | No registration: the welcome screen asks only for a name (and shows the language choice and the legal links). Nothing is sent anywhere. | `client/src/pages/device/WelcomePage.tsx` |
| Profile questionnaire (onboarding) | Age is required, 13–100; a lower age is rejected (`age_too_young`). The app cannot be used until the questionnaire is completed (`/onboarding` until done). | `shared/schemas/profile.ts` (`onboardingSchema`), `shared/constants.ts` (`MIN_AGE = 13`), `client/src/layout/guards.tsx` |
| Under 13 | Cannot finish the questionnaire, so cannot use the app. The name typed on the welcome screen stays on the phone (no account exists anywhere); erasing or uninstalling removes it. | |
| 13–17 | Stricter rules: no calorie deficit, protein capped at 1.5 g/kg, no advanced exercises, no 1RM-based loads, RPE ≤ 7, reps ≥ 6, one-increment progression; the built-in coach adapts its answers; the questionnaire shows an age notice. | `shared/nutrition.ts`, `server/src/modules/workouts/generator.ts`, `server/src/modules/sessions/progression.ts`, `server/src/modules/coach/builtin.ts`, `server/src/modules/coach/safety.ts` |
| Parental consent | **Not collected or checked.** The terms and privacy policy say users under 18 need a parent's consent. | `/terms`, `/privacy` |
| Age verification | None; the age is self-reported. | |
| Data about minors held by the developer | None: nothing the person enters leaves the phone (only barcode numbers go to Open Food Facts). | `docs/device-mode.md` |

## Suggested Play Console answers

- **Target age groups:** 13–15, 16–17 and 18 and over, because the app explicitly supports teenagers.
  **Decide:** if you cannot meet the legal requirements for teenagers (consent, especially for health
  data of EU users under 16), choose **18 and over** only, and change `MIN_AGE` and the copy to match.
- **Does the app appeal to children (under 13)?** No: plain fitness UI, no characters or games aimed at
  children.
- **Ads:** "No, my app does not contain ads" (no ad SDK or ad code).
- **Families policy:** not applicable as long as under-13s are not targeted.
- **App access (for reviewers):** no sign-in; all functionality is available without special access. The
  reviewer types a name and completes the questionnaire on first launch.

Hosted mode (`android-twa/`, only if it becomes the listing): registration asks for name, email and password
but no age; an under-13 user cannot finish onboarding, but the account created at registration remains until
deleted (see `checklist.md`, "Hosted mode only"); reviewers need a test account that completed the questionnaire.
