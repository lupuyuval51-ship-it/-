import { PLANS, costOf, formatMoney, levelsAllowed, monthlyPrice, planOffer, type PlanId } from "@/config/plans";
import type { TFn } from "@/lib/i18n";

/** Price text for a plan in a region, straight from the central config (never derived from an exchange rate). */
export function planPriceText(plan: PlanId, region: string | null): { text: string; currency: "USD" | "ILS"; minor: number; isFree: boolean } {
  const { currency, minor } = monthlyPrice(plan, region);
  return { text: formatMoney(minor, currency), currency, minor, isFree: minor === 0 };
}

export const planHasTierA = (plan: PlanId): boolean => PLANS[plan].graphics.allowedTiers.includes("A");

/**
 * "2 topics at level C or 1 at level B": the plan's offer in words, generated from its points budget and level costs
 * (`planOffer`), never hard-coded. With `points`, what those points buy (e.g. what is left this period).
 */
export function offerText(t: TFn, plan: PlanId, points?: number): string {
  return planOffer(plan, points)
    .map((o, i) => (i > 0 ? t("offer.more", { n: o.topics, level: o.level }) : o.topics === 1 ? t("offer.first.one", { level: o.level }) : t("offer.first", { n: o.topics, level: o.level })))
    .join(t("offer.or"));
}

/** "10 points: level A = 2 · level B = 1 · level C = 1", lowest level first. */
export function pointsText(t: TFn, plan: PlanId): string {
  const costs = [...levelsAllowed(plan)].reverse().map((level) => t("pricing.cost", { level, n: costOf(plan, level)! })).join(" · ");
  return t("pricing.points", { n: PLANS[plan].allowance.budget, costs });
}
