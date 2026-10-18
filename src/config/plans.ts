/**
 * THE single source of truth for plans, prices, allowances and graphics permissions.
 *
 * Every other module (API routes, allowance service, pricing page, runtime session setup, webhooks) reads
 * from here. Never hard-code a price, a limit or a tier check anywhere else, and never gate by price.
 * This file is pure data + pure functions so it is safe to import from both server and client code;
 * all ENFORCEMENT happens on the server (see src/server/allowance and src/server/games/play-session).
 */

export const PLAN_IDS = ["FREE", "PLUS", "PRO"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** Quality order: A is the highest tier, C the lowest. */
export const GRAPHICS_TIERS = ["A", "B", "C"] as const;
export type GraphicsTier = (typeof GRAPHICS_TIERS)[number];

export type CurrencyCode = "USD" | "ILS";

/**
 * How a plan's allowance period is defined.
 * - calendar_month_utc: resets at 00:00 UTC on the 1st of every month (used by FREE).
 * - billing_period:     follows the subscription's paid billing period from the payment provider.
 */
export type AllowancePeriodRule = { kind: "calendar_month_utc" } | { kind: "billing_period" };

// ───────────────────────────── game feature tiers ─────────────────────────────

/**
 * What a game can contain. Every game is built at one FEATURE TIER, also called its LEVEL (C, B or A): C exposes 40 %
 * of these features, B 70 %, A all of them (the shares are computed below, so the lists cannot drift from the promise).
 * The level of each game is decided by the server within what the plan offers (`levelsAllowed`) and uses one game of
 * that level's own quota (`quotaOf`). A feature that is not in the level is never generated, never kept when a model or
 * an edit adds it, and a request for it is refused with the level and the plan that unlock it.
 */
export const GAME_FEATURES = [
  // what kind of world (4)
  "type:exploration", "type:puzzle", "type:platformer", "type:simulation",
  // what the player is asked (6)
  "challenge:choice", "challenge:numeric", "challenge:sequence", "challenge:match", "challenge:program", "challenge:simulation",
  // what the game does (10)
  "system:collect", "system:dialogue", "system:checkpoints", "system:hazards", "system:timed_bonus", "system:adaptive_difficulty",
  "system:side_missions", "system:boss", "system:reactions", "system:multi_area",
] as const;
export type GameFeature = (typeof GAME_FEATURES)[number];

/** Feature tiers use the same letters as the graphics tiers but are a separate setting: A is the fullest, C the most basic. */
export type FeatureTier = "A" | "B" | "C";
export const FEATURE_TIERS: readonly FeatureTier[] = ["C", "B", "A"];

const TIER_C: readonly GameFeature[] = ["type:exploration", "type:puzzle", "challenge:choice", "challenge:numeric", "challenge:sequence", "system:collect", "system:dialogue", "system:checkpoints"];
const TIER_B: readonly GameFeature[] = [...TIER_C, "type:platformer", "challenge:match", "system:hazards", "system:timed_bonus", "system:side_missions", "system:multi_area"];

export const TIER_FEATURES: Readonly<Record<FeatureTier, readonly GameFeature[]>> = Object.freeze({ C: TIER_C, B: TIER_B, A: GAME_FEATURES });

/** Areas a game of each tier may have (a single area unless the tier has multi-area adventures). */
export const TIER_MAX_AREAS: Readonly<Record<FeatureTier, number>> = Object.freeze({ C: 1, B: 2, A: 4 });

export const tierHas = (tier: FeatureTier, feature: GameFeature): boolean => TIER_FEATURES[tier].includes(feature);
/** Whole-number percentage of all game features a tier exposes (C 40, B 70, A 100). */
export const featureShare = (tier: FeatureTier): number => Math.round((TIER_FEATURES[tier].length / GAME_FEATURES.length) * 100);
/** The lowest level (feature tier) that has the feature. */
export function levelUnlocking(feature: GameFeature): FeatureTier {
  return FEATURE_TIERS.find((t) => tierHas(t, feature)) ?? "A";
}
/** The cheapest plan that can make a game with the feature (for "available on Plus" messages). */
export function planUnlocking(feature: GameFeature): PlanId {
  return planUnlockingLevel(levelUnlocking(feature));
}
/** The cheapest plan that can make games at this level. */
export function planUnlockingLevel(level: FeatureTier): PlanId {
  return PLAN_IDS.find((p) => levelsAllowed(p).includes(level)) ?? "PRO";
}

/** Level of the personal AI robot that edits games from natural-language instructions. */
export const ROBOT_LEVELS = ["none", "B", "A"] as const;
export type RobotLevel = (typeof ROBOT_LEVELS)[number];

/**
 * What a plan can DO (capabilities and usage limits). Quotas live here and only here, so they can be tuned without
 * touching any other code. Every consumer is on the server; the UI only displays what the server reports.
 */
/** How a topic-library topic is unlocked: open to everyone, from Plus, or only on Pro. */
export type TopicTier = "free" | "plus" | "pro";

export interface PlanFeatures {
  /** "none" = no AI editing. B = guided edits; A = also plans larger multi-part changes. */
  robot: RobotLevel;
  /** AI edit requests per allowance period (0 = not available). A failed edit never counts. */
  aiEditsPerPeriod: number;
  /** Saved versions can be listed and restored. */
  versionHistory: boolean;
  /** Versions kept per game; the oldest are pruned beyond this (the current one is never pruned). */
  versionsKept: number;
  /**
   * Which tiers of the topic library the plan can play (src/lib/game/topics/premium.ts): "free" topics (about two thirds of each
   * category), "plus" topics (the next third, Plus and Pro) and "pro" topics (a few in every category, Pro only).
   */
  topicTiers: readonly TopicTier[];
}

/** A level's quota with no count (still rate-limited, one job at a time). */
export const UNLIMITED = null;
/** Games per period at one level: a whole number, or `UNLIMITED` (null). */
export type LevelQuota = number | null;

/**
 * A plan's game allowance: every level has its OWN quota of games per period, and using one level never reduces
 * another. Every game (a "topic") is made at one level (feature tier C/B/A) and uses one game of that level's quota.
 * A level missing here can never be made on the plan. Unused games do not roll over.
 */
export type PlanAllowance = Readonly<Partial<Record<FeatureTier, LevelQuota>>>;

export interface PlanDefinition {
  id: PlanId;
  /** Ascending order of capability; used for upgrade/downgrade labelling only, never for access checks. */
  rank: number;
  /**
   * Monthly price in MINOR units (cents / agorot) per currency. A currency that is not listed is NOT offered:
   * no price is ever derived from an exchange rate.
   */
  monthlyPrices: Readonly<Partial<Record<CurrencyCode, number>>>;
  /** Games per period at each level the plan offers (the player picks the level of each game). */
  allowance: PlanAllowance;
  allowancePeriod: AllowancePeriodRule;
  graphics: { allowedTiers: readonly GraphicsTier[]; defaultTier: GraphicsTier };
  features: PlanFeatures;
}

/** Plus and Pro share this exact object: Pro's advantage is the number of games per level, not better graphics. */
const TIER_A_GRAPHICS = Object.freeze({
  allowedTiers: Object.freeze(["A", "B", "C"] as const),
  defaultTier: "A" as GraphicsTier,
});

const FREE_GRAPHICS = Object.freeze({
  allowedTiers: Object.freeze(["B", "C"] as const),
  defaultTier: "B" as GraphicsTier,
});

export const PLANS: Readonly<Record<PlanId, PlanDefinition>> = Object.freeze({
  FREE: {
    id: "FREE",
    rank: 0,
    monthlyPrices: { USD: 0, ILS: 0 },
    // 1 topic at level B and 5 topics at level C per calendar month (UTC), each level counted on its own. Never level A
    // (it is for paying plans only).
    allowance: { B: 1, C: 5 },
    // FREE ALLOWANCE PERIOD: the calendar month (UTC). Unused games do not roll over.
    allowancePeriod: { kind: "calendar_month_utc" },
    graphics: FREE_GRAPHICS,
    features: { robot: "none", aiEditsPerPeriod: 0, versionHistory: false, versionsKept: 3, topicTiers: ["free"] },
  },
  PLUS: {
    id: "PLUS",
    rank: 1,
    // $5/month internationally; exactly ₪5/month for users in Israel (explicit, never FX-derived).
    monthlyPrices: { USD: 500, ILS: 500 },
    // 5 topics at level A, 10 at level B and unlimited level C per billing period, each level counted on its own (Pro has four times these quotas, plus the Pro-only topics, a stronger robot and more AI edits).
    allowance: { A: 5, B: 10, C: UNLIMITED },
    allowancePeriod: { kind: "billing_period" },
    graphics: TIER_A_GRAPHICS,
    features: { robot: "B", aiEditsPerPeriod: 40, versionHistory: true, versionsKept: 20, topicTiers: ["free", "plus"] },
  },
  PRO: {
    id: "PRO",
    rank: 2,
    // $20/month internationally; exactly ₪20/month for users in Israel (explicit, never FX-derived).
    monthlyPrices: { USD: 2000, ILS: 2000 },
    // 20 topics at level A, 40 at level B and unlimited level C per billing period, each level counted on its own: four times Plus's quotas.
    allowance: { A: 20, B: 40, C: UNLIMITED },
    allowancePeriod: { kind: "billing_period" },
    graphics: TIER_A_GRAPHICS,
    features: { robot: "A", aiEditsPerPeriod: 200, versionHistory: true, versionsKept: 100, topicTiers: ["free", "plus", "pro"] },
  },
});

// ───────────────────────────── allowance: a quota per level ─────────────────────────────

/** The levels a plan can make, highest first. */
export function levelsAllowed(plan: PlanId): FeatureTier[] {
  return (["A", "B", "C"] as const).filter((l) => PLANS[plan].allowance[l] !== undefined);
}

/** The highest level a plan can make (Free B, Plus A, Pro A). */
export function maxLevel(plan: PlanId): FeatureTier {
  return levelsAllowed(plan)[0] ?? "C";
}

/** Games per period at `level` on `plan`: a whole number, `UNLIMITED` (null), or 0 when the plan does not offer the level. */
export function quotaOf(plan: PlanId, level: FeatureTier): LevelQuota {
  const quota = PLANS[plan].allowance[level];
  return quota === undefined ? 0 : quota;
}

/** Games that can still be started at one level: limit − used − reserved, never negative; `UNLIMITED` stays unlimited. */
export function quotaLeft(limit: LevelQuota, used: number, reserved: number): LevelQuota {
  return limit === UNLIMITED ? UNLIMITED : Math.max(0, limit - used - reserved);
}

/** Is there at least one game left (an unlimited level always has one)? */
export function hasLeft(left: LevelQuota): boolean {
  return left === UNLIMITED || left > 0;
}

export interface OfferOption {
  level: FeatureTier;
  /** Games per period at this level; `UNLIMITED` (null) when the level has no count. */
  topics: LevelQuota;
}

/**
 * The plan's offer, highest level first ("3 topics at level A, 5 at level B and unlimited at level C"), straight from the
 * quotas. Every level is a separate count, so the options add up (they are not alternatives).
 */
export function planOffer(plan: PlanId): OfferOption[] {
  return levelsAllowed(plan).map((level) => ({ level, topics: quotaOf(plan, level) }));
}

/**
 * The level a new game gets when the player does not choose one: the highest level the plan offers that `fits` the
 * request (e.g. a Full Adventure needs at least B) and still has a game left (`left`: games left per level, `UNLIMITED`
 * for no count; a level that is not listed counts as its full quota). When none of those has a game left, the highest
 * level that fits (the server then answers ALLOWANCE_EXHAUSTED), else the plan's highest.
 */
export function defaultLevel(plan: PlanId, left: Partial<Record<FeatureTier, LevelQuota>> = {}, fits: (level: FeatureTier) => boolean = () => true): FeatureTier {
  const levels = levelsAllowed(plan);
  const leftAt = (l: FeatureTier): LevelQuota => (left[l] !== undefined ? left[l] : quotaOf(plan, l));
  return levels.find((l) => fits(l) && hasLeft(leftAt(l))) ?? levels.find(fits) ?? maxLevel(plan);
}

/** Region whose users are shown localized prices where a localized price is explicitly configured. */
export const ISRAEL = "IL";

export const PAID_PLAN_IDS = ["PLUS", "PRO"] as const satisfies readonly PlanId[];
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && (PLAN_IDS as readonly string[]).includes(v);
}
export function isPaidPlanId(v: unknown): v is PaidPlanId {
  return v === "PLUS" || v === "PRO";
}
export function isGraphicsTier(v: unknown): v is GraphicsTier {
  return typeof v === "string" && (GRAPHICS_TIERS as readonly string[]).includes(v);
}

