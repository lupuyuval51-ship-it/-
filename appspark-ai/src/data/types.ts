/**
 * Core domain model for AppSpark AI.
 *
 * Every piece of user-facing copy inside an idea is stored in both Hebrew and
 * English so the catalogue works in either locale without machine translation.
 *
 * This file is imported by Node scripts (seed validation / SQL generation) as
 * well as by the app, so keep it free of React Native imports and TypeScript
 * features that cannot be stripped (enums, namespaces, parameter properties).
 */

export type Locale = 'he' | 'en';

export interface Localized {
  he: string;
  en: string;
}

export interface LocalizedList {
  he: string[];
  en: string[];
}

export const CATEGORY_SLUGS = [
  'ai',
  'productivity',
  'business',
  'health',
  'education',
  'finance',
  'social',
  'entertainment',
  'games',
  'devtools',
  'lifestyle',
  'creativity',
  'ecommerce',
] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const BUSINESS_MODELS = [
  'free',
  'freemium',
  'subscription',
  'one-time',
  'ads',
  'marketplace',
  'b2b',
  'open-source',
] as const;
export type BusinessModel = (typeof BUSINESS_MODELS)[number];

export const PLATFORMS = ['ios', 'android', 'web', 'cross-platform'] as const;
export type AppPlatform = (typeof PLATFORMS)[number];

export const AUDIENCES = [
  'consumers',
  'developers',
  'businesses',
  'students',
  'creators',
  'kids',
  'parents',
  'professionals',
  'gamers',
  'teams',
] as const;
export type Audience = (typeof AUDIENCES)[number];

/**
 * Estimated money needed to run the MVP for a few months (APIs, hosting,
 * paid services). Not revenue – we never promise earnings.
 */
export const BUDGET_TIERS = ['free', 'low', 'medium', 'high'] as const;
export type BudgetTier = (typeof BUDGET_TIERS)[number];

export const PROFIT_POTENTIALS = ['low', 'medium', 'high'] as const;
export type ProfitPotential = (typeof PROFIT_POTENTIALS)[number];

export const IDENTITY_PATTERNS = ['grid', 'wave', 'dots', 'diagonal', 'ring', 'none'] as const;
export type IdentityPattern = (typeof IDENTITY_PATTERNS)[number];

export interface IdeaIdentity {
  /** 0–360 hue used to derive a muted tint for the idea tile. */
  hue: number;
  /** 1–2 characters rendered as a monogram. Latin letters render best. */
  glyph: string;
  pattern: IdentityPattern;
}

export interface IdeaEffort {
  /** Weeks for one developer to reach a usable MVP. */
  weeksMin: number;
  weeksMax: number;
}

export interface IdeaScreen {
  name: Localized;
  description: Localized;
}

export interface IdeaSpec {
  overview: Localized;
  problem: Localized;
  solution: Localized;
  usp: Localized;
  targetUsers: LocalizedList;
  coreFeatures: LocalizedList;
  screens: IdeaScreen[];
  userJourney: LocalizedList;
  uxDirection: Localized;
  architecture: Localized;
  /** Technology names, English only (e.g. "Expo", "Supabase"). */
  stack: string[];
  database: LocalizedList;
  auth: Localized;
  monetization: LocalizedList;
  mvpMilestones: LocalizedList;
  risks: LocalizedList;
  expansion: LocalizedList;
}

export interface IdeaFlags {
  beginnerFriendly: boolean;
  profitPotential: ProfitPotential;
  experimental: boolean;
  trending: boolean;
  /** Higher weight = more likely to be the featured idea of the day. 1–5. */
  featuredWeight: number;
}

export interface Idea {
  /** Stable slug, lowercase with dashes. Unique across the catalogue. */
  id: string;
  name: Localized;
  tagline: Localized;
  category: CategorySlug;
  secondaryCategories: CategorySlug[];
  difficulty: Difficulty;
  effort: IdeaEffort;
  budget: BudgetTier;
  businessModel: BusinessModel;
  platforms: AppPlatform[];
  audience: Audience[];
  /** English lowercase keywords used for search in both locales. */
  tags: string[];
  identity: IdeaIdentity;
  flags: IdeaFlags;
  spec: IdeaSpec;
}

/** Where an idea came from. Seeded ideas are curated; generated ones are per user. */
export type IdeaSource = 'curated' | 'ai' | 'demo';

export interface GeneratedIdea {
  id: string;
  idea: Idea;
  source: Exclude<IdeaSource, 'curated'>;
  /** The free-text brief the user typed. */
  brief: string;
  createdAt: string;
  provider?: string;
  model?: string;
}

export const PROJECT_STATUSES = ['saved', 'exploring', 'ready', 'in-development', 'launched'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface SavedIdea {
  ideaId: string;
  createdAt: string;
}

export interface Project {
  id: string;
  ideaId: string | null;
  name: string;
  description: string;
  notes: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export const AI_TARGETS = ['claude', 'codex', 'gemini', 'universal'] as const;
export type AiTarget = (typeof AI_TARGETS)[number];

export const PROMPT_PLATFORMS = ['ios', 'android', 'web', 'cross-platform'] as const;
export type PromptPlatform = (typeof PROMPT_PLATFORMS)[number];

export const FRAMEWORKS = ['expo', 'react-native', 'nextjs', 'flutter', 'ai-recommended'] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export const DESIGN_DIRECTIONS = ['minimal-dark', 'editorial', 'playful', 'enterprise', 'ai-recommended'] as const;
export type DesignDirection = (typeof DESIGN_DIRECTIONS)[number];

export const FEATURE_COMPLEXITIES = ['lean', 'standard', 'rich'] as const;
export type FeatureComplexity = (typeof FEATURE_COMPLEXITIES)[number];

export const PROMPT_SCOPES = ['mvp', 'complete'] as const;
export type PromptScope = (typeof PROMPT_SCOPES)[number];

export const BACKENDS = ['supabase', 'firebase', 'custom-node', 'local-only', 'ai-recommended'] as const;
export type Backend = (typeof BACKENDS)[number];

export interface PromptOptions {
  targetAi: AiTarget;
  platform: PromptPlatform;
  framework: Framework;
  designDirection: DesignDirection;
  complexity: FeatureComplexity;
  scope: PromptScope;
  language: Locale;
  backend: Backend;
}

export interface GeneratedPrompt {
  id: string;
  ideaId: string;
  title: string;
  options: PromptOptions;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const EXPERIENCE_LEVELS = ['none', 'beginner', 'intermediate', 'advanced'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface OnboardingAnswers {
  interests: CategorySlug[];
  experience: ExperienceLevel | null;
  platform: PromptPlatform | null;
  assistant: AiTarget | null;
}
