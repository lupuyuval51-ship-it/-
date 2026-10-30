# Play Console: content rating questionnaire (IARC) notes

> **Draft.** The questionnaire wording changes; answer what the app does, using the facts below. The
> operator is responsible for the answers. Facts checked against the code on 2026-10-30, for the
> device-mode Android app (no AI, no accounts, no communication between users).

**Category:** "Utility, Productivity, Communication, or Other" fits a fitness and nutrition tracker (it is
not a game, not a social network and does not stream media).

| Topic | What the app does | Suggested answer |
|---|---|---|
| Violence, blood, fear | None. Exercise animations are simple figures performing exercises. | No |
| Sexuality, nudity | None. | No |
| Crude humour, profanity | None in the app's own text. The coach's answers are built-in texts filled with the person's own data (`server/src/modules/coach/builtin.ts`); no AI in the device-mode app. | No |
| Drugs | No depiction or promotion. Questions about performance-enhancing drug dosing get a fixed safety reply that refuses dosing (`server/src/modules/coach/safety.ts`). | No |
| Alcohol, tobacco | The food database lists beer and red wine so their calories can be logged; there is no depiction or promotion of drinking. | **Decide:** IARC asks about references to alcohol. Answer honestly; a nutrition-data reference may raise the rating in some regions (e.g. PEGI 12). |
| Gambling | None. | No |
| Users interact with each other | No chat, no comments, no public profiles, no sharing between users. | No |
| Shares the user's location | No location is collected. | No |
| Digital purchases | None (no billing code). | No |
| Unrestricted internet access | No; the app only shows its own pages, and its only network request is the barcode lookup (Open Food Facts). | No |
| AI-generated content | None in the device-mode app. (Hosted mode with `AI_API_KEY` only: coach answers and meal-photo estimates, which bring Play's AI-Generated Content policy and its report-button requirement, see `checklist.md`.) | No |

Expected result: a general-audience rating (Everyone / PEGI 3 / USK 0), possibly higher where alcohol
references count. Not guaranteed; IARC decides from the answers.
