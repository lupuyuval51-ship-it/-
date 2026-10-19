/**
 * Display switch of the app. It never locks or unlocks anything (that is `src/lib/offline/entitlement.ts`); it only
 * decides what is shown. It is off in a normal build, because it did not help a learner learn:
 *
 * - plans: the plans and prices (the questionnaire's plan step with the country for prices, Settings → Plans, `#/plans`).
 *   The app sells nothing yet, so they were only a distraction. Build with VITE_SHOW_PLANS=1 to show them again (for
 *   example once Google Play Billing exists).
 * The code behind it stays in place. (Games are never built from a subject alone: "my own notes" needs notes, ready-made
 * content comes from the topic library and the learning path.)
 */
export const showPlans = (flag: unknown = import.meta.env.VITE_SHOW_PLANS): boolean => flag === "1";
