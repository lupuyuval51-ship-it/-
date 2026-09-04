type Environment = Record<string, string | undefined>;

export function defaultDemoMode(environment: Environment = process.env) {
  return environment.DEMO_MODE === 'true' || (environment.DEMO_MODE === undefined && environment.NODE_ENV !== 'production');
}

/** Called at the request boundary so an image can be built without deployment secrets. */
export function applicationUrl(environment: Environment = process.env, demo = defaultDemoMode(environment)) {
  const raw = environment.APP_URL?.trim();
  const realProduction = environment.NODE_ENV === 'production' && !demo;
  if (realProduction && !raw) throw new Error('APP_URL is required in production and must be an HTTPS origin.');
  let parsed: URL;
  try { parsed = new URL(raw || 'http://localhost:3000'); }
  catch { throw new Error('APP_URL must be a valid absolute HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('APP_URL must be an HTTP(S) origin without credentials, a path, query or fragment.');
  if (realProduction && parsed.protocol !== 'https:') throw new Error('APP_URL must use HTTPS when production Demo mode is disabled.');
  return parsed.origin;
}

export const config = {
  demo: defaultDemoMode(),
  get appUrl() { return applicationUrl(process.env, config.demo); },
  get secureCookies() { return new URL(config.appUrl).protocol === 'https:'; },
  bit: {
    phone: process.env.BIT_PAYMENT_PHONE || '0526262828',
    url: process.env.BIT_PAYMENT_URL_VERIFIED === 'true' && /^https:\/\//.test(process.env.BIT_PAYMENT_URL || '') ? process.env.BIT_PAYMENT_URL! : null,
  },
  maxFileBytes: 5 * 1024 * 1024,
  prices: { FREE: 0, BASIC: price('BASIC_MONTHLY_PRICE_NIS', 9), PLUS: price('PLUS_MONTHLY_PRICE_NIS', 19), PRO: price('PRO_MONTHLY_PRICE_NIS', 39) },
  /** Every Claude request is paid for, so the daily allowance is derived from the amount actually paid. */
  ai: {
    freeMessages: setting('AI_FREE_DAILY_MESSAGES', 8),
    messagesPerNis: setting('AI_MESSAGES_PER_NIS', 2.5),
    freeGames: setting('AI_FREE_DAILY_GAMES', 1),
    gamesPerNis: setting('AI_GAMES_PER_NIS', 0.3),
  },
};
function price(key: string, fallback: number) { const value = Number(process.env[key] || fallback); if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid price: ${key}`); return Math.round(value * 100) / 100; }
function setting(key: string, fallback: number) { const value = Number(process.env[key] ?? fallback); if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid AI allowance: ${key}`); return value; }
export type Plan = 'FREE' | 'BASIC' | 'PLUS' | 'PRO';
/** A paid month buys a proportional daily allowance; the free tier keeps a small standing quota. */
export const aiDailyMessages = (paidAmount: number) => Math.max(0, Math.round(config.ai.freeMessages + Math.max(0, paidAmount) * config.ai.messagesPerNis));
export const aiDailyGames = (paidAmount: number) => Math.max(0, Math.round(config.ai.freeGames + Math.max(0, paidAmount) * config.ai.gamesPerNis));
/** `paidAmount` is what the learner actually paid for the active month, not the current list price. */
export function entitlements(plan: Plan, paidAmount = config.prices[plan]) {
  const basic = plan !== 'FREE', plus = plan === 'PLUS' || plan === 'PRO', pro = plan === 'PRO';
  return { canPlayFull3DGames: basic, canAccessBasic3DWorlds: basic, canAccessPremium3DWorlds: plus, canViewGameHistory: basic, canViewFullGameHistory: plus, canCreatePrivate3DChallenge: pro, canCreate3DGameContent: pro, canAccessEarlyGameModes: pro, canUseAdvancedCoach: plus, canCreateLearningPath: pro, canPublishMarketplacePath: pro, maxActivePaths: pro ? 50 : plus ? 5 : 1, coachDailyLimit: aiDailyMessages(paidAmount), gameGenerationDailyLimit: aiDailyGames(paidAmount), gameAttempts: basic ? 2 : 0, historyDays: plus ? 3650 : basic ? 14 : 0, paidAmount };
}
export const plans = (['FREE', 'BASIC', 'PLUS', 'PRO'] as Plan[]).map(id => ({ id, name: id[0] + id.slice(1).toLowerCase(), price: config.prices[id], features: entitlements(id) }));
export const gameModes = ['answer-gates', 'escape-room', 'collect-sort', 'build-path', 'boss-quiz', 'knowledge-arena'] as const;
export const worlds = ['future-city', 'sky-island', 'ai-lab', 'mystery-castle', 'digital-world'] as const;