export function getPlan(id: PlanId): PlanDefinition {
  return PLANS[id];
}

export function planAllowsTier(plan: PlanId, tier: GraphicsTier): boolean {
  return PLANS[plan].graphics.allowedTiers.includes(tier);
}

/**
 * Server-trusted graphics resolution. `requested` is only a preference: the result is always within the plan.
 * If the requested tier is not allowed, the best allowed tier that is not better than requested is chosen
 * (FREE asking for A gets B), falling back to the plan default.
 */
export function resolveGraphicsTier(plan: PlanId, requested?: GraphicsTier | null): GraphicsTier {
  const def = PLANS[plan].graphics;
  if (!requested) return def.defaultTier;
  if (def.allowedTiers.includes(requested)) return requested;
  const wanted = GRAPHICS_TIERS.indexOf(requested);
  const candidate = GRAPHICS_TIERS.find((t, i) => i >= wanted && def.allowedTiers.includes(t));
  return candidate ?? def.defaultTier;
}

/** Display currency for a region: ILS only where a plan explicitly configures an ILS price. */
export function displayCurrency(plan: PlanId, country: string | null | undefined): CurrencyCode {
  if (country?.toUpperCase() === ISRAEL && PLANS[plan].monthlyPrices.ILS !== undefined) return "ILS";
  return "USD";
}

export function monthlyPrice(plan: PlanId, country: string | null | undefined): { currency: CurrencyCode; minor: number } {
  const currency = displayCurrency(plan, country);
  return { currency, minor: PLANS[plan].monthlyPrices[currency] ?? 0 };
}

const SYMBOL: Record<CurrencyCode, string> = { USD: "$", ILS: "₪" };

/** "$10", "₪40", "$9.99". Deterministic (no Intl) so server and client always agree. */
export function formatMoney(minor: number, currency: CurrencyCode): string {
  const major = minor / 100;
  const text = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `${SYMBOL[currency]}${text}`;
}

/** Start (inclusive) and end (exclusive) of the UTC calendar month containing `at`. */
export function calendarMonthUtc(at: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
  const end = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1));
  return { start, end };
}
