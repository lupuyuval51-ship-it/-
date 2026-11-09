import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
try {
  const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch {}
const env = process.env;
const int = (v, d) => Number.isFinite(Number(v)) ? Number(v) : d;
export const config = {
  port: int(env.PORT, 3000),
  demoMode: env.DEMO_MODE !== 'false',
  appUrl: env.APP_URL || 'http://localhost:3000',
  sessionSecret: env.SESSION_SECRET || 'demo-only-change-me',
  bitPhone: env.BIT_PAYMENT_PHONE || '0526262828',
  bitUrl: /^https:\/\//.test(env.BIT_PAYMENT_URL || '') ? env.BIT_PAYMENT_URL : '',
  aiProvider: env.AI_PROVIDER || 'anthropic',
  aiApiKey: env.AI_API_KEY || env.ANTHROPIC_API_KEY || '',
  aiModel: env.AI_MODEL || 'claude-opus-5',
  prices: { free: 0, basic: int(env.BASIC_MONTHLY_PRICE_NIS, 9), plus: int(env.PLUS_MONTHLY_PRICE_NIS, 19), pro: int(env.PRO_MONTHLY_PRICE_NIS, 39) }
};
export const featureKeys = ['canPlayFull3DGames','canAccessBasic3DWorlds','canAccessPremium3DWorlds','canViewGameHistory','canViewFullGameHistory','canCreatePrivate3DChallenge','canCreate3DGameContent','canAccessEarlyGameModes','canUseAdvancedCoach','canCreateLearningPath','canPublishMarketplacePath'];
const flags = (...enabled) => Object.fromEntries(featureKeys.map(k => [k, enabled.includes(k)]));
export const plans = {
  free: { id:'free', name:'Free', price:0, activePathLimit:1, coachDailyLimit:5, historyDays:0, features: flags() },
  basic:{ id:'basic', name:'Basic', price:config.prices.basic, activePathLimit:1, coachDailyLimit:8, historyDays:14, label:'הדרך הזולה לפתוח את משחקי ה־3D', features: flags('canPlayFull3DGames','canAccessBasic3DWorlds','canViewGameHistory') },
  plus:{ id:'plus', name:'Plus', price:config.prices.plus, activePathLimit:5, coachDailyLimit:30, historyDays:3650, label:'הבחירה המשתלמת ביותר', features: flags('canPlayFull3DGames','canAccessBasic3DWorlds','canAccessPremium3DWorlds','canViewGameHistory','canViewFullGameHistory','canCreatePrivate3DChallenge','canUseAdvancedCoach') },
  pro:{ id:'pro', name:'Pro', price:config.prices.pro, activePathLimit:999, coachDailyLimit:100, historyDays:3650, features: flags(...featureKeys) }
};
export const hasFeature = (planId, feature) => Boolean(plans[planId]?.features?.[feature]);
