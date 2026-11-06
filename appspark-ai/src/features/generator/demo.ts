import { allIdeas } from '@/data/ideas';
import type { BudgetTier, Difficulty, Idea, Locale, Localized } from '@/data/types';

import type { GeneratorInput } from './types';

/**
 * DEMO generator. Produces clearly-labelled sample concepts by remixing the
 * curated catalogue with the user's brief. It is NOT an AI and the UI says so.
 * Deterministic for a given input so results are reproducible.
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10000) / 10000;
  };
}

interface Twist {
  key: string;
  name: Localized;
  clause: Localized;
  feature: Localized;
}

const TWISTS: Twist[] = [
  { key: 'daily', name: { he: 'יומי', en: 'Daily' }, clause: { he: 'סבב אחד ביום שנגמר בשלוש דקות', en: 'one round a day that ends in three minutes' }, feature: { he: 'טקס יומי עם סטרייק שמתאפס בחצות', en: 'A daily ritual with a streak that resets at midnight' } },
  { key: 'circle', name: { he: 'במעגל', en: 'Circle' }, clause: { he: 'קבוצה קטנה של עד שמונה אנשים שמתקדמת יחד', en: 'a small circle of up to eight people progressing together' }, feature: { he: 'מעגלים סגורים עם הזמנה בלבד ולוח התקדמות משותף', en: 'Invite-only circles with a shared progress board' } },
  { key: 'coach', name: { he: 'עם מאמן', en: 'Coach' }, clause: { he: 'מאמן AI שזוכר את ההיסטוריה שלך ומציע את הצעד הבא', en: 'an AI coach that remembers your history and suggests the next step' }, feature: { he: 'דיבריף שבועי שמסכם דפוסים ומציע ניסוי אחד', en: 'A weekly debrief that summarises patterns and proposes one experiment' } },
  { key: 'offline', name: { he: 'בלי רשת', en: 'Offline' }, clause: { he: 'עובד לגמרי בלי אינטרנט ומסתנכרן כשיש', en: 'works fully offline and syncs when connected' }, feature: { he: 'אחסון מקומי עם סנכרון רקע ופתרון קונפליקטים פשוט', en: 'Local-first storage with background sync and simple conflict resolution' } },
  { key: 'voice', name: { he: 'בקול', en: 'Voice' }, clause: { he: 'הכול בקול – בלי להקליד אפילו מילה', en: 'everything by voice – not a single word typed' }, feature: { he: 'קלט קולי שהופך לפריטים מובנים ואישור בלחיצה אחת', en: 'Voice input that becomes structured items with one-tap confirmation' } },
  { key: 'local', name: { he: 'שכונתי', en: 'Local' }, clause: { he: 'מוגבל לרדיוס של כמה רחובות ממך', en: 'limited to a few streets around you' }, feature: { he: 'גילוי לפי שכונה בלי לחשוף מיקום מדויק', en: 'Neighbourhood discovery without exposing precise location' } },
  { key: 'teams', name: { he: 'לצוותים', en: 'Teams' }, clause: { he: 'נבנה לצוותים קטנים עם לוח מחוונים למנהל', en: 'built for small teams with a manager dashboard' }, feature: { he: 'תפקידים, הזמנות ודוח שבועי למנהל הצוות', en: 'Roles, invitations and a weekly report for the team lead' } },
  { key: 'kids', name: { he: 'למשפחה', en: 'Family' }, clause: { he: 'גרסה משפחתית בטוחה לילדים עם פיקוח הורים', en: 'a kid-safe family version with parental oversight' }, feature: { he: 'פרופילי ילדים פרטיים כברירת מחדל ואישור הורה לכל שיתוף', en: 'Child profiles private by default and parent approval for any sharing' } },
];

const SUFFIXES: Localized[] = [
  { he: 'Loop', en: 'Loop' },
  { he: 'Nest', en: 'Nest' },
  { he: 'Pilot', en: 'Pilot' },
  { he: 'Lane', en: 'Lane' },
  { he: 'Atlas', en: 'Atlas' },
  { he: 'Pulse', en: 'Pulse' },
];

function extractKeyword(text: string, locale: Locale): string | null {
  const stop = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'app', 'an', 'to', 'of', 'a', 'i', 'want', 'idea', 'build', 'can', 'alone', 'has', 'be', 'אני', 'רוצה', 'רעיון', 'אפליקציה', 'לבנות', 'שאפשר', 'לבד', 'שיש', 'לו', 'עם', 'של', 'על', 'את', 'כדי', 'גם', 'או', 'יש', 'להפוך', 'פוטנציאל', 'לה', 'למשחק', 'משחק']);
  const words = text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !stop.has(w.toLowerCase()));
  if (!words.length) return null;
  const hebrew = words.filter((w) => /[֐-׿]/.test(w));
  const latin = words.filter((w) => /^[A-Za-z]+$/.test(w));
  const pool = locale === 'he' ? (hebrew.length ? hebrew : latin) : latin.length ? latin : hebrew;
  if (!pool.length) return null;
  return pool.sort((a, b) => b.length - a.length)[0];
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function difficultyFor(complexity: GeneratorInput['complexity']): Difficulty {
  return complexity === 'simple' ? 'beginner' : complexity === 'ambitious' ? 'advanced' : 'intermediate';
}

function budgetFor(budget: GeneratorInput['budget']): BudgetTier {
  return budget === 'none' ? 'free' : budget === 'small' ? 'low' : budget === 'medium' ? 'medium' : 'high';
}

function effortFor(difficulty: Difficulty): Idea['effort'] {
  return difficulty === 'beginner' ? { weeksMin: 1, weeksMax: 3 } : difficulty === 'advanced' ? { weeksMin: 8, weeksMax: 14 } : { weeksMin: 3, weeksMax: 7 };
}

/** Returns 3–5 remixed sample ideas. */
export function generateDemoIdeas(input: GeneratorInput, locale: Locale): Idea[] {
  const seed = hash(JSON.stringify({ ...input, locale }));
  const random = rng(seed);
  const keywordEn = extractKeyword(`${input.brief} ${input.interests}`, 'en');

  let pool = allIdeas.filter((idea) => !input.category || idea.category === input.category || idea.secondaryCategories.includes(input.category));
  if (input.audience) {
    const narrowed = pool.filter((idea) => idea.audience.includes(input.audience as never));
    if (narrowed.length >= 3) pool = narrowed;
  }
  if (pool.length < 3) pool = allIdeas;

  const count = 3 + Math.floor(random() * 3); // 3–5
  const picked: Idea[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (picked.length < count && guard < 50 && used.size < pool.length) {
    guard += 1;
    const base = pool[Math.floor(random() * pool.length)];
    if (used.has(base.id)) continue;
    used.add(base.id);
    picked.push(base);
  }

  const difficulty = difficultyFor(input.complexity);
  const twistOffset = input.originality === 'safe' ? 0 : input.originality === 'fresh' ? 2 : 4;

  return picked.map((base, index) => {
    const twist = TWISTS[(Math.floor(random() * TWISTS.length) + twistOffset + index) % TWISTS.length];
    const suffix = SUFFIXES[(index + Math.floor(random() * SUFFIXES.length)) % SUFFIXES.length];
    // Product names: an English keyword from the brief makes a brandable name ("Dog Pilot");
    // Hebrew keywords are usually inflected (prefixes like ל/ב/ו), so the Hebrew name reuses the base brand + twist.
    const brandHe = base.name.he.split(/\s[–-]\s/)[0];
    const nameEn = keywordEn ? `${capitalize(keywordEn)} ${suffix.en}` : `${base.name.en} ${twist.name.en}`;
    const nameHe = `${brandHe} ${twist.name.he}`;
    const id = `demo-${hash(`${seed}-${base.id}-${twist.key}-${index}`).toString(36)}`;
    const businessModel = input.monetization ?? base.businessModel;

    const idea: Idea = {
      ...base,
      id,
      name: { he: nameHe, en: nameEn },
      tagline: {
        he: `${base.tagline.he.replace(/\.$/, '')} – ${twist.clause.he}.`,
        en: `${base.tagline.en.replace(/\.$/, '')} – ${twist.clause.en}.`,
      },
      difficulty,
      effort: effortFor(difficulty),
      budget: budgetFor(input.budget),
      businessModel,
      platforms: input.platform === 'cross-platform' ? ['ios', 'android'] : [input.platform],
      audience: input.audience ? [input.audience] : base.audience,
      tags: Array.from(new Set([...base.tags, twist.key, 'demo'])),
      identity: { ...base.identity, hue: (base.identity.hue + 47 * (index + 1)) % 360, glyph: (nameEn.match(/[A-Za-z]/)?.[0] ?? 'D').toUpperCase() + (nameEn.match(/[A-Za-z]/g)?.[1]?.toLowerCase() ?? '') },
      flags: { ...base.flags, trending: false, experimental: input.originality === 'wild', featuredWeight: 1 },
      spec: {
        ...base.spec,
        usp: {
          he: `${base.spec.usp.he} הבידול בגרסה הזו: ${twist.clause.he}.`,
          en: `${base.spec.usp.en} The differentiator in this version: ${twist.clause.en}.`,
        },
        coreFeatures: {
          he: [twist.feature.he, ...base.spec.coreFeatures.he].slice(0, difficulty === 'beginner' ? 4 : 7),
          en: [twist.feature.en, ...base.spec.coreFeatures.en].slice(0, difficulty === 'beginner' ? 4 : 7),
        },
      },
    };
    return idea;
  });
}
