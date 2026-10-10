import { PLANS, formatMoney, monthlyPrice, type PlanId } from "@/config/plans";

/** Price text for a plan in a region, straight from the central config (never derived from an exchange rate). */
export function planPriceText(plan: PlanId, region: string | null): { text: string; currency: "USD" | "ILS"; minor: number; isFree: boolean } {
  const { currency, minor } = monthlyPrice(plan, region);
  return { text: formatMoney(minor, currency), currency, minor, isFree: minor === 0 };
}

export const planGames = (plan: PlanId): number => PLANS[plan].gamesPerPeriod;
export const planHasTierA = (plan: PlanId): boolean => PLANS[plan].graphics.allowedTiers.includes("A");
