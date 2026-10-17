/**
 * Display switches of the app. They never lock or unlock anything (that is `src/lib/offline/entitlement.ts`); they only
 * decide what is shown. Both are off in a normal build, because they did not help a learner learn:
 *
 * - plans: the plans and prices (the questionnaire's plan step with the country for prices, Settings → Plans, `#/plans`).
 *   The app sells nothing yet, so they were only a distraction. Build with VITE_SHOW_PLANS=1 to show them again (for
 *   example once Google Play Billing exists).
 * - demo games: a subject typed without notes made a demo-template game. Off, "my own notes" needs notes; ready-made
 *   content comes from the topic library and the learning path. Build with VITE_DEMO_GAMES=1 to bring it back.
 *
 * The code behind both stays in place.
 */
export const showPlans = (flag: unknown = import.meta.env.VITE_SHOW_PLANS): boolean => flag === "1";
export const demoGames = (flag: unknown = import.meta.env.VITE_DEMO_GAMES): boolean => flag === "1";
