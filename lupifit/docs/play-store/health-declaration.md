# Play Console: Health apps declaration notes

> **Draft.** Facts checked against the code on 2026-10-29. Play's Health apps policy and the
> declaration form change; read the current form before answering.

## Health features to declare

| Feature group in the form | Applies? | Why |
|---|---|---|
| Activity and fitness (workout plans, workout tracking) | **Yes** | Plan generator, live workout tracker, personal records, progress (`server/src/modules/workouts`, `sessions`, `progress`). |
| Nutrition and weight management (calorie counting, diet tracking, weight tracking) | **Yes** | Calorie and macro targets, food log, barcode lookup, daily menu, weigh-ins (`server/src/modules/nutrition`, `progress/bodyWeight.ts`). |
| Sleep management | No | Only a "sleep hours" questionnaire answer and a 3-level sleep check-in that adjust workouts; no sleep tracking. |
| Stress / mental health | No | A stress-level questionnaire answer only. The coach answers self-harm messages with fixed safety text and does not offer mental-health services. |
| Medical device, diagnosis, treatment, clinical decision support | **No** | The app gives general guidance only and says so (`common.disclaimer`, `/terms`). |
| Disease management, medication, health research, period tracking, emergency services | No | Not present. |
| Health Connect / Google Fit data | No | The web app and its TWA wrapper do not request Health Connect permissions. |

## Things the policy expects that the app already has

- A clear "not medical advice" statement: on the coach page and the public pages (`common.disclaimer`),
  in the terms (`/terms`, "Not medical advice") and in the store description.
- A privacy policy that covers health data: `/privacy` ("Health information", "AI features").
- Safety limits: calorie targets never go below a computed safe minimum, no calorie deficit under 18,
  conservative plans for under 18 and for 50+ (`shared/nutrition.ts`, `shared/age.ts`,
  `server/src/modules/workouts/generator.ts`).

## Open points

- **Decide:** whether AI features are enabled in production; if so, the coach and photo analysis send
  health-related data to the AI provider (described in `/privacy`), and Play's AI-Generated Content policy
  applies (report button missing, see `checklist.md`).
- The daily menu has no allergen data; the in-app notice must stay (AGENTS.md).
