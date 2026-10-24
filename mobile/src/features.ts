/**
 * Display switch of the app. It never locks or unlocks anything (that is `src/lib/offline/entitlement.ts`); it only
 * decides what is shown.
 *
 * - plans: the plans and prices (Settings → Plans, `#/plans`), on in a normal build now that Google Play Billing sells
 *   them. Build with VITE_SHOW_PLANS=0 to hide them again.
 * The code behind it stays in place. (Games are never built from a subject alone: "my own notes" needs notes, ready-made
 * content comes from the topic library and the learning path.)
 */
export const showPlans = (flag: unknown = import.meta.env.VITE_SHOW_PLANS): boolean => flag !== "0";
