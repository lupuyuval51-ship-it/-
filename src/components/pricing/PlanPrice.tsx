import { PLANS, formatMoney, monthlyPrice, planOffer, type PlanId } from "@/config/plans";
import type { TFn } from "@/lib/i18n";
import { TOPICS } from "@/lib/game/topics/catalog";
import { topicOpenFor } from "@/lib/game/topics/premium";

/** Price text for a plan in a region, straight from the central config (never derived from an exchange rate). */
export function planPriceText(plan: PlanId, region: string | null): { text: string; currency: "USD" | "ILS"; minor: number; isFree: boolean } {
  const { currency, minor } = monthlyPrice(plan, region);
  return { text: formatMoney(minor, currency), currency, minor, isFree: minor === 0 };
}

export const planHasTierA = (plan: PlanId): boolean => PLANS[plan].graphics.allowedTiers.includes("A");

/**
 * "3 topics at level A, 5 at level B and unlimited at level C": the plan's offer in words, generated from its quota per
 * level (`planOffer`), never hard-coded. Every level is its own count, so the parts add up (they are not alternatives).
 */
export function offerText(t: TFn, plan: PlanId): string {
  const offer = planOffer(plan);
  return offer.reduce((text, o, i) => {
    const part = o.topics === null
      ? t(i === 0 ? "offer.first.unlimited" : "offer.unlimited", { level: o.level })
      : i > 0 ? t("offer.more", { n: o.topics, level: o.level }) : o.topics === 1 ? t("offer.first.one", { level: o.level }) : t("offer.first", { n: o.topics, level: o.level });
    if (i === 0) return part;
    // the last part is joined with "and" (some languages write it differently before "unlimited"), the others with a comma
    const join = i < offer.length - 1 ? t("offer.sep") : o.topics === null ? t("offer.and.unlimited") : t("offer.and");
    return text + join + part;
  }, "");
}

/** "All 201 library topics" / "137 of the 201 library topics": how much of the topic library the plan opens. */
/** How many library topics a plan opens, out of all of them. */
export function topicsOpen(plan: PlanId): { open: number; total: number } {
  return { open: TOPICS.filter((x) => topicOpenFor(plan, x.id)).length, total: TOPICS.length };
}

export function topicsText(t: TFn, plan: PlanId): string {
  const { open, total } = topicsOpen(plan);
  return open === total ? t("pricing.topics.all", { n: total }) : t("pricing.topics.some", { n: open, total });
}
