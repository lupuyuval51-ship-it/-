# Play Console: Target audience and content notes

> **Draft.** Facts checked against the code on 2026-10-29. The age choices have legal consequences
> (Israeli Privacy Protection Law incl. Amendment 13, GDPR Art. 8 for EU users, Play Families policy);
> decide them with a lawyer.

## What the code actually does with age

| Step | Behaviour | Code |
|---|---|---|
| Registration | Asks only for name, email and password; **no age**. Shows "LUPU-FIT is for ages 13 and up. We ask your age in the next step…". | `client/src/pages/auth/RegisterPage.tsx`, `auth.register.ageNote` |
| Profile questionnaire (onboarding) | Age is required, 13–100; a lower age is rejected by the server (`age_too_young`). The app cannot be used until the questionnaire is completed (`RequireAuth` redirects to `/onboarding`). | `shared/schemas/profile.ts` (`onboardingSchema`), `shared/constants.ts` (`MIN_AGE = 13`), `client/src/layout/guards.tsx` |
| Under 13 | Cannot finish onboarding, so cannot use the app, **but the account created at registration (name, email, password hash) stays** until deleted. | (gap, see `checklist.md`) |
| 13–17 | Stricter rules: no calorie deficit, protein capped at 1.5 g/kg, no advanced exercises, no 1RM-based loads, RPE ≤ 7, reps ≥ 6, one-increment progression; the coach is told the user is a minor; onboarding shows an age notice. | `shared/nutrition.ts`, `server/src/modules/workouts/generator.ts`, `server/src/modules/sessions/progression.ts`, `server/src/modules/coach/prompt.ts` |
| Parental consent | **Not collected or checked.** The terms and privacy policy say users under 18 need a parent's consent. | `/terms`, `/privacy` |
| Age verification | None; the age is self-reported. | |

## Suggested Play Console answers

- **Target age groups:** 13–15, 16–17 and 18 and over, because the app explicitly supports teenagers.
  **Decide:** if you cannot meet the legal requirements for teenagers (consent, especially for health
  data of EU users under 16), choose **18 and over** only, and change `MIN_AGE` and the copy to match.
- **Does the app appeal to children (under 13)?** No: plain fitness UI, no characters or games aimed at
  children.
- **Ads:** "No, my app does not contain ads" (no ad SDK or ad code).
- **Families policy:** not applicable as long as under-13s are not targeted.
- **App access (for reviewers):** sign-in is required. Create a reviewer account that has completed the
  questionnaire and give its email and password in "App access".
