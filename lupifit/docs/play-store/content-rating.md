# Play Console: content rating questionnaire (IARC) notes

> **Draft.** The questionnaire wording changes; answer what the app does, using the facts below. The
> operator is responsible for the answers. Facts checked against the code on 2026-10-29.

**Category:** "Utility, Productivity, Communication, or Other" fits a fitness and nutrition tracker (it is
not a game, not a social network and does not stream media).

| Topic | What the app does | Suggested answer |
|---|---|---|
| Violence, blood, fear | None. Exercise animations are simple figures performing exercises. | No |
| Sexuality, nudity | None. | No |
| Crude humour, profanity | None in the app's own text. The coach's answers are fixed texts or, if AI is enabled, generated text constrained by the system prompt (`server/src/modules/coach/prompt.ts`). | No |
| Drugs | No depiction or promotion. Questions about performance-enhancing drug dosing get a fixed safety reply that refuses dosing (`server/src/modules/coach/safety.ts`). | No |
| Alcohol, tobacco | The food database lists beer and red wine so their calories can be logged; there is no depiction or promotion of drinking. | **Decide:** IARC asks about references to alcohol. Answer honestly; a nutrition-data reference may raise the rating in some regions (e.g. PEGI 12). |
| Gambling | None. | No |
| Users interact with each other | No chat, no comments, no public profiles, no sharing between users. | No |
| Shares the user's location | No location is collected. | No |
| Digital purchases | None (no billing code). | No |
| Unrestricted internet access | No; the app only shows its own pages. | No |
| AI-generated content | Only if AI is enabled: coach answers and meal-photo estimates. | If enabled, also follow Play's AI-Generated Content policy: users must be able to report offensive AI output in the app. **The app has no report button today** (see `checklist.md`). |

Expected result: a general-audience rating (Everyone / PEGI 3 / USK 0), possibly higher where alcohol
references count. Not guaranteed; IARC decides from the answers.
